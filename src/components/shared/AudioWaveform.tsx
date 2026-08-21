/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  isSpeaking?: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  isSpeaking = false,
  color = '#10b981',
  barCount = 32,
  height = 64,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;

        if (isActive) {
          const frequency = isSpeaking ? 0.3 : 0.15;
          const amplitude = isSpeaking ? height * 0.42 : height * 0.2;
          const noise = Math.sin(phase + i * frequency) * Math.cos(phase * 0.5 + i * 0.2);
          barHeight = Math.max(6, Math.abs(noise * amplitude) + 8);
        }

        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        // Gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isSpeaking) {
          gradient.addColorStop(0, '#06b6d4'); // cyan-500
          gradient.addColorStop(0.5, '#10b981'); // emerald-500
          gradient.addColorStop(1, '#8b5cf6'); // purple-500
        } else if (isActive) {
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(1, '#059669');
        } else {
          gradient.addColorStop(0, '#475569');
          gradient.addColorStop(1, '#334155');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + 2, y, barWidth - 4, barHeight, 3);
        ctx.fill();
      }

      phase += isSpeaking ? 0.12 : 0.04;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, isSpeaking, color, barCount, height]);

  return (
    <div className="w-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={320}
        height={height}
        className="w-full max-w-xs h-16"
      />
    </div>
  );
};
