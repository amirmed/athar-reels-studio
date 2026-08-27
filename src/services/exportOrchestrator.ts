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
 * Fetch and decode an audio URL into an AudioBuffer
 */
export async function fetchAndDecodeAudio(
  audioCtx: AudioContext | BaseAudioContext,
  url: string
): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  } catch (e) {
    console.warn(`[ExportOrchestrator] Audio fetch/decode failed for ${url}:`, e);
    return null;
  }
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

/**
 * Main Export Orchestration Function
 * Executes the three-tier waterfall: Native Electron FFmpeg -> WebCodecs MP4 -> MediaRecorder
 */
export async function exportProject(options: ExportProjectOptions): Promise<ExportResult> {
  const {
    projectName,
    surahName = 'سورة قرآنية',
    reciterName,
    aspectRatio = '9:16',
    quality = '1080p',
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
    reportProgress('جاري التصدير عبر محرك FFmpeg فائق السرعة 🚀...', 5, { engine: 'ffmpeg' });

    const unbindProgress = window.electronAPI.videoExport.onProgress((data) => {
      if (signal?.aborted) return;
      const pct = Math.min(99, Math.max(1, Math.round(data.percent || 0)));
      reportProgress(data.phase || `جاري التصدير عبر محرك FFmpeg (${pct}%)...`, pct, {
        engine: 'ffmpeg',
      });
    });

    try {
      const resolvedAudioUrls = await resolveAudioUrlsForIpc(audioUrls);

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
      });

      unbindProgress();

      if (exportResult?.success && exportResult.outputPath) {
        reportProgress('اكتمل التصدير بنجاح عبر محرك FFmpeg ✅', 100, { engine: 'ffmpeg' });
        return {
          success: true,
          engine: 'ffmpeg',
          outputPath: exportResult.outputPath,
          blobUrl: exportResult.blobUrl,
          durationSec: exportResult.durationSec || totalDuration || 15,
        };
      }
    } catch (nativeErr) {
      unbindProgress();
      console.warn('[ExportOrchestrator] Native FFmpeg failed, falling back to WebCodecs:', nativeErr);
      if (signal?.aborted) {
        return {
          success: false,
          error: 'تم إلغاء عملية التصدير',
        };
      }
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

  // 1. Decode all Ayah audio buffers
  const validAudioUrls = audioUrls.filter(Boolean);
  const loadedBuffers: AudioBuffer[] = [];

  for (let i = 0; i < validAudioUrls.length; i++) {
    if (signal?.aborted) throw new Error('تم إلغاء عملية التصدير');
    reportProgress(`جاري قراءة الصوت (${i + 1}/${validAudioUrls.length})...`, 10 + Math.round((i / validAudioUrls.length) * 15));
    const buf = await fetchAndDecodeAudio(audioCtx, validAudioUrls[i]);
    if (buf) loadedBuffers.push(buf);
  }

  // 2. Stitch and Process Master Audio Buffer
  let masterBuffer: AudioBuffer | null = null;
  if (loadedBuffers.length > 0) {
    masterBuffer = concatenateAudioBuffers(audioCtx, loadedBuffers);

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
  }

  // 3. Build Precise Timeline Ranges
  let cumulativeTime = 0;
  const isSingleContinuousAudio = validAudioUrls.length === 1 && validAyahs.length > 1;

  const ayahTimeRanges = validAyahs.map((a, idx) => {
    let start = cumulativeTime;
    let end = cumulativeTime;
    let dur = a.duration || 6;

    if (isSingleContinuousAudio && a.startTimeMs !== undefined && a.endTimeMs !== undefined) {
      start = a.startTimeMs / 1000;
      end = a.endTimeMs / 1000;
      dur = Math.max(0.1, end - start);
      cumulativeTime = end;
    } else {
      const bufDur = loadedBuffers[idx]?.duration;
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

  const totalDurationSec =
    masterBuffer?.duration || (cumulativeTime > 0 ? cumulativeTime : totalDuration || 15);

  // 4. Preload Visual Assets
  reportProgress('جاري تجهيز الخلفيات والصور...', 30);
  const [bgImg, sceneBgImages] = await Promise.all([
    preloadImage(backgroundPath),
    preloadSceneBackgrounds(textSettings?.sceneBackgrounds),
  ]);

  if (signal?.aborted) throw new Error('تم إلغاء عملية التصدير');

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

      const downloadUrl = URL.createObjectURL(mp4Blob);
      const cleanProjectName = projectName.replace(/[/\\?%*:|"<>]/g, '-');
      reportProgress('اكتمل التصدير بنجاح وبصيغة MP4 القياسية ✅', 100, { engine: 'webcodecs' });

      return {
        success: true,
        engine: 'webcodecs',
        blob: mp4Blob,
        blobUrl: downloadUrl,
        outputPath: `${cleanProjectName}.mp4`,
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

  const dest = audioCtx.createMediaStreamDestination();
  let activeBufferSource: AudioBufferSourceNode | null = null;

  if (masterBuffer) {
    activeBufferSource = audioCtx.createBufferSource();
    activeBufferSource.buffer = masterBuffer;
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 1.0;
    activeBufferSource.connect(masterGain);
    masterGain.connect(dest);
  }

  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  let selectedMime = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(selectedMime)) selectedMime = 'video/webm;codecs=vp8,opus';
  if (!MediaRecorder.isTypeSupported(selectedMime)) selectedMime = 'video/webm';
  if (!MediaRecorder.isTypeSupported(selectedMime)) selectedMime = 'video/mp4';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: MediaRecorder.isTypeSupported(selectedMime) ? selectedMime : undefined,
    videoBitsPerSecond: targetBitrate,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(100);

  const exportStartTime = audioCtx.currentTime;
  if (activeBufferSource) {
    activeBufferSource.start(exportStartTime);
  }

  const totalFrames = Math.max(fps * 3, Math.round(fps * totalDurationSec));

  await new Promise<void>((resolve, reject) => {
    let lastUiUpdateWallTime = 0;
    let lastReportedPercent = -1;

    const renderLoop = () => {
      if (signal?.aborted) {
        recorder.stop();
        reject(new Error('تم إلغاء عملية التصدير'));
        return;
      }

      const elapsedAudioTime = audioCtx.currentTime - exportStartTime;

      if (elapsedAudioTime >= totalDurationSec) {
        resolve();
        return;
      }

      const activeRange =
        ayahTimeRanges.find((r) => elapsedAudioTime >= r.start && elapsedAudioTime < r.end) ||
        ayahTimeRanges[ayahTimeRanges.length - 1];

      const localAyahTime = Math.max(0, elapsedAudioTime - activeRange.start);
      const currentProg = Math.min(1, elapsedAudioTime / totalDurationSec);
      const currentFrame = Math.floor(elapsedAudioTime * fps);

      renderVideoExportFrame({
        ctx,
        width,
        height,
        frame: currentFrame,
        totalFrames,
        currentTimeSec: localAyahTime,
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
      });

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
          totalAyahs: validAyahs.length,
          engine: 'mediarecorder',
        });
      }

      requestAnimationFrame(renderLoop);
    };

    requestAnimationFrame(renderLoop);
  });

  const finalBlob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const ext = selectedMime.includes('mp4') ? 'video/mp4' : 'video/webm';
      resolve(new Blob(chunks, { type: ext }));
    };
    recorder.stop();
  });

  const downloadUrl = URL.createObjectURL(finalBlob);
  const cleanProjectName = projectName.replace(/[/\\?%*:|"<>]/g, '-');
  const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
  reportProgress('اكتمل التصدير بنجاح ✅', 100, { engine: 'mediarecorder' });

  return {
    success: true,
    engine: 'mediarecorder',
    blob: finalBlob,
    blobUrl: downloadUrl,
    outputPath: `${cleanProjectName}.${ext}`,
    durationSec: totalDurationSec,
    fileSizeBytes: finalBlob.size,
  };
}
