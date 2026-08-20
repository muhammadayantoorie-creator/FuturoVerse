import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  studentId?: string;
}

export function useCurrentUserQuery() {
  return useQuery<UserProfile | null, Error>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      // 1. Check if user is cached in localStorage first
      const localUserStr = localStorage.getItem('auth_user');
      let cachedUser: UserProfile | null = null;
      if (localUserStr) {
        try {
          cachedUser = JSON.parse(localUserStr);
        } catch {
          // Ignore parse errors
        }
      }

      // 2. Check Firebase Auth
      return new Promise<UserProfile | null>((resolve) => {
        let isResolved = false;

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          unsubscribe();
          if (isResolved) return;
          isResolved = true;

          if (fbUser) {
            try {
              const userDocRef = doc(db, 'users', fbUser.uid);
              const userDoc = await getDoc(userDocRef);
              const profile: UserProfile = userDoc.exists() ? {
                id: fbUser.uid,
                email: fbUser.email || '',
                name: userDoc.data().name || fbUser.displayName || 'User',
                role: userDoc.data().role || 'student',
              } : {
                id: fbUser.uid,
                email: fbUser.email || '',
                name: fbUser.displayName || 'New User',
                role: 'student',
              };
              localStorage.setItem('auth_user', JSON.stringify(profile));
              resolve(profile);
              return;
            } catch (err) {
              console.warn('Firestore user fetch failed, falling back to basic auth info:', err);
              const profile: UserProfile = {
                id: fbUser.uid,
                email: fbUser.email || '',
                name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                role: 'student',
              };
              localStorage.setItem('auth_user', JSON.stringify(profile));
              resolve(profile);
              return;
            }
          }

          // If no Firebase user, return cached local user if available
          if (cachedUser) {
            resolve(cachedUser);
          } else {
            resolve(null);
          }
        }, (err) => {
          console.warn('Firebase onAuthStateChanged error:', err);
          if (!isResolved) {
            isResolved = true;
            resolve(cachedUser || null);
          }
        });

        // Safety timeout in case Firebase auth is slow/unresponsive
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            resolve(cachedUser || null);
          }
        }, 1200);
      });
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
      const emailClean = credentials.email.trim().toLowerCase();

      // Attempt 1: Firebase Auth
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailClean, credentials.password);
        const fbUser = userCredential.user;
        let role: 'admin' | 'teacher' | 'student' = 'student';
        let name = fbUser.displayName || emailClean.split('@')[0];

        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role || 'student';
            name = userDoc.data().name || name;
          }
        } catch {
          // Firestore read optional
        }

        const userProfile: UserProfile = {
          id: fbUser.uid,
          email: fbUser.email || emailClean,
          name,
          role,
        };

        localStorage.setItem('auth_user', JSON.stringify(userProfile));
        return { user: userProfile };
      } catch (fbErr: any) {
        console.warn('Firebase login failed, trying backend authentication API...', fbErr);
        
        // Attempt 2: Server-side API Auth
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailClean,
            password: credentials.password,
            rememberMe: credentials.rememberMe ?? false,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            studentId: data.user.studentId,
          };
          localStorage.setItem('auth_user', JSON.stringify(userProfile));
          return { user: userProfile };
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || fbErr.message || 'Invalid email or password.');
        }
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: { name: string; email: string; password: string; role: 'admin' | 'teacher' | 'student'; rememberMe?: boolean }) => {
      const emailClean = userData.email.trim().toLowerCase();
      let userProfile: UserProfile | null = null;

      // Attempt 1: Firebase Auth + Firestore
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailClean, userData.password);
        const fbUser = userCredential.user;

        try {
          await setDoc(doc(db, 'users', fbUser.uid), {
            name: userData.name.trim(),
            email: emailClean,
            role: userData.role || 'student',
            createdAt: new Date().toISOString(),
          });
        } catch (fsErr) {
          console.warn('Firestore doc write warning:', fsErr);
        }

        userProfile = {
          id: fbUser.uid,
          email: emailClean,
          name: userData.name.trim(),
          role: userData.role || 'student',
        };
      } catch (fbErr: any) {
        console.warn('Firebase registration failed, trying backend API register...', fbErr);
      }

      // Also ensure backend DB has the user
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name.trim(),
          email: emailClean,
          password: userData.password,
          role: userData.role || 'student',
          rememberMe: userData.rememberMe ?? false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!userProfile) {
          userProfile = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            studentId: data.user.studentId,
          };
        }
      } else if (!userProfile) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to complete registration.');
      }

      if (userProfile) {
        localStorage.setItem('auth_user', JSON.stringify(userProfile));
        return { user: userProfile };
      }

      throw new Error('Registration could not be completed.');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const emailClean = data.email.trim().toLowerCase();
      let fbSent = false;

      // Try Firebase reset email
      try {
        await sendPasswordResetEmail(auth, emailClean);
        fbSent = true;
      } catch (fbErr) {
        console.warn('Firebase sendPasswordResetEmail note:', fbErr);
      }

      // Call backend forgot-password API
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailClean }),
      });

      if (res.ok) {
        const result = await res.json();
        return {
          message: fbSent 
            ? 'Password reset instructions have been sent to your email address and generated for instant access.'
            : 'Password reset link generated successfully.',
          resetToken: result.resetToken,
        };
      }

      if (fbSent) {
        return { message: 'Password reset email sent to your inbox.' };
      }

      throw new Error('Unable to send reset instructions for this email.');
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        return { message: result.message || 'Password reset successfully!' };
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reset password.');
      }
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Firebase signout note:', err);
      }
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore network logout error
      }
      localStorage.removeItem('auth_user');
    },
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useGoogleLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: 'student' | 'teacher' | 'admin' = 'student') => {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;
      
      const userDocRef = doc(db, 'users', fbUser.uid);
      let finalRole = role;
      let name = fbUser.displayName || 'Google User';

      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          finalRole = data.role || role;
          name = data.name || name;
        } else {
          await setDoc(userDocRef, {
            name,
            email: fbUser.email || '',
            role,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (fsErr) {
        console.warn('Firestore doc write warning on google login:', fsErr);
      }

      const userProfile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name,
        role: finalRole,
      };

      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      return { user: userProfile };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

