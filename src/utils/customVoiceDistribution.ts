import type { AyahData } from '../services/quranApi';
import { quranCacheService } from '../services/quranCacheService';

export interface SilenceInterval {
  startSec: number;
  endSec: number;
  durationSec: number;
  midpointSec: number;
  avgRms: number;
}

export interface SilenceDetectionOptions {
  windowSizeMs?: number; // RMS window (default: 100ms)
  hopSizeMs?: number; // RMS hop step (default: 25ms)
  minSilenceDurationMs?: number; // Minimum silence pause to cut (default: 600ms)
  silenceThresholdRms?: number; // Explicit silence threshold or dynamic auto-detect
}

/**
 * Compute sliding RMS (Root Mean Square) energy envelope across audio samples
 */
export function computeRmsFrames(
  channelData: Float32Array,
  sampleRate: number,
  windowSizeMs = 100,
  hopSizeMs = 25
): { times: number[]; rms: number[] } {
  if (!channelData || channelData.length === 0 || sampleRate <= 0) {
    return { times: [], rms: [] };
  }

  const windowSize = Math.max(1, Math.round((windowSizeMs / 1000) * sampleRate));
  const hopSize = Math.max(1, Math.round((hopSizeMs / 1000) * sampleRate));
  const totalSamples = channelData.length;
  const numFrames = Math.max(0, Math.floor((totalSamples - windowSize) / hopSize) + 1);

  const times: number[] = new Array(numFrames);
  const rms: number[] = new Array(numFrames);

  for (let k = 0; k < numFrames; k++) {
    const offset = k * hopSize;
    let sumSq = 0;
    const end = Math.min(offset + windowSize, totalSamples);
    const count = end - offset;

    for (let j = offset; j < end; j++) {
      const val = channelData[j] || 0;
      sumSq += val * val;
    }

    const valRms = count > 0 ? Math.sqrt(sumSq / count) : 0;
    times[k] = Math.round(((offset + count / 2) / sampleRate) * 1000) / 1000;
    rms[k] = valRms;
  }

  return { times, rms };
}

/**
 * Detect silence intervals (pauses >= minSilenceDurationMs) in an audio channel
 */
export function detectSilenceIntervals(
  channelData: Float32Array,
  sampleRate: number,
  options: SilenceDetectionOptions = {}
): SilenceInterval[] {
  const windowSizeMs = options.windowSizeMs ?? 100;
  const hopSizeMs = options.hopSizeMs ?? 25;
  const minSilenceSec = (options.minSilenceDurationMs ?? 600) / 1000;

  const { times, rms } = computeRmsFrames(channelData, sampleRate, windowSizeMs, hopSizeMs);
  if (rms.length === 0) return [];

  // Determine dynamic adaptive silence threshold
  let threshold = options.silenceThresholdRms;
  if (threshold === undefined) {
    let maxRms = 0;
    for (let i = 0; i < rms.length; i++) {
      if (rms[i] > maxRms) maxRms = rms[i];
    }
    const sortedSample = [...rms].sort((a, b) => a - b);
    const p10 = sortedSample[Math.floor(sortedSample.length * 0.1)] || 0.001;

    // Adaptive threshold based on noise floor & peak speech energy
    threshold = Math.max(0.01, Math.min(0.05, p10 * 2.5, maxRms * 0.08));
  }

  const intervals: SilenceInterval[] = [];
  let inSilence = false;
  let silenceStartIdx = 0;
  let silenceSumRms = 0;

  for (let i = 0; i < rms.length; i++) {
    const isSilent = rms[i] <= threshold;

    if (isSilent && !inSilence) {
      inSilence = true;
      silenceStartIdx = i;
      silenceSumRms = rms[i];
    } else if (isSilent && inSilence) {
      silenceSumRms += rms[i];
    } else if (!isSilent && inSilence) {
      inSilence = false;
      const startSec = times[silenceStartIdx];
      const endSec = times[i - 1];
      const durationSec = Math.max(0, endSec - startSec);
      const count = i - silenceStartIdx;
      if (durationSec >= minSilenceSec) {
        intervals.push({
          startSec,
          endSec,
          durationSec,
          midpointSec: Math.round(((startSec + endSec) / 2) * 1000) / 1000,
          avgRms: count > 0 ? silenceSumRms / count : 0,
        });
      }
    }
  }

  if (inSilence) {
    const startSec = times[silenceStartIdx];
    const endSec = times[times.length - 1];
    const durationSec = Math.max(0, endSec - startSec);
    const count = times.length - silenceStartIdx;
    if (durationSec >= minSilenceSec) {
      intervals.push({
        startSec,
        endSec,
        durationSec,
        midpointSec: Math.round(((startSec + endSec) / 2) * 1000) / 1000,
        avgRms: count > 0 ? silenceSumRms / count : 0,
      });
    }
  }

  return intervals;
}

/**
 * Detect precise Ayah split boundary timestamps (in seconds) between multiple Ayahs.
 * Matches detected recitation breath pauses (silence) to expected Quranic proportional weights.
 */
export function detectAyahSplitBoundaries(
  channelData: Float32Array,
  sampleRate: number,
  numAyahs: number,
  weights: number[],
  totalDuration: number,
  options: SilenceDetectionOptions = {}
): number[] {
  if (numAyahs <= 1) return [];

  const neededSplits = numAyahs - 1;
  const totalWeight = weights.reduce((s, w) => s + w, 0) || 1;

  // Calculate theoretical proportional split points
  const expectedSplits: number[] = [];
  let cumWeight = 0;
  for (let i = 0; i < neededSplits; i++) {
    cumWeight += weights[i] || 1;
    expectedSplits.push((totalDuration * cumWeight) / totalWeight);
  }

  // Detect silence intervals
  const rawSilences = detectSilenceIntervals(channelData, sampleRate, options);

  // Filter out leading/trailing silences (e.g. before recitation starts or after it ends)
  const validSilences = rawSilences.filter((s) => {
    return s.midpointSec >= totalDuration * 0.04 && s.midpointSec <= totalDuration * 0.96;
  });

  if (validSilences.length === 0) {
    // Fallback directly to proportional splits if no silences detected
    return expectedSplits.map((s) => Math.round(s * 1000) / 1000);
  }

  // If exact number of silences found, use their midpoints in chronological order
  if (validSilences.length === neededSplits) {
    return validSilences.map((s) => s.midpointSec);
  }

  // If more silences detected than needed, select the best monotonically increasing set of silences
  // that minimize deviation from expected positions while favoring longer, deeper pauses
  if (validSilences.length > neededSplits) {
    const M = validSilences.length;
    const dp: number[][] = Array.from({ length: neededSplits + 1 }, () =>
      Array(M).fill(Infinity)
    );
    const parent: number[][] = Array.from({ length: neededSplits + 1 }, () =>
      Array(M).fill(-1)
    );

    // Base case: first split point
    for (let j = 0; j < M; j++) {
      const dist = Math.abs(validSilences[j].midpointSec - expectedSplits[0]);
      const pauseBonus = Math.min(2.0, validSilences[j].durationSec);
      dp[1][j] = dist - pauseBonus * 0.5;
    }

    for (let k = 2; k <= neededSplits; k++) {
      for (let j = k - 1; j < M; j++) {
        const dist = Math.abs(validSilences[j].midpointSec - expectedSplits[k - 1]);
        const pauseBonus = Math.min(2.0, validSilences[j].durationSec);
        const cost = dist - pauseBonus * 0.5;

        for (let p = k - 2; p < j; p++) {
          const totalCost = dp[k - 1][p] + cost;
          if (totalCost < dp[k][j]) {
            dp[k][j] = totalCost;
            parent[k][j] = p;
          }
        }
      }
    }

    let bestEnd = -1;
    let minCost = Infinity;
    for (let j = neededSplits - 1; j < M; j++) {
      if (dp[neededSplits][j] < minCost) {
        minCost = dp[neededSplits][j];
        bestEnd = j;
      }
    }

    if (bestEnd !== -1) {
      const chosenIndices: number[] = [];
      let curr = bestEnd;
      for (let k = neededSplits; k >= 1; k--) {
        chosenIndices.push(curr);
        curr = parent[k][curr];
      }
      chosenIndices.reverse();
      return chosenIndices.map((idx) => validSilences[idx].midpointSec);
    }
  }

  // If fewer silences detected than needed (1 <= M < neededSplits),
  // snap detected silences to nearest expected splits and proportionally interpolate remaining
  const matchedSplits = [...expectedSplits];
  const usedSilences = new Set<number>();

  for (let sIdx = 0; sIdx < validSilences.length; sIdx++) {
    const sil = validSilences[sIdx];
    let bestSplitIdx = -1;
    let minDiff = Infinity;

    for (let eIdx = 0; eIdx < expectedSplits.length; eIdx++) {
      if (!usedSilences.has(eIdx)) {
        const diff = Math.abs(expectedSplits[eIdx] - sil.midpointSec);
        if (diff < minDiff) {
          minDiff = diff;
          bestSplitIdx = eIdx;
        }
      }
    }

    if (bestSplitIdx !== -1 && minDiff < totalDuration * 0.35) {
      matchedSplits[bestSplitIdx] = sil.midpointSec;
      usedSilences.add(bestSplitIdx);
    }
  }

  // Ensure strict monotonic ordering
  for (let i = 1; i < matchedSplits.length; i++) {
    if (matchedSplits[i] <= matchedSplits[i - 1]) {
      matchedSplits[i] = matchedSplits[i - 1] + 0.5;
    }
  }

  return matchedSplits.map((s) => Math.round(s * 1000) / 1000);
}

/**
 * Assign split boundaries and duration/word timestamps to AyahData items
 */
export function applyAyahBoundaries(
  ayahs: AyahData[],
  customVoiceUrl: string,
  splitPoints: number[],
  totalDuration: number
): void {
  if (!customVoiceUrl || ayahs.length === 0) return;

  if (ayahs.length === 1) {
    const a = ayahs[0];
    a.audioUrl = customVoiceUrl;
    a.fallbackUrls = [];
    if (totalDuration > 0) {
      a.duration = Math.round(totalDuration * 1000) / 1000;
      a.startTimeMs = 0;
      a.endTimeMs = Math.round(totalDuration * 1000);
      a.isFullSurahFile = false;
      if (a.words?.length) {
        const last = a.words[a.words.length - 1]?.endTime || totalDuration || 1;
        const scale = totalDuration / last;
        a.words.forEach((w) => {
          w.startTime = Math.round(w.startTime * scale * 1000) / 1000;
          w.endTime = Math.round(w.endTime * scale * 1000) / 1000;
        });
      }
    }
    return;
  }

  const boundaries = [0, ...splitPoints, totalDuration];

  ayahs.forEach((a, idx) => {
    const startSec = boundaries[idx];
    const endSec = boundaries[idx + 1];
    const duration = Math.max(0.5, Math.round((endSec - startSec) * 1000) / 1000);

    a.audioUrl = customVoiceUrl;
    a.fallbackUrls = [];
    a.duration = duration;
    a.startTimeMs = Math.round(startSec * 1000);
    a.endTimeMs = Math.round(endSec * 1000);
    a.isFullSurahFile = true;

    if (a.words?.length) {
      const last = a.words[a.words.length - 1]?.endTime || 1;
      const scale = duration / last;
      a.words.forEach((w) => {
        w.startTime = Math.round(w.startTime * scale * 1000) / 1000;
        w.endTime = Math.round(w.endTime * scale * 1000) / 1000;
      });
    }
  });
}

/**
 * Synchronous baseline: Distributes custom recorded audio across ayahs proportionally
 */
export function applyCustomVoiceToAyahs(
  ayahs: AyahData[],
  customVoiceUrl: string,
  recordedDuration: number
): void {
  if (!customVoiceUrl || ayahs.length === 0) return;

  if (ayahs.length === 1) {
    applyAyahBoundaries(ayahs, customVoiceUrl, [], recordedDuration);
    return;
  }

  const total =
    recordedDuration > 0
      ? recordedDuration
      : ayahs.reduce((s, a) => s + (a.duration || 5), 0);

  const weights = ayahs.map((a) =>
    a.duration && a.duration > 0
      ? a.duration
      : Math.max(1, a.words?.length || (a.text ? a.text.split(/\s+/).length : 1))
  );
  const totalW = weights.reduce((s, w) => s + w, 0) || 1;

  const splitPoints: number[] = [];
  let acc = 0;
  for (let idx = 0; idx < ayahs.length - 1; idx++) {
    acc += (total * weights[idx]) / totalW;
    splitPoints.push(Math.round(acc * 1000) / 1000);
  }

  applyAyahBoundaries(ayahs, customVoiceUrl, splitPoints, total);
}

/**
 * Fetch and decode an audio URL into an AudioBuffer safely
 */
export async function fetchAndDecodeAudioBuffer(
  url: string,
  audioCtx?: AudioContext | BaseAudioContext
): Promise<AudioBuffer | null> {
  if (!url || typeof url !== 'string') return null;

  try {
    let arrayBuffer: ArrayBuffer | null = null;

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

    if (!ctx) return null;

    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));

    if (ownCtx && ownCtx.state !== 'closed') {
      try {
        await ownCtx.close();
      } catch {
        // Ignore
      }
    }

    return decoded;
  } catch (e) {
    console.warn('[CustomVoiceDistribution] Could not decode audio buffer:', e);
    return null;
  }
}

const splitCache = new Map<string, { points: number[]; duration: number }>();

export function clearCustomVoiceSplitCache(): void {
  splitCache.clear();
}

/**
 * Asynchronous smart distributor:
 * Uses Web Audio API decoding and RMS energy silence detection to find real recitation pauses
 * between Ayahs, achieving true precision karaoke timing.
 * Features fast in-memory caching to avoid re-fetching and re-decoding when called sequentially
 * in the editor and export pages.
 */
export async function applyCustomVoiceWithSilenceDetection(
  ayahs: AyahData[],
  customVoiceUrl: string,
  recordedDuration: number,
  audioCtx?: AudioContext | BaseAudioContext
): Promise<boolean> {
  if (!customVoiceUrl || ayahs.length === 0) return false;

  // Single ayah doesn't need inter-ayah split detection
  if (ayahs.length === 1) {
    applyCustomVoiceToAyahs(ayahs, customVoiceUrl, recordedDuration);
    return true;
  }

  // ⚡ Fast Cache: same file + same ayah count + same duration = identical split points
  const cacheKey = `${customVoiceUrl}#${ayahs.length}#${(recordedDuration || 0).toFixed(2)}`;
  const cached = splitCache.get(cacheKey);
  if (cached) {
    applyAyahBoundaries(ayahs, customVoiceUrl, cached.points, cached.duration);
    return true;
  }

  try {
    const decodedBuffer = await fetchAndDecodeAudioBuffer(customVoiceUrl, audioCtx);
    if (!decodedBuffer) {
      applyCustomVoiceToAyahs(ayahs, customVoiceUrl, recordedDuration);
      return false;
    }

    const actualDuration = decodedBuffer.duration || recordedDuration || 1;
    const channelData = decodedBuffer.getChannelData(0);
    const sampleRate = decodedBuffer.sampleRate;

    const weights = ayahs.map((a) =>
      a.duration && a.duration > 0
        ? a.duration
        : Math.max(1, a.words?.length || (a.text ? a.text.split(/\s+/).length : 1))
    );

    const splitPoints = detectAyahSplitBoundaries(
      channelData,
      sampleRate,
      ayahs.length,
      weights,
      actualDuration,
      {
        windowSizeMs: 100,
        hopSizeMs: 25,
        minSilenceDurationMs: 600,
      }
    );

    applyAyahBoundaries(ayahs, customVoiceUrl, splitPoints, actualDuration);

    splitCache.set(cacheKey, { points: splitPoints, duration: actualDuration });
    if (splitCache.size > 10) {
      const firstKey = splitCache.keys().next().value;
      if (firstKey) splitCache.delete(firstKey);
    }

    return true;
  } catch (err) {
    console.warn(
      '[CustomVoiceDistribution] Silence detection failed, falling back to proportional:',
      err
    );
    applyCustomVoiceToAyahs(ayahs, customVoiceUrl, recordedDuration);
    return false;
  }
}

