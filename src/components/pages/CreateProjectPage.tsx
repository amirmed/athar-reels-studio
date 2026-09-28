import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppLayout } from '../layout/AppLayout';
import { Project } from '../../types';
import { createDefaultProject } from '../../utils/projectDefaults';
import { reciters, surahs } from '../../data/mockData';
import { studioTemplates } from '../../data/templates';
import { AutoReelModal } from '../ui/AutoReelModal';
import { ReciterBrowserModal } from '../ui/ReciterBrowserModal';
import { ClipLibraryModal } from '../ui/ClipLibraryModal';
import { PresetTemplatesModal } from '../ui/PresetTemplatesModal';
import {
  getAvailableSurahsForReciter,
  isSurahAvailableForReciter,
} from '../../services/quranApi';
import {
  FileText,
  Mic,
  BookOpen,
  Hash,
  Ratio,
  Sparkles,
  ArrowLeft,
  Check,
  Loader2,
  Wand2,
  AlertTriangle,
  Film,
  BookHeart,
  Image as ImageIcon,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

export const CreateProjectPage: React.FC = () => {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addProject = useAppStore((s) => s.addProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const addToast = useAppStore((s) => s.addToast);
  const { t } = useTranslation();
  const [isAutoReelModalOpen, setIsAutoReelModalOpen] = useState(false);
  const [isReciterModalOpen, setIsReciterModalOpen] = useState(false);
  const [isClipLibraryOpen, setIsClipLibraryOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [reciterId, setReciterId] = useState('yasser_128');
  const [surahNumber, setSurahNumber] = useState<number>(1);
  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(7);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('aesthetic_rain');
  const [filterAvailableSurahsOnly, setFilterAvailableSurahsOnly] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const availableSurahs = getAvailableSurahsForReciter(reciterId);
  const isFullQuran = availableSurahs.length === 114;
  const isCurrentSurahAvailable = isSurahAvailableForReciter(reciterId, surahNumber);

  const selectedSurah = surahs.find((s) => s.number === surahNumber);
  const selectedReciter = reciters.find((r) => r.id === reciterId);
  const selectedTpl =
    studioTemplates.find((t) => t.id === selectedTemplateId) || studioTemplates[0];

  const handleReciterChange = (newReciterId: string) => {
    setReciterId(newReciterId);
    const newAvailable = getAvailableSurahsForReciter(newReciterId);
    if (!newAvailable.includes(surahNumber)) {
      const nextSurahNum = newAvailable[0] || 1;
      handleSurahChange(nextSurahNum);
      const sName = surahs.find((s) => s.number === nextSurahNum)?.name;
      const rObj = reciters.find((r) => r.id === newReciterId);
      addToast({
        message: t(
          'createProject.surahAutoAdjusted',
          'تم ضبط السورة تلقائياً على (سورة {surah}) لأنها متوفرة بصوت {reciter} ✨'
        )
          .replace('{surah}', sName || '')
          .replace('{reciter}', rObj?.name || 'القارئ'),
        type: 'info',
      });
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      addToast({
        message: t('createProject.enterNameWarning', 'يرجى إدخال اسم المشروع'),
        type: 'warning',
      });
      return;
    }
    if (!reciterId) {
      addToast({
        message: t('createProject.selectReciterWarning', 'يرجى اختيار القارئ'),
        type: 'warning',
      });
      return;
    }
    if (!surahNumber) {
      addToast({
        message: t('createProject.selectSurahWarning', 'يرجى اختيار السورة'),
        type: 'warning',
      });
      return;
    }

    setIsCreating(true);

    const project: Project = createDefaultProject({
      name: name.trim(),
      reciter: selectedReciter?.name || '',
      reciterId,
      surah: selectedSurah?.name || '',
      surahNumber,
      fromAyah,
      toAyah,
      aspectRatio,
      transition: selectedTpl.transition || 'fadeScale',
      videoEffect: selectedTpl.videoEffect || 'none',
      activeTemplateId: selectedTpl.id,
      backgroundType: selectedTpl.backgroundUrl ? 'image' : 'none',
      backgroundUrl: selectedTpl.backgroundUrl,
      backgroundOpacity: selectedTpl.backgroundOpacity ?? 0.6,
      watermark: 'atar-studio.com',
      textSettings: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        textColor: '#ffffff',
        bgColor: '#000000',
        bgOpacity: 0.5,
        position: 'center',
        translationFontSize: 16,
        translationColor: '#e2e8f0',
        displayMode: 'chunked',
        ...selectedTpl.textSettings,
      },
      audioSettings: {
        recitationVolume: 85,
        fadeIn: true,
        fadeOut: true,
        fadeDuration: 2,
        backgroundVolume: 20,
        ...selectedTpl.audioSettings,
      },
    });

    addProject(project);
    setCurrentProject(project);
    addToast({
      message: t(
        'createProject.projectCreatedSuccess',
        'تم إنشاء المشروع وتطبيق قالب "{template}" بنجاح ✓'
      ).replace('{template}', selectedTpl.name),
      type: 'success',
    });

    // Small delay so toast shows before navigation
    setTimeout(() => {
      setIsCreating(false);
      setCurrentPage('editor');
    }, 300);
  };

  // Auto-generate name when surah is selected
  const handleSurahChange = (num: number) => {
    setSurahNumber(num);
    const surah = surahs.find((s) => s.number === num);
    if (surah) {
      setFromAyah(1);
      setToAyah(Math.min(surah.ayahCount, 10)); // Default first 10 ayahs
      // Auto-suggest a name if empty
      if (!name.trim()) {
        setName(`ريلز سورة ${surah.name}`);
      }
    }
  };

  const displayedSurahs =
    filterAvailableSurahsOnly && !isFullQuran
      ? surahs.filter((s) => availableSurahs.includes(s.number))
      : surahs;

  const aspectOptions = [
    {
      value: '9:16' as const,
      label: t('export.ratioReels', 'ريلز'),
      sublabel: '9:16',
      icon: '📱',
    },
    {
      value: '16:9' as const,
      label: t('export.ratioYoutube', 'يوتيوب'),
      sublabel: '16:9',
      icon: '🖥️',
    },
    {
      value: '1:1' as const,
      label: t('export.ratioSquare', 'مربع'),
      sublabel: '1:1',
      icon: '⬜',
    },
  ];

  const [creationFormat, setCreationFormat] = useState<'quran' | 'azkar' | 'quotes' | 'voice'>(
    'quran'
  );

  const creationFormats = [
    {
      id: 'quran' as const,
      title: t('dashboard.studioQuranReelsTitle', 'ريلز قرآني سينمائي'),
      badge: t('dashboard.studioQuranReelsBadge', 'فيديو سينمائي 🎬'),
      desc: t(
        'dashboard.studioQuranReelsDesc',
        'فيديوهات قصيرة لكبار القراء مع كاريوكي التلاوة ومؤثرات كين بيرنز FHD'
      ),
      icon: <Film size={20} className="text-gold-400" />,
      activeClass:
        'from-gold-500/25 via-amber-500/10 to-surface-900 border-gold-400/90 shadow-xl shadow-gold-500/15 ring-2 ring-gold-400/40',
      badgeClass: 'bg-gold-500/20 text-gold-300 border-gold-400/40',
      accentColor: '#cbb06b',
    },
    {
      id: 'azkar' as const,
      title: t('dashboard.studioAzkarTitle', 'أذكار وأحاديث نبوية'),
      badge: t('dashboard.studioAzkarBadge', 'أذكار + تسبيح 📿'),
      desc: t(
        'dashboard.studioAzkarDesc',
        'أذكار الصباح والمساء وحصن المسلم مع عدّاد تسبيح تفاعلي وتحويل لريلز'
      ),
      icon: <BookHeart size={20} className="text-emerald-400" />,
      activeClass:
        'from-emerald-500/25 via-teal-500/10 to-surface-900 border-emerald-400/90 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-400/40',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      accentColor: '#34d399',
    },
    {
      id: 'quotes' as const,
      title: t('dashboard.studioQuotesTitle', 'كروت وبوستات الصور'),
      badge: t('dashboard.studioQuotesBadge', 'بوستات HD 🖼️'),
      desc: t(
        'dashboard.studioQuotesDesc',
        'تصميم بوستات دعوية وبطاقات آيات جاهزة لإنستغرام وواتساب بنقرة زر'
      ),
      icon: <ImageIcon size={20} className="text-sky-400" />,
      activeClass:
        'from-sky-500/25 via-blue-500/10 to-surface-900 border-sky-400/90 shadow-xl shadow-sky-500/15 ring-2 ring-sky-400/40',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
      accentColor: '#38bdf8',
    },
    {
      id: 'voice' as const,
      title: t('dashboard.studioVoiceTitle', 'التلقين والتسجيل 8D'),
      badge: t('dashboard.studioVoiceBadge', 'تسجيل 8D 🎧'),
      desc: t(
        'dashboard.studioVoiceDesc',
        'مصحف ملقن متحرك لتسجيل تلاوتك بصوتك مع صدى الحرم ثلاثي الأبعاد'
      ),
      icon: <Mic size={20} className="text-purple-400" />,
      activeClass:
        'from-purple-500/25 via-indigo-500/10 to-surface-900 border-purple-400/90 shadow-xl shadow-purple-500/15 ring-2 ring-purple-400/40',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      accentColor: '#c084fc',
    },
  ];

  return (
    <AppLayout
      title={t('createProject.title', 'استوديو الإنشاء والتصميم')}
      subtitle={t('createProject.subtitle', 'اختر نوع المحتوى الذي ترغب في إنشائه وتصميمه اليوم')}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in">
        {/* Step 1: Format Switcher (Segmented Control) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-surface-300">
              {t(
                'createProject.chooseEnv',
                'اختر بيئة الإنتاج والاستوديو:'
              )}
            </span>
          </div>

          <div
            data-tour="create-formats"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-900/80 p-1.5 rounded-xl border border-surface-700/30"
          >
            {creationFormats.map((fmt) => {
              const isSelected = creationFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => {
                    setCreationFormat(fmt.id);
                    if (fmt.id === 'azkar') setCurrentPage('azkar');
                    else if (fmt.id === 'quotes') setCurrentPage('quotes');
                    else if (fmt.id === 'voice') setCurrentPage('voice-studio');
                  }}
                  className={`p-3 rounded-lg border text-start transition-all duration-150 cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-gold-500/10 border-gold-500/30 text-gold-300 shadow-sm'
                      : 'bg-transparent border-transparent text-surface-400 hover:text-surface-100 hover:bg-surface-800/60'
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${isSelected ? 'text-gold-400' : 'text-surface-400'}`}>
                    {fmt.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs truncate text-surface-50">
                      {fmt.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI 1-Click Auto Reel Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-xl bg-surface-900 border border-gold-500/25 p-5 shadow-lg overflow-hidden group hover:border-gold-500/40 transition-all duration-150"
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-start">
              <div className="w-10 h-10 rounded-xl bg-surface-800 text-gold-400 border border-surface-700/40 flex items-center justify-center shrink-0">
                <Wand2 size={20} />
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
                  <h3 className="text-xs font-bold text-surface-50 group-hover:text-gold-300 transition-colors">
                    {t(
                      'createProject.autoReelBannerTitle',
                      'توليد ريلز قرآني تلقائي ذكي'
                    )}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-gold-500/10 text-gold-300 font-semibold border border-gold-500/20">
                    توليد ذكي
                  </span>
                </div>
                <p className="text-xs text-surface-400 max-w-xl">
                  {t(
                    'createProject.autoReelBannerDesc',
                    'اختر سورة، وسيقوم النظام بتجهيز التلاوة، الآيات، التوقيت، والخلفيات تلقائياً.'
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAutoReelModalOpen(true)}
              className="btn-gold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
            >
              <span>{t('createProject.autoGenerateNow', 'توليد تلقائي')}</span>
              <ArrowLeft size={13} />
            </button>
          </div>
        </motion.div>

        {/* Video Presets Catalog */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-surface-200 flex items-center gap-2">
              <Sparkles size={16} className="text-gold-400" />
              <span>
                {t(
                  'createProject.presetsCatalogTitle',
                  'قوالب وتصاميم جاهزة للاستخدام السريع'
                )}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setIsTemplatesModalOpen(true)}
              className="text-xs text-gold-400 hover:text-gold-300 font-bold transition-colors cursor-pointer"
            >
              {t('createProject.viewAllTemplates', 'عرض كافة القوالب ←')}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {studioTemplates.slice(0, 6).map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplateId(tpl.id);
                    addToast({
                      message: `تم اختيار قالب «${tpl.name}» 🎨`,
                      type: 'info',
                    });
                  }}
                  className={`relative p-3 rounded-2xl border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-gold-500/15 border-gold-400 shadow-md shadow-gold-500/10 ring-1 ring-gold-400/50'
                      : 'bg-surface-900 border-surface-700/40 hover:border-surface-600'
                  }`}
                >
                  {tpl.backgroundUrl && (
                    <div className="h-20 rounded-xl overflow-hidden mb-2.5 relative">
                      <img
                        src={tpl.backgroundUrl}
                        alt={tpl.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-1.5 end-2 text-xs font-bold text-white">
                        {tpl.name}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-surface-300 line-clamp-1 leading-relaxed">
                    {tpl.description}
                  </p>
                  {isSelected && (
                    <div className="absolute top-2 left-2 p-1 rounded-full bg-gold-400 text-black">
                      <Check size={12} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-8 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center">
              <Sparkles size={20} className="text-accent-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-50">
                {t('editor.templatesTab', 'تخصيص يدوي للمشروع')}
              </h2>
              <p className="text-xs text-surface-400">
                {t('createProject.subtitle', 'أو اختر تفاصيل السورة والآيات والقارئ يدوياً')}
              </p>
            </div>
          </div>

          <div className="divider"></div>

          {/* Project name */}
          <div>
            <label className="label flex items-center gap-2">
              <FileText size={14} className="text-accent-400" />
              {t('createProject.projectNameLabel', 'اسم المشروع:')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(
                'createProject.projectNamePlaceholder',
                'مثال: ريلز سورة الكهف — يوم الجمعة'
              )}
              className="glass-input w-full"
            />
          </div>

          {/* Reciter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label flex items-center gap-2 mb-0">
                <Mic size={14} className="text-accent-400" />
                <span>{t('createProject.reciterLabel', 'القارئ والصوت 🎙️:')}</span>
                {isFullQuran ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    🟢 {t('editor.fullQuranBadge', 'مصحف كامل (114 سورة)')}
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    🟡 {availableSurahs.length} سورة مسجلة
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setIsReciterModalOpen(true)}
                className="text-xs text-gold-400 hover:text-gold-300 font-bold flex items-center gap-1.5 hover:underline bg-gold-400/10 px-2.5 py-1 rounded-lg border border-gold-400/20 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>
                  {t(
                    'createProject.allRecitersBtn',
                    'تصفح جميع القراء (16 قارئ) ←'
                  )}
                </span>
              </button>
            </div>
            <select
              value={reciterId}
              onChange={(e) => handleReciterChange(e.target.value)}
              className="glass-select w-full"
            >
              <option value="">{t('voiceStudio.selectSurah', 'اختر القارئ...')}</option>
              {reciters.map((r) => {
                const rSurahs = getAvailableSurahsForReciter(r.id);
                const isFull = rSurahs.length === 114;
                return (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.style} (
                    {isFull ? '114 سورة كاملة ✓' : `${rSurahs.length} سورة متوفرة`})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Surah Selection with Availability Intelligence */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label flex items-center gap-2 mb-0">
                <BookOpen size={14} className="text-accent-400" />
                <span>{t('createProject.surahLabel', 'السورة الكريمة 📖:')}</span>
                <span className="text-[11px] text-surface-400">
                  ({displayedSurahs.length} سورة معروضة)
                </span>
              </label>

              {!isFullQuran && (
                <label className="flex items-center gap-1.5 text-xs text-gold-300 font-bold cursor-pointer bg-gold-500/10 px-2 py-0.5 rounded-lg border border-gold-500/20">
                  <input
                    type="checkbox"
                    checked={filterAvailableSurahsOnly}
                    onChange={(e) => setFilterAvailableSurahsOnly(e.target.checked)}
                    className="checkbox checkbox-xs accent-gold-400"
                  />
                  <span>
                    {t(
                      'createProject.filterAvailableLabel',
                      'عرض السور المتوفرة فقط لهذا القارئ'
                    )}{' '}
                    ({availableSurahs.length}) 🎧
                  </span>
                </label>
              )}
            </div>

            <select
              value={surahNumber || ''}
              onChange={(e) => handleSurahChange(Number(e.target.value))}
              className={`glass-select w-full ${!isCurrentSurahAvailable ? 'border-amber-500/60 bg-amber-500/10' : ''}`}
            >
              <option value="">{t('voiceStudio.selectSurah', 'اختر السورة...')}</option>
              {displayedSurahs.map((s) => {
                const isAvail = availableSurahs.includes(s.number);
                return (
                  <option key={s.number} value={s.number}>
                    {s.number}. سورة {s.name} — {s.ayahCount} آية ({s.revelationType}){' '}
                    {isAvail ? '✓' : '(⚠️ غير مسجلة لهذا القارئ)'}
                  </option>
                );
              })}
            </select>

            {/* Smart Availability Alert & 1-Click Fix */}
            {!isCurrentSurahAvailable && (
              <div className="mt-2.5 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-200">
                    <span className="font-bold">سورة {selectedSurah?.name}</span> غير مسجلة بصوت
                    القارئ <span className="font-bold">{selectedReciter?.name}</span>.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleReciterChange('alafasy_128')}
                    className="px-2.5 py-1 rounded-xl bg-surface-900 hover:bg-surface-800 text-gold-300 font-bold text-[11px] border border-gold-400/30 transition-all cursor-pointer"
                  >
                    تبديل لمشاري العفاسي (مصحف كامل) 🔄
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSurahChange(availableSurahs[0] || 1)}
                    className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-onbrand font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                  >
                    اختيار سورة{' '}
                    {surahs.find((s) => s.number === availableSurahs[0])?.name || 'الفاتحة'} 📖
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ayah range */}
          {selectedSurah && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-2">
                  <Hash size={14} className="text-accent-400" />
                  {t('createProject.fromAyahLabel', 'من آية:')}
                </label>
                <input
                  type="number"
                  value={fromAyah}
                  onChange={(e) => {
                    const maxAyah = selectedSurah.ayahCount;
                    const val = Math.max(1, Math.min(maxAyah, Number(e.target.value) || 1));
                    setFromAyah(val);
                    if (val > toAyah) {
                      setToAyah(val);
                    }
                  }}
                  min={1}
                  max={selectedSurah.ayahCount}
                  className="glass-input w-full"
                />
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <Hash size={14} className="text-accent-400" />
                  {t('createProject.toAyahLabel', 'إلى آية:')}
                </label>
                <input
                  type="number"
                  value={toAyah}
                  onChange={(e) => {
                    const maxAyah = selectedSurah.ayahCount;
                    const val = Math.max(fromAyah, Math.min(maxAyah, Number(e.target.value) || fromAyah));
                    setToAyah(val);
                  }}
                  min={1}
                  max={selectedSurah.ayahCount}
                  className="glass-input w-full"
                />
              </div>
              <div className="col-span-2 text-[11px] text-surface-400 text-center">
                {toAyah - fromAyah + 1} آية سيتم تضمينها من أصل {selectedSurah.ayahCount} آية
              </div>
            </div>
          )}

          {/* Pro Template Selector */}
          <div>
            <label className="label flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wand2 size={14} className="text-gold-400" />
                {t('editor.templatesTab', 'اختر القالب والتأثير الأولي (Pro Template)')}
              </span>
              <span className="text-[11px] text-gold-400 font-semibold">جاهز بضغطة زر ✨</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {studioTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`
                    p-3 rounded-xl border text-start transition-all flex flex-col justify-between relative overflow-hidden group
                    ${
                      selectedTemplateId === tpl.id
                        ? 'bg-accent-500/15 border-accent-500/40 shadow-lg shadow-accent-500/10'
                        : 'bg-surface-800/40 border-surface-700/40 text-surface-400 hover:bg-surface-800/70 hover:border-surface-600'
                    }
                  `}
                >
                  {selectedTemplateId === tpl.id && (
                    <div className="absolute top-2 start-2 w-4 h-4 bg-accent-500 rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{tpl.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-surface-50 block">{tpl.name}</span>
                      <span className="text-[10px] text-gold-400 block">{tpl.tag}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-surface-400 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect ratio */}
          <div>
            <label className="label flex items-center gap-2">
              <Ratio size={14} className="text-accent-400" />
              {t('createProject.aspectRatioLabel', 'أبعاد ومقاس الفيديو:')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {aspectOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAspectRatio(opt.value)}
                  className={`
                    relative p-4 rounded-xl border text-center transition-all duration-200
                    ${
                      aspectRatio === opt.value
                        ? 'bg-accent-500/10 border-accent-500/30 text-accent-400'
                        : 'bg-surface-800/40 border-surface-700/40 text-surface-400 hover:bg-surface-800/60 hover:border-surface-600'
                    }
                  `}
                >
                  {aspectRatio === opt.value && (
                    <div className="absolute top-2 start-2 w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <span className="text-2xl mb-2 block">{opt.icon}</span>
                  <span className="text-sm font-semibold block">{opt.label}</span>
                  <span className="text-xs opacity-60 block mt-0.5">{opt.sublabel}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="divider"></div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="btn-primary flex items-center gap-2 px-8 disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? <Loader2 size={18} className="animate-spin" /> : null}
              {isCreating
                ? t('createProject.creatingBtn', 'جارٍ إنشاء وتجهيز المشروع...')
                : t('createProject.createAndOpenBtn', 'إنشاء والبدء في التصميم')}
            </button>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="btn-ghost flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              {t('common.cancel', 'رجوع')}
            </button>
          </div>
        </motion.div>
      </div>

      {/* AI Auto-Reels Generator Modal */}
      <AutoReelModal isOpen={isAutoReelModalOpen} onClose={() => setIsAutoReelModalOpen(false)} />

      {/* Reciter Browser Modal */}
      <ReciterBrowserModal
        isOpen={isReciterModalOpen}
        onClose={() => setIsReciterModalOpen(false)}
        selectedReciterId={reciterId}
        onSelectReciter={(reciter) => {
          setReciterId(reciter.id);
        }}
      />

      {/* Clip Library Modal */}
      <ClipLibraryModal isOpen={isClipLibraryOpen} onClose={() => setIsClipLibraryOpen(false)} />

      {/* Preset Templates Catalog Modal */}
      <PresetTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        activeTemplateId={selectedTemplateId}
        onApplyTemplate={(tpl) => setSelectedTemplateId(tpl.id)}
      />
    </AppLayout>
  );
};
