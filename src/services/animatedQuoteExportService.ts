import { QuoteCardSettings } from '../types';
import { renderQuoteToCanvas } from './imageExportService';
import { ambientSounds } from '../data/ambientSounds';

export type MotionStyle = 'stardust' | 'breathingZoom' | 'celestialRays' | 'gentleRain';

export interface AnimatedQuoteConfig {
  settings: QuoteCardSettings;
  motionStyle: MotionStyle;
  durationSeconds: number; // 5, 8, 12
  ambientSoundId?: string;
  ambientVolume?: number; // 0 to 100
  fps?: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  alpha: number;
  maxAlpha: number;
  pulseSpeed: number;
  pulseVal: number;
  color: string;
  angle?: number;
  length?: number;
}

/**
 * Initializes particles according to motion style
 */
export function initParticles(width: number, height: number, style: MotionStyle): Particle[] {
  const particles: Particle[] = [];

  if (style === 'stardust') {
    const count = Math.min(45, Math.round((width * height) / 35000));
    const colors = ['#fde047', '#f59e0b', '#fbbf24', '#ffffff', '#fed7aa'];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.5 + Math.random() * 3.5,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: -0.4 - Math.random() * 0.8,
        alpha: 0.2 + Math.random() * 0.6,
        maxAlpha: 0.5 + Math.random() * 0.45,
        pulseSpeed: 0.02 + Math.random() * 0.035,
        pulseVal: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  } else if (style === 'gentleRain') {
    const count = Math.min(70, Math.round((width * height) / 25000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1,
        length: 15 + Math.random() * 25,
        speedX: -0.8 - Math.random() * 0.5,
        speedY: 10 + Math.random() * 8,
        alpha: 0.15 + Math.random() * 0.35,
        maxAlpha: 0.4,
        pulseSpeed: 0,
        pulseVal: 0,
        color: 'rgba(216, 235, 255, 0.45)',
      });
    }
  }

  return particles;
}

/**
 * Draws a single motion frame onto the target canvas
 */
export function drawMotionFrame(
  ctx: CanvasRenderingContext2D,
  baseCardCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  timeSec: number,
  style: MotionStyle,
  particles: Particle[]
): void {
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Base Card with Subtle Breathing Zoom
  ctx.save();
  if (style === 'breathingZoom') {
    const scale = 1.0 + Math.sin(timeSec * 0.8) * 0.025; // 1.0 to 1.025
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);
  }
  ctx.drawImage(baseCardCanvas, 0, 0, width, height);
  ctx.restore();

  // 2. Motion Effects Overlay
  if (style === 'stardust') {
    // Draw and update glowing stardust particles
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    particles.forEach((p) => {
      p.pulseVal += p.pulseSpeed;
      const currentAlpha = Math.max(
        0.1,
        Math.min(p.maxAlpha, (Math.sin(p.pulseVal) + 1) * 0.5 * p.maxAlpha)
      );

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.8);
      grad.addColorStop(0, p.color);
      grad.addColorStop(0.4, p.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.globalAlpha = currentAlpha;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Core particle
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = currentAlpha * 0.9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Movement
      p.x += p.speedX + Math.sin(p.pulseVal * 0.5) * 0.3;
      p.y += p.speedY;

      // Wrap around screen
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
    });
    ctx.restore();
  } else if (style === 'celestialRays') {
    // Gentle sweeping ethereal god-rays
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const rayAngle = Math.sin(timeSec * 0.4) * 0.15 - 0.25;
    const rayIntensity = 0.12 + Math.sin(timeSec * 0.9) * 0.05;

    const grad = ctx.createLinearGradient(
      width * 0.2 + Math.cos(rayAngle) * width * 0.3,
      0,
      width * 0.8,
      height
    );
    grad.addColorStop(0, `rgba(254, 240, 138, ${rayIntensity * 1.5})`);
    grad.addColorStop(0.3, `rgba(245, 158, 11, ${rayIntensity * 0.8})`);
    grad.addColorStop(0.7, `rgba(217, 119, 6, ${rayIntensity * 0.3})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient breathing vignette
    const centerGlow = ctx.createRadialGradient(
      width / 2,
      height * 0.45,
      width * 0.1,
      width / 2,
      height * 0.45,
      width * 0.7
    );
    centerGlow.addColorStop(0, `rgba(251, 191, 36, ${0.08 + Math.sin(timeSec * 1.2) * 0.04})`);
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else if (style === 'gentleRain') {
    // Falling rain streaks and gentle ambient mist
    ctx.save();
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';

    particles.forEach((p) => {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.speedX * 2, p.y + (p.length || 20));
      ctx.stroke();

      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * (width + 50);
      }
      if (p.x < -20) p.x = width + 20;
    });

    // Gentle mist layer
    const mistGrad = ctx.createLinearGradient(0, height * 0.7, 0, height);
    mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    mistGrad.addColorStop(1, 'rgba(186, 230, 253, 0.08)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    ctx.restore();
  }
}

/**
 * Exports Animated Quote Video with MediaRecorder and Web Audio API
 */
export async function exportAnimatedQuoteVideo(
  config: AnimatedQuoteConfig,
  onProgress?: (renderedSeconds: number, totalSeconds: number, percent: number) => void
): Promise<{ blob: Blob; url: string }> {
  // 1. Render Base High-Res Card
  const baseCardCanvas = await renderQuoteToCanvas(config.settings, false);
  const width = baseCardCanvas.width;
  const height = baseCardCanvas.height;

  // 2. Setup Render Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Failed to create canvas context');

  const particles = initParticles(width, height, config.motionStyle);
  const totalDuration = config.durationSeconds || 8;
  const fps = config.fps || 30;
  const totalFrames = Math.round(totalDuration * fps);

  // 3. Setup Audio Stream (Ambient Sound or Silent Track)
  const AudioCtxClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtxClass();
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch (err) {
      console.debug('[AnimatedQuote] audioCtx resume error:', err);
    }
  }
  const destNode = audioCtx.createMediaStreamDestination();

  let ambientAudioEl: HTMLAudioElement | null = null;
  let sourceNode: MediaElementAudioSourceNode | null = null;

  const ambientItem = ambientSounds.find((s) => s.id === config.ambientSoundId);
  if (ambientItem && ambientItem.fileUrl && (config.ambientVolume ?? 35) > 0) {
    try {
      ambientAudioEl = new Audio(ambientItem.fileUrl);
      ambientAudioEl.crossOrigin = 'anonymous';
      ambientAudioEl.loop = true;
      sourceNode = audioCtx.createMediaElementSource(ambientAudioEl);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = (config.ambientVolume ?? 35) / 100;
      sourceNode.connect(gainNode);
      gainNode.connect(destNode);
      await ambientAudioEl.play();
    } catch (err) {
      console.warn('[AnimatedQuote] Could not load ambient audio:', err);
    }
  } else {
    // Generate gentle silent oscillator so the video file has a clean valid audio track
    const osc = audioCtx.createOscillator();
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0.0001;
    osc.connect(silentGain);
    silentGain.connect(destNode);
    osc.start();
  }

  // 4. Setup MediaStream & MediaRecorder
  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...destNode.stream.getAudioTracks(),
  ]);

  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond: 6000000, // 6 Mbps HD
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise<{ blob: Blob; url: string }>((resolve, reject) => {
    recorder.onstop = () => {
      // Cleanup audio
      if (ambientAudioEl) {
        ambientAudioEl.pause();
        ambientAudioEl.src = '';
      }
      audioCtx.close().catch((err) => {
        console.debug('[AnimatedQuote] audioCtx close error:', err);
      });

      const finalBlob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(finalBlob);
      resolve({ blob: finalBlob, url });
    };

    recorder.onerror = (e) => {
      reject(e);
    };

    recorder.start(100);

    // 5. Render frames continuously with strict clock
    let currentFrame = 0;
    const intervalMs = 1000 / fps;

    const renderLoop = () => {
      if (currentFrame >= totalFrames) {
        recorder.stop();
        return;
      }

      const timeSec = currentFrame / fps;
      drawMotionFrame(ctx, baseCardCanvas, width, height, timeSec, config.motionStyle, particles);

      currentFrame++;
      if (onProgress) {
        const percent = Math.min(100, Math.round((currentFrame / totalFrames) * 100));
        onProgress(timeSec, totalDuration, percent);
      }

      setTimeout(renderLoop, intervalMs);
    };

    renderLoop();
  });
}
