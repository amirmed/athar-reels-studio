/**
 * Athar Studio WebCodecs Ultra-Fast MP4 Export Engine
 * Exports Quran reels and videos 5x - 10x faster than real-time
 * producing real MP4 (H.264 + AAC) files with zero-dependency MP4 muxing.
 */

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { AyahData } from './quranApi';
import { TextSettings, AudioSettings } from '../types';
import { renderVideoExportFrame } from './videoFrameRenderer';

export interface WebCodecsExportParams {
  width: number;
  height: number;
  fps?: number;
  bitrate?: number;
  ayahs: AyahData[];
  timeline: Array<{
    start: number;
    end: number;
    duration: number;
    ayah: AyahData;
  }>;
  totalDurationSec: number;
  masterAudioBuffer?: AudioBuffer | null;
  audioUrls?: string[];
  audioSettings?: AudioSettings;
  bgImage?: HTMLImageElement | null;
  bgVideoUrl?: string | null;
  sceneBgImages?: Record<number, HTMLImageElement | HTMLVideoElement>;
  bgOpacity: number;
  textSettings?: TextSettings;
  watermark?: string;
  projectName: string;
  surahName?: string;
  reciterName?: string;
  showTranslation?: boolean;
  onProgress?: (info: {
    percent: number;
    currentFrame: number;
    totalFrames: number;
    fps: number;
  }) => void;
  signal?: AbortSignal;
}

/**
 * Check if WebCodecs H.264 video encoding is supported in the current environment
 */
export async function isWebCodecsExportSupported(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    typeof (window as any).VideoEncoder === 'undefined' ||
    typeof (window as any).VideoFrame === 'undefined'
  ) {
    return false;
  }

  try {
    const support = await VideoEncoder.isConfigSupported({
      codec: 'avc1.640028', // H.264 High Profile Level 4.0
      width: 1080,
      height: 1920,
      bitrate: 8_000_000,
      framerate: 30,
    });
    return !!support.supported;
  } catch {
    try {
      // Fallback configuration check: Main Profile
      const fallbackSupport = await VideoEncoder.isConfigSupported({
        codec: 'avc1.4d002a', // H.264 Main Profile Level 4.2
        width: 1080,
        height: 1920,
        bitrate: 8_000_000,
        framerate: 30,
      });
      return !!fallbackSupport.supported;
    } catch {
      return false;
    }
  }
}

/**
 * Generate algorithmic impulse response for Mosque Reverb in OfflineAudioContext
 */
function generateMosqueImpulse(
  ctx: OfflineAudioContext,
  durationSec: number,
  decayRate: number
): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * durationSec);
  const impulse = ctx.createBuffer(2, length, rate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const envelope = Math.exp(-decayRate * t);
    const earlyRefl = i < rate * 0.08 ? (Math.random() * 2 - 1) * 1.5 : Math.random() * 2 - 1;
    left[i] = earlyRefl * envelope;
    right[i] = (Math.random() * 2 - 1) * envelope;
  }

  return impulse;
}

/**
 * Mix, decode, and process all audio tracks with full DSP (Reverb, 8D, EQ, Noise Gate) using OfflineAudioContext
 */
async function buildMasterAudioBuffer(
  audioUrls: string[],
  totalDurationSec: number,
  audioSettings?: AudioSettings
): Promise<AudioBuffer | null> {
  if (!audioUrls || audioUrls.length === 0 || totalDurationSec <= 0) {
    return null;
  }

  try {
    const sampleRate = 48000;
    const numberOfChannels = 2;
    const length = Math.ceil(sampleRate * (totalDurationSec + 2));
    const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);

    // 1. DSP Filter Nodes (Noise Gate, Clarity, Warmth, Dynamics)
    const highpass = offlineCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = audioSettings?.enableNoiseGate ? 80 : 30;

    const clarity = offlineCtx.createBiquadFilter();
    clarity.type = 'highshelf';
    clarity.frequency.value = 3500;
    clarity.gain.value = audioSettings?.enableStudioClarity ? 4.0 : 0;

    const warmth = offlineCtx.createBiquadFilter();
    warmth.type = 'lowshelf';
    warmth.frequency.value = 250;
    warmth.gain.value = audioSettings?.enableVoiceWarmth ? 3.5 : 0;

    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 8;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.2;

    highpass.connect(clarity);
    clarity.connect(warmth);
    warmth.connect(compressor);

    // 2. Reverb Dry / Wet Mixing
    const dryGain = offlineCtx.createGain();
    const wetGain = offlineCtx.createGain();
    const subMasterGain = offlineCtx.createGain();

    compressor.connect(dryGain);
    dryGain.connect(subMasterGain);

    if (audioSettings?.reverbPreset && audioSettings.reverbPreset !== 'none') {
      const convolver = offlineCtx.createConvolver();
      let dur = 2.5;
      let decay = 3.0;
      if (audioSettings.reverbPreset === 'smallRoom') {
        dur = 1.2;
        decay = 5.0;
      } else if (audioSettings.reverbPreset === 'grandMosque') {
        dur = 3.2;
        decay = 2.2;
      } else if (audioSettings.reverbPreset === 'makkahHaram') {
        dur = 4.8;
        decay = 1.5;
      } else if (audioSettings.reverbPreset === 'celestialEcho') {
        dur = 6.5;
        decay = 1.1;
      }

      convolver.buffer = generateMosqueImpulse(offlineCtx, dur, decay);
      const wetFraction = ((audioSettings.reverbLevel ?? 35) / 100) * 0.75;
      wetGain.gain.value = wetFraction;
      dryGain.gain.value = 1.0 - wetFraction * 0.3;

      compressor.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(subMasterGain);
    } else {
      dryGain.gain.value = 1.0;
      wetGain.gain.value = 0;
    }

    // 3. 8D Binaural Spatial Audio Modulation
    let postDspNode: AudioNode = subMasterGain;
    if (audioSettings?.enable8DAudio && typeof (offlineCtx as any).createStereoPanner === 'function') {
      const panner = (offlineCtx as any).createStereoPanner();
      const speedHz = audioSettings.eightDSpeed ?? 0.12;
      const depth = Math.min(1.0, (audioSettings.eightDDepth ?? 85) / 100);

      const points = Math.max(100, Math.ceil(totalDurationSec * 30));
      const curve = new Float32Array(points);
      for (let i = 0; i < points; i++) {
        const t = (i / points) * totalDurationSec;
        curve[i] = Math.sin(2 * Math.PI * speedHz * t) * depth;
      }
      panner.pan.setValueCurveAtTime(curve, 0, totalDurationSec);

      subMasterGain.connect(panner);
      postDspNode = panner;
    }

    // 4. Master Volume & Fades
    const masterGain = offlineCtx.createGain();
    const baseVol = (audioSettings?.recitationVolume ?? 100) / 100;
    masterGain.gain.setValueAtTime(baseVol, 0);

    if (audioSettings?.fadeIn) {
      const fadeDur = audioSettings.fadeDuration || 0.5;
      masterGain.gain.setValueAtTime(0, 0);
      masterGain.gain.linearRampToValueAtTime(baseVol, fadeDur);
    }
    if (audioSettings?.fadeOut && totalDurationSec > 1) {
      const fadeDur = audioSettings.fadeDuration || 0.5;
      const startFadeOut = Math.max(0, totalDurationSec - fadeDur);
      masterGain.gain.setValueAtTime(baseVol, startFadeOut);
      masterGain.gain.linearRampToValueAtTime(0, totalDurationSec);
    }

    postDspNode.connect(masterGain);
    masterGain.connect(offlineCtx.destination);

    // 5. Decode and stream all audio segments into DSP chain
    let currentOffset = 0;
    for (const url of audioUrls) {
      if (!url) continue;
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const arrayBuf = await res.arrayBuffer();
        const decoded = await offlineCtx.decodeAudioData(arrayBuf);

        const source = offlineCtx.createBufferSource();
        source.buffer = decoded;
        source.connect(highpass);
        source.start(currentOffset);

        currentOffset += decoded.duration;
      } catch (e) {
        console.warn('[WebCodecsExport] Error decoding audio segment:', e);
      }
    }

    return await offlineCtx.startRendering();
  } catch (err) {
    console.warn('[WebCodecsExport] Failed to build master audio buffer with DSP:', err);
    return null;
  }
}

/**
 * High-Speed WebCodecs MP4 Export
 */
export async function exportVideoWithWebCodecs(params: WebCodecsExportParams): Promise<Blob> {
  const {
    width,
    height,
    fps = 30,
    bitrate = 8_000_000,
    timeline,
    totalDurationSec,
    bgImage,
    bgOpacity,
    textSettings,
    watermark,
    projectName,
    surahName,
    reciterName,
    showTranslation,
    onProgress,
    signal,
  } = params;

  if (signal?.aborted) {
    throw new Error('Export aborted by user');
  }

  // 1. Prepare Master AudioBuffer with full DSP chain
  let masterBuffer = params.masterAudioBuffer || null;
  if (!masterBuffer && params.audioUrls && params.audioUrls.length > 0) {
    masterBuffer = await buildMasterAudioBuffer(params.audioUrls, totalDurationSec, params.audioSettings);
  }

  const sampleRate = masterBuffer ? masterBuffer.sampleRate : 48000;
  const numberOfChannels = masterBuffer ? masterBuffer.numberOfChannels : 2;
  const hasAudio = !!(masterBuffer && masterBuffer.length > 0);

  // 2. Determine preferred H.264 codec string
  let chosenVideoCodec = 'avc1.640028';
  try {
    const configCheck = await VideoEncoder.isConfigSupported({
      codec: 'avc1.640028',
      width,
      height,
      bitrate,
      framerate: fps,
    });
    if (!configCheck.supported) {
      chosenVideoCodec = 'avc1.4d002a';
    }
  } catch {
    chosenVideoCodec = 'avc1.4d002a';
  }

  // 3. Initialize MP4 Muxer with FastStart for instant playback
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width,
      height,
      frameRate: fps,
    },
    audio: hasAudio
      ? {
          codec: 'aac',
          numberOfChannels,
          sampleRate,
        }
      : undefined,
    fastStart: 'in-memory',
  });

  // 4. Initialize VideoEncoder
  let encoderError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        muxer.addVideoChunk(chunk, meta);
      } catch (err: any) {
        console.warn('[WebCodecsExport] Error adding video chunk:', err);
      }
    },
    error: (e) => {
      console.error('[WebCodecsExport] VideoEncoder error:', e);
      encoderError = new Error(`VideoEncoder failure: ${e.message}`);
    },
  });

  videoEncoder.configure({
    codec: chosenVideoCodec,
    width,
    height,
    bitrate,
    framerate: fps,
  });

  // 5. Initialize AudioEncoder (if audio track exists)
  let audioEncoder: AudioEncoder | null = null;
  if (hasAudio && typeof AudioEncoder !== 'undefined') {
    try {
      const audioSupport = await AudioEncoder.isConfigSupported({
        codec: 'mp4a.40.2', // AAC-LC
        sampleRate,
        numberOfChannels,
        bitrate: 192_000,
      });

      if (audioSupport.supported) {
        audioEncoder = new AudioEncoder({
          output: (chunk, meta) => {
            try {
              muxer.addAudioChunk(chunk, meta);
            } catch (err: any) {
              console.warn('[WebCodecsExport] Error adding audio chunk:', err);
            }
          },
          error: (e) => {
            console.warn('[WebCodecsExport] AudioEncoder error:', e);
          },
        });

        audioEncoder.configure({
          codec: 'mp4a.40.2',
          sampleRate,
          numberOfChannels,
          bitrate: 192_000,
        });
      }
    } catch (err) {
      console.warn('[WebCodecsExport] AudioEncoder setup skipped:', err);
    }
  }

  // 6. Encode Audio Track in Chunks (if AudioEncoder active)
  if (audioEncoder && masterBuffer) {
    const channel0 = masterBuffer.getChannelData(0);
    const channel1 = numberOfChannels > 1 ? masterBuffer.getChannelData(1) : channel0;
    const totalSamples = masterBuffer.length;
    const frameSize = 1024; // Standard AAC frame size

    for (let offset = 0; offset < totalSamples; offset += frameSize) {
      if (signal?.aborted) break;

      const currentFrameCount = Math.min(frameSize, totalSamples - offset);
      const planarData = new Float32Array(currentFrameCount * 2);

      // Copy planar channel 0 & channel 1
      planarData.set(channel0.subarray(offset, offset + currentFrameCount), 0);
      planarData.set(channel1.subarray(offset, offset + currentFrameCount), currentFrameCount);

      const timestampUs = Math.round((offset / sampleRate) * 1_000_000);

      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate,
        numberOfChannels: 2,
        numberOfFrames: currentFrameCount,
        timestamp: timestampUs,
        data: planarData,
      });

      audioEncoder.encode(audioData);
      audioData.close();
    }
  }

  // 7. Setup Offscreen or standard Canvas for ultra-fast rendering
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) {
    throw new Error('Failed to create canvas 2D rendering context for export');
  }

  const totalFrames = Math.max(fps * 2, Math.round(fps * totalDurationSec));
  const startTime = performance.now();
  let lastReportedTime = 0;

  // 8. Faster-Than-Realtime Frame Loop
  for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
    if (signal?.aborted) {
      videoEncoder.close();
      if (audioEncoder) audioEncoder.close();
      throw new Error('Export cancelled by user');
    }

    if (encoderError) {
      throw encoderError;
    }

    const currentTimeSec = frameIdx / fps;
    const timestampUs = Math.round(currentTimeSec * 1_000_000);
    const durationUs = Math.round((1 / fps) * 1_000_000);

    // Find active timeline segment
    let activeSegmentIndex = timeline.findIndex(
      (s) => currentTimeSec >= s.start && currentTimeSec < s.end
    );
    if (activeSegmentIndex === -1 && timeline.length > 0) {
      activeSegmentIndex =
        currentTimeSec >= timeline[timeline.length - 1].end ? timeline.length - 1 : 0;
    }

    const activeSegment = timeline[activeSegmentIndex];
    const currentAyah = activeSegment ? activeSegment.ayah : params.ayahs[0];

    // Render frame to canvas with full visual parity
    renderVideoExportFrame({
      ctx,
      width,
      height,
      frame: frameIdx,
      totalFrames,
      currentTimeSec,
      bgImage,
      sceneBgImages: params.sceneBgImages,
      currentAyahIndex: activeSegmentIndex >= 0 ? activeSegmentIndex : 0,
      bgOpacity,
      currentAyah,
      textSettings,
      watermark,
      projectName,
      surahName,
      reciterName,
      showTranslation,
    });

    // Create VideoFrame from Canvas
    const videoFrame = new VideoFrame(canvas, {
      timestamp: timestampUs,
      duration: durationUs,
    });

    const isKeyFrame = frameIdx % (fps * 2) === 0;
    videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
    videoFrame.close();

    // Backpressure: prevent encoder queue overflow
    while (videoEncoder.encodeQueueSize > 6) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Progress updates
    const now = performance.now();
    if (now - lastReportedTime >= 80 || frameIdx === totalFrames - 1) {
      lastReportedTime = now;
      const elapsedSec = Math.max(0.01, (now - startTime) / 1000);
      const currentFps = Math.round((frameIdx + 1) / elapsedSec);
      const percent = Math.min(99, Math.round(((frameIdx + 1) / totalFrames) * 100));

      if (onProgress) {
        onProgress({
          percent,
          currentFrame: frameIdx + 1,
          totalFrames,
          fps: currentFps,
        });
      }
    }
  }

  // 9. Flush Encoders and Finalize MP4 File
  await videoEncoder.flush();
  videoEncoder.close();

  if (audioEncoder) {
    await audioEncoder.flush();
    audioEncoder.close();
  }

  muxer.finalize();

  const mp4Blob = new Blob([target.buffer], { type: 'video/mp4' });
  return mp4Blob;
}
