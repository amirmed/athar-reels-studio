import React, { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioElement,
  isPlaying,
  color = '#14b8a6',
  barCount = 32,
  height = 48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    // Setup AudioContext and analyser
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    const ctx = contextRef.current;

    if (!sourceRef.current) {
      try {
        sourceRef.current = ctx.createMediaElementSource(audioElement);
      } catch {
        // Already connected
      }
    }

    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 128;
      sourceRef.current?.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const cCtx = canvas.getContext('2d');
    if (!cCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      cCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount - 1;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = isPlaying
          ? dataArray[dataIndex]
          : (Math.sin(Date.now() / 800 + i * 0.5) + 1) * 15;
        const barHeight = (value / 255) * canvas.height;

        // Gradient bar
        const gradient = cCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, `${color}aa`);
        gradient.addColorStop(1, `${color}ff`);

        cCtx.fillStyle = gradient;
        cCtx.beginPath();
        cCtx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 2);
        cCtx.fill();

        x += barWidth + 1;
      }
    };

    draw();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={height}
      className="w-full rounded-lg"
      style={{ height }}
    />
  );
};

// Simulated visualizer (when no real audio context is available)
export const SimulatedVisualizer: React.FC<{
  isPlaying: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}> = ({ isPlaying, color = '#14b8a6', barCount = 32, height = 48 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const barsRef = useRef<number[]>(
    Array.from({ length: barCount }, () => Math.random() * 0.3 + 0.1)
  );
  const targetsRef = useRef<number[]>(Array.from({ length: barCount }, () => Math.random()));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cCtx = canvas.getContext('2d');
    if (!cCtx) return;

    let frame = 0;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      frame++;

      // Update bar targets periodically
      if (frame % 8 === 0 && isPlaying) {
        for (let i = 0; i < barCount; i++) {
          targetsRef.current[i] = Math.random() * 0.9 + 0.05;
        }
      }

      cCtx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / barCount - 1;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        // Smooth lerp toward target
        const speed = isPlaying ? 0.12 : 0.04;
        barsRef.current[i] += (targetsRef.current[i] - barsRef.current[i]) * speed;

        const idle = (Math.sin(Date.now() / 1000 + i * 0.4) + 1) * 0.08 + 0.04;
        const val = isPlaying ? barsRef.current[i] : idle;
        const barHeight = val * canvas.height;

        const gradient = cCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, `${color}60`);
        gradient.addColorStop(0.6, `${color}cc`);
        gradient.addColorStop(1, `${color}ff`);

        cCtx.fillStyle = gradient;
        cCtx.beginPath();
        cCtx.roundRect(x, canvas.height - barHeight, barWidth, Math.max(barHeight, 2), 2);
        cCtx.fill();

        x += barWidth + 1;
      }
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={height}
      className="w-full rounded-lg opacity-90"
      style={{ height }}
    />
  );
};
