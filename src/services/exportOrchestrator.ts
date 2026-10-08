/**
 * Athar Studio Unified Export Orchestrator
 * Centralizes the video export waterfall across Native FFmpeg (Desktop),
 * WebCodecs Hardware Muxer (Ultra-fast MP4 in browser), and Realtime MediaRecorder.
 */

import { AyahData } from './quranApi';
import { TextSettings, AudioSettings, AspectRatio } from '../types';
import { renderVideoExportFrame } from './videoFrameRenderer';
import { isWebCodecsExportSupported, exportVideoWithWebCodecs } from './webCodecsExportService';
import { render8DSpatialBuffer } from './spatial8DAudioEngine';
import { isVideoMedia } from '../utils/imageUtils';
import { extractAudioPeaksFromBuffer } from './audioPeakExtractor';

export interface PlatformPreset {
  id: string;
  name: string;
  sub: string;
  icon: string;
  aspect: AspectRatio;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  bitrateLabel: string;
  desc: string;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: 'tiktok',
    name: 'تيك توك',
    sub: 'TikTok 9:16',
    icon: '🎵',
    aspect: '9:16',
    width: 1080,
    height: 1920,
    fps: 60,
    bitrate: 8_000_000,
    bitrateLabel: '8 Mbps',
    desc: 'أعلى سرعة انتشار وخوارزمية TikTok',
  },
  {
    id: 'reels',
    name: 'إنستغرام ريلز',
    sub: 'Reels 9:16',
    icon: '📸',
    aspect: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    bitrate: 6_000_000,
    bitrateLabel: '6 Mbps',
    desc: 'متوافق 100% مع ضغط إنستغرام بدون فقدان الجودة',
  },
  {
    id: 'shorts',
    name: 'يوتيوب شورتس',
    sub: 'Shorts 9:16',
    icon: '▶️',
    aspect: '9:16',
    width: 1080,
    height: 1920,
    fps: 60,
    bitrate: 12_000_000,
    bitrateLabel: '12 Mbps',
    desc: 'أعلى نقاء وتفاصيل فائقة لخوارزميات اليوتيوب',
  },
  {
    id: 'whatsapp',
    name: 'واتساب ستاتوس',
    sub: 'Status 9:16',
    icon: '💬',
    aspect: '9:16',
    width: 720,
    height: 1280,
    fps: 30,
    bitrate: 2_500_000,
    bitrateLabel: '2.5 Mbps',
    desc: 'حجم خفيف جداً ومثالي للمجموعات',
  },
  {
    id: 'square',
    name: 'بوست مربع',
    sub: 'Square 1:1',
    icon: '🔲',
    aspect: '1:1',
    width: 1080,
    height: 1080,
    fps: 30,
    bitrate: 5_000_000,
    bitrateLabel: '5 Mbps',
    desc: 'منشورات إنستغرام وفيسبوك المربعة',
  },
  {
    id: 'youtube',
    name: 'يوتيوب أفقي',
    sub: 'Landscape 16:9',
    icon: '🖥️',
    aspect: '16:9',
    width: 1920,
    height: 1080,
    fps: 60,
    bitrate: 14_000_000,
    bitrateLabel: '14 Mbps',
    desc: 'شاشات العرض الكبيرة والتلفاز',
  },
];

export const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '3:4': { width: 1080, height: 1440 },
  '2:3': { width: 1080, height: 1620 },
};

export const QUALITY_BITRATES: Record<string, number> = {
  standard: 4_000_000,
  high: 8_000_000,
  premium: 14_000_000,
  '720p': 3_000_000,
  '1080p': 8_000_000,
  '4k': 22_000_000,
};

export interface ExportProjectOptions {
  projectName: string;
  surahName?: string;
  reciterName?: string;
  aspectRatio?: AspectRatio | string;
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
  quality?: 'standard' | 'high' | 'premium' | '720p' | '1080p' | '4k' | string;
  backgroundPath?: string;
  backgroundOpacity?: number;
  audioUrls?: string[];
  ayahs: (AyahData & { translationText?: string; tafsirText?: string })[];
  textSettings?: TextSettings;
  audioSettings?: AudioSettings;
  watermark?: string;
  showTranslation?: boolean;
  showTafsir?: boolean;
  totalDuration?: number;
  savePathPref?: string;
  preferEngine?: 'auto' | 'ffmpeg' | 'webcodecs' | 'mediarecorder';
  signal?: AbortSignal;
  onProgress?: (event: ExportProgressEvent) => void;
}

export interface ExportProgressEvent {
  phase: string;
  percent: number;
  currentFrame?: number;
  totalFrames?: number;
  fps?: number;
  currentAyah?: number;
  totalAyahs?: number;
  elapsedSeconds?: number;
  estimatedSecondsRemaining?: number;
  engine?: 'ffmpeg' | 'webcodecs' | 'mediarecorder';
}

export interface ExportResult {
  success: boolean;
  engine?: 'ffmpeg' | 'webcodecs' | 'mediarecorder';
  blob?: Blob;
  blobUrl?: string;
  outputPath?: string;
  durationSec?: number;
  fileSizeBytes?: number;
  error?: string;
}

/**
 * Resolve target output file path from project name, extension, and optional user save path preference
 */
export function resolveTargetOutputPath(
  projectName: string,
  ext: string = 'mp4',
  savePathPref?: string
): string {
  const cleanProjectName = projectName.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'ayah_video';
  const targetExt = ext.startsWith('.') ? ext.slice(1) : ext;

  if (savePathPref && typeof savePathPref === 'string' && savePathPref.trim().length > 0) {
    const trimmed = savePathPref.trim();
    if (/\.(mp4|webm|mkv|mov|avi)$/i.test(trimmed)) {
      return trimmed;
    }
    const separator = trimmed.includes('\\') ? '\\' : '/';
    const cleanDir = trimmed.replace(/[/\\]+$/, '');
    return `${cleanDir}${separator}${cleanProjectName}.${targetExt}`;
  }

  // لا مسار مفضل — الطبقة الأصلية ستستخدم مجلد temp الآمن افتراضيًا،
  // والطبقات 2/3 تعيد الـ blob فقط ليحفظه المستخدم عبر زر الحفظ
  return '';
}

/**
 * Fetch and decode an audio URL into an AudioBuffer with retry support
 */
export async function fetchAndDecodeAudio(
  audioCtx: AudioContext | BaseAudioContext,
  url: string,
  retries = 1
): Promise<AudioBuffer | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      return await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 350));
        continue;
      }
      console.warn(`[ExportOrchestrator] Audio fetch/decode failed for ${url}:`, e);
      return null;
    }
  }
  return null;
}

/**
 * Concatenate multiple AudioBuffers into a single seamless AudioBuffer
 */
export function concatenateAudioBuffers(
  audioCtx: AudioContext | BaseAudioContext,
  buffers: AudioBuffer[]
): AudioBuffer | null {
  const validBuffers = buffers.filter(Boolean);
  if (validBuffers.length === 0) return null;
  if (validBuffers.length === 1) return validBuffers[0];

  const totalLength = validBuffers.reduce((sum, b) => sum + b.length, 0);
  const numberOfChannels = Math.max(...validBuffers.map((b) => b.numberOfChannels));
  const sampleRate = validBuffers[0].sampleRate;

  const outBuffer = audioCtx.createBuffer(numberOfChannels, totalLength, sampleRate);

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const outData = outBuffer.getChannelData(channel);
    let offset = 0;
    for (const b of validBuffers) {
      const inData = b.getChannelData(Math.min(channel, b.numberOfChannels - 1));
      outData.set(inData, offset);
      offset += b.length;
    }
  }

  return outBuffer;
}

/**
 * Slice an AudioBuffer to extract a precise segment [startSec, endSec]
 */
export function sliceAudioBuffer(
  audioCtx: AudioContext | BaseAudioContext,
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const totalLength = buffer.length;
  const startSample = Math.max(0, Math.min(totalLength, Math.floor(startSec * sampleRate)));
  const endSample = Math.max(startSample, Math.min(totalLength, Math.ceil(endSec * sampleRate)));
  const frameCount = Math.max(1, endSample - startSample);
  const numberOfChannels = buffer.numberOfChannels;

  const outBuffer = audioCtx.createBuffer(numberOfChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inData = buffer.getChannelData(channel);
    const outData = outBuffer.getChannelData(channel);
    outData.set(inData.subarray(startSample, endSample), 0);
  }

  return outBuffer;
}

/**
 * Resolve blob URLs into base64 Data URLs for IPC transfer if needed
 */
export async function resolveAudioUrlsForIpc(urls: string[]): Promise<string[]> {
  return Promise.all(
    urls.map(async (u) => {
      if (u && typeof u === 'string' && u.startsWith('blob:')) {
        try {
          const res = await fetch(u);
          const blob = await res.blob();
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(u);
            reader.readAsDataURL(blob);
          });
        } catch {
          return u;
        }
      }
      return u;
    })
  );
}

/**
 * Load image with CORS
 */
export async function preloadImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('[ExportOrchestrator] Failed to preload image:', url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Preload all scene backgrounds
 */
export async function preloadSceneBackgrounds(
  sceneBackgrounds?: Record<number, string>
): Promise<Record<number, HTMLImageElement>> {
  const result: Record<number, HTMLImageElement> = {};
  if (!sceneBackgrounds || Object.keys(sceneBackgrounds).length === 0) return result;

  const entries = Object.entries(sceneBackgrounds);
  await Promise.all(
    entries.map(async ([idxStr, sceneUrl]) => {
      if (!sceneUrl) return;
      const img = await preloadImage(sceneUrl);
      if (img) result[Number(idxStr)] = img;
    })
  );
  return result;
}

let isExportActiveMutex = false;

/**
 * Check if an export job is currently running across any thread/modal
 */
export function isProjectExporting(): boolean {
  return isExportActiveMutex;
}

/**
 * Reset export mutex (e.g. for testing or emergency recovery)
 */
export function resetExportMutex(): void {
  isExportActiveMutex = false;
}

/**
 * Main Export Orchestration Function
 * Executes the three-tier waterfall: Native Electron FFmpeg -> WebCodecs MP4 -> MediaRecorder
 */
export async function exportProject(options: ExportProjectOptions): Promise<ExportResult> {
  if (isExportActiveMutex) {
    return {
      success: false,
      error: 'عملية تصدير أخرى قيد المعالجة حالياً. يرجى الانتظار حتى تكتمل أو إلغاؤها.',
    };
  }

  isExportActiveMutex = true;

  try {
    const {
      projectName,
      surahName = 'سورة قرآنية',
      reciterName,
      aspectRatio = '9:16',
      quality = 'high',
      backgroundPath,
      backgroundOpacity = 0.6,
      audioUrls: rawAudioUrls = [],
      ayahs,
      textSettings,
      audioSettings,
      watermark,
      showTranslation = false,
      showTafsir: _showTafsir = false,
      totalDuration,
      savePathPref,
      preferEngine = 'auto',
      signal,
      onProgress,
    } = options;

    if (signal?.aborted) {
      return {
        success: false,
        error: 'تم إلغاء عملية التصدير من قِبل المستخدم',
      };
    }

    const startWallTime = Date.now();

    const reportProgress = (
      phase: string,
    percent: number,
    extra?: Partial<ExportProgressEvent>
  ) => {
    if (!onProgress) return;
    const nowWall = Date.now();
    const elapsedWallSec = Math.round((nowWall - startWallTime) / 1000);
    let estimatedSecondsRemaining: number | undefined = undefined;
    if (percent > 0 && percent < 100) {
      const totalSec = elapsedWallSec / (percent / 100);
      estimatedSecondsRemaining = Math.max(0, Math.round(totalSec - elapsedWallSec));
    }

    onProgress({
      phase,
      percent: Math.min(100, Math.max(0, percent)),
      elapsedSeconds: elapsedWallSec,
      estimatedSecondsRemaining,
      ...extra,
    });
  };

  reportProgress('جاري تهيئة منصة التصيير والموارد...', 2);

  // 1. Resolve Target Resolution, FPS, and Bitrate
  const baseDims = ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS['9:16'];
  const width = options.width || baseDims.width;
  const height = options.height || baseDims.height;
  const fps = options.fps || 30;
  const targetBitrate =
    options.bitrate ||
    QUALITY_BITRATES[quality] ||
    (quality === 'standard' ? 4_000_000 : quality === 'premium' ? 14_000_000 : 8_000_000);

  const validAyahs = ayahs.filter((a) => a && a.text && a.text.trim().length > 0);
  const audioUrls =
    rawAudioUrls.length > 0
      ? rawAudioUrls
      : validAyahs.map((a) => a.audioUrl).filter(Boolean) as string[];

  // ─── TIER 1: Native Electron FFmpeg Export ───────────────────────────────────
  const isElectronAvailable =
    typeof window !== 'undefined' &&
    typeof window.electronAPI?.videoExport?.start === 'function';

  if (isElectronAvailable && window.electronAPI && preferEngine !== 'webcodecs' && preferEngine !== 'mediarecorder') {
    if (signal?.aborted) {
      return {
        success: false,
        error: 'تم إلغاء عملية التصدير',
      };
    }

    reportProgress('جاري التصدير عبر محرك FFmpeg فائق السرعة 🚀...', 5, { engine: 'ffmpeg' });

    const unbindProgress = window.electronAPI.videoExport.onProgress((data) => {
      if (signal?.aborted) return;
      const pct = Math.min(99, Math.max(1, Math.round(data.percent || 0)));
      reportProgress(data.phase || `جاري التصدير عبر محرك FFmpeg (${pct}%)...`, pct, {
        engine: 'ffmpeg',
      });
    });

    const onAbort = () => {
      try {
        window.electronAPI?.videoExport?.cancel?.();
      } catch (err) {
        console.debug('[ExportOrchestrator] FFmpeg cancel error:', err);
      }
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const resolvedAudioUrls = await resolveAudioUrlsForIpc(audioUrls);

      if (signal?.aborted) {
        onAbort();
        return {
          success: false,
          error: 'تم إلغاء عملية التصدير',
        };
      }

      const exportAyahs = validAyahs.map((a) => {
        const sTime =
          a.startTimeMs !== undefined && a.startTimeMs >= 0
            ? a.startTimeMs / 1000
            : a.words?.[0]?.startTime || 0;
        const eTime =
          a.endTimeMs !== undefined && a.endTimeMs > 0
            ? a.endTimeMs / 1000
            : a.words?.[a.words.length - 1]?.endTime || a.duration || 6;

        return {
          text: a.text,
          startTime: sTime,
          endTime: eTime,
          numberInSurah: a.numberInSurah,
          translationText: a.translationText,
          tafsirText: a.tafsirText,
          words: a.words,
          chunks: a.chunks,
        };
      });

      const targetFfmpegOutputPath = savePathPref
        ? resolveTargetOutputPath(projectName, 'mp4', savePathPref)
        : undefined;

      const exportResult = await window.electronAPI.videoExport.start({
        projectName,
        aspectRatio,
        quality,
        ayahs: exportAyahs,
        audioUrls: resolvedAudioUrls,
        backgroundPath,
        bgOpacity: backgroundOpacity ?? 0.65,
        watermark,
        transition: 'fade',
        videoEffect: 'none',
        textSettings,
        audioSettings,
        surahName,
        reciterName,
        fps,
        bitrate: targetBitrate,
        outputPath: targetFfmpegOutputPath || undefined,
        totalDuration,
        hwAcceleration: 'auto',
      });

      unbindProgress();
      signal?.removeEventListener('abort', onAbort);

      if (signal?.aborted) {
        return {
          success: false,
          error: 'تم إلغاء عملية التصدير',
        };
      }

      if (exportResult?.success && exportResult.outputPath) {
        reportProgress('اكتمل التصدير بنجاح عبر محرك FFmpeg ✅', 100, { engine: 'ffmpeg' });
        return {
          success: true,
          engine: 'ffmpeg',
          outputPath: exportResult.outputPath,
          blobUrl: exportResult.blobUrl,
          durationSec: exportResult.durationSec || totalDuration || 15,
        };
      } else if (exportResult && !exportResult.success && exportResult.error?.includes('إلغاء')) {
        return {
          success: false,
          error: exportResult.error || 'تم إلغاء عملية التصدير',
        };
      } else {
        onProgress?.({
          percent: 8,
          phase: `تعذر محرك FFmpeg الأصلي${exportResult?.error ? ` (${exportResult.error})` : ''} — جارٍ التبديل للمحرك الاحتياطي (أبطأ)...`,
        });
      }
    } catch (nativeErr: any) {
      unbindProgress();
      signal?.removeEventListener('abort', onAbort);
      console.warn('[ExportOrchestrator] Native FFmpeg failed, falling back to WebCodecs:', nativeErr);
      if (signal?.aborted) {
        return {
          success: false,
          error: 'تم إلغاء عملية التصدير',
        };
      }
      onProgress?.({
        percent: 8,
        phase: `تعذر محرك FFmpeg الأصلي${nativeErr?.message ? ` (${nativeErr.message})` : ''} — جارٍ التبديل للمحرك الاحتياطي (أبطأ)...`,
      });
    } finally {
      signal?.removeEventListener('abort', onAbort);
    }
  }

  // ─── TIER 2 & 3: Browser Pre-flight & Audio Decoding ────────────────────────
  reportProgress('جاري فك ترميز ومعالجة الصوت والمؤثرات...', 10);

  const AudioCtxClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtxClass();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  try {
    // 1. Decode all Ayah audio buffers with exact index tracking
    const validAudioUrls = audioUrls.filter(Boolean);
    const loadedBuffersMap = new Map<number, AudioBuffer>();

    for (let i = 0; i < validAudioUrls.length; i++) {
      if (signal?.aborted) throw new Error('تم إلغاء عملية التصدير');
      reportProgress(`جاري قراءة الصوت (${i + 1}/${validAudioUrls.length})...`, 10 + Math.round((i / validAudioUrls.length) * 15));
      const buf = await fetchAndDecodeAudio(audioCtx, validAudioUrls[i]);
      if (buf) loadedBuffersMap.set(i, buf);
    }

    // Smart Audio Guard: If audio files were configured, ensure they were successfully retrieved and decoded.
    if (validAudioUrls.length > 0) {
      if (loadedBuffersMap.size === 0) {
        return {
          success: false,
          error: 'تعذر تحميل تلاوة القارئ الصوتية. يرجى التحقق من اتصال الإنترنت أو اختيار قارئ آخر.',
        };
      }
      if (loadedBuffersMap.size < validAudioUrls.length) {
        const missingCount = validAudioUrls.length - loadedBuffersMap.size;
        return {
          success: false,
          error: `تعذر تحميل تلاوة ${missingCount} من الآيات المختارة. يرجى التحقق من اتصال الإنترنت والمحاولة مجددًا.`,
        };
      }
    }

    // 2. Stitch and Process Master Audio Buffer
    let masterBuffer: AudioBuffer | null = null;
    const loadedBuffersList = Array.from(loadedBuffersMap.values());
    if (loadedBuffersList.length > 0) {
      masterBuffer = concatenateAudioBuffers(audioCtx, loadedBuffersList);
    }

    // 3. Build Precise Timeline Ranges & Trim Continuous Audio Tracks
    const isFullSurahTrack = validAyahs.some((a) => (a as any).isFullSurahFile);
    const bufferDuration = masterBuffer?.duration || 0;
    const rawStartSec = (validAyahs[0]?.startTimeMs ?? 0) / 1000;

    const hasAyahTimestamps =
      validAyahs.length > 0 &&
      validAyahs[0].startTimeMs !== undefined &&
      validAyahs[validAyahs.length - 1].endTimeMs !== undefined;

    // A track is continuous (chapter/full-surah) ONLY if:
    // 1) It is explicitly marked as isFullSurahFile, OR
    // 2) The loaded buffer duration is genuinely large enough to contain the timestamp offset (e.g. 919s into a 30m file)
    // 3) OR it's a custom voice file (single URL) covering multiple verses
    const isContinuousTrack =
      validAudioUrls.length === 1 &&
      ((validAyahs.length > 1 && !isFullSurahTrack && bufferDuration > 0) ||
        (isFullSurahTrack && hasAyahTimestamps) ||
        (hasAyahTimestamps && rawStartSec > 0 && bufferDuration > rawStartSec + 0.5));

    let baseStartSec = 0;
    if (isContinuousTrack && hasAyahTimestamps && bufferDuration > rawStartSec + 0.5) {
      baseStartSec = Math.max(0, rawStartSec);
    }

    let cumulativeTime = 0;
    const ayahTimeRanges = validAyahs.map((a, idx) => {
      let start = cumulativeTime;
      let end = cumulativeTime;
      let dur = a.duration || 6;

      if (isContinuousTrack && a.startTimeMs !== undefined && a.endTimeMs !== undefined) {
        start = Math.max(0, a.startTimeMs / 1000 - baseStartSec);
        end = Math.max(start + 0.1, a.endTimeMs / 1000 - baseStartSec);
        dur = Math.max(0.1, end - start);
        cumulativeTime = end;
      } else {
        const bufDur = loadedBuffersMap.get(idx)?.duration;
        dur =
          bufDur && !isNaN(bufDur) && bufDur > 0
            ? bufDur
            : a.duration && !isNaN(a.duration) && a.duration > 0
              ? a.duration
              : totalDuration
                ? totalDuration / Math.max(1, validAyahs.length)
                : 6;
        start = cumulativeTime;
        cumulativeTime += dur;
        end = cumulativeTime;
      }

      return {
        start,
        end,
        duration: dur,
        ayah: { ...a, duration: dur },
        ayahIndex: idx + 1,
      };
    });

    // Trim master audio buffer to match selected Ayah range if continuous audio was provided
    if (masterBuffer) {
      if (isContinuousTrack && hasAyahTimestamps && cumulativeTime > 0) {
        const rangeStartSec = baseStartSec;
        const rangeEndSec = baseStartSec + cumulativeTime;
        // Protect against slicing past end of buffer
        if (rangeStartSec < masterBuffer.duration) {
          if (rangeStartSec > 0 || masterBuffer.duration > cumulativeTime + 0.5) {
            masterBuffer = sliceAudioBuffer(audioCtx, masterBuffer, rangeStartSec, rangeEndSec);
          }
        }
      } else if (
        validAudioUrls.length === 1 &&
        cumulativeTime > 0 &&
        masterBuffer.duration > cumulativeTime + 0.5
      ) {
        masterBuffer = sliceAudioBuffer(audioCtx, masterBuffer, 0, cumulativeTime);
      }
    }

  // Calculate strict total duration: Selected ayahs range duration takes precedence over full source file
  const totalDurationSec =
    cumulativeTime > 0
      ? cumulativeTime
      : masterBuffer?.duration || totalDuration || 15;

  // Process 8D Spatial Audio on trimmed master buffer
  if (audioSettings?.enable8DAudio && masterBuffer) {
    reportProgress('جاري معالجة الصوت المكاني 8D ومعايرة المدار 360° 🎧...', 26);
    try {
      masterBuffer = await render8DSpatialBuffer(audioCtx, masterBuffer, {
        speedHz: audioSettings.eightDSpeed ?? 0.12,
        depth: (audioSettings.eightDDepth ?? 85) / 100,
        style: audioSettings.eightDStyle ?? 'orbit360',
      });
    } catch (e8d) {
      console.warn('[ExportOrchestrator] 8D rendering fallback:', e8d);
    }
  }

  // 4. Preload Visual Assets
  reportProgress('جاري تجهيز الخلفيات والصور...', 30);
  const [bgImg, sceneBgImages] = await Promise.all([
    preloadImage(backgroundPath),
    preloadSceneBackgrounds(textSettings?.sceneBackgrounds),
  ]);

  if (signal?.aborted) throw new Error('تم إلغاء عملية التصدير');

  // 4.5. Compute Acoustic Waveform Peaks from Decoded Master Buffer
  const masterAudioPeaks = masterBuffer ? extractAudioPeaksFromBuffer(masterBuffer, 350) : undefined;

  // ─── TIER 2: Ultra-Fast WebCodecs Hardware Muxer (MP4) ───────────────────────
  const canUseWebCodecs = await isWebCodecsExportSupported();
  if (canUseWebCodecs && preferEngine !== 'mediarecorder') {
    reportProgress('جاري التصدير فائق السرعة عبر محرك WebCodecs (MP4)...', 35, {
      engine: 'webcodecs',
    });

    try {
      const mp4Blob = await exportVideoWithWebCodecs({
        width,
        height,
        fps,
        bitrate: targetBitrate,
        ayahs: validAyahs,
        timeline: ayahTimeRanges,
        totalDurationSec,
        masterAudioBuffer: masterBuffer,
        audioPeaks: masterAudioPeaks,
        audioUrls: validAyahs.map((a) => a.audioUrl).filter(Boolean),
        bgImage: bgImg,
        sceneBgImages,
        bgOpacity: backgroundOpacity ?? 0.6,
        textSettings,
        audioSettings,
        watermark,
        projectName,
        surahName,
        reciterName,
        showTranslation: !!showTranslation,
        signal,
        onProgress: ({ percent, currentFrame, totalFrames, fps: renderFps }) => {
          reportProgress(
            `تصدير فائق السرعة عبر WebCodecs (${percent}% - ${renderFps} FPS)...`,
            Math.min(99, 35 + Math.round(percent * 0.64)),
            {
              currentFrame,
              totalFrames,
              fps: renderFps,
              engine: 'webcodecs',
            }
          );
        },
      });

      if (mp4Blob.size < 1024) {
        throw new Error('نتيجة الترميز فارغة (0 بايت) — فشل التصيير بصمت.');
      }

      const targetOutputPath = resolveTargetOutputPath(projectName, 'mp4', savePathPref);
      const isExplicitPath = targetOutputPath.includes('/') || targetOutputPath.includes('\\');
      let savedToDisk = false;

      // If running in Electron and we have an absolute destination path, save binary file directly to disk
      if (
        typeof window !== 'undefined' &&
        window.electronAPI?.fs?.writeBinaryFile &&
        isExplicitPath
      ) {
        try {
          const arrayBuffer = await mp4Blob.arrayBuffer();
          const writeRes = await window.electronAPI.fs.writeBinaryFile(
            targetOutputPath,
            new Uint8Array(arrayBuffer)
          );
          if (writeRes?.success) {
            savedToDisk = true;
          } else {
            console.warn('[WebCodecs] فشل حفظ الملف تلقائيًا:', writeRes?.error);
          }
        } catch (fsErr) {
          console.warn('[ExportOrchestrator] writeBinaryFile error:', fsErr);
        }
      }

      const downloadUrl = registerExportBlobUrl(URL.createObjectURL(mp4Blob));
      reportProgress('اكتمل التصدير بنجاح وبصيغة MP4 القياسية ✅', 100, { engine: 'webcodecs' });

      return {
        success: true,
        engine: 'webcodecs',
        blob: mp4Blob,
        blobUrl: downloadUrl,
        outputPath: savedToDisk ? targetOutputPath : undefined,
        durationSec: totalDurationSec,
        fileSizeBytes: mp4Blob.size,
      };
    } catch (webCodecsErr) {
      console.warn(
        '[ExportOrchestrator] WebCodecs export failed, falling back to MediaRecorder:',
        webCodecsErr
      );
      if (signal?.aborted) {
        return {
          success: false,
          error: 'تم إلغاء عملية التصدير',
        };
      }
    }
  }

  // ─── TIER 3: MediaRecorder Canvas Fallback Stream ───────────────────────────
  reportProgress('جاري التصدير عبر مسار التسجيل القياسي للمتصفح...', 35, {
    engine: 'mediarecorder',
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('فشل إنشاء سياق Canvas للتصدير');

  let bgVideo: HTMLVideoElement | null = null;
  if (backgroundPath && isVideoMedia(backgroundPath)) {
    bgVideo = document.createElement('video');
    bgVideo.crossOrigin = 'anonymous';
    bgVideo.src = backgroundPath;
    bgVideo.muted = true;
    bgVideo.loop = true;
    await new Promise((resolve) => {
      if (!bgVideo) return resolve(null);
      bgVideo.onloadeddata = () => {
        bgVideo?.play().catch((err) => {
          console.debug('[ExportOrchestrator] bgVideo play error:', err);
        });
        resolve(null);
      };
      bgVideo.onerror = () => resolve(null);
    });
  }

  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch (e) {
      console.warn('[MediaRecorder] AudioContext resume failed:', e);
    }
  }

  const dest = audioCtx.createMediaStreamDestination();
  let activeBufferSource: AudioBufferSourceNode | null = null;

  if (masterBuffer) {
    activeBufferSource = audioCtx.createBufferSource();
    activeBufferSource.buffer = masterBuffer;
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 1.0;
    activeBufferSource.connect(masterGain);
    masterGain.connect(dest);

    // Keep-alive: virtually-silent continuous sound to prevent MediaRecorder muxer audio starvation
    try {
      const silenceOsc = audioCtx.createOscillator();
      const silenceGain = audioCtx.createGain();
      silenceGain.gain.value = 0.00001;
      silenceOsc.connect(silenceGain);
      silenceGain.connect(dest);
      silenceOsc.start();
    } catch (err) {
      void err;
    }
  }

  const fallbackAyah =
    validAyahs[0] || ayahs[0] || { text: projectName || 'قرآن كريم', duration: totalDurationSec };
  const initialRange = ayahTimeRanges[0] || {
    start: 0,
    end: totalDurationSec,
    duration: totalDurationSec,
    ayah: fallbackAyah,
    ayahIndex: 1,
  };

  // Pre-render frame 0 so canvas.captureStream immediately has valid pixel data
  try {
    renderVideoExportFrame({
      ctx,
      width,
      height,
      frame: 0,
      totalFrames: Math.max(fps * 2, Math.round(fps * totalDurationSec)),
      currentTimeSec: 0,
      globalTimeSec: 0,
      bgImage: bgImg,
      bgVideo,
      bgOpacity: backgroundOpacity,
      currentAyah: initialRange.ayah,
      textSettings,
      watermark,
      projectName,
      surahName: initialRange.ayah.surahName || surahName,
      reciterName,
      showTranslation,
      isCustomContent: !surahName || surahName.length === 0,
      audioPeaks: masterAudioPeaks,
      totalDurationSec,
    });
  } catch (initRenderErr) {
    console.warn('[MediaRecorder] Initial frame render warning:', initRenderErr);
  }

  const canvasStream = canvas.captureStream(fps);
  const audioTracks = activeBufferSource ? dest.stream.getAudioTracks() : [];
  const videoTracks = canvasStream.getVideoTracks();
  const combinedStream = new MediaStream([...videoTracks, ...audioTracks]);

  const stopAllTracks = () => {
    try {
      videoTracks.forEach((t) => t.stop());
      audioTracks.forEach((t) => t.stop());
      canvasStream.getTracks().forEach((t) => t.stop());
      combinedStream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.debug('[ExportOrchestrator] Track stop error:', err);
    }
    if (bgVideo) {
      try {
        bgVideo.pause();
        bgVideo.src = '';
      } catch (err) {
        void err;
      }
    }
    if (activeBufferSource) {
      try {
        activeBufferSource.stop();
        activeBufferSource.disconnect();
      } catch (err) {
        void err;
      }
    }
  };

  const hasAudioTrack = activeBufferSource !== null;
  const candidateMimes = hasAudioTrack
    ? [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/webm',
        'video/mp4',
      ]
    : [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];

  const selectedMime = candidateMimes.find((m) => {
    try {
      return MediaRecorder.isTypeSupported(m);
    } catch {
      return false;
    }
  }) || '';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: selectedMime || undefined,
    videoBitsPerSecond: targetBitrate,
  });

  const chunks: Blob[] = [];

  const finalBlob = await new Promise<Blob>((resolve, reject) => {
    let animFrameId: number | null = null;
    let isFinished = false;

    const cleanup = () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      stopAllTracks();
    };

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onerror = (e) => {
      cleanup();
      reject(new Error(`MediaRecorder error: ${(e as any)?.error?.message || 'فشل في تسجيل الفيديو'}`));
    };

    recorder.onstop = () => {
      cleanup();
      if (signal?.aborted) {
        reject(new Error('تم إلغاء عملية التصدير من قِبل المستخدم'));
        return;
      }
      const mimeType = selectedMime.includes('mp4') ? 'video/mp4' : 'video/webm';
      resolve(new Blob(chunks, { type: mimeType }));
    };

    const handleAbort = () => {
      if (isFinished) return;
      isFinished = true;
      cleanup();
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch (err) {
          void err;
        }
      }
      reject(new Error('تم إلغاء عملية التصدير من قِبل المستخدم'));
    };

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener('abort', handleAbort, { once: true });

    recorder.start(100);

    const exportStartTime = audioCtx.currentTime;
    const wallStartTime = performance.now();
    if (activeBufferSource) {
      try {
        activeBufferSource.start(exportStartTime);
      } catch (err) {
        console.warn('[MediaRecorder] Buffer start warning:', err);
      }
    }

    const totalFrames = Math.max(fps * 2, Math.round(fps * totalDurationSec));
    let lastUiUpdateWallTime = 0;
    let lastReportedPercent = -1;

    const renderLoop = () => {
      if (isFinished || signal?.aborted) {
        handleAbort();
        return;
      }

      const wallElapsedSec = (performance.now() - wallStartTime) / 1000;
      const audioElapsedSec =
        audioCtx.state === 'running'
          ? Math.max(0, audioCtx.currentTime - exportStartTime)
          : wallElapsedSec;
      const elapsedSec = Math.max(wallElapsedSec, audioElapsedSec);

      if (elapsedSec >= totalDurationSec) {
        isFinished = true;
        if (recorder.state === 'recording') {
          try {
            recorder.requestData();
          } catch (err) {
            void err;
          }
          setTimeout(() => {
            try {
              if (recorder.state !== 'inactive') {
                recorder.stop();
              }
            } catch (err) {
              void err;
            }
          }, 100);
        } else if (recorder.state !== 'inactive') {
          try {
            recorder.stop();
          } catch (err) {
            void err;
          }
        }
        return;
      }

      const activeRange =
        ayahTimeRanges.find((r) => elapsedSec >= r.start && elapsedSec < r.end) ||
        ayahTimeRanges[ayahTimeRanges.length - 1] ||
        initialRange;

      const localAyahTime = Math.max(0, elapsedSec - activeRange.start);
      const currentProg = Math.min(1, elapsedSec / totalDurationSec);
      const currentFrame = Math.floor(elapsedSec * fps);

      try {
        renderVideoExportFrame({
          ctx,
          width,
          height,
          frame: currentFrame,
          totalFrames,
          currentTimeSec: localAyahTime,
          globalTimeSec: elapsedSec,
          bgImage: bgImg,
          bgVideo,
          bgOpacity: backgroundOpacity,
          currentAyah: activeRange.ayah,
          textSettings,
          watermark,
          projectName,
          surahName: activeRange.ayah.surahName || surahName,
          reciterName,
          showTranslation,
          isCustomContent: !surahName || surahName.length === 0,
          audioPeaks: masterAudioPeaks,
          totalDurationSec,
        });
      } catch (frameErr) {
        console.warn('[MediaRecorder] Frame render error:', frameErr);
      }

      const percent = Math.min(99, 35 + Math.round(currentProg * 64));
      const nowWall = Date.now();

      if (nowWall - lastUiUpdateWallTime >= 250 || percent !== lastReportedPercent) {
        lastUiUpdateWallTime = nowWall;
        lastReportedPercent = percent;
        reportProgress(`جاري تسجيل إطارات الفيديو (${percent}%)...`, percent, {
          currentFrame,
          totalFrames,
          fps,
          currentAyah: activeRange.ayahIndex,
          totalAyahs: validAyahs.length || 1,
          engine: 'mediarecorder',
        });
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);
  });

  if (finalBlob.size < 1024) {
    throw new Error('نتيجة التسجيل فارغة (0 بايت) — فشل التصيير بصمت.');
  }

  const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
  const targetOutputPath = resolveTargetOutputPath(projectName, ext, savePathPref);
  const isExplicitPath = targetOutputPath.includes('/') || targetOutputPath.includes('\\');
  let savedToDisk = false;

  // If running in Electron and we have an absolute destination path, save binary file directly to disk
  if (
    typeof window !== 'undefined' &&
    window.electronAPI?.fs?.writeBinaryFile &&
    isExplicitPath
  ) {
    try {
      const arrayBuffer = await finalBlob.arrayBuffer();
      const writeRes = await window.electronAPI.fs.writeBinaryFile(
        targetOutputPath,
        new Uint8Array(arrayBuffer)
      );
      if (writeRes?.success) {
        savedToDisk = true;
      } else {
        console.warn('[MediaRecorder] فشل حفظ الملف تلقائيًا:', writeRes?.error);
      }
    } catch (fsErr) {
      console.warn('[ExportOrchestrator] writeBinaryFile error:', fsErr);
    }
  }

  const downloadUrl = registerExportBlobUrl(URL.createObjectURL(finalBlob));
  reportProgress('اكتمل التصدير بنجاح ✅', 100, { engine: 'mediarecorder' });

  return {
    success: true,
    engine: 'mediarecorder',
    blob: finalBlob,
    blobUrl: downloadUrl,
    outputPath: savedToDisk ? targetOutputPath : undefined,
    durationSec: totalDurationSec,
    fileSizeBytes: finalBlob.size,
  };
  } finally {
    if (audioCtx && typeof audioCtx.close === 'function' && audioCtx.state !== 'closed') {
      try {
        await audioCtx.close();
      } catch (err) {
        console.debug('[ExportOrchestrator] AudioContext close error:', err);
      }
    }
  }
  } finally {
    isExportActiveMutex = false;
  }
}

/**
 * Map to track auto-revoke timers for export Blob URLs to prevent browser memory leaks
 */
const activeBlobUrlTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Registers an export blob URL with an auto-revoke safety net timer.
 * Default auto-revoke timeout is 10 minutes (600,000 ms).
 */
export function registerExportBlobUrl(url: string, autoRevokeMs: number = 10 * 60 * 1000): string {
  if (url && url.startsWith('blob:')) {
    const existing = activeBlobUrlTimers.get(url);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      revokeExportBlobUrl(url);
    }, autoRevokeMs);
    activeBlobUrlTimers.set(url, timer);
  }
  return url;
}

/**
 * Revoke blob URLs generated during export to free browser memory immediately
 */
export function revokeExportBlobUrl(url?: string): void {
  if (url && url.startsWith('blob:')) {
    const timer = activeBlobUrlTimers.get(url);
    if (timer) {
      clearTimeout(timer);
      activeBlobUrlTimers.delete(url);
    }
    try {
      URL.revokeObjectURL(url);
    } catch (err) {
      console.debug('[ExportOrchestrator] Blob URL revoke error:', err);
    }
  }
}
