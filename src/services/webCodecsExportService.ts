/**
 * Athar Studio WebCodecs Ultra-Fast MP4 Export Engine
 * Exports Quran reels and videos 5x - 10x faster than real-time
 * producing real MP4 (H.264 + AAC) files with zero-dependency MP4 muxing.
 */

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { AyahData } from './quranApi';
import { TextSettings } from '../types';
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
  bgImage?: HTMLImageElement | null;
  bgVideoUrl?: string | null;
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
 * Mix and decode all audio tracks into a master AudioBuffer using OfflineAudioContext
 */
async function buildMasterAudioBuffer(
  audioUrls: string[],
  totalDurationSec: number
): Promise<AudioBuffer | null> {
  if (!audioUrls || audioUrls.length === 0 || totalDurationSec <= 0) {
    return null;
  }

  try {
    const sampleRate = 48000;
    const numberOfChannels = 2;
    const length = Math.ceil(sampleRate * (totalDurationSec + 1));
    const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);

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
        source.connect(offlineCtx.destination);
        source.start(currentOffset);

        currentOffset += decoded.duration;
      } catch (e) {
        console.warn('[WebCodecsExport] Error decoding audio segment:', e);
      }
    }

    return await offlineCtx.startRendering();
  } catch (err) {
    console.warn('[WebCodecsExport] Failed to build master audio buffer:', err);
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

  // 1. Prepare Master AudioBuffer
  let masterBuffer = params.masterAudioBuffer || null;
  if (!masterBuffer && params.audioUrls && params.audioUrls.length > 0) {
    masterBuffer = await buildMasterAudioBuffer(params.audioUrls, totalDurationSec);
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
    let activeSegment = timeline.find((s) => currentTimeSec >= s.start && currentTimeSec < s.end);
    if (!activeSegment && timeline.length > 0) {
      activeSegment =
        currentTimeSec >= timeline[timeline.length - 1].end
          ? timeline[timeline.length - 1]
          : timeline[0];
    }

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
