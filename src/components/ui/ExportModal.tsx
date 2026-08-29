import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Settings,
  FolderOpen,
  Image as ImageIcon,
  Share2,
  Play,
  Pause,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { Modal } from './Modal';
import { ThumbnailModal } from './ThumbnailModal';
import { PublishKitModal } from './PublishKitModal';
import { renderVideoExportFrame } from '../../services/videoFrameRenderer';
import { getAudioPeaksCached, extractAudioPeaksFromUrl } from '../../services/audioPeakExtractor';
import { AyahData } from '../../services/quranApi';
import {
  TextSettings,
  AudioSettings,
  AspectRatio,
  TransitionType,
  VideoEffectType,
} from '../../types';
import { isVideoMedia } from '../../utils/imageUtils';
import { useHotkeys } from '../../hooks/useHotkeys';
import { useAppStore } from '../../store/useAppStore';
import {
  PLATFORM_PRESETS,
  exportProject,
  isProjectExporting,
} from '../../services/exportOrchestrator';

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

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectName,
  backgroundPath,
  audioUrls = [],
  ayahs,
  aspectRatio: _aspectRatio,
  watermark,
  textColor: _textColor = '#ffffff',
  bgOpacity = 0.6,
  fontFamily: _fontFamily = 'Amiri',
  totalDuration,
  transition: _transition = 'fadeScale',
  videoEffect: _videoEffect = 'none',
  textSettings,
  audioSettings,
  showTranslation = false,
  showTafsir = false,
  surahName = 'سورة قرآنية',
  reciterName,
}) => {
  const addToast = useAppStore((s) => s.addToast);
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

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setProgress(0);
      setPhase('');
      setError(null);
      setDownloadBlobUrl((prevUrl) => {
        if (prevUrl && prevUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(prevUrl);
          } catch {}
        }
        return null;
      });
      abortControllerRef.current = null;
      if (previewAnimRef.current) {
        cancelAnimationFrame(previewAnimRef.current);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (downloadBlobUrl && downloadBlobUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(downloadBlobUrl);
        } catch {}
      }
    };
  }, [downloadBlobUrl]);

  const activePreset =
    PLATFORM_PRESETS.find((p) => p.id === selectedPlatformPreset) || PLATFORM_PRESETS[0];

  // Pre-load audio peaks for live preview parity
  const previewAudioUrl = audioUrls?.[0] || ayahs?.[0]?.audioUrl;
  const [previewPeaks, setPreviewPeaks] = useState<number[] | undefined>(undefined);

  useEffect(() => {
    if (!previewAudioUrl) {
      setPreviewPeaks(undefined);
      return;
    }
    const cached = getAudioPeaksCached(previewAudioUrl);
    if (cached) {
      setPreviewPeaks(cached);
      return;
    }
    let isCancelled = false;
    extractAudioPeaksFromUrl(previewAudioUrl).then((p) => {
      if (!isCancelled && p && p.length > 0) {
        setPreviewPeaks(p);
      }
    }).catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [previewAudioUrl]);

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
        bgVideoEl.play().catch((err) => {
          console.debug('[ExportModal] Video play error:', err);
        });
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
        globalTimeSec: elapsed,
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
        audioPeaks: previewPeaks,
        totalDurationSec: maxPreviewDuration,
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
    reciterName,
    showTranslation,
  ]);

  // Main Export Process
  const handleStartExport = async () => {
    if (status === 'exporting' || isProjectExporting()) {
      return;
    }
    setStatus('exporting');
    setProgress(0);
    setError(null);
    setPhase('جاري تهيئة منصة التصيير والموارد...');
    abortControllerRef.current = new AbortController();

    if (audioUrls.length === 1 && ayahs.length > 1) {
      addToast({
        message: '🎙️ تنبيه: سيتم استخدام تسجيلك الصوتي المخصص كمسار موحد لكافة آيات الفيديو.',
        type: 'info',
      });
    }

    // Estimated size calculation: (bitrate * seconds) / 8 / 1024 / 1024
    const totalDurationSec = totalDuration || ayahs.reduce((sum, a) => sum + (a.duration || 6), 0) || 15;
    const estMb =
      Math.round((((activePreset.bitrate + 192_000) * totalDurationSec) / (8 * 1024 * 1024)) * 10) / 10;
    setEstimatedSizeMb(estMb);

    const settings = useAppStore.getState().settings;
    const preferredSavePath = settings?.projectsPath
      ? `${settings.projectsPath.replace(/[/\\]+$/, '')}/${projectName.replace(/[/\\?%*:|"<>]/g, '-')}.mp4`
      : undefined;

    try {
      const result = await exportProject({
        projectName,
        surahName,
        reciterName,
        aspectRatio: activePreset.aspect,
        width: activePreset.width,
        height: activePreset.height,
        fps: activePreset.fps,
        bitrate: activePreset.bitrate,
        backgroundPath,
        backgroundOpacity: bgOpacity,
        audioUrls,
        ayahs,
        textSettings,
        audioSettings,
        watermark,
        showTranslation,
        showTafsir,
        totalDuration,
        savePathPref: preferredSavePath,
        signal: abortControllerRef.current.signal,
        onProgress: (evt) => {
          setProgress(evt.percent);
          setPhase(evt.phase);
          if (evt.currentFrame !== undefined) setCurrentFrameNumber(evt.currentFrame);
          if (evt.totalFrames !== undefined) setTotalFrameCount(evt.totalFrames);
          if (evt.fps !== undefined) setRealtimeFps(evt.fps);
          if (evt.currentAyah !== undefined) setCurrentAyahNumber(evt.currentAyah);
          if (evt.elapsedSeconds !== undefined) setElapsedSeconds(evt.elapsedSeconds);
          if (evt.estimatedSecondsRemaining !== undefined) {
            setEstimatedSecondsRemaining(evt.estimatedSecondsRemaining);
          }
        },
      });

      if (result.success) {
        if (result.blobUrl) {
          setDownloadBlobUrl(result.blobUrl);
        }
        if (result.outputPath) {
          setOutputPath(result.outputPath);
        }
        setStatus('done');
        setProgress(100);
        setPhase('اكتمل التصدير بنجاح وبأعلى جودة ✅');
      } else {
        throw new Error(result.error || 'فشلت عملية تصدير الفيديو');
      }
    } catch (err: unknown) {
      if (abortControllerRef.current?.signal.aborted) {
        setStatus('idle');
        setProgress(0);
        setPhase('');
        return;
      }
      console.error('[ExportModal] Export failed:', err);
      const errMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء تصدير الفيديو';
      setError(errMsg);
      setStatus('error');
    }
  };

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (window.electronAPI?.videoExport?.cancel) {
      try {
        window.electronAPI.videoExport.cancel();
      } catch (err) {
        console.debug('[ExportModal] Cancel error:', err);
      }
    }
    setStatus('idle');
    setProgress(0);
    setPhase('');
  };

  const handleUserCancelClick = () => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء عملية تصدير الفيديو الجارية؟')) {
        return;
      }
    }
    handleCancelExport();
  };

  const handleModalClose = () => {
    if (status === 'exporting') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (!window.confirm('عملية التصدير جارية حالياً. هل أنت متأكد من إلغاء التصدير وإغلاق النافذة؟')) {
          return;
        }
      }
      handleCancelExport();
    }
    onClose();
  };

  useHotkeys('Escape', handleModalClose, { enabled: isOpen && status !== 'exporting' });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        size="lg"
        title="🚀 تصدير الفيديو الذكي (Studio Export)"
        headerIcon={<Film size={18} />}
        closeOnBackdropClick={status !== 'exporting'}
        closeOnEscape={status !== 'exporting'}
        bodyClassName="space-y-5 text-start"
      >

        {/* Status === 'idle' (Platform Presets & 5.1 Live Preview) */}
        {status === 'idle' && (
          <div className="space-y-4">
            {/* Tab Switcher: Export Setup vs 5.1 🎥 Live Preview */}
            <div className="flex p-1 bg-surface-950 rounded-2xl border border-surface-700/40 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-gold-500 text-surface-950 font-extrabold shadow-sm'
                    : 'text-surface-400 hover:text-surface-50'
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
                    : 'text-surface-400 hover:text-surface-50'
                }`}
              >
                <Eye size={14} />
                <span>معاينة حية دقيقة قبل التصدير 🎥</span>
              </button>
            </div>

            {/* TAB 1: 5.3 📐 Platform Presets */}
            {activeTab === 'export' && (
              <div className="space-y-3">
                <label className="block text-surface-300 text-xs font-bold">
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
                        className={`p-3 rounded-2xl text-start border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gold-500/15 border-gold-400 text-surface-50 ring-1 ring-gold-400/40 shadow-lg shadow-gold-500/10'
                            : 'bg-surface-950/60 border-surface-700/30 text-surface-400 hover:text-surface-50 hover:bg-surface-950'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{preset.icon}</span>
                            <span className="text-[11px] font-mono text-gold-400 bg-surface-900 px-1.5 py-0.5 rounded border border-surface-700/30">
                              {preset.bitrateLabel}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-surface-50">{preset.name}</div>
                          <div className="text-[11px] text-surface-400">{preset.sub}</div>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-surface-700/30 text-[10px] text-surface-400 truncate">
                          {preset.width}×{preset.height} • {preset.fps}fps
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Platform Summary Badge */}
                <div className="p-3 rounded-2xl bg-surface-950/80 border border-surface-700/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{activePreset.icon}</span>
                    <div>
                      <div className="font-bold text-surface-50">
                        {activePreset.name} ({activePreset.width}×{activePreset.height})
                      </div>
                      <div className="text-[11px] text-surface-400">{activePreset.desc}</div>
                    </div>
                  </div>
                  <div className="text-end font-mono text-xs text-gold-300">
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
                  <div className="absolute top-2 end-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-gold-300 font-bold">
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
                  <span className="text-xs text-surface-400 font-mono">
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
              <h4 className="font-bold text-sm text-surface-50">{phase}</h4>
              <p className="text-xs text-surface-400 font-mono">
                {currentFrameNumber} / {totalFrameCount} إطار ({progress}%)
              </p>
            </div>

            {/* Glowing Multi-Segment Progress Bar */}
            <div className="relative w-full h-4 rounded-full bg-surface-950 border border-surface-700/40 overflow-hidden p-0.5 shadow-inner">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-gold-400 to-emerald-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'linear', duration: 0.1 }}
              />
            </div>

            {/* 5.2 📊 Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-surface-950/70 border border-surface-700/30">
                <div className="text-surface-400 text-[11px]">الآية الحالية</div>
                <div className="font-bold text-surface-50 mt-0.5">
                  {currentAyahNumber} من {ayahs.length}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/70 border border-surface-700/30">
                <div className="text-surface-400 text-[11px]">سرعة الإطارات</div>
                <div className="font-bold text-gold-300 font-mono mt-0.5">{realtimeFps} FPS</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/70 border border-surface-700/30">
                <div className="text-surface-400 text-[11px]">الوقت المنقضي</div>
                <div className="font-bold text-surface-50 font-mono mt-0.5">{elapsedSeconds}s</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/70 border border-surface-700/30">
                <div className="text-surface-400 text-[11px]">الوقت المتبقي (ETA)</div>
                <div className="font-bold text-emerald-300 font-mono mt-0.5">
                  ~{estimatedSecondsRemaining}s
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-surface-400 px-1">
              <span>الحجم التقريبي للملف: ~{estimatedSizeMb} MB</span>
              <button
                type="button"
                onClick={handleUserCancelClick}
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
              <h4 className="font-extrabold text-base text-surface-50">تم تصدير الفيديو بنجاح! 🎉</h4>
              <p className="text-xs text-emerald-400/90 mt-0.5">
                الفيديو جاهز بأعلى جودة وصوت نقي 100%
              </p>
            </div>

            {/* Native Path or Download Blob Actions */}
            {outputPath && (outputPath.includes('/') || outputPath.includes('\\')) && window.electronAPI?.shell && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-surface-950/80 border border-surface-700/40 text-xs font-mono text-gold-300/90 truncate">
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
                    className="py-3 px-4 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-50 font-bold text-xs flex items-center justify-center gap-1.5 border border-surface-700/40 active:scale-98 transition-all cursor-pointer"
                  >
                    <Play size={14} />
                    <span>تشغيل الفيديو 🎬</span>
                  </button>
                </div>
              </div>
            )}

            {downloadBlobUrl && (
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
                            new Uint8Array(arrayBuffer)
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
                    a.download = (outputPath && !outputPath.includes('/') && !outputPath.includes('\\'))
                      ? outputPath
                      : `${projectName.replace(/[/\\?%*:|"<>]/g, '-')}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-surface-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Download size={18} />
                  <span>حفظ باسم / تحميل ملف الفيديو 📥</span>
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
                className="py-2.5 px-3 rounded-xl bg-surface-950 border border-surface-700/40 hover:border-gold-500/30 text-surface-50 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
                className="py-2.5 px-3 rounded-xl bg-surface-950 border border-surface-700/40 hover:border-surface-700/60 text-surface-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
              <h4 className="font-bold text-sm text-surface-50">تعذر إكمال تصدير الفيديو</h4>
              <p className="text-xs text-rose-400 mt-1">
                {error || 'حدث خطأ غير متوقع أثناء معالجة الإطارات'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="px-6 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-50 font-bold text-xs cursor-pointer border border-surface-700/40"
            >
              إعادة المحاولة 🔄
            </button>
          </div>
        )}
      </Modal>

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
    </>
  );
};
