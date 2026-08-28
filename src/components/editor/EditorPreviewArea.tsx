import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TextSettings, AudioSettings } from '../../types';
import { AyahData, TranslationData } from '../../services/quranApi';
import { PreviewFrame } from '../ui/PreviewFrame';
import { PlatformPreviewOverlay, PlatformOverlayType } from '../ui/PlatformPreviewOverlay';
import { EditorTimeline } from './EditorTimeline';
import { ambientSounds } from '../../data/ambientSounds';
import { useAppStore } from '../../store/useAppStore';
import {
  Smartphone,
  Square,
  Monitor,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Image as ImageIcon,
  Share2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';

interface EditorPreviewAreaProps {
  aspectRatio: '9:16' | '1:1' | '16:9';
  setAspectRatio: (ratio: '9:16' | '1:1' | '16:9') => void;
  ayahs: AyahData[];
  translations?: TranslationData[];
  currentAyahIndex: number;
  audioCurrentTime: number;
  audioDuration: number;
  isPlaying: boolean;
  textSettings: TextSettings;
  setTextSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
  audioSettings: AudioSettings;
  showTranslation?: boolean;
  showTafsir?: boolean;
  backgroundFile?: string;
  backgroundOpacity?: number;
  watermark?: string;
  surahName?: string;
  fromAyah?: number;
  toAyah?: number;
  transition?: string;
  videoEffect?: string;
  togglePlay: () => void;
  seekToAyah: (idx: number) => void;
  onOpenPresetModal?: () => void;
  onOpenThumbnailModal?: () => void;
  onOpenViralCaption?: () => void;
  onOpenFullscreen?: () => void;
  onOpenWaveformTimingEditor?: () => void;
}

function formatAudioTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const EditorPreviewArea: React.FC<EditorPreviewAreaProps> = React.memo(
  ({
    aspectRatio,
    setAspectRatio,
    ayahs,
    translations = [],
    currentAyahIndex,
    audioCurrentTime,
    audioDuration,
    isPlaying,
    textSettings,
    setTextSettings,
    showTranslation = false,
    showTafsir = false,
    backgroundFile,
    backgroundOpacity,
    watermark,
    surahName,
    fromAyah,
    toAyah,
    transition = 'fade',
    videoEffect = 'none',
    audioSettings,
    togglePlay,
    seekToAyah,
    onOpenPresetModal,
    onOpenThumbnailModal,
    onOpenViralCaption,
    onOpenFullscreen,
    onOpenWaveformTimingEditor,
  }) => {
    // Read project & global settings directly from store
    const currentProject = useAppStore((s) => s.currentProject);
    const settings = useAppStore((s) => s.settings);
    const updateSettings = useAppStore((s) => s.updateSettings);
    const addToast = useAppStore((s) => s.addToast);

    // Internal UI state
    const [previewZoom, setPreviewZoom] = useState<number>(100);
    const [platformOverlay, setPlatformOverlay] = useState<PlatformOverlayType>('none');
    const [showSafeZones, setShowSafeZones] = useState<boolean>(true);

    const currentPerfMode = settings.performanceMode || 'balanced';

    // Derived metadata
    const effectiveSurahName =
      surahName || currentProject?.customTitle || currentProject?.surah || 'سورة الفاتحة';
    const effectiveFromAyah = fromAyah ?? currentProject?.fromAyah ?? 1;
    const effectiveToAyah = toAyah ?? currentProject?.toAyah ?? 7;
    const effectiveWatermark = watermark ?? currentProject?.watermark ?? 'أَثَـر ستوديو';
    const effectiveBgOpacity = backgroundOpacity ?? currentProject?.backgroundOpacity ?? 0.65;
    const overallProgress =
      audioDuration > 0 ? Math.min(100, Math.max(0, (audioCurrentTime / audioDuration) * 100)) : 0;

    const cyclePerformanceMode = () => {
      const modes: Array<'performance' | 'balanced' | 'quality'> = [
        'performance',
        'balanced',
        'quality',
      ];
      const nextIdx = (modes.indexOf(currentPerfMode) + 1) % modes.length;
      const nextMode = modes[nextIdx];
      updateSettings({ performanceMode: nextMode });
      const labels = {
        performance: '⚡ وضع الأداء السريع (توفير الموارد وخفض الرسوم)',
        balanced: '⚖️ وضع متوازن (أداء وجودة معتدلة)',
        quality: '✨ وضع الجودة الفائقة (أعلى دقة ومؤثرات كاملة)',
      };
      addToast({ message: labels[nextMode], type: 'info' });
    };

    return (
      <main className="flex-1 flex flex-col items-center justify-between p-2 md:p-3 overflow-hidden bg-surface-950/60 relative">
        {/* Top Floating Control Bar */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-900/90 border border-white/10 backdrop-blur-md z-20 shadow-lg flex-wrap justify-center">
          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-1 bg-surface-950/80 p-1 rounded-xl border border-white/5">
            {[
              { id: '9:16' as const, label: '9:16 ريلز', icon: Smartphone },
              { id: '1:1' as const, label: '1:1 بوست', icon: Square },
              { id: '16:9' as const, label: '16:9 يوتيوب', icon: Monitor },
            ].map((r) => {
              const Icon = r.icon;
              const isSelected = aspectRatio === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setAspectRatio(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-surface-950 shadow-md'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={13} />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          <div className="w-px h-3.5 bg-white/[0.08]" />

          {/* Platform Mockup Overlay Selector (Only for 9:16) */}
          {aspectRatio === '9:16' && (
            <>
              <div className="flex items-center gap-1 bg-surface-950/80 p-1 rounded-xl border border-white/5">
                {[
                  { id: 'none', label: 'بدون', icon: '🚫' },
                  { id: 'tiktok', label: 'تيك توك', icon: '🎵' },
                  { id: 'reels', label: 'ريلز', icon: '📸' },
                  { id: 'shorts', label: 'شورتس', icon: '▶️' },
                  { id: 'whatsapp', label: 'واتساب', icon: '💬' },
                ].map((p) => {
                  const isSelected = platformOverlay === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatformOverlay(p.id as PlatformOverlayType)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40 shadow-sm'
                          : 'text-white/40 hover:text-white'
                      }`}
                      title={`معاينة بحجم وواجهة ${p.label}`}
                    >
                      <span>{p.icon}</span>
                      <span className="hidden sm:inline">{p.label}</span>
                    </button>
                  );
                })}

                {/* Safe Zones Toggle */}
                {platformOverlay !== 'none' && (
                  <button
                    type="button"
                    onClick={() => setShowSafeZones(!showSafeZones)}
                    className={`px-1.5 py-0.5 rounded text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                      showSafeZones
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-white/30 hover:text-white/60'
                    }`}
                    title={
                      showSafeZones
                        ? 'إخفاء خطوط منطقة الأمان'
                        : 'إظهار خطوط منطقة الأمان (Safe Zones)'
                    }
                  >
                    {showSafeZones ? <Eye size={11} /> : <EyeOff size={11} />}
                    <span className="hidden md:inline">منطقة الأمان</span>
                  </button>
                )}
              </div>

              <div className="w-px h-3.5 bg-white/[0.08]" />
            </>
          )}

          {/* Performance Mode Quick Switcher */}
          <button
            type="button"
            onClick={cyclePerformanceMode}
            className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              currentPerfMode === 'performance'
                ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                : currentPerfMode === 'quality'
                  ? 'bg-purple-500/15 border-purple-400/30 text-purple-300'
                  : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
            }`}
            title="انقر للتبديل بين أوضاع الأداء والجودة (سريع / متوازن / جودة فائقة)"
            aria-label="التبديل بين أوضاع الأداء والجودة"
          >
            <Zap size={12} className={currentPerfMode === 'performance' ? 'animate-bounce' : ''} />
            <span>
              {currentPerfMode === 'performance'
                ? '⚡ سريع'
                : currentPerfMode === 'quality'
                  ? '✨ فائق'
                  : '⚖️ متوازن'}
            </span>
          </button>

          <div className="w-px h-3.5 bg-white/[0.08]" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-surface-950/80 p-1 rounded-xl border border-white/5 text-xs">
            <button
              type="button"
              onClick={() => setPreviewZoom((z) => Math.max(50, z - 15))}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-surface-800 transition-colors active:scale-95 cursor-pointer"
              title="تصغير شاشة المعاينة (-)"
              aria-label="تصغير شاشة المعاينة"
            >
              <ZoomOut size={13} />
            </button>

            <button
              type="button"
              onClick={() => setPreviewZoom(100)}
              className="px-1.5 py-0.5 rounded text-[11px] font-mono text-gold-400 hover:bg-surface-800 transition-colors cursor-pointer"
              title="إعادة ضبط الحجم (100%)"
              aria-label="إعادة ضبط حجم شاشة المعاينة (100%)"
            >
              {previewZoom}%
            </button>

            <button
              type="button"
              onClick={() => setPreviewZoom((z) => Math.min(180, z + 15))}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-surface-800 transition-colors active:scale-95 cursor-pointer"
              title="تكبير شاشة المعاينة (+)"
              aria-label="تكبير شاشة المعاينة"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* 1-Click Viral Preset Styles Trigger */}
          {onOpenPresetModal && (
            <>
              <div className="w-px h-3.5 bg-white/[0.08]" />
              <button
                type="button"
                onClick={onOpenPresetModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 border border-gold-400/30 text-xs font-bold text-gold-300 hover:text-gold-200 transition-all active:scale-95 shadow-sm cursor-pointer"
                title="تطبيق قوالب سينمائية جاهزة بنقرة واحدة"
                aria-label="تطبيق قوالب سينمائية جاهزة"
              >
                <Sparkles size={12} className="text-gold-400 animate-pulse" />
                <span>القوالب 🎬</span>
              </button>
            </>
          )}

          {/* 1-Click 4K Viral Thumbnail Cover Trigger */}
          {onOpenThumbnailModal && (
            <>
              <div className="w-px h-3.5 bg-white/[0.08]" />
              <button
                type="button"
                onClick={onOpenThumbnailModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-xs font-bold text-sky-300 hover:text-sky-200 transition-all active:scale-95 shadow-sm cursor-pointer"
                title="توليد وتصدير غلاف فيديو 4K احترافي بنقرة واحدة"
                aria-label="توليد وتصدير غلاف فيديو 4K احترافي"
              >
                <ImageIcon size={12} className="text-sky-400" />
                <span>الغلاف 4K</span>
              </button>
            </>
          )}

          {/* 1-Click Viral Caption / Hashtags Generator Trigger */}
          {onOpenViralCaption && (
            <>
              <div className="w-px h-3.5 bg-white/[0.08]" />
              <button
                type="button"
                onClick={onOpenViralCaption}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-all active:scale-95 shadow-sm cursor-pointer"
                title="توليد كابشن متصدر وهاشتاجات فيروسية للنشر على تيك توك وإنستغرام"
                aria-label="توليد كابشن متصدر وهاشتاجات فيروسية"
              >
                <Share2 size={12} className="text-emerald-400" />
                <span>الكابشن 🔥</span>
              </button>
            </>
          )}

          {/* Fullscreen Studio Preview Trigger */}
          {onOpenFullscreen && (
            <>
              <div className="w-px h-3.5 bg-white/[0.08]" />
              <button
                type="button"
                onClick={onOpenFullscreen}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95 cursor-pointer"
                title="معاينة بملء الشاشة (مسرح سينمائي)"
                aria-label="معاينة بملء الشاشة"
              >
                <Maximize2 size={13} />
              </button>
            </>
          )}
        </div>

        {/* Central Live Video Canvas Container */}
        <div className="flex-1 w-full flex items-center justify-center relative overflow-auto p-4 custom-scrollbar">
          <div
            style={{
              transform: `scale(${previewZoom / 100})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="flex items-center justify-center relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <PreviewFrame
                aspectRatio={aspectRatio}
                ayahText={
                  ayahs[currentAyahIndex]?.text ||
                  currentProject?.customText ||
                  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
                }
                translationText={translations[currentAyahIndex]?.text}
                textSettings={textSettings}
                showTranslation={showTranslation}
                showTafsir={showTafsir}
                backgroundUrl={backgroundFile}
                backgroundOpacity={effectiveBgOpacity}
                watermark={effectiveWatermark}
                surahName={effectiveSurahName}
                reciterName={
                  audioSettings.customReciterName ||
                  currentProject?.customReciterName ||
                  currentProject?.reciter ||
                  undefined
                }
                ayahRange={`${effectiveFromAyah} - ${effectiveToAyah}`}
                currentAyahIndex={currentAyahIndex}
                currentTime={audioCurrentTime}
                ayahs={ayahs}
                translations={translations}
                isPlaying={isPlaying}
                transition={transition}
                videoEffect={videoEffect}
                performanceMode={currentPerfMode}
                onWordClick={() => onOpenWaveformTimingEditor?.()}
                onWatermarkDragEnd={(x, y) =>
                  setTextSettings((s) => ({
                    ...s,
                    watermarkX: (s.watermarkX || 0) + x,
                    watermarkY: (s.watermarkY || 0) + y,
                  }))
                }
              />

              {/* Platform Real Safe Zone Mockup Overlay */}
              <PlatformPreviewOverlay
                platform={platformOverlay}
                showSafeZones={showSafeZones}
                aspectRatio={aspectRatio}
                surahName={effectiveSurahName}
                watermark={effectiveWatermark}
              />
            </div>
          </div>
        </div>

        {/* Interactive Ayah & Audio Timeline Bar */}
        <div className="w-full max-w-4xl z-20">
          <EditorTimeline
            ayahs={ayahs}
            currentAyahIndex={currentAyahIndex}
            audioCurrentTime={audioCurrentTime}
            audioDuration={audioDuration}
            isPlaying={isPlaying}
            audioSettings={audioSettings}
            onSeekToAyah={seekToAyah}
            formatAudioTime={formatAudioTime}
            onOpenWaveformEditor={onOpenWaveformTimingEditor}
          />
        </div>

        {/* Bottom Audio Timeline & Transport Bar */}
        <div className="w-full max-w-2xl floating-toolbar p-3 z-20 mt-2 space-y-2">
          {/* Overall Progress bar */}
          <div className="relative h-1.5 rounded-full bg-white/[0.08] overflow-hidden cursor-pointer">
            <motion.div
              className="absolute top-0 bottom-0 start-0 bg-gradient-to-r from-accent-500 to-gold-400 rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Left: Time & Progress */}
            <div className="flex items-center gap-2 text-xs font-mono text-white/50">
              <span className="text-white font-bold">{formatAudioTime(audioCurrentTime)}</span>
              <span>/</span>
              <span>{formatAudioTime(audioDuration)}</span>
            </div>

            {/* Center: Main Play Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => seekToAyah(Math.max(0, currentAyahIndex - 1))}
                disabled={currentAyahIndex <= 0}
                className="p-2 rounded-xl bg-surface-800/60 hover:bg-surface-700 text-white/60 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
                title="الآية السابقة"
                aria-label="الآية السابقة"
              >
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-gradient-to-tr from-accent-500 to-gold-400 hover:from-accent-400 hover:to-gold-300 text-black flex items-center justify-center shadow-lg shadow-accent-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل المعاينة'}
                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل المعاينة'}
              >
                {isPlaying ? (
                  <Pause size={18} className="fill-black" />
                ) : (
                  <Play size={18} className="fill-black -scale-x-100 ms-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => seekToAyah(Math.min(ayahs.length - 1, currentAyahIndex + 1))}
                disabled={currentAyahIndex >= ayahs.length - 1}
                className="p-2 rounded-xl bg-surface-800/60 hover:bg-surface-700 text-white/60 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
                title="الآية التالية"
                aria-label="الآية التالية"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Right: Ambient Sound Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/80 border border-white/[0.06] text-xs text-white/60">
                <Volume2 size={13} className="text-accent-400" />
                <span className="truncate max-w-[80px]">
                  {ambientSounds.find((s) => s.id === audioSettings.ambientSoundId)?.name ||
                    'طبيعي'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
);
