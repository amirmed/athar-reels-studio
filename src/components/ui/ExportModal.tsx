import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Music,
  FileVideo,
  Settings,
  FolderOpen,
  Sparkles,
  Image as ImageIcon,
  Zap,
  Share2,
  MessageCircle,
  Send,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Smartphone,
  Monitor,
  Square,
} from 'lucide-react';
import { ViralCaptionGenerator } from './ViralCaptionGenerator';
import { ThumbnailModal } from './ThumbnailModal';
import { PublishKitModal } from './PublishKitModal';
import { getSocialShareLinks, triggerNativeShare } from '../../services/viralCaptionService';
import { renderVideoExportFrame } from '../../services/videoFrameRenderer';
import { AyahData } from '../../services/quranApi';
import {
  render8DSpatialBuffer,
  Spatial8DAudioProcessor,
} from '../../services/spatial8DAudioEngine';
import {
  TextSettings,
  AudioSettings,
  AspectRatio,
  TransitionType,
  VideoEffectType,
} from '../../types';
import { isVideoMedia } from '../../utils/imageUtils';
import {
  isWebCodecsExportSupported,
  exportVideoWithWebCodecs,
} from '../../services/webCodecsExportService';
import { useHotkeys } from '../../hooks/useHotkeys';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  backgroundPath?: string;
  audioUrls?: string[];
  ayahs: (AyahData & { translationText?: string })[];
  aspectRatio: AspectRatio;
  watermark?: string;
  textColor?: string;
  bgOpacity?: number;
  fontFamily?: string;
  totalDuration?: number;
  transition?: TransitionType | string;
  videoEffect?: VideoEffectType | string;
  textSettings?: TextSettings;
  audioSettings?: AudioSettings;
  showTranslation?: boolean;
  showTafsir?: boolean;
  surahName?: string;
  reciterName?: string;
}

type ExportStatus = 'idle' | 'choosing' | 'exporting' | 'done' | 'error';

interface PlatformPreset {
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

const PLATFORM_PRESETS: PlatformPreset[] = [
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

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectName,
  backgroundPath,
  audioUrls = [],
  ayahs,
  aspectRatio,
  watermark,
  textColor = '#ffffff',
  bgOpacity = 0.6,
  fontFamily = 'Amiri',
  totalDuration,
  transition = 'fadeScale',
  videoEffect = 'none',
  textSettings,
  audioSettings,
  showTranslation = false,
  showTafsir = false,
  surahName = 'سورة قرآنية',
  reciterName,
}) => {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('جاري التجهيز...');
  const [outputPath, setOutputPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const [showThumbnailModal, setShowThumbnailModal] = useState(false);
  const [showPublishKitModal, setShowPublishKitModal] = useState(false);
  const [selectedPlatformPreset, setSelectedPlatformPreset] = useState<string>('tiktok');
  const [activeTab, setActiveTab] = useState<'export' | 'preview'>('export');

  // Smart Progress Metrics State
  const [currentFrameNumber, setCurrentFrameNumber] = useState(0);
  const [totalFrameCount, setTotalFrameCount] = useState(0);
  const [currentAyahNumber, setCurrentAyahNumber] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState(0);
  const [estimatedSizeMb, setEstimatedSizeMb] = useState(0);
  const [realtimeFps, setRealtimeFps] = useState(30);

  // Live Canvas Preview Player State
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [previewTimeSec, setPreviewTimeSec] = useState(0);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewAnimRef = useRef<number | null>(null);

  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setProgress(0);
      setPhase('');
      setError(null);
      setDownloadBlobUrl(null);
      abortControllerRef.current = false;
      if (previewAnimRef.current) {
        cancelAnimationFrame(previewAnimRef.current);
      }
    }
  }, [isOpen]);

  const activePreset =
    PLATFORM_PRESETS.find((p) => p.id === selectedPlatformPreset) || PLATFORM_PRESETS[0];

  // Helper: Fetch and decode audio URL into AudioBuffer with CORS fallbacks
  const fetchAndDecodeAudio = async (
    audioCtx: AudioContext,
    url: string
  ): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      return await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.warn(`[ExportModal] CORS fetch failed for ${url}, trying fallback`, e);
      return null;
    }
  };

  // Helper: Concatenate multiple AudioBuffers into one seamless buffer
  const concatenateAudioBuffers = (
    audioCtx: AudioContext,
    buffers: AudioBuffer[]
  ): AudioBuffer | null => {
    if (buffers.length === 0) return null;
    if (buffers.length === 1) return buffers[0];

    const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
    const numberOfChannels = Math.max(...buffers.map((b) => b.numberOfChannels));
    const sampleRate = buffers[0].sampleRate;

    const outBuffer = audioCtx.createBuffer(numberOfChannels, totalLength, sampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const outData = outBuffer.getChannelData(channel);
      let offset = 0;
      for (const b of buffers) {
        const inData = b.getChannelData(Math.min(channel, b.numberOfChannels - 1));
        outData.set(inData, offset);
        offset += b.length;
      }
    }
    return outBuffer;
  };

  // 5.1 🎥 Live Export Canvas Preview Loop
  useEffect(() => {
    if (!isOpen || activeTab !== 'preview' || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewW = 360;
    const previewH = Math.round(previewW * (activePreset.height / activePreset.width));
    canvas.width = previewW;
    canvas.height = previewH;

    const startTimestamp = performance.now();
    const maxPreviewDuration = 6.0; // 6-second preview loop

    let bgImgEl: HTMLImageElement | null = null;
    let bgVideoEl: HTMLVideoElement | null = null;
    const isVideoBg = Boolean(backgroundPath && isVideoMedia(backgroundPath));

    if (backgroundPath) {
      if (isVideoBg) {
        bgVideoEl = document.createElement('video');
        bgVideoEl.crossOrigin = 'anonymous';
        bgVideoEl.src = backgroundPath;
        bgVideoEl.muted = true;
        bgVideoEl.loop = true;
        bgVideoEl.playsInline = true;
        bgVideoEl.play().catch(() => {});
      } else {
        bgImgEl = new Image();
        bgImgEl.crossOrigin = 'anonymous';
        bgImgEl.src = backgroundPath;
      }
    }

    const previewLoop = (now: number) => {
      if (!isPreviewPlaying) {
        previewAnimRef.current = requestAnimationFrame(previewLoop);
        return;
      }

      const elapsed = ((now - startTimestamp) / 1000) % maxPreviewDuration;
      setPreviewTimeSec(elapsed);

      const targetAyah = ayahs[0] || {
        numberInSurah: 1,
        surahNumber: 1,
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        duration: 6,
        words: [],
      };

      renderVideoExportFrame({
        ctx,
        width: previewW,
        height: previewH,
        frame: Math.floor(elapsed * 30),
        totalFrames: Math.floor(maxPreviewDuration * 30),
        currentTimeSec: elapsed,
        bgImage: bgImgEl,
        bgVideo: bgVideoEl,
        bgOpacity,
        currentAyah: targetAyah,
        textSettings,
        watermark,
        projectName,
        surahName,
        reciterName,
        showTranslation,
        isCustomContent: !surahName || surahName.length === 0,
      });

      previewAnimRef.current = requestAnimationFrame(previewLoop);
    };

    previewAnimRef.current = requestAnimationFrame(previewLoop);

    return () => {
      if (previewAnimRef.current) {
        cancelAnimationFrame(previewAnimRef.current);
      }
      if (bgVideoEl) {
        try {
          bgVideoEl.pause();
          bgVideoEl.src = '';
        } catch {
          // ignore
        }
      }
    };
  }, [
    isOpen,
    activeTab,
    isPreviewPlaying,
    activePreset,
    backgroundPath,
    bgOpacity,
    ayahs,
    textSettings,
    watermark,
    projectName,
    surahName,
    showTranslation,
  ]);

  // Main Export Process
  const handleStartExport = async () => {
    setStatus('exporting');
    setProgress(0);
    setError(null);
    setPhase('جاري تهيئة منصة التصيير والموارد...');
    abortControllerRef.current = false;

    const startWallTime = Date.now();

    // ── Check if Native Electron FFmpeg Engine is available ──────────────────
    if (window.electronAPI?.videoExport?.start) {
      const unbindProgress = window.electronAPI.videoExport.onProgress((data) => {
        if (!abortControllerRef.current) {
          const pct = Math.min(99, Math.max(1, Math.round(data.percent || 0)));
          setProgress(pct);
          setPhase(data.phase || `جاري التصدير عبر محرك FFmpeg (${pct}%)...`);
          const elapsedWallSec = (Date.now() - startWallTime) / 1000;
          setElapsedSeconds(Math.round(elapsedWallSec));
          if (pct > 0) {
            const totalEstSec = elapsedWallSec / (pct / 100);
            setEstimatedSecondsRemaining(Math.max(0, Math.round(totalEstSec - elapsedWallSec)));
          }
        }
      });

      try {
        let targetSavePath: string | null = null;
        if (window.electronAPI?.dialog?.saveFile) {
          targetSavePath = await window.electronAPI.dialog.saveFile({
            defaultPath: `${projectName.replace(/[/\\?%*:|"<>]/g, '-')}.mp4`,
            filters: [{ name: 'فيديو MP4', extensions: ['mp4', 'mkv'] }],
          });
          if (!targetSavePath) {
            unbindProgress();
            setStatus('idle');
            return;
          }
        }

        setPhase('جاري التصدير عبر محرك FFmpeg فائق السرعة 🚀...');

        const validAyahs = ayahs.filter((a) => a && a.text && a.text.trim().length > 0);
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
            words: a.words,
            chunks: a.chunks,
          };
        });

        const resolvedAudioUrls = await Promise.all(
          (audioUrls || []).filter(Boolean).map(async (u) => {
            if (typeof u === 'string' && u.startsWith('blob:')) {
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

        const exportResult = await window.electronAPI.videoExport.start({
          outputPath: targetSavePath || undefined,
          projectName,
          aspectRatio: activePreset.aspect,
          quality:
            activePreset.bitrate > 10_000_000
              ? 'premium'
              : activePreset.bitrate > 5_000_000
                ? 'high'
                : 'standard',
          ayahs: exportAyahs,
          audioUrls: resolvedAudioUrls.filter(Boolean) as string[],
          backgroundPath,
          bgOpacity,
          watermark,
          textColor,
          fontFamily,
          transition,
          videoEffect,
          textSettings,
          audioSettings,
          showTranslation,
          showTafsir,
          surahName,
        });

        unbindProgress();

        if (exportResult?.success && exportResult.outputPath) {
          setOutputPath(exportResult.outputPath);
          setStatus('done');
          setProgress(100);
          setPhase('اكتمل التصدير بنجاح عبر محرك FFmpeg ✅');
          return;
        } else if (exportResult && !exportResult.success) {
          throw new Error(exportResult.error || 'فشل التصدير عبر محرك FFmpeg');
        }
      } catch (nativeErr: any) {
        unbindProgress();
        console.warn(
          '[ExportModal] Native FFmpeg export error, attempting Web Canvas fallback:',
          nativeErr
        );
        if (abortControllerRef.current) {
          setStatus('idle');
          return;
        }
        // Fall through to Web Canvas exporter if native failed
      }
    }

    try {
      const dimensions = { width: activePreset.width, height: activePreset.height };
      const fps = activePreset.fps;
      const targetBitrate = activePreset.bitrate;

      // 1. Offscreen High-Performance Canvas setup
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      if (!ctx) throw new Error('فشل إنشاء سياق Canvas للتصدير');

      // Pre-load background image or video and multi-scene backgrounds
      let bgImg: HTMLImageElement | null = null;
      let bgVideo: HTMLVideoElement | null = null;
      const sceneBgImages: Record<number, HTMLImageElement> = {};

      if (backgroundPath) {
        const isVideo = isVideoMedia(backgroundPath);
        if (isVideo) {
          bgVideo = document.createElement('video');
          bgVideo.crossOrigin = 'anonymous';
          bgVideo.src = backgroundPath;
          bgVideo.muted = true;
          bgVideo.loop = true;
          await new Promise((resolve) => {
            if (!bgVideo) return resolve(null);
            bgVideo.onloadeddata = () => {
              bgVideo?.play().catch(() => {});
              resolve(null);
            };
            bgVideo.onerror = () => {
              console.warn(
                '[ExportModal] Failed to load background video, proceeding with dark backdrop'
              );
              resolve(null);
            };
          });
        } else {
          bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          await new Promise((resolve) => {
            if (!bgImg) return resolve(null);
            bgImg.onload = () => resolve(null);
            bgImg.onerror = () => {
              console.warn(
                '[ExportModal] Failed to load background image, using fallback backdrop'
              );
              resolve(null);
            };
            bgImg.src = backgroundPath;
          });
        }
      }

      // Pre-load all scene backgrounds if multi-scene is enabled
      if (textSettings?.sceneBackgrounds && Object.keys(textSettings.sceneBackgrounds).length > 0) {
        const entries = Object.entries(textSettings.sceneBackgrounds);
        await Promise.all(
          entries.map(async ([idxStr, sceneUrl]) => {
            if (!sceneUrl) return;
            try {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              await new Promise((resolve) => {
                img.onload = () => resolve(null);
                img.onerror = () => resolve(null);
                img.src = sceneUrl;
              });
              sceneBgImages[Number(idxStr)] = img;
            } catch (e) {
              console.warn('[ExportModal] Failed to preload scene background:', sceneUrl, e);
            }
          })
        );
      }

      // 2. Audio setup with Web Audio API
      setPhase('جاري معالجة الصوت والمؤثرات ودمج التلاوة...');
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const dest = audioCtx.createMediaStreamDestination();

      // Inaudible carrier
      const carrierOsc = audioCtx.createOscillator();
      const carrierGain = audioCtx.createGain();
      carrierGain.gain.value = 0.0001;
      carrierOsc.connect(carrierGain);
      carrierGain.connect(dest);
      carrierOsc.start();

      // Load all Ayah audio buffers and stitch them
      const validAudioUrls = audioUrls.filter(Boolean);
      const loadedBuffers: AudioBuffer[] = [];

      for (let i = 0; i < validAudioUrls.length; i++) {
        setPhase(`جاري تحميل وقراءة الصوت (${i + 1}/${validAudioUrls.length})...`);
        const buf = await fetchAndDecodeAudio(audioCtx, validAudioUrls[i]);
        if (!buf) {
          throw new Error(
            `تعذر تحميل وقراءة صوت الآية (${i + 1} من ${validAudioUrls.length}). يرجى التحقق من اتصال الإنترنت والمحاولة مجدداً.`
          );
        }
        loadedBuffers.push(buf);
      }

      let masterBuffer: AudioBuffer | null = null;
      let activeBufferSource: AudioBufferSourceNode | null = null;
      let activeAudioEl: HTMLAudioElement | null = null;

      if (loadedBuffers.length > 0) {
        masterBuffer = concatenateAudioBuffers(audioCtx, loadedBuffers);

        // Apply 8D Binaural Spatial Audio Rendering if enabled
        if (audioSettings?.enable8DAudio && masterBuffer) {
          setPhase('جاري معالجة الصوت المكاني 8D ومعايرة المدار 360° 🎧...');
          try {
            masterBuffer = await render8DSpatialBuffer(audioCtx, masterBuffer, {
              speedHz: audioSettings.eightDSpeed ?? 0.12,
              depth: (audioSettings.eightDDepth ?? 85) / 100,
              style: audioSettings.eightDStyle ?? 'orbit360',
            });
          } catch (e8d) {
            console.warn('[ExportModal] 8D rendering fallback:', e8d);
          }
        }

        if (masterBuffer) {
          activeBufferSource = audioCtx.createBufferSource();
          activeBufferSource.buffer = masterBuffer;
          const masterGain = audioCtx.createGain();
          masterGain.gain.value = 1.0;
          activeBufferSource.connect(masterGain);
          masterGain.connect(dest);
        }
      } else if (validAudioUrls.length > 0) {
        try {
          activeAudioEl = new Audio(validAudioUrls[0]);
          activeAudioEl.crossOrigin = 'anonymous';
          const mediaSource = audioCtx.createMediaElementSource(activeAudioEl);
          const voiceGain = audioCtx.createGain();
          voiceGain.gain.value = 1.0;
          mediaSource.connect(voiceGain);

          if (audioSettings?.enable8DAudio) {
            const spatial8D = new Spatial8DAudioProcessor(audioCtx);
            spatial8D.configure({
              speedHz: audioSettings.eightDSpeed ?? 0.12,
              depth: (audioSettings.eightDDepth ?? 85) / 100,
              style: audioSettings.eightDStyle ?? 'orbit360',
            });
            spatial8D.setEnabled(true);
            voiceGain.connect(spatial8D.getInput());
            spatial8D.getOutput().connect(dest);
          } else {
            voiceGain.connect(dest);
          }
        } catch (audioErr) {
          console.warn('[ExportModal] Fallback audio play error:', audioErr);
        }
      }

      // Compute precise per-ayah timing ranges
      let cumulativeTime = 0;
      const validAyahs = ayahs.filter((a) => a && a.text && a.text.trim().length > 0);
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
        masterBuffer?.duration ||
        (cumulativeTime > 0
          ? cumulativeTime
          : activeAudioEl?.duration && !isNaN(activeAudioEl.duration)
            ? activeAudioEl.duration
            : totalDuration || 15);

      // Estimated size calculation: (bitrate * seconds) / 8 / 1024 / 1024
      const estMb =
        Math.round((((targetBitrate + 192_000) * totalDurationSec) / (8 * 1024 * 1024)) * 10) / 10;
      setEstimatedSizeMb(estMb);

      // 3. WebCodecs Ultra-Fast MP4 Export Engine (5x-10x Faster than Realtime)
      const canUseWebCodecs = await isWebCodecsExportSupported();
      if (canUseWebCodecs) {
        setPhase(`جاري التصدير فائق السرعة عبر محرك WebCodecs (MP4)...`);

        const mp4Blob = await exportVideoWithWebCodecs({
          width: activePreset.width,
          height: activePreset.height,
          fps,
          bitrate: targetBitrate,
          ayahs: validAyahs,
          timeline: ayahTimeRanges,
          totalDurationSec,
          masterAudioBuffer: masterBuffer,
          audioUrls: validAyahs.map((a) => a.audioUrl).filter(Boolean),
          bgImage: bgImg,
          sceneBgImages,
          bgOpacity: bgOpacity ?? 0.6,
          textSettings,
          audioSettings,
          watermark,
          projectName,
          surahName,
          reciterName,
          showTranslation: !!showTranslation,
          onProgress: ({ percent, currentFrame, totalFrames: tFrames, fps: renderFps }) => {
            setProgress(percent);
            setCurrentFrameNumber(currentFrame);
            setTotalFrameCount(tFrames);
            setRealtimeFps(renderFps);
            const nowWall = performance.now();
            const elapsedWallSec = (nowWall - startWallTime) / 1000;
            setElapsedSeconds(Math.round(elapsedWallSec));
            if (percent > 0) {
              const totalEstSec = elapsedWallSec / (percent / 100);
              const remainingSec = Math.max(0, Math.round(totalEstSec - elapsedWallSec));
              setEstimatedSecondsRemaining(remainingSec);
            }
            setPhase(`تصدير فائق السرعة عبر WebCodecs (${percent}% - ${renderFps} FPS)...`);
          },
        });

        const url = URL.createObjectURL(mp4Blob);
        setDownloadBlobUrl(url);
        const cleanProjectName = projectName.replace(/[/\\?%*:|"<>]/g, '-');
        setOutputPath(`${cleanProjectName}.mp4`);
        setStatus('done');
        setProgress(100);
        setPhase('اكتمل التصدير بنجاح وبأعلى سرعة وبصيغة MP4 القياسية ✅');
        return;
      }

      // 4. Fallback: Setup MediaRecorder with platform bitrate (Legacy Browser Mode)
      const canvasStream = canvas.captureStream(fps);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      let selectedMime = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(selectedMime)) {
        selectedMime = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(selectedMime)) {
        selectedMime = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(selectedMime)) {
        selectedMime = 'video/mp4';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported(selectedMime) ? selectedMime : undefined,
        videoBitsPerSecond: targetBitrate,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.start(100);

      // Start Audio Playback synced to Web Audio timeline
      const exportStartTime = audioCtx.currentTime;
      if (activeBufferSource) {
        activeBufferSource.start(exportStartTime);
      } else if (activeAudioEl) {
        try {
          await activeAudioEl.play();
        } catch {
          // ignore error
        }
      }

      // 4. Render Video Frames locked to Audio Clock with 5.2 📊 Smart Progress Metrics
      const totalFrames = Math.max(fps * 3, Math.round(fps * totalDurationSec));
      setTotalFrameCount(totalFrames);
      setRealtimeFps(fps);

      await new Promise<void>((resolve) => {
        let lastUiUpdateWallTime = 0;
        let lastReportedPercent = -1;

        const renderLoop = () => {
          if (abortControllerRef.current) {
            resolve();
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
            width: dimensions.width,
            height: dimensions.height,
            frame: currentFrame,
            totalFrames,
            currentTimeSec: localAyahTime,
            bgImage: bgImg,
            bgVideo: bgVideo,
            bgOpacity,
            currentAyah: activeRange.ayah,
            textSettings,
            watermark,
            projectName,
            surahName: activeRange.ayah.surahName || surahName,
            reciterName,
            showTranslation,
            isCustomContent: !surahName || surahName.length === 0,
          });

          // 5.2 📊 Smart Throttled UI Progress Updates (every 250ms or when integer percent changes)
          const percent = Math.min(99, Math.round(currentProg * 100));
          const nowWall = Date.now();

          if (nowWall - lastUiUpdateWallTime >= 250 || percent !== lastReportedPercent) {
            lastUiUpdateWallTime = nowWall;
            lastReportedPercent = percent;

            setProgress(percent);
            setCurrentFrameNumber(currentFrame);
            setCurrentAyahNumber(activeRange.ayahIndex);

            const elapsedWallSec = (nowWall - startWallTime) / 1000;
            setElapsedSeconds(Math.round(elapsedWallSec));

            if (percent > 0) {
              const totalEstSec = elapsedWallSec / (percent / 100);
              const remainingSec = Math.max(0, Math.round(totalEstSec - elapsedWallSec));
              setEstimatedSecondsRemaining(remainingSec);
            }

            setPhase(`جاري تصدير الفيديو لمنصة «${activePreset.name}» (${percent}%)...`);
          }

          requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
      });

      setPhase('جاري حفظ ملف الفيديو وتجهيز الرابط النهائي...');

      try {
        if (recorder.state === 'recording') {
          recorder.requestData();
        }
      } catch {
        // ignore
      }

      await new Promise((resolve) => {
        recorder.onstop = () => {
          if (carrierOsc) {
            try {
              carrierOsc.stop();
            } catch {
              /* ignore */
            }
          }
          if (activeBufferSource) {
            try {
              activeBufferSource.stop();
            } catch {
              /* ignore */
            }
          }
          if (activeAudioEl) {
            activeAudioEl.pause();
            activeAudioEl.src = '';
          }
          if (bgVideo) {
            bgVideo.pause();
            bgVideo.src = '';
          }
          audioCtx.close().catch(() => {});

          const blob = new Blob(chunks, { type: selectedMime });
          const url = URL.createObjectURL(blob);
          setDownloadBlobUrl(url);
          const extension = selectedMime.includes('mp4') ? '.mp4' : '.webm';
          const cleanProjectName = projectName.replace(/[/\\?%*:|"<>]/g, '-');
          setOutputPath(`${cleanProjectName}${extension}`);
          setStatus('done');
          setProgress(100);
          setPhase('اكتمل التصدير بنجاح وبأعلى جودة ✅');
          resolve(null);
        };

        if (recorder.state === 'recording') {
          recorder.stop();
        }
      });
    } catch (err: unknown) {
      console.error('[ExportModal] Export failed:', err);
      const errMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء تصدير الفيديو';
      setError(errMsg);
      setStatus('error');
    }
  };

  const handleCancelExport = () => {
    abortControllerRef.current = true;
    if (window.electronAPI?.videoExport?.cancel) {
      try {
        window.electronAPI.videoExport.cancel();
      } catch {}
    }
    setStatus('idle');
    setProgress(0);
    setPhase('');
  };

  useHotkeys('Escape', onClose, { enabled: isOpen && status !== 'exporting' });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="تصدير الفيديو الذكي عالي الجودة"
    >
      <div className="relative w-full max-w-2xl bg-surface-900/95 border border-gold-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-right overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <button
            onClick={status === 'exporting' ? handleCancelExport : onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-white">
              🚀 تصدير الفيديو الذكي (Studio Export)
            </h3>
            <div className="p-2 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400">
              <Film size={18} />
            </div>
          </div>
        </div>

        {/* Status === 'idle' (Platform Presets & 5.1 Live Preview) */}
        {status === 'idle' && (
          <div className="space-y-4">
            {/* Tab Switcher: Export Setup vs 5.1 🎥 Live Preview */}
            <div className="flex p-1 bg-surface-950 rounded-2xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-gold-500 text-surface-950 font-extrabold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Settings size={14} />
                <span>إعدادات ومنصات التصدير 📐</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-gold-500 text-surface-950 font-extrabold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Eye size={14} />
                <span>معاينة حية دقيقة قبل التصدير 🎥</span>
              </button>
            </div>

            {/* TAB 1: 5.3 📐 Platform Presets */}
            {activeTab === 'export' && (
              <div className="space-y-3">
                <label className="block text-white/70 text-xs font-bold">
                  اختر المنصة المستهدفة (تحسين تلقائي للدقة والبت-ريت) 🎯:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PLATFORM_PRESETS.map((preset) => {
                    const isSelected = selectedPlatformPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPlatformPreset(preset.id)}
                        className={`p-3 rounded-2xl text-right border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gold-500/15 border-gold-400 text-white ring-1 ring-gold-400/40 shadow-lg shadow-gold-500/10'
                            : 'bg-surface-950/60 border-white/[0.04] text-white/60 hover:text-white hover:bg-surface-950'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{preset.icon}</span>
                            <span className="text-[11px] font-mono text-gold-400 bg-surface-900 px-1.5 py-0.5 rounded border border-white/5">
                              {preset.bitrateLabel}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-white">{preset.name}</div>
                          <div className="text-[11px] text-white/40">{preset.sub}</div>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-white/5 text-[10px] text-white/50 truncate">
                          {preset.width}×{preset.height} • {preset.fps}fps
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Platform Summary Badge */}
                <div className="p-3 rounded-2xl bg-surface-950/80 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{activePreset.icon}</span>
                    <div>
                      <div className="font-bold text-white">
                        {activePreset.name} ({activePreset.width}×{activePreset.height})
                      </div>
                      <div className="text-[11px] text-white/50">{activePreset.desc}</div>
                    </div>
                  </div>
                  <div className="text-left font-mono text-xs text-gold-300">
                    <div>{activePreset.fps} FPS</div>
                    <div>{activePreset.bitrateLabel}</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 5.1 🎥 Live Export Canvas Preview Player */}
            {activeTab === 'preview' && (
              <div className="space-y-3 flex flex-col items-center">
                <div className="relative rounded-2xl overflow-hidden border border-gold-500/40 shadow-2xl bg-black flex items-center justify-center max-h-[280px]">
                  <canvas ref={previewCanvasRef} className="max-h-[280px] w-auto object-contain" />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-gold-300 font-bold">
                    معاينة حية 1:1 🎬
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                    className="p-2 rounded-xl bg-gold-500 text-surface-950 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 shadow"
                  >
                    {isPreviewPlaying ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isPreviewPlaying ? 'إيقاف المعاينة' : 'تشغيل المعاينة'}</span>
                  </button>
                  <span className="text-xs text-white/60 font-mono">
                    {previewTimeSec.toFixed(1)}s / 6.0s
                  </span>
                </div>
              </div>
            )}

            {/* Start Export Button */}
            <button
              type="button"
              onClick={handleStartExport}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-surface-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-gold-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <Download size={18} />
              <span>بدء تصدير الفيديو لمنصة «{activePreset.name}» 🚀</span>
            </button>
          </div>
        )}

        {/* Status === 'exporting' (5.2 📊 Smart Progress Metrics Dashboard) */}
        {status === 'exporting' && (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-gold-500/10 text-gold-400 border border-gold-500/20 mb-1 animate-spin">
                <Loader2 size={24} />
              </div>
              <h4 className="font-bold text-sm text-white">{phase}</h4>
              <p className="text-xs text-white/50 font-mono">
                {currentFrameNumber} / {totalFrameCount} إطار ({progress}%)
              </p>
            </div>

            {/* Glowing Multi-Segment Progress Bar */}
            <div className="relative w-full h-4 rounded-full bg-surface-950 border border-white/10 overflow-hidden p-0.5 shadow-inner">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-gold-400 to-emerald-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'linear', duration: 0.1 }}
              />
            </div>

            {/* 5.2 📊 Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-surface-950/70 border border-white/5">
                <div className="text-white/40 text-[11px]">الآية الحالية</div>
                <div className="font-bold text-white mt-0.5">
                  {currentAyahNumber} من {ayahs.length}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/70 border border-white/5">
                <div className="text-white/40 text-[11px]">سرعة الإطارات</div>
                <div className="font-bold text-gold-300 font-mono mt-0.5">{realtimeFps} FPS</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/70 border border-white/5">
                <div className="text-white/40 text-[11px]">الوقت المنقضي</div>
                <div className="font-bold text-white font-mono mt-0.5">{elapsedSeconds}s</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/70 border border-white/5">
                <div className="text-white/40 text-[11px]">الوقت المتبقي (ETA)</div>
                <div className="font-bold text-emerald-300 font-mono mt-0.5">
                  ~{estimatedSecondsRemaining}s
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white/40 px-1">
              <span>الحجم التقريبي للملف: ~{estimatedSizeMb} MB</span>
              <button
                type="button"
                onClick={handleCancelExport}
                className="text-rose-400 hover:underline cursor-pointer"
              >
                إلغاء التصدير ✕
              </button>
            </div>
          </div>
        )}

        {/* Status === 'done' (Success & Direct Download & Share) */}
        {status === 'done' && (
          <div className="space-y-4 py-2 text-center">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-white">تم تصدير الفيديو بنجاح! 🎉</h4>
              <p className="text-xs text-emerald-400/90 mt-0.5">
                الفيديو جاهز بأعلى جودة وصوت نقي 100%
              </p>
            </div>

            {/* Native Path or Download Blob Actions */}
            {outputPath && window.electronAPI?.shell && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-surface-950/80 border border-white/10 text-xs font-mono text-gold-300/90 truncate">
                  {outputPath}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => window.electronAPI?.shell?.showItemInFolder(outputPath)}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-surface-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    <FolderOpen size={15} />
                    <span>فتح مكان الملف 📁</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.electronAPI?.shell?.openPath(outputPath)}
                    className="py-3 px-4 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 active:scale-98 transition-all cursor-pointer"
                  >
                    <Play size={14} />
                    <span>تشغيل الفيديو 🎬</span>
                  </button>
                </div>
              </div>
            )}

            {downloadBlobUrl && !window.electronAPI?.shell && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (
                        window.electronAPI?.dialog?.saveFile &&
                        window.electronAPI?.fs?.writeBinaryFile
                      ) {
                        const defaultFilename =
                          outputPath || `${projectName.replace(/[/\\?%*:|"<>]/g, '-')}.mp4`;
                        const savePath = await window.electronAPI.dialog.saveFile({
                          defaultPath: defaultFilename,
                          filters: [{ name: 'فيديو MP4', extensions: ['mp4', 'webm'] }],
                        });
                        if (savePath) {
                          const res = await fetch(downloadBlobUrl);
                          const arrayBuffer = await res.arrayBuffer();
                          await window.electronAPI.fs.writeBinaryFile(
                            savePath,
                            new Uint8Array(arrayBuffer) as any
                          );
                          window.electronAPI.shell?.showItemInFolder(savePath);
                          return;
                        }
                      }
                    } catch (e) {
                      console.warn('Native save failed, falling back to download link:', e);
                    }
                    // Web fallback
                    const a = document.createElement('a');
                    a.href = downloadBlobUrl;
                    a.download = outputPath || 'ayah_video.mp4';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-surface-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Download size={18} />
                  <span>حفظ وتحميل ملف الفيديو (Save Video) 📥</span>
                </button>
              </div>
            )}

            {/* Direct Publish Kit Launcher */}
            <button
              type="button"
              onClick={() => setShowPublishKitModal(true)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-gold-500/25 via-amber-500/20 to-gold-400/20 text-gold-300 hover:text-gold-200 border border-gold-400/40 hover:border-gold-300 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Share2 size={15} className="text-gold-400" />
              <span>عدة النشر المباشر في TikTok و Reels و YouTube 🚀</span>
            </button>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowThumbnailModal(true)}
                className="py-2.5 px-3 rounded-xl bg-surface-950 border border-white/10 hover:border-gold-500/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ImageIcon size={14} className="text-gold-400" />
                <span>تصميم غلاف الريلز 🖼️</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setProgress(0);
                }}
                className="py-2.5 px-3 rounded-xl bg-surface-950 border border-white/10 hover:border-white/20 text-white/80 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>تصدير لمنصة أخرى 🔄</span>
              </button>
            </div>
          </div>
        )}

        {/* Status === 'error' (6.2 🔇 Graceful Error State) */}
        {status === 'error' && (
          <div className="space-y-4 py-2 text-center">
            <div className="inline-flex p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertCircle size={32} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">تعذر إكمال تصدير الفيديو</h4>
              <p className="text-xs text-rose-400 mt-1">
                {error || 'حدث خطأ غير متوقع أثناء معالجة الإطارات'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
            >
              إعادة المحاولة 🔄
            </button>
          </div>
        )}
      </div>

      {showThumbnailModal && (
        <ThumbnailModal
          isOpen={showThumbnailModal}
          onClose={() => setShowThumbnailModal(false)}
          project={{
            id: 'export-preview',
            name: projectName,
            reciter: reciterName || 'القارئ',
            reciterId: 'alafasy_128',
            customReciterName: reciterName,
            surah: surahName,
            surahNumber: ayahs[0]?.surahNumber || 1,
            fromAyah: ayahs[0]?.numberInSurah || 1,
            toAyah: ayahs[ayahs.length - 1]?.numberInSurah || 1,
            aspectRatio: activePreset.aspect,
            backgroundType: 'image',
            backgroundUrl: backgroundPath,
            backgroundOpacity: bgOpacity,
            watermark: watermark,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'editing',
            exportCount: 0,
            textSettings: textSettings || {
              fontSize: 28,
              fontWeight: 'bold',
              textAlign: 'center',
              textColor: '#ffffff',
              bgColor: 'rgba(0,0,0,0.5)',
              bgOpacity: 0.5,
              position: 'center',
              translationFontSize: 12,
              translationColor: '#ffffff',
            },
            audioSettings: audioSettings || {
              recitationVolume: 85,
              fadeIn: true,
              fadeOut: true,
              fadeDuration: 2,
              backgroundVolume: 20,
              ambientSoundId: 'none',
              ambientSoundVolume: 0,
            },
            translationEnabled: showTranslation,
            tafsirEnabled: showTafsir,
          }}
          ayahs={ayahs}
          currentAyahIndex={0}
        />
      )}

      {showPublishKitModal && (
        <PublishKitModal
          isOpen={showPublishKitModal}
          onClose={() => setShowPublishKitModal(false)}
          videoPath={outputPath || undefined}
          surahName={surahName || projectName}
          ayahRange={ayahs.length > 0 ? `${ayahs[0]?.numberInSurah}-${ayahs[ayahs.length - 1]?.numberInSurah}` : undefined}
          ayahText={ayahs.map((a) => a.text).join(' ')}
        />
      )}
    </div>
  );
};
