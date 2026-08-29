import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n';
import { AppLayout } from '../layout/AppLayout';
import { AzkarItem, Project } from '../../types';
import { createDefaultProject } from '../../utils/projectDefaults';
import { azkarCategories, initialAzkarList } from '../../data/azkarHadithData';
import {
  searchHadithsAndAzkar,
  playAzkarAudio,
  stopAzkarAudio,
} from '../../services/hadithAzkarApi';
import { ArabicAiVoiceModal } from '../ui/ArabicAiVoiceModal';
import {
  BookHeart,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  Video,
  Copy,
  Check,
  RotateCcw,
  Flame,
  Award,
  Image as ImageIcon,
} from 'lucide-react';

export const AzkarStudioPage: React.FC = () => {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addProject = useAppStore((s) => s.addProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const addToast = useAppStore((s) => s.addToast);
  const setActiveQuoteDraft = useAppStore((s) => s.setActiveQuoteDraft);
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AzkarItem[]>(initialAzkarList);
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedVoiceItem, setSelectedVoiceItem] = useState<AzkarItem | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup audio & timers when switching pages
  useEffect(() => {
    return () => {
      stopAzkarAudio();
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Filter items by category & search
  const filteredItems = useMemo(() => {
    return searchResults.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.arabicText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.benefit && item.benefit.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [searchResults, selectedCategory, searchQuery]);

  // Handle live search
  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults(initialAzkarList);
      return;
    }
    const results = await searchHadithsAndAzkar(val);
    setSearchResults(results);
  };

  // Counter click
  const handleIncrement = (id: string, max: number) => {
    const current = counters[id] || 0;
    const next = current + 1;
    if (next <= max) {
      setCounters((prev) => ({ ...prev, [id]: next }));
      if (next === max) {
        addToast({ message: 'تقبل الله ذكرك وطاعتك! ✨', type: 'success' });
      }
    }
  };

  const handleResetCounter = (id: string) => {
    setCounters((prev) => ({ ...prev, [id]: 0 }));
  };

  // Listen to Arabic audio / speech
  const handleToggleSpeech = (item: AzkarItem) => {
    if (playingId === item.id) {
      stopAzkarAudio();
      setPlayingId(null);
    } else {
      stopAzkarAudio();
      setPlayingId(item.id);
      playAzkarAudio(
        item,
        () => setPlayingId(item.id),
        () => setPlayingId(null),
        () => {
          setPlayingId(null);
          addToast({ message: 'تعذر تشغيل الصوت. تحقق من اتصالك بالإنترنت', type: 'warning' });
        }
      );
    }
  };

  // Copy text & reference
  const handleCopy = (item: AzkarItem) => {
    const fullText = `${item.title}\n\n« ${item.arabicText} »\n\nالمصدر: ${item.reference}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(item.id);
    addToast({ message: 'تم نسخ الذكر والمصدر بنجاح ✓', type: 'success' });
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
  };

  // 1-Click Convert to Video Reel Project
  const handleConvertToReel = (item: AzkarItem) => {
    const project: Project = createDefaultProject({
      name: `${item.title} — ريل دعوي`,
      contentType: item.category === 'hadith' ? 'hadith' : 'azkar',
      customText: item.arabicText,
      customTitle: item.title,
      customReference: item.reference,
      customAudioUrl: item.audioUrl || undefined,
      reciter: 'الشيخ حامد (صوت وقور)',
      reciterId: 'hamed_neural',
      surah: item.title,
      surahNumber: 0,
      fromAyah: 1,
      toAyah: 1,
      aspectRatio: '9:16',
      backgroundType: 'image',
      backgroundUrl:
        'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
      backgroundOpacity: 0.65,
      watermark: 'atar-studio.com',
      textSettings: {
        fontSize: 27,
        fontWeight: 'bold',
        textAlign: 'center',
        textColor: '#ffffff',
        bgColor: '#000000',
        bgOpacity: 0.55,
        position: 'center',
        fontFamily: 'Amiri',
        wordHighlightEnabled: true,
        wordHighlightStyle: 'goldGlow',
        wordHighlightColor: '#fbbf24',
        inactiveWordOpacity: 0.55,
        highlightScale: true,
        showProgressBar: true,
        progressBarStyle: 'neonGlow',
        progressBarColor: '#fbbf24',
        progressBarHeight: 4,
        showIslamicOrnaments: true,
        ornamentStyle: 'royalFrame',
        ornamentColor: '#fbbf24',
        ornamentOpacity: 0.8,
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
    addToast({ message: `تم تجهيز ريل "${item.title}" في المحرر بنجاح ✨`, type: 'success' });
    setCurrentPage('editor');
  };

  // 1-Click Design Luxury Quote Card
  const handleDesignImageCard = (item: AzkarItem) => {
    setActiveQuoteDraft({
      title: item.title,
      text: item.arabicText,
      reference: item.reference,
    });
    addToast({ message: `تم فتح "${item.title}" في أستوديو كروت الصور 🎨`, type: 'success' });
    setCurrentPage('quotes');
  };

  return (
    <AppLayout
      title={t('azkarStudio.title', 'استوديو الأذكار والحديث النبوي 📖')}
      subtitle={t('azkarStudio.subtitle', 'صمّم ريلز وبطاقات دعوية تفاعلية للأذكار المأثورة والأدعية النبوية بضغطة زر')}
      topbarActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage('quotes')}
            className="btn-secondary-sm flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <ImageIcon size={14} className="text-accent-400" />
            {t('imageQuotes.title', 'استوديو كروت الصور')}
          </button>
          <button
            onClick={() => setCurrentPage('create')}
            className="btn-primary-sm flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Sparkles size={14} />
            {t('nav.createProject', 'إنشاء ريل مخصص')}
          </button>
        </div>
      }
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Search & Hero Header */}
        <div className="relative rounded-3xl bg-gradient-to-r from-surface-900 via-surface-800 to-surface-900 border border-surface-700/40 p-6 shadow-2xl overflow-hidden">
          <div className="absolute -top-12 -start-12 w-64 h-64 bg-accent-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-12 -end-12 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 rounded-lg bg-gold-400/15 text-gold-400 border border-gold-400/30">
                  <BookHeart size={18} />
                </span>
                <span className="text-xs font-bold text-gold-400">مكتبة إسلامية شاملة وموثوقة</span>
              </div>
              <h2 className="text-2xl font-bold text-surface-50 mb-1">
                حصن المسلم، أدعية الأنبياء، والأحاديث الصحيحة
              </h2>
              <p className="text-xs text-surface-400">
                اقرأ واستمع للذكر بصوت نقي، تتبع عدد التكرار، أو حول أي دعاء مباشرة إلى فيديو تيك
                توك وإنستغرام احترافي!
              </p>
            </div>

            {/* Live Search Input */}
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="ابحث عن دعاء، حديث، أو ذكر..."
                className="glass-input w-full ps-10 pe-4 py-2.5 text-xs rounded-xl"
              />
              <Search size={16} className="absolute start-3 top-3 text-surface-400" />
            </div>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {azkarCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/20 border border-accent-400/30'
                  : 'bg-surface-800/60 hover:bg-surface-800 text-surface-300 hover:text-surface-50 border border-surface-700/40'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-surface-400 px-1">
          <span>يتم عرض {filteredItems.length} ذكراً وحديثاً</span>
          <span className="flex items-center gap-1 text-gold-400/80">
            <Award size={14} />
            أذكار موثقة مع الصوت والتخريج الصحيح
          </span>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const currentCount = counters[item.id] || 0;
              const isCompleted = currentCount >= item.repeatCount;
              const isPlaying = playingId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    p-5 rounded-2xl bg-surface-900 border transition-all flex flex-col justify-between
                    ${
                      isCompleted
                        ? 'border-emerald-500/40 shadow-md shadow-emerald-500/5'
                        : 'border-surface-700/40 hover:border-surface-600'
                    }
                  `}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-surface-800/80 text-accent-400 border border-surface-700/40 font-semibold">
                          {item.categoryNameAr}
                        </span>
                        <h3 className="text-sm font-bold text-surface-50">{item.title}</h3>
                      </div>
                      <span className="text-[11px] font-mono text-surface-400 bg-surface-800/40 px-2 py-0.5 rounded-md border border-surface-700/40">
                        {item.reference}
                      </span>
                    </div>

                    {/* Arabic Text */}
                    <div className="p-4 rounded-xl bg-surface-950/60 border border-surface-700/30 mb-3 text-start">
                      <p className="quran-text text-lg leading-[2.2] text-surface-50 font-medium select-text">
                        {item.arabicText}
                      </p>
                    </div>

                    {/* Benefit / Virtues Note */}
                    {item.benefit && (
                      <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 mb-4 flex items-start gap-2">
                        <Sparkles size={14} className="text-gold-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-950 dark:text-gold-300 leading-relaxed font-medium">
                          {item.benefit}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-surface-700/40 flex items-center justify-between gap-2">
                    {/* Interactive Repeat Counter Button */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleIncrement(item.id, item.repeatCount)}
                        className={`
                          px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer
                          ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                              : 'bg-surface-800 hover:bg-accent-500/20 text-surface-50 border border-surface-700/40 hover:border-accent-500/40'
                          }
                        `}
                      >
                        {isCompleted ? (
                          <>
                            <Check size={14} />
                            <span>
                              اكتمل ({currentCount}/{item.repeatCount})
                            </span>
                          </>
                        ) : (
                          <>
                            <Flame size={14} className="text-accent-400" />
                            <span>
                              التكرار ({currentCount}/{item.repeatCount})
                            </span>
                          </>
                        )}
                      </button>

                      {currentCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleResetCounter(item.id)}
                          className="p-1.5 rounded-lg bg-surface-800/60 hover:bg-surface-800 text-surface-400 hover:text-surface-50 cursor-pointer"
                          title="إعادة التصفير"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>

                    {/* Action buttons (Clean Progressive Disclosure) */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                      {/* Audio speech button */}
                      <button
                        type="button"
                        onClick={() => handleToggleSpeech(item)}
                        className={`p-2 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                          isPlaying
                            ? 'bg-accent-500 text-white border-accent-400 animate-pulse'
                            : 'bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-surface-50 border-surface-700/40'
                        }`}
                        title="استماع صوتي سريع"
                      >
                        {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>

                      {/* 1-Click Design Image Quote Card */}
                      <button
                        type="button"
                        onClick={() => handleDesignImageCard(item)}
                        className="py-1.5 px-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-surface-50 text-xs font-semibold flex items-center gap-1 border border-surface-700/40 hover:border-accent-400/40 transition-all cursor-pointer"
                        title="تصميم كرت صورة فاخر للواتساب والإنستغرام"
                      >
                        <ImageIcon size={13} className="text-accent-400" />
                        <span>كرت صورة</span>
                      </button>

                      {/* Copy button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(item)}
                        className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-surface-50 border border-surface-700/40 transition-all cursor-pointer"
                        title="نسخ النص والمصدر"
                      >
                        {isCopied ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>

                      {/* 1-Click Convert to Reel Video */}
                      <button
                        type="button"
                        onClick={() => handleConvertToReel(item)}
                        className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-accent-500/20 transition-all group cursor-pointer"
                      >
                        <Video size={13} className="group-hover:scale-110 transition-transform" />
                        <span>تحويل لريل 🚀</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Arabic AI Voice Modal */}
      {selectedVoiceItem && (
        <ArabicAiVoiceModal
          isOpen={Boolean(selectedVoiceItem)}
          onClose={() => setSelectedVoiceItem(null)}
          item={selectedVoiceItem}
          onConfirmReel={(project) => {
            addProject(project);
            setCurrentProject(project);
            setCurrentPage('editor');
            addToast({ message: 'تم تجهيز الريلز بصوت الـ AI العربي بنجاح 🚀✨', type: 'success' });
          }}
        />
      )}
    </AppLayout>
  );
};
