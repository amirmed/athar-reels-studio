/**
 * Audio Peak Extractor & Envelope Generator for Athar Studio
 * Extracts true acoustic amplitudes/peaks from AudioBuffer or audio URLs
 * for 1:1 waveform visualization across live preview and video export.
 */

import { quranCacheService } from './quranCacheService';

// In-memory LRU cache of computed peaks (Key: audioUrl or bufferKey)
const peakCache = new Map<string, number[]>();
const MAX_PEAK_CACHE_SIZE = 150;

/**
 * Extract normalized acoustic peaks from an AudioBuffer
 * @param buffer Decoded AudioBuffer
 * @param sampleCount Total number of peak points to extract across duration (default: 300)
 */
export function extractAudioPeaksFromBuffer(
  buffer: AudioBuffer,
  sampleCount = 300
): number[] {
  if (!buffer || buffer.length === 0) {
    return Array(sampleCount).fill(0.2);
  }

  const channelData = buffer.getChannelData(0);
  const totalSamples = channelData.length;
  const blockSize = Math.max(1, Math.floor(totalSamples / sampleCount));
  const peaks: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, totalSamples);
    const count = end - start;

    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j] || 0);
    }

    const avg = count > 0 ? sum / count : 0;
    // Scale and normalize with soft ceiling
    const normalized = Math.min(1, Math.max(0.06, avg * 2.9));
    peaks.push(normalized);
  }

  return peaks;
}

/**
 * Extract and cache acoustic peaks from an audio URL
 */
export async function extractAudioPeaksFromUrl(
  url: string,
  audioCtx?: AudioContext | BaseAudioContext,
  sampleCount = 300
): Promise<number[]> {
  if (!url || typeof url !== 'string') {
    return Array(sampleCount).fill(0.2);
  }

  // Check cache first
  const cached = peakCache.get(url);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    let arrayBuffer: ArrayBuffer | null = null;

    // Try reading from Quran indexedDB cache if available
    try {
      const cachedBlob = await quranCacheService.getCachedAudioBlob(url);
      if (cachedBlob) {
        arrayBuffer = await cachedBlob.arrayBuffer();
      }
    } catch {
      // Fallback to fetch
    }

    if (!arrayBuffer) {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      arrayBuffer = await res.arrayBuffer();
    }

    let ctx = audioCtx;
    let ownCtx: AudioContext | null = null;
    if (!ctx) {
      const AudioCtxClass =
        (typeof window !== 'undefined' &&
          (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)) ||
        null;
      if (AudioCtxClass) {
        ownCtx = new AudioCtxClass();
        ctx = ownCtx;
      }
    }

    if (!ctx) {
      return Array(sampleCount).fill(0.25);
    }

    const decodedBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const peaks = extractAudioPeaksFromBuffer(decodedBuffer, sampleCount);

    // Cache results with LRU eviction
    if (peakCache.size >= MAX_PEAK_CACHE_SIZE) {
      const firstKey = peakCache.keys().next().value;
      if (firstKey) peakCache.delete(firstKey);
    }
    peakCache.set(url, peaks);

    if (ownCtx && ownCtx.state !== 'closed') {
      try {
        await ownCtx.close();
      } catch {
        // Ignore
      }
    }

    return peaks;
  } catch (err) {
    console.debug('[AudioPeakExtractor] Peak extraction failed for URL, using synthesized envelope:', err);
    return Array(sampleCount).fill(0.25);
  }
}

/**
 * Get synchronously cached peaks if already decoded
 */
export function getAudioPeaksCached(url: string): number[] | undefined {
  return peakCache.get(url);
}

/**
 * Store pre-computed peaks in cache
 */
export function cacheAudioPeaks(key: string, peaks: number[]): void {
  if (peakCache.size >= MAX_PEAK_CACHE_SIZE) {
    const firstKey = peakCache.keys().next().value;
    if (firstKey) peakCache.delete(firstKey);
  }
  peakCache.set(key, peaks);
}

/**
 * Sample amplitude heights array around the current playback timestamp
 * @param peaks Real acoustic peaks
 * @param currentTimeSec Current playback position in seconds
 * @param totalDurationSec Total track duration in seconds
 * @param barCount Number of output bars (default: 28)
 * @param frame Video frame number for subtle live animation
 */
export function getSampledWaveformHeights(
  peaks: number[] | undefined,
  currentTimeSec: number,
  totalDurationSec: number,
  barCount = 28,
  frame = 0
): number[] {
  const safeDuration = Math.max(0.1, totalDurationSec || 15);
  const progress = Math.max(0, Math.min(1, (currentTimeSec || 0) / safeDuration));

  if (!peaks || peaks.length === 0) {
    // Smooth dynamic fallback when audio is loading or offline
    return Array.from({ length: barCount }, (_, b) => {
      const phase = frame * 0.22 + b * 0.38;
      const taper = 0.5 + 0.5 * Math.sin((b / (barCount - 1)) * Math.PI);
      return 0.15 + 0.7 * Math.abs(Math.sin(phase)) * taper;
    });
  }

  const centerIndex = Math.floor(progress * (peaks.length - 1));
  const halfWindow = Math.floor(barCount / 2);
  const heights: number[] = [];

  for (let b = 0; b < barCount; b++) {
    const offset = b - halfWindow;
    const peakIdx = Math.min(peaks.length - 1, Math.max(0, centerIndex + offset));
    const rawPeak = peaks[peakIdx] ?? 0.12;

    // Taper edges smoothly so the waveform looks naturally shaped around the center
    const taper = 0.55 + 0.45 * Math.sin((b / Math.max(1, barCount - 1)) * Math.PI);
    // Subtle dynamic modulation to reflect continuous acoustic energy
    const dynamicMod = 0.9 + 0.1 * Math.sin(frame * 0.3 + b * 0.7);
    const heightFactor = Math.min(1, Math.max(0.08, rawPeak * taper * dynamicMod));
    heights.push(heightFactor);
  }

  return heights;
}
