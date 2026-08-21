/**
 * Confetti Victory Animation Component
 * Canvas-based confetti burst for quiz wins, achievements, and celebrations.
 */
import React, { useEffect, useRef, useCallback } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number; // ms, default 3500
  particleCount?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'star';
  alpha: number;
  decay: number;
}

const COLORS = [
  '#10b981', '#34d399', '#6ee7b7', // emerald
  '#f59e0b', '#fbbf24', '#fde68a', // amber
  '#3b82f6', '#60a5fa', '#93c5fd', // blue
  '#ec4899', '#f472b6', '#fbcfe8', // pink
  '#8b5cf6', '#a78bfa', '#c4b5fd', // purple
  '#f97316', '#fb923c', '#fdba74', // orange
];

function createParticle(canvas: HTMLCanvasElement): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 4 + Math.random() * 8;
  return {
    x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.4,
    y: canvas.height * 0.3 + Math.random() * canvas.height * 0.1,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    shape: (['rect', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)],
    alpha: 1,
    decay: 0.008 + Math.random() * 0.006,
  };
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.4;
    ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
}

export const Confetti: React.FC<ConfettiProps> = ({ active, duration = 3500, particleCount = 180 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!startRef.current) startRef.current = timestamp;
    const elapsed = timestamp - startRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn new particles in bursts
    if (elapsed < duration * 0.5 && particlesRef.current.length < particleCount) {
      for (let i = 0; i < 4; i++) {
        particlesRef.current.push(createParticle(canvas));
      }
    }

    particlesRef.current = particlesRef.current.filter(p => p.alpha > 0.01);

    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.vx *= 0.99; // air resistance
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawStar(ctx, 0, 0, p.size / 2);
      }
      ctx.restore();
    }

    if (elapsed < duration || particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [duration, particleCount]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesRef.current = [];
    startRef.current = 0;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [active, animate]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9998] pointer-events-none"
      aria-hidden="true"
    />
  );
};

/**
 * Hook for triggering confetti from any component.
 */
import { useState } from 'react';

export function useConfetti() {
  const [active, setActive] = useState(false);

  const trigger = useCallback((duration = 3500) => {
    setActive(true);
    setTimeout(() => setActive(false), duration + 500);
  }, []);

  return { active, trigger };
}
