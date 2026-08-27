import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppLayout } from '../layout/AppLayout';
import { QuoteCardSettings, QuoteAspectRatio, OrnamentStyle } from '../../types';
import { createDefaultProject } from '../../utils/projectDefaults';
import {
  ASPECT_DIMENSIONS,
  renderQuoteToCanvas,
  downloadQuoteImage,
  copyQuoteImageToClipboard,
} from '../../services/imageExportService';
import { quotePresetTemplates } from '../../data/quoteTemplates';
import { CURATED_QUOTES, CuratedQuoteItem } from '../../data/curatedQuotesData';
import { AiBackgroundGenerator } from '../ui/AiBackgroundGenerator';
import { IslamicPexelsBrowser } from '../ui/IslamicPexelsBrowser';
import { MediaUploader } from '../ui/MediaUploader';
import {
  Download,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Type,
  Frame,
  Video,
  Square,
  Smartphone,
  Monitor,
  Wand2,
  Palette,
  Hash,
  BookOpen,
  Move,
  Film,
} from 'lucide-react';
import { AnimatedQuoteModal } from '../ui/AnimatedQuoteModal';

const CURATED_BACKGROUNDS = [
  {
    id: 'bg1',
    name: 'الروضة النبوية',
    url: 'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'bg2',
    name: 'الكعبة المشرفة',
    url: 'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'bg3',
    name: 'سماء ونجوم',
    url: 'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'bg4',
    name: 'غروب الصحراء',
    url: 'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'bg5',
    name: 'أمواج البحر',
    url: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'bg6',
    name: 'ضباب الطبيعة',
    url: 'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
];

const FONTS = [
  { id: 'Amiri', name: 'الخط الأميري (كلاسيكي فاخر)' },
  { id: 'Cairo', name: 'خط كايرو (عصري متوازن)' },
  { id: 'Tajawal', name: 'خط تجوال (أنيق وسلس)' },
  { id: 'Scheherazade New', name: 'خط شهرزاد (نسخي أصيل)' },
];

export const ImageQuotesStudioPage: React.FC = () => {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addProject = useAppStore((s) => s.addProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const addToast = useAppStore((s) => s.addToast);
  const activeQuoteDraft = useAppStore((s) => s.activeQuoteDraft);

  const [settings, setSettings] = useState<QuoteCardSettings>({
    title: activeQuoteDraft?.title || 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
    text:
      activeQuoteDraft?.text ||
      'قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ : « إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى ، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ » .',
    reference: activeQuoteDraft?.reference || 'متفق عليه (البخاري ومسلم)',
    aspectRatio: (activeQuoteDraft?.aspectRatio as QuoteAspectRatio) || '1:1',
    backgroundType: 'image',
    backgroundUrl: activeQuoteDraft?.backgroundUrl || CURATED_BACKGROUNDS[0].url,
    backgroundColor: '#0a0d14',
    backgroundBlur: 0,
    backgroundOpacity: 0.6,
    fontFamily: 'Amiri',
    fontSize: 36,
    textColor: '#ffffff',
    textGradient: true,
    textGradientColors: ['#ffffff', '#fef08a'],
    lineHeight: 1.95,
    textAlign: 'center',
    showOrnament: true,
    ornamentStyle: 'royalFrame',
    ornamentColor: '#fbbf24',
    ornamentOpacity: 0.85,
    showReferenceBadge: true,
    watermark: 'atar-studio.com',
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showAnimatedModal, setShowAnimatedModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'content' | 'style' | 'ornaments' | 'upload' | 'pexels' | 'ai'
  >('content');

  // Generate live preview when settings change
  const renderPreview = useCallback(async () => {
    setIsRendering(true);
    try {
      const canvas = await renderQuoteToCanvas(settings, true);
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92));
    } catch (e) {
      console.error('Preview render error:', e);
    } finally {
      setIsRendering(false);
    }
  }, [settings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      renderPreview();
    }, 120);
    return () => clearTimeout(timer);
  }, [renderPreview]);

  // Apply a preset template
  const applyPreset = (preset: (typeof quotePresetTemplates)[0]) => {
    setSettings((prev) => ({
      ...prev,
      ...preset.settings,
    }));
    addToast({ message: `تم تطبيق قالب "${preset.name}" بنجاح ✨`, type: 'success' });
  };

  const [quoteCategoryFilter, setQuoteCategoryFilter] = useState<
    'all' | 'quran_peace' | 'hadith' | 'dua' | 'dhikr'
  >('all');

  // Populate from Curated Quotes Library
  const handleSelectCuratedQuote = (item: CuratedQuoteItem) => {
    setSettings((prev) => ({
      ...prev,
      title: item.title,
      text: item.text,
      reference: item.reference,
      fontFamily: item.suggestedFont || prev.fontFamily,
      backgroundUrl: item.suggestedBgUrl || prev.backgroundUrl,
    }));
    addToast({ message: `تم اختيار «${item.title}» وتطبيق الخلفية المناسبة ✨`, type: 'success' });
  };

  // Download High-Res Image
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadQuoteImage(settings, `${settings.title || 'islamic_quote'}_${Date.now()}.png`);
      addToast({ message: 'تم تحميل الصورة بدقة عالية HD بنجاح! 📥', type: 'success' });
    } catch {
      addToast({ message: 'حدث خطأ أثناء تحميل الصورة', type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    try {
      const success = await copyQuoteImageToClipboard(settings);
      if (success) {
        setIsCopied(true);
        addToast({
          message: 'تم نسخ الصورة للحافظة بنجاح! يمكنك لصقها الآن في واتساب وتلغرام 📋✓',
          type: 'success',
        });
        setTimeout(() => setIsCopied(false), 2500);
      } else {
        addToast({ message: 'المتصفح لا يدعم نسخ الصور المباشر للحافظة', type: 'warning' });
      }
    } catch {
      addToast({ message: 'تعذر نسخ الصورة', type: 'error' });
    }
  };

  // Copy Caption and Hashtags
  const handleCopyCaption = () => {
    const caption = `${settings.title}\n\n« ${settings.text} »\n\nالمصدر: ${settings.reference}\n\n• • •\n#قرآن_كريم #حديث_شريف #أذكار #راحة_نفسية #إسلاميات #اكسبلور #دعاء`;
    navigator.clipboard.writeText(caption);
    addToast({ message: 'تم نسخ النص والكابشن والهاشتاغات بنجاح 🏷️✓', type: 'success' });
  };

  // Convert to Video Reel in Editor
  const handleConvertToReelProject = () => {
    const project = createDefaultProject({
      name: `${settings.title || 'تصميم إسلامي'} — ريلز`,
      contentType: 'custom',
      customText: settings.text,
      customTitle: settings.title,
      customReference: settings.reference,
      customAudioUrl: `/api/tts?text=${encodeURIComponent(settings.text)}`,
      reciter: 'الشيخ حامد (صوت وقور)',
      reciterId: 'hamed_neural',
      surah: settings.title || 'اقتباس دعوي',
      surahNumber: 0,
      fromAyah: 1,
      toAyah: 1,
      aspectRatio:
        settings.aspectRatio === '1:1' ? '1:1' : settings.aspectRatio === '16:9' ? '16:9' : '9:16',
      backgroundType: 'image',
      backgroundUrl: settings.backgroundUrl || CURATED_BACKGROUNDS[0].url,
      backgroundOpacity: settings.backgroundOpacity,
      watermark: settings.watermark,
      textSettings: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        textColor: settings.textColor,
        bgColor: '#000000',
        bgOpacity: 0.55,
        position: 'center',
        fontFamily: settings.fontFamily,
        wordHighlightEnabled: true,
        wordHighlightStyle: 'goldGlow',
        wordHighlightColor: settings.ornamentColor,
        inactiveWordOpacity: 0.55,
        highlightScale: true,
        showProgressBar: true,
        progressBarStyle: 'neonGlow',
        progressBarColor: settings.ornamentColor,
        progressBarHeight: 4,
        showIslamicOrnaments: settings.showOrnament,
        ornamentStyle: settings.ornamentStyle,
        ornamentColor: settings.ornamentColor,
        ornamentOpacity: settings.ornamentOpacity,
        translationFontSize: 14,
        translationColor: '#e2e8f0',
      },
      audioSettings: {
        recitationVolume: 85,
        fadeIn: true,
        fadeOut: true,
        fadeDuration: 2,
        backgroundVolume: 22,
      },
    });

    addProject(project);
    setCurrentProject(project);
    addToast({ message: 'تم تحويل الكرت إلى مشروع فيديو في المحرر! ✨', type: 'success' });
    setCurrentPage('editor');
  };

  return (
    <AppLayout
      title="أستوديو كروت وبوستات الصور الدعوية"
      topbarActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnimatedModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-surface-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-gold-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Film size={14} />
            <span>ستوري متحرك 🎬✨</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn-primary-sm flex items-center gap-1.5 text-xs"
          >
            <Download size={14} />
            {isDownloading ? 'جاري التصدير...' : 'تحميل صورة HD'}
          </button>
        </div>
      }
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Preset Templates Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-white/50 shrink-0 ml-2">القوالب الجاهزة:</span>
          {quotePresetTemplates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyPreset(tpl)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-xs font-bold text-white/80 hover:text-white border border-white/[0.06] hover:border-accent-400/40 transition-all shrink-0 group shadow-sm"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: tpl.previewColor }}
              />
              <span>{tpl.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Canvas Preview & Action Bar (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Aspect Ratio Switcher */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-surface-900/80 border border-white/[0.06]">
              <div className="flex items-center gap-1">
                {(['1:1', '9:16', '4:5', '16:9'] as QuoteAspectRatio[]).map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setSettings((s) => ({ ...s, aspectRatio: ar }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      settings.aspectRatio === ar
                        ? 'bg-accent-500 text-white shadow-md shadow-accent-500/20'
                        : 'text-white/50 hover:text-white hover:bg-surface-800'
                    }`}
                  >
                    {ar === '1:1' && <Square size={13} />}
                    {ar === '9:16' && <Smartphone size={13} />}
                    {ar === '4:5' && <Smartphone size={13} className="rotate-90" />}
                    {ar === '16:9' && <Monitor size={13} />}
                    <span>{ASPECT_DIMENSIONS[ar].label}</span>
                  </button>
                ))}
              </div>
              <span className="text-xs text-white/40 px-2 font-mono">
                {ASPECT_DIMENSIONS[settings.aspectRatio].width} ×{' '}
                {ASPECT_DIMENSIONS[settings.aspectRatio].height}
              </span>
            </div>

            {/* Canvas Preview Container */}
            <div className="relative rounded-3xl bg-surface-950/80 border border-white/[0.08] p-4 flex items-center justify-center min-h-[500px] overflow-hidden shadow-2xl">
              {previewUrl ? (
                <div
                  className="relative max-h-[560px] max-w-full rounded-2xl overflow-hidden shadow-2xl border border-white/[0.1] transition-all"
                  style={{
                    aspectRatio:
                      settings.aspectRatio === '1:1'
                        ? '1/1'
                        : settings.aspectRatio === '9:16'
                          ? '9/16'
                          : settings.aspectRatio === '4:5'
                            ? '4/5'
                            : '16/9',
                  }}
                >
                  <img
                    src={previewUrl}
                    alt="Quote Preview"
                    className="w-full h-full object-contain select-none pointer-events-none"
                  />

                  {/* Freehand Draggable Watermark Layer on Card */}
                  {settings.watermark && settings.showWatermark !== false && (
                    <div
                      className={`absolute inset-0 flex pointer-events-none p-6 ${
                        settings.watermarkPosition === 'topLeft'
                          ? 'items-start justify-start'
                          : settings.watermarkPosition === 'top'
                            ? 'items-start justify-center'
                            : settings.watermarkPosition === 'topRight'
                              ? 'items-start justify-end'
                              : settings.watermarkPosition === 'bottomLeft'
                                ? 'items-end justify-start'
                                : settings.watermarkPosition === 'bottomRight'
                                  ? 'items-end justify-end'
                                  : settings.watermarkPosition === 'center'
                                    ? 'items-center justify-center'
                                    : 'items-end justify-center'
                      }`}
                    >
                      <motion.div
                        drag
                        dragMomentum={false}
                        dragConstraints={{ left: -140, right: 140, top: -180, bottom: 180 }}
                        whileHover={{ scale: 1.08 }}
                        whileDrag={{ scale: 1.15, zIndex: 50 }}
                        onDragEnd={(_e, info) => {
                          setSettings((s) => ({
                            ...s,
                            watermarkX: (s.watermarkX || 0) + info.offset.x,
                            watermarkY: (s.watermarkY || 0) + info.offset.y,
                          }));
                        }}
                        className="group/wm relative pointer-events-auto cursor-grab active:cursor-grabbing select-none"
                      >
                        {/* Drag Handle Indicator */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/wm:opacity-100 transition-opacity bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] text-accent-300 border border-accent-500/30 flex items-center gap-1 shadow-lg pointer-events-none whitespace-nowrap z-40">
                          <Move size={8} className="text-accent-400" />
                          <span>اسحب باليد ✋</span>
                        </div>

                        <span
                          className="font-sans font-semibold tracking-wider px-2.5 py-1 rounded-md transition-all group-hover/wm:bg-black/50 group-hover/wm:border group-hover/wm:border-accent-400/50"
                          style={{
                            fontSize: `${settings.watermarkFontSize || 12}px`,
                            color: settings.watermarkColor || settings.textColor || '#ffffff',
                            opacity: settings.watermarkOpacity ?? 0.6,
                            textShadow: '0 1px 4px rgba(0,0,0,0.85)',
                          }}
                        >
                          {settings.watermark}
                        </span>
                      </motion.div>
                    </div>
                  )}

                  {isRendering && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <Sparkles size={24} className="text-accent-400 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 text-white/40">
                  <Sparkles size={32} className="mx-auto mb-2 animate-pulse text-accent-400" />
                  <p className="text-xs">جاري تجهيز المعاينة...</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="space-y-2.5">
              {/* Primary Motion Video Action */}
              <button
                onClick={() => setShowAnimatedModal(true)}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-gold-400 via-amber-500 to-amber-600 hover:from-gold-300 hover:to-amber-500 text-surface-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-gold-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
              >
                <Film size={18} className="group-hover:rotate-6 transition-transform" />
                <span>تصدير فيديو ستوري متحرك مع أصوات الطبيعة 🎬✨ (Story MP4)</span>
              </button>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent-500/20 transition-all group cursor-pointer"
                >
                  <Download
                    size={15}
                    className="group-hover:-translate-y-0.5 transition-transform"
                  />
                  <span>{isDownloading ? 'جاري التحميل...' : 'تحميل صورة HD'}</span>
                </button>

                <button
                  onClick={handleCopyImage}
                  className="py-3 px-4 rounded-2xl bg-surface-800 hover:bg-surface-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer"
                >
                  {isCopied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  <span>{isCopied ? 'تم النسخ ✓' : 'نسخ الصورة'}</span>
                </button>

                <button
                  onClick={handleCopyCaption}
                  className="py-3 px-4 rounded-2xl bg-surface-800 hover:bg-surface-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer"
                >
                  <Hash size={15} className="text-gold-400" />
                  <span>نسخ الهاشتاغات</span>
                </button>

                <button
                  onClick={handleConvertToReelProject}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-gold-500/20 to-gold-600/20 hover:from-gold-500/30 hover:to-gold-600/30 text-gold-300 text-xs font-bold flex items-center justify-center gap-2 border border-gold-500/30 transition-all cursor-pointer"
                >
                  <Video size={15} className="text-gold-400" />
                  <span>تحويل لريل فيديو</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Controls Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Navigation Tabs */}
            <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-surface-900/80 border border-white/[0.06] overflow-x-auto scrollbar-none">
              {[
                { id: 'content', label: 'المحتوى', icon: <Type size={13} /> },
                { id: 'style', label: 'الخط والتنسيق', icon: <Palette size={13} /> },
                { id: 'ornaments', label: 'الزخارف', icon: <Frame size={13} /> },
                { id: 'upload', label: 'رفع من جهازي', icon: <Upload size={13} /> },
                { id: 'pexels', label: 'خلفيات Pexels الإسلامية', icon: <ImageIcon size={13} /> },
                { id: 'ai', label: 'توليد بالذكاء AI', icon: <Wand2 size={13} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'style' | 'content' | 'upload' | 'ornaments' | 'pexels' | 'ai')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-accent-500 text-white shadow-md shadow-accent-500/20'
                      : 'text-white/50 hover:text-white hover:bg-surface-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="glass-panel p-5 space-y-4 animate-in">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">
                    عنوان الكرت أو المناسبة
                  </label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))}
                    placeholder="مثال: حديث شريف، دعاء الفرج، حكمة اليوم..."
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">
                    النص القرآني أو الحديث الشريف
                  </label>
                  <textarea
                    rows={5}
                    value={settings.text}
                    onChange={(e) => setSettings((s) => ({ ...s, text: e.target.value }))}
                    placeholder="اكتب أو الصق نص الحديث أو الآية هنا..."
                    className="glass-input w-full p-3 text-xs leading-relaxed rounded-xl font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">
                    المصدر والتخريج
                  </label>
                  <input
                    type="text"
                    value={settings.reference}
                    onChange={(e) => setSettings((s) => ({ ...s, reference: e.target.value }))}
                    placeholder="مثال: صحيح البخاري، سورة الكهف: 10..."
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>

                {/* Curated Quotes & Quran Library */}
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gold-400 flex items-center gap-1.5">
                      <BookOpen size={13} />
                      <span>مكتبة الاقتباسات والآيات الجاهزة 📖</span>
                    </label>
                    <span className="text-[11px] text-white/40">1-Click Apply</span>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { id: 'all', label: 'الكل' },
                      { id: 'quran_peace', label: '🌿 آيات السكينة' },
                      { id: 'hadith', label: '📜 أحاديث نبوية' },
                      { id: 'dua', label: '🤲 أدعية جامعة' },
                      { id: 'dhikr', label: '🌙 أذكار وتحصين' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setQuoteCategoryFilter(cat.id as 'hadith' | 'all' | 'quran_peace' | 'dua' | 'dhikr')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          quoteCategoryFilter === cat.id
                            ? 'bg-gold-500/20 text-gold-300 border border-gold-400/40'
                            : 'bg-surface-800/80 text-white/50 hover:text-white border border-white/[0.04]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* List of Quotes */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {CURATED_QUOTES.filter(
                      (q) => quoteCategoryFilter === 'all' || q.category === quoteCategoryFilter
                    ).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectCuratedQuote(item)}
                        className="p-2.5 rounded-xl bg-surface-800/60 hover:bg-surface-800 border border-white/[0.04] hover:border-gold-500/40 cursor-pointer transition-all flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <span className="text-xs text-white/90 font-bold block truncate group-hover:text-gold-300 transition-colors">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-white/40 block truncate">
                              {item.reference}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-gold-400 shrink-0 border border-white/[0.04]">
                          {item.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Typography & Style Tab */}
            {activeTab === 'style' && (
              <div className="glass-panel p-5 space-y-4 animate-in">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">
                    نوع الخط العربي
                  </label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => setSettings((s) => ({ ...s, fontFamily: e.target.value }))}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl bg-surface-900 text-white"
                  >
                    {FONTS.map((f) => (
                      <option key={f.id} value={f.id} className="bg-surface-900 text-white">
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-1.5">
                    <span>حجم الخط</span>
                    <span className="font-mono text-accent-400">{settings.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={24}
                    max={64}
                    value={settings.fontSize}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, fontSize: Number(e.target.value) }))
                    }
                    className="w-full accent-accent-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-1.5">
                    <span>تباعد الأسطر</span>
                    <span className="font-mono text-accent-400">{settings.lineHeight}x</span>
                  </div>
                  <input
                    type="range"
                    min={1.4}
                    max={2.8}
                    step={0.05}
                    value={settings.lineHeight}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, lineHeight: Number(e.target.value) }))
                    }
                    className="w-full accent-accent-500"
                  />
                </div>

                {/* Text Gradient Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-800/60 border border-white/[0.04]">
                  <div>
                    <span className="text-xs font-bold text-white">تدرج لوني ذهبي للنص</span>
                    <p className="text-[11px] text-white/40">
                      يضفي بريقاً ولمعاناً ملكياً على الكلمات
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.textGradient}
                    onChange={(e) => setSettings((s) => ({ ...s, textGradient: e.target.checked }))}
                    className="toggle"
                  />
                </div>

                {/* Luxury Quote Marks Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-800/60 border border-white/[0.04]">
                  <div>
                    <span className="text-xs font-bold text-white">
                      علامات التنصيص الملكية « ... »
                    </span>
                    <p className="text-[11px] text-white/40">
                      إحاطة النص القرآني أو الحديث بقوسي تنصيص
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showQuoteMarks ?? true}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, showQuoteMarks: e.target.checked }))
                    }
                    className="toggle"
                  />
                </div>

                {/* Glassmorphism Frosted Card Toggle */}
                <div className="p-3 rounded-xl bg-surface-800/60 border border-white/[0.04] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>بطاقة زجاجية بلورية خلف النص 🧊</span>
                      </span>
                      <p className="text-[11px] text-white/40">
                        Glassmorphism يرفع وضوح النص فوق الصور المعقدة
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableGlassCard ?? false}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, enableGlassCard: e.target.checked }))
                      }
                      className="toggle"
                    />
                  </div>

                  {settings.enableGlassCard && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-1">
                        <span>عتامة البطاقة الزجاجية</span>
                        <span className="font-mono text-accent-400">
                          {Math.round((settings.glassOpacity ?? 0.45) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.15}
                        max={0.85}
                        step={0.05}
                        value={settings.glassOpacity ?? 0.45}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, glassOpacity: Number(e.target.value) }))
                        }
                        className="w-full accent-accent-500"
                      />
                    </div>
                  )}
                </div>

                {/* Watermark Studio Card */}
                <div className="p-4 rounded-2xl bg-surface-800/60 border border-white/[0.06] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={14} className="text-accent-400" />
                      <span>العلامة المائية والتوقيع (Watermark)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          showWatermark: s.showWatermark === false ? true : false,
                        }))
                      }
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                        settings.showWatermark !== false
                          ? 'bg-accent-500/20 border-accent-400 text-accent-300'
                          : 'bg-surface-900 border-white/10 text-white/40'
                      }`}
                    >
                      {settings.showWatermark !== false ? 'مفعلة ✓' : 'مخفية'}
                    </button>
                  </div>

                  {settings.showWatermark !== false && (
                    <>
                      <div>
                        <input
                          type="text"
                          value={settings.watermark}
                          onChange={(e) =>
                            setSettings((s) => ({ ...s, watermark: e.target.value }))
                          }
                          placeholder="مثال: @athar_studio أو اسم حسابك"
                          className="glass-input w-full px-3 py-2 text-xs rounded-xl font-medium"
                        />
                      </div>

                      {/* 6/7-Direction Position Grid */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-white/60">
                            موضع العلامة المائية (أو اسحبها باليد على الكرت ✋):
                          </label>
                          {(settings.watermarkX || settings.watermarkY) && (
                            <button
                              type="button"
                              onClick={() =>
                                setSettings((s) => ({
                                  ...s,
                                  watermarkX: 0,
                                  watermarkY: 0,
                                }))
                              }
                              className="text-[11px] text-accent-400 hover:text-accent-300 font-bold underline cursor-pointer"
                            >
                              إعادة للزاوية 🔄
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto p-1.5 rounded-xl bg-surface-900/80 border border-white/[0.06]">
                          {[
                            { id: 'topLeft', label: '↖️ أعلى اليسار' },
                            { id: 'top', label: '⬆️ أعلى الوسط' },
                            { id: 'topRight', label: '↗️ أعلى اليمين' },
                            { id: 'bottomLeft', label: '↙️ أسفل اليسار' },
                            { id: 'bottom', label: '⬇️ أسفل الوسط' },
                            { id: 'bottomRight', label: '↘️ أسفل اليمين' },
                            { id: 'center', label: '🎯 في المنتصف' },
                          ].map((pos) => (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() =>
                                setSettings((s) => ({
                                  ...s,
                                  watermarkPosition: pos.id as QuoteCardSettings['watermarkPosition'],
                                  watermarkX: 0,
                                  watermarkY: 0,
                                }))
                              }
                              className={`p-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                                (settings.watermarkPosition || 'bottom') === pos.id &&
                                !settings.watermarkX &&
                                !settings.watermarkY
                                  ? 'bg-accent-500 text-white font-black shadow-md shadow-accent-500/30'
                                  : 'bg-surface-800/80 text-white/60 hover:text-white hover:bg-surface-700'
                              } ${pos.id === 'center' ? 'col-span-3' : ''}`}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Opacity & Size Sliders */}
                      <div className="space-y-2 pt-1 border-t border-white/[0.04]">
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-1">
                            <span>شفافية العلامة المائية</span>
                            <span className="font-mono text-accent-400">
                              {Math.round((settings.watermarkOpacity ?? 0.6) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            value={Math.round((settings.watermarkOpacity ?? 0.6) * 100)}
                            onChange={(e) =>
                              setSettings((s) => ({
                                ...s,
                                watermarkOpacity: Number(e.target.value) / 100,
                              }))
                            }
                            className="w-full accent-accent-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-1">
                            <span>حجم خط العلامة المائية</span>
                            <span className="font-mono text-accent-400">
                              {settings.watermarkFontSize || 12}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min={8}
                            max={24}
                            value={settings.watermarkFontSize || 12}
                            onChange={(e) =>
                              setSettings((s) => ({
                                ...s,
                                watermarkFontSize: Number(e.target.value),
                              }))
                            }
                            className="w-full accent-accent-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Watermark Color Preset */}
                      <div className="pt-1 border-t border-white/[0.04]">
                        <label className="block text-xs font-bold text-white/60 mb-1.5">
                          لون العلامة المائية:
                        </label>
                        <div className="flex items-center gap-2">
                          {[
                            { color: '#ffffff', name: 'أبيض' },
                            { color: '#fbbf24', name: 'ذهبي' },
                            { color: '#34d399', name: 'زمردي' },
                            { color: '#38bdf8', name: 'سماوي' },
                            { color: '#e2e8f0', name: 'فضي' },
                          ].map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() =>
                                setSettings((s) => ({
                                  ...s,
                                  watermarkColor: c.color,
                                }))
                              }
                              className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                                (settings.watermarkColor || '#ffffff') === c.color
                                  ? 'border-accent-400 scale-110 shadow-md'
                                  : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Ornaments Tab */}
            {activeTab === 'ornaments' && (
              <div className="glass-panel p-5 space-y-4 animate-in">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-800/60 border border-white/[0.04]">
                  <div>
                    <span className="text-xs font-bold text-white">تفعيل الإطارات والزخارف</span>
                    <p className="text-[11px] text-white/40">إطارات إسلامية باروكية تحيط بالكرت</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showOrnament}
                    onChange={(e) => setSettings((s) => ({ ...s, showOrnament: e.target.checked }))}
                    className="toggle"
                  />
                </div>

                {settings.showOrnament && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-white/70 mb-2">
                        نمط الإطار الإسلامي
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'royalFrame', name: 'الملكي الفاخر 👑' },
                          { id: 'geometricArabesque', name: 'أرابيسك هندسي 🕌' },
                          { id: 'floralCorners', name: 'أركان زهرية 🌿' },
                          { id: 'domeCrescent', name: 'قبة وهلال 🌙' },
                        ].map((orn) => (
                          <button
                            key={orn.id}
                            onClick={() =>
                              setSettings((s) => ({ ...s, ornamentStyle: orn.id as OrnamentStyle }))
                            }
                            className={`p-3 rounded-xl text-xs font-bold text-right border transition-all ${
                              settings.ornamentStyle === orn.id
                                ? 'bg-accent-500/20 border-accent-400 text-white'
                                : 'bg-surface-800/60 border-white/[0.04] text-white/60 hover:text-white'
                            }`}
                          >
                            {orn.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-1.5">
                        <span>شفافية الإطار</span>
                        <span className="font-mono text-accent-400">
                          {Math.round(settings.ornamentOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.2}
                        max={1.0}
                        step={0.05}
                        value={settings.ornamentOpacity}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, ornamentOpacity: Number(e.target.value) }))
                        }
                        className="w-full accent-accent-500"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Pexels Islamic Backgrounds Tab */}
            {activeTab === 'pexels' && (
              <div className="glass-panel p-5 space-y-4 animate-in">
                <IslamicPexelsBrowser
                  selectedUrl={settings.backgroundUrl}
                  onSelectPhoto={(url) => {
                    setSettings((s) => ({ ...s, backgroundType: 'image', backgroundUrl: url }));
                    addToast({ message: 'تم تطبيق خلفية Pexels بنجاح ✨', type: 'success' });
                  }}
                />

                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-1.5">
                    <span>عتامة وتغميق الخلفية (لزيادة وضوح النص)</span>
                    <span className="font-mono text-accent-400">
                      {Math.round(settings.backgroundOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={settings.backgroundOpacity}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, backgroundOpacity: Number(e.target.value) }))
                    }
                    className="w-full accent-accent-500"
                  />
                </div>
              </div>
            )}

            {/* Upload Custom Background Tab */}
            {activeTab === 'upload' && (
              <div className="glass-panel p-5 space-y-4 animate-in">
                <MediaUploader
                  type="image"
                  currentFile={settings.backgroundUrl}
                  onUpload={(url) => {
                    setSettings((s) => ({ ...s, backgroundType: 'image', backgroundUrl: url }));
                    addToast({ message: 'تم تطبيق خلفيتك المخصصة بنجاح 🖼️✨', type: 'success' });
                  }}
                  onRemove={() => {
                    setSettings((s) => ({ ...s, backgroundUrl: CURATED_BACKGROUNDS[0].url }));
                    addToast({ message: 'تمت استعادة الخلفية الافتراضية 🔄', type: 'info' });
                  }}
                />

                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-1.5">
                    <span>عتامة وتغميق الخلفية</span>
                    <span className="font-mono text-accent-400">
                      {Math.round(settings.backgroundOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={settings.backgroundOpacity}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, backgroundOpacity: Number(e.target.value) }))
                    }
                    className="w-full accent-accent-500"
                  />
                </div>
              </div>
            )}

            {/* AI Generator Tab */}
            {activeTab === 'ai' && (
              <div className="glass-panel p-5 space-y-4 animate-in">
                <AiBackgroundGenerator
                  onSelectBackground={(url) => {
                    setSettings((s) => ({ ...s, backgroundType: 'image', backgroundUrl: url }));
                    addToast({ message: 'تم تطبيق الخلفية المولدة بنجاح ✨', type: 'success' });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animated Motion Story Quotes Modal */}
      <AnimatedQuoteModal
        isOpen={showAnimatedModal}
        onClose={() => setShowAnimatedModal(false)}
        settings={settings}
        addToast={addToast}
      />
    </AppLayout>
  );
};
