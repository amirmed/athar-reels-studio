import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextSettings, AudioSettings } from '../../types';
import { AyahData, TranslationData } from '../../services/quranApi';
import { PreviewFrame } from '../ui/PreviewFrame';
import { PlatformPreviewOverlay, PlatformOverlayType } from '../ui/PlatformPreviewOverlay';
import { QuickTextFloatingBar } from './QuickTextFloatingBar';
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
  ChevronDown,
  Check,
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
  setShowTranslation?: (val: boolean | ((prev: boolean) => boolean)) => void;
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

const RATIO_OPTIONS = [
  {
    id: '9:16' as const,
    label: '9:16 عمودي',
    sublabel: 'ريلز، تيك توك، شورتس',
    resolution: '1080 × 1920',
    icon: Smartphone,
  },
  {
    id: '1:1' as const,
    label: '1:1 مربع',
    sublabel: 'منشور إنستغرام وفيسبوك',
    resolution: '1080 × 1080',
    icon: Square,
  },
  {
    id: '16:9' as const,
    label: '16:9 أفقي',
    sublabel: 'يوتيوب والشاشات العريضة',
    resolution: '1920 × 1080',
    icon: Monitor,
  },
] as const;

const PLATFORM_OPTIONS: Array<{
  id: PlatformOverlayType;
  label: string;
  sublabel: string;
  icon: string;
}> = [
  {
    id: 'none',
    label: 'شاشة نقية (بدون محاكاة)',
    sublabel: 'عرض الفيديو القرآني بدون أي واجهات تواصل',
    icon: '🚫',
  },
  {
    id: 'tiktok',
    label: 'تيك توك (TikTok)',
    sublabel: 'محاكاة أزرار التفاعل، اسم الحساب والصوت',
    icon: '🎵',
  },
  {
    id: 'reels',
    label: 'إنستغرام ريلز (Reels)',
    sublabel: 'محاكاة واجهة ريلز إنستغرام والأزرار الجانبية',
    icon: '📸',
  },
  {
    id: 'shorts',
    label: 'يوتيوب شورتس (Shorts)',
    sublabel: 'محاكاة أزرار يوتيوب شورتس وشريط العنوان',
    icon: '▶️',
  },
  {
    id: 'whatsapp',
    label: 'حالة واتساب (Status)',
    sublabel: 'محاكاة شريط الحالة العلوي والسفلي بالواتساب',
    icon: '💬',
  },
];

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
    setShowTranslation,
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
    const [isTextSelected, setIsTextSelected] = useState<boolean>(false);

    // Dropdowns state & click-outside refs
    const [isRatioOpen, setIsRatioOpen] = useState<boolean>(false);
    const [isPlatformOpen, setIsPlatformOpen] = useState<boolean>(false);
    const ratioMenuRef = useRef<HTMLDivElement>(null);
    const platformMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ratioMenuRef.current && !ratioMenuRef.current.contains(e.target as Node)) {
          setIsRatioOpen(false);
        }
        if (platformMenuRef.current && !platformMenuRef.current.contains(e.target as Node)) {
          setIsPlatformOpen(false);
        }
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsRatioOpen(false);
          setIsPlatformOpen(false);
          setIsTextSelected(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

    const activeRatioConfig =
      RATIO_OPTIONS.find((r) => r.id === aspectRatio) || RATIO_OPTIONS[0];
    const ActiveRatioIcon = activeRatioConfig.icon;

    const activePlatformConfig =
      PLATFORM_OPTIONS.find((p) => p.id === platformOverlay) || PLATFORM_OPTIONS[0];

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
      <main className="flex-1 flex flex-col items-center justify-between p-2 md:p-3 overflow-hidden bg-surface-950 relative">
        {/* Top Floating Controls Header (Split into Viewport Display Pill & Creative Studio Actions Pill) */}
        <div className="w-full max-w-5xl flex items-center justify-between gap-2 z-20 px-1 flex-wrap sm:flex-nowrap">
          {/* 1. Viewport & Canvas Controls (Aspect Ratio, Social Mockup, Zoom, Fullscreen) */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-900/95 backdrop-blur-md border border-surface-700/50 shadow-xl shrink-0">
            {/* Aspect Ratio Dropdown */}
            <div className="relative" ref={ratioMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsRatioOpen((v) => !v);
                  setIsPlatformOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isRatioOpen
                    ? 'bg-gold-500/20 border-gold-500/50 text-gold-400 shadow-md ring-1 ring-gold-500/30'
                    : 'bg-surface-800 hover:bg-surface-750 border-surface-700/60 text-surface-200 hover:text-white shadow-sm'
                }`}
                title="تغيير مقاس وأبعاد الفيديو (Aspect Ratio)"
                aria-expanded={isRatioOpen}
                aria-haspopup="listbox"
              >
                <ActiveRatioIcon size={14} className="text-gold-400" />
                <span className="font-mono font-black">{aspectRatio}</span>
                <span className="text-[11px] text-surface-400 font-normal hidden md:inline">
                  {activeRatioConfig.label.split(' ')[1]}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-surface-400 transition-transform duration-200 ${
                    isRatioOpen ? 'rotate-180 text-gold-400' : ''
                  }`}
                />
              </button>

              {isRatioOpen && (
                <div
                  className="absolute top-full mt-2 start-0 z-50 w-64 p-1.5 bg-surface-900/95 backdrop-blur-xl border border-surface-700/80 rounded-2xl shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150"
                  role="listbox"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-surface-400 uppercase tracking-wider flex items-center justify-between border-b border-surface-800/80 pb-1.5 mb-1">
                    <span>مقاس وأبعاد الفيديو</span>
                    <span className="text-[9px] font-mono text-surface-500">Aspect Ratio</span>
                  </div>
                  {RATIO_OPTIONS.map((r) => {
                    const Icon = r.icon;
                    const isSelected = aspectRatio === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setAspectRatio(r.id);
                          setIsRatioOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-start transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gold-500/15 border border-gold-500/40 text-gold-200 font-bold'
                            : 'hover:bg-surface-800/80 text-surface-300 hover:text-white border border-transparent'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-gold-500/25 text-gold-400'
                                : 'bg-surface-800 text-surface-400'
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span className="font-mono text-white">{r.id}</span>
                              <span className="text-surface-300 font-normal">
                                {r.label.split(' ')[1]}
                              </span>
                            </div>
                            <div className="text-[10px] text-surface-400 leading-tight">
                              {r.sublabel}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-800 text-surface-400 border border-surface-700/50">
                            {r.resolution}
                          </span>
                          {isSelected && <Check size={13} className="text-gold-400 font-bold" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. CapCut-Style Platform Overlay & Safe Zones Dropdown (For 9:16) */}
            {aspectRatio === '9:16' && (
              <>
                <div className="w-px h-3.5 bg-surface-700/40" />
                <div className="relative" ref={platformMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlatformOpen((v) => !v);
                      setIsRatioOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      platformOverlay !== 'none'
                        ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 shadow-md ring-1 ring-sky-400/30'
                        : isPlatformOpen
                          ? 'bg-surface-800 border-surface-600 text-white'
                          : 'bg-surface-800 hover:bg-surface-750 border-surface-700/60 text-surface-300 hover:text-white shadow-sm'
                    }`}
                    title="معاينة واجهات المنصات ومناطق الأمان (Social Mockup & Safe Zones)"
                    aria-expanded={isPlatformOpen}
                    aria-haspopup="listbox"
                  >
                    <span className="text-sm leading-none">{activePlatformConfig.icon}</span>
                    <span className="font-medium hidden sm:inline">
                      {platformOverlay === 'none'
                        ? 'المنصة'
                        : activePlatformConfig.label.split(' ')[0]}
                    </span>
                    {showSafeZones && platformOverlay !== 'none' && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                        title="مناطق الأمان مفعّلة"
                      />
                    )}
                    <ChevronDown
                      size={12}
                      className={`text-surface-400 transition-transform duration-200 ${
                        isPlatformOpen ? 'rotate-180 text-sky-400' : ''
                      }`}
                    />
                  </button>

                  {isPlatformOpen && (
                    <div
                      className="absolute top-full mt-2 start-0 z-50 w-72 p-1.5 bg-surface-900/95 backdrop-blur-xl border border-surface-700/80 rounded-2xl shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150"
                      role="listbox"
                    >
                      <div className="px-2 py-1 text-[10px] font-bold text-surface-400 uppercase tracking-wider flex items-center justify-between border-b border-surface-800/80 pb-1.5 mb-1">
                        <span>محاكاة المنصات (Social Mockup)</span>
                        <span className="text-[9px] font-mono text-surface-500">9:16 Overlay</span>
                      </div>

                      {PLATFORM_OPTIONS.map((p) => {
                        const isSelected = platformOverlay === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setPlatformOverlay(p.id);
                              setIsPlatformOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-start transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-sky-500/15 border border-sky-400/30 text-sky-200 font-bold'
                                : 'hover:bg-surface-800/80 text-surface-300 hover:text-white border border-transparent'
                            }`}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{p.icon}</span>
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>{p.label}</span>
                                </div>
                                <div className="text-[10px] text-surface-400 leading-tight">
                                  {p.sublabel}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check size={13} className="text-sky-400 font-bold" />}
                          </button>
                        );
                      })}

                      {/* Integrated Safe Zones Toggle */}
                      <div className="pt-1.5 mt-1 border-t border-surface-800/80">
                        <button
                          type="button"
                          onClick={() => setShowSafeZones((s) => !s)}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-800/70 text-start transition-colors cursor-pointer"
                          title="تبديل إظهار خطوط حدود الأمان"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                showSafeZones
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-surface-800 text-surface-500'
                              }`}
                            >
                              {showSafeZones ? <Eye size={14} /> : <EyeOff size={14} />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1">
                                <span>خطوط منطقة الأمان</span>
                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">
                                  Safe Zones
                                </span>
                              </div>
                              <div className="text-[10px] text-surface-400">
                                تحديد الحواف لتجنب حجب الآيات بأزرار التطبيق
                              </div>
                            </div>
                          </div>

                          {/* Modern Switch Toggle */}
                          <div
                            className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                              showSafeZones ? 'bg-emerald-500 justify-end' : 'bg-surface-700 justify-start'
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="w-px h-3.5 bg-surface-700/40" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-surface-800 p-1 rounded-xl border border-surface-700/40 text-xs">
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.max(50, z - 15))}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-50 hover:bg-surface-700 transition-colors active:scale-95 cursor-pointer"
                title="تصغير شاشة المعاينة (-)"
                aria-label="تصغير شاشة المعاينة"
              >
                <ZoomOut size={13} />
              </button>

              <button
                type="button"
                onClick={() => setPreviewZoom(100)}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono text-gold-600 dark:text-gold-400 font-bold hover:bg-surface-700 transition-colors cursor-pointer"
                title="إعادة ضبط الحجم (100%)"
                aria-label="إعادة ضبط حجم شاشة المعاينة (100%)"
              >
                {previewZoom}%
              </button>

              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.min(180, z + 15))}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-50 hover:bg-surface-700 transition-colors active:scale-95 cursor-pointer"
                title="تكبير شاشة المعاينة (+)"
                aria-label="تكبير شاشة المعاينة"
              >
                <ZoomIn size={13} />
              </button>
            </div>

            {/* Fullscreen 4K Preview Trigger */}
            {onOpenFullscreen && (
              <>
                <div className="w-px h-3.5 bg-surface-700/40" />
                <button
                  type="button"
                  onClick={onOpenFullscreen}
                  className="p-1 rounded-lg text-surface-400 hover:text-surface-50 hover:bg-surface-800 transition-colors active:scale-95 cursor-pointer"
                  title="شاشة كاملة (Fullscreen)"
                  aria-label="عرض ملء الشاشة"
                >
                  <Maximize2 size={13} />
                </button>
              </>
            )}
          </div>

          {/* 2. Creative Studio Actions & Tools (Text Tools, Presets, Cover 4K, Caption, Performance) */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-900/95 backdrop-blur-md border border-surface-700/50 shadow-xl shrink-0">
            {/* Quick Text Floating Bar Toggle */}
            <button
              type="button"
              onClick={() => setIsTextSelected((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isTextSelected
                  ? 'bg-gold-500/20 border-gold-500/50 text-gold-300 shadow-sm ring-1 ring-gold-500/30'
                  : 'bg-surface-800 hover:bg-surface-750 border-surface-700/60 text-surface-300 hover:text-white'
              }`}
              title="شريط التعديل السريع للنص القرآني (أو انقر على الآية مباشرة)"
              aria-label="أدوات النص السريع"
            >
              <Sparkles size={12} className={isTextSelected ? 'text-gold-400 animate-pulse' : 'text-surface-400'} />
              <span className="hidden sm:inline">أدوات النص</span>
              <span className="sm:hidden">نص</span>
              <span className="text-[11px]">🪄</span>
            </button>

            {/* 1-Click Viral Preset Styles Trigger */}
            {onOpenPresetModal && (
              <>
                <div className="w-px h-3.5 bg-surface-700/40" />
                <button
                  type="button"
                  onClick={onOpenPresetModal}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 border border-gold-400/30 text-xs font-bold text-gold-700 dark:text-gold-300 transition-all active:scale-95 shadow-sm cursor-pointer"
                  title="تطبيق قوالب سينمائية جاهزة بنقرة واحدة"
                  aria-label="تطبيق قوالب سينمائية جاهزة"
                >
                  <Sparkles size={12} className="text-gold-500 dark:text-gold-400 animate-pulse" />
                  <span className="hidden md:inline">القوالب</span>
                  <span className="text-[11px]">🎬</span>
                </button>
              </>
            )}

            {/* 1-Click 4K Viral Thumbnail Cover Trigger */}
            {onOpenThumbnailModal && (
              <>
                <div className="w-px h-3.5 bg-surface-700/40" />
                <button
                  type="button"
                  onClick={onOpenThumbnailModal}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-xs font-bold text-sky-700 dark:text-sky-300 transition-all active:scale-95 shadow-sm cursor-pointer"
                  title="توليد وتصدير غلاف فيديو 4K احترافي بنقرة واحدة"
                  aria-label="توليد وتصدير غلاف فيديو 4K احترافي"
                >
                  <ImageIcon size={12} className="text-sky-500 dark:text-sky-400" />
                  <span className="hidden md:inline">الغلاف</span>
                  <span className="text-[10px] font-mono font-bold">4K</span>
                </button>
              </>
            )}

            {/* 1-Click Viral Caption / Hashtags Generator Trigger */}
            {onOpenViralCaption && (
              <>
                <div className="w-px h-3.5 bg-surface-700/40" />
                <button
                  type="button"
                  onClick={onOpenViralCaption}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-all active:scale-95 shadow-sm cursor-pointer"
                  title="توليد كابشن إسلامي وهاشتاجات للنشر بنقرة واحدة"
                  aria-label="توليد كابشن وهاشتاجات للنشر"
                >
                  <Share2 size={12} className="text-emerald-500 dark:text-emerald-400" />
                  <span className="hidden md:inline">الكابشن</span>
                  <span className="text-[11px]">✍️</span>
                </button>
              </>
            )}

            {/* Performance Mode Quick Switcher */}
            <div className="w-px h-3.5 bg-surface-700/40" />
            <button
              type="button"
              onClick={cyclePerformanceMode}
              className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                currentPerfMode === 'performance'
                  ? 'bg-amber-500/15 border-amber-400/30 text-amber-700 dark:text-amber-300'
                  : currentPerfMode === 'quality'
                    ? 'bg-purple-500/15 border-purple-400/30 text-purple-700 dark:text-purple-300'
                    : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-700 dark:text-emerald-300'
              }`}
              title="انقر للتبديل بين أوضاع الأداء والجودة (سريع / متوازن / جودة فائقة)"
              aria-label="التبديل بين أوضاع الأداء والجودة"
            >
              <Zap size={12} className={currentPerfMode === 'performance' ? 'animate-bounce' : ''} />
              <span className="hidden lg:inline">
                {currentPerfMode === 'performance'
                  ? '⚡ سريع'
                  : currentPerfMode === 'quality'
                    ? '✨ فائق'
                    : '⚖️ متوازن'}
              </span>
              <span className="lg:hidden text-xs">
                {currentPerfMode === 'performance'
                  ? '⚡'
                  : currentPerfMode === 'quality'
                    ? '✨'
                    : '⚖️'}
              </span>
            </button>
          </div>
        </div>

        {/* Central Live Video Canvas Container */}
        <div
          className={`flex-1 w-full flex items-center justify-center relative p-4 ${
            previewZoom > 100 ? 'overflow-auto custom-scrollbar' : 'overflow-hidden'
          }`}
          onClick={() => setIsTextSelected(false)}
        >
          {/* Quick Text Floating Action Bar (Smartly docked so it never clips under overflow-hidden on short screens) */}
          <AnimatePresence>
            {isTextSelected && (
              <div
                className={`absolute ${
                  textSettings.position === 'bottom'
                    ? 'top-3 md:top-4'
                    : 'bottom-3 md:bottom-4'
                } left-1/2 -translate-x-1/2 z-40 max-w-[calc(100%-1rem)] pointer-events-auto`}
                onClick={(e) => e.stopPropagation()}
              >
                <QuickTextFloatingBar
                  textSettings={textSettings}
                  setTextSettings={setTextSettings}
                  showTranslation={showTranslation}
                  setShowTranslation={setShowTranslation}
                  onClose={() => setIsTextSelected(false)}
                />
              </div>
            )}
          </AnimatePresence>

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
                isTextSelected={isTextSelected}
                onSelectText={() => setIsTextSelected(true)}
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
          <div className="relative h-1.5 rounded-full bg-surface-800 overflow-hidden cursor-pointer">
            <motion.div
              className="absolute top-0 bottom-0 start-0 bg-gradient-to-r from-accent-500 to-gold-400 rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Left: Time & Progress */}
            <div className="flex items-center gap-2 text-xs font-mono text-surface-400">
              <span className="text-surface-50 font-bold">{formatAudioTime(audioCurrentTime)}</span>
              <span>/</span>
              <span>{formatAudioTime(audioDuration)}</span>
            </div>

            {/* Center: Main Play Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => seekToAyah(Math.max(0, currentAyahIndex - 1))}
                disabled={currentAyahIndex <= 0}
                className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-surface-50 disabled:opacity-30 transition-all cursor-pointer border border-surface-700/40"
                title="الآية السابقة"
                aria-label="الآية السابقة"
              >
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-gradient-to-tr from-accent-500 to-gold-400 hover:from-accent-400 hover:to-gold-300 text-onbrand flex items-center justify-center shadow-lg shadow-accent-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل المعاينة'}
                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل المعاينة'}
              >
                {isPlaying ? (
                  <Pause size={18} className="fill-onbrand" />
                ) : (
                  <Play size={18} className="fill-onbrand -scale-x-100 ms-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => seekToAyah(Math.min(ayahs.length - 1, currentAyahIndex + 1))}
                disabled={currentAyahIndex >= ayahs.length - 1}
                className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-surface-50 disabled:opacity-30 transition-all cursor-pointer border border-surface-700/40"
                title="الآية التالية"
                aria-label="الآية التالية"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Right: Ambient Sound Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800 border border-surface-700/40 text-xs text-surface-300 font-bold">
                <Volume2 size={13} className="text-accent-500 dark:text-accent-400" />
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
