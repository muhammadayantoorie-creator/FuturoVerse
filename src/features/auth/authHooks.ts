import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '@/src/lib/firebase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  studentId?: string;
}

async function exchangeFirebaseSession(
  idToken: string,
  requestedRole: UserProfile['role'],
  rememberMe = false,
  name?: string,
): Promise<UserProfile> {
  const response = await fetch('/api/auth/firebase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ idToken, requestedRole, rememberMe, name }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Firebase sign-in could not be verified by the server.');
  return payload.user as UserProfile;
}

export function useCurrentUserQuery() {
  return useQuery<UserProfile | null, Error>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.status === 401) {
        localStorage.removeItem('auth_user');
        return null;
      }
      if (!res.ok) throw new Error('Unable to restore your session.');
      const payload = await res.json();
      const user = payload.user as UserProfile;
      localStorage.setItem('auth_user', JSON.stringify(user));
      return user;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
      const emailClean = credentials.email.trim().toLowerCase();
      let userProfile: UserProfile;
      try {
        const credential = await signInWithEmailAndPassword(auth, emailClean, credentials.password);
        userProfile = await exchangeFirebaseSession(await credential.user.getIdToken(), 'student', credentials.rememberMe);
      } catch (firebaseError) {
        // Existing demo/local accounts use the server password store. Keep this
        // fallback so they remain usable when Firebase Auth is unavailable.
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: emailClean, password: credentials.password, rememberMe: credentials.rememberMe ?? false }),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || 'Unable to sign in. Please verify your credentials and try again.');
        }
        const data = await res.json();
        userProfile = data.user as UserProfile;
      }
      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      return { user: userProfile };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: { name: string; email: string; password: string; role: 'admin' | 'teacher' | 'student'; departmentOrClass?: string; rememberMe?: boolean }) => {
      const emailClean = userData.email.trim().toLowerCase();
      const nameTrimmed = userData.name.trim();
      let userProfile: UserProfile | null = null;

      // Firebase is the identity provider. The server verifies the ID token and
      // creates the authoritative application session and role record.
      try {
        let credential;
        try {
          credential = await createUserWithEmailAndPassword(auth, emailClean, userData.password);
        } catch (fbErr: any) {
          if (fbErr?.code === 'auth/email-already-in-use') {
            credential = await signInWithEmailAndPassword(auth, emailClean, userData.password);
          } else if (fbErr?.code === 'auth/weak-password') {
            throw new Error('Password is too weak. Please use at least 6 characters.');
          } else if (fbErr?.code === 'auth/invalid-email') {
            throw new Error('Invalid email address format.');
          } else {
            throw fbErr;
          }
        }

        userProfile = await exchangeFirebaseSession(
          await credential.user.getIdToken(),
          userData.role || 'student',
          userData.rememberMe,
          nameTrimmed,
        );
      } catch (err: any) {
        if (err?.message?.includes('Password is too weak') || err?.message?.includes('Invalid email address')) {
          throw err;
        }
        console.warn('Firebase registration/session exchange failed; trying the local server fallback:', err?.code || err?.message);
      }

      // The local server fallback keeps demo and offline-development accounts usable.
      if (!userProfile) try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: nameTrimmed,
            email: emailClean,
            password: userData.password,
            role: userData.role || 'student',
            departmentOrClass: userData.departmentOrClass || '',
            rememberMe: userData.rememberMe ?? false,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          userProfile = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            studentId: data.user.studentId,
          };
        } else {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || 'Registration could not be completed.');
        }
      } catch (apiErr: any) {
        throw new Error(apiErr?.message || 'Registration could not be completed.');
      }

      // A server session is required because protected API access is authoritative.
      if (!userProfile) {
        throw new Error('Registration did not create a server session.');
      }

      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      return { user: userProfile };
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
      provider.setCustomParameters({ prompt: 'select_account' });

      let fbUser: any = null;

      try {
        const userCredential = await signInWithPopup(auth, provider);
        fbUser = userCredential.user;
      } catch (popupErr: any) {
        console.warn('Google popup auth notice:', popupErr?.code || popupErr?.message);

        if (popupErr?.code === 'auth/popup-blocked') {
          throw new Error('Google sign-in was blocked by the browser. Allow pop-ups for this site and try again.');
        }

        // Never create a local role when identity-provider authentication fails.
        if (
          popupErr?.code === 'auth/unauthorized-domain' ||
          popupErr?.code === 'auth/operation-not-allowed' ||
          popupErr?.code === 'auth/configuration-not-found' ||
          popupErr?.code === 'auth/internal-error' ||
          popupErr?.code === 'auth/invalid-api-key' ||
          !fbUser
        ) {
          throw new Error('Google sign-in could not be completed. Use email and password to continue.');
        }

        throw popupErr;
      }

      if (!fbUser) {
        throw new Error('Google Sign-in did not complete.');
      }

      const userProfile = await exchangeFirebaseSession(await fbUser.getIdToken(), role);

      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      return { user: userProfile, redirected: false };
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['currentUser'], data.user);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    },
  });
}
