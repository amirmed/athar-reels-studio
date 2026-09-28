import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppLayout } from '../layout/AppLayout';
import { StatCard } from '../ui/StatCard';
import { ProjectCard } from '../ui/ProjectCard';
import { EmptyState } from '../ui/EmptyState';
import { Modal, ConfirmDialog } from '../ui/Modal';
import { AutoReelModal } from '../ui/AutoReelModal';
import { DashboardSkeleton } from '../ui/DashboardSkeleton';
import { createDefaultProject } from '../../utils/projectDefaults';
import {
  FolderOpen,
  Download,
  Film,
  Clock,
  ArrowLeft,
  TrendingUp,
  HelpCircle,
  BookHeart,
  Image as ImageIcon,
  Mic,
} from 'lucide-react';

import { studioTemplates } from '../../data/templates';
import { surahs, reciters } from '../../data/mockData';
import { getTodayDailyVerse } from '../../data/dailyVerses';
import { StudioTemplate } from '../../types';
import { OnboardingModal } from '../ui/OnboardingModal';
import { useTranslation } from '../../i18n';

export const DashboardPage: React.FC = () => {
  const [isAutoReelModalOpen, setIsAutoReelModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedTemplateForConfirm, setSelectedTemplateForConfirm] =
    useState<StudioTemplate | null>(null);
  const [templateSurahNum, setTemplateSurahNum] = useState<number>(1);
  const [templateFromAyah, setTemplateFromAyah] = useState<number>(1);
  const [templateToAyah, setTemplateToAyah] = useState<number>(7);
  const [templateReciterId, setTemplateReciterId] = useState<string>('alafasy_128');

  const projects = useAppStore((s) => s.projects);
  const exportJobs = useAppStore((s) => s.exportJobs);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addProject = useAppStore((s) => s.addProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const isLoadingProjects = useAppStore((s) => s.isLoadingProjects);
  const activeModal = useAppStore((s) => s.activeModal);
  const modalData = useAppStore((s) => s.modalData);
  const closeModal = useAppStore((s) => s.closeModal);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const addToast = useAppStore((s) => s.addToast);
  const startTour = useAppStore((s) => s.startTour);
  const { t } = useTranslation();

  // Trigger Onboarding on first visit
  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('athar_has_seen_onboarding');
      if (!hasSeen && projects.length === 0) {
        setIsOnboardingOpen(true);
        localStorage.setItem('athar_has_seen_onboarding', 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [projects.length]);

  const totalProjects = projects.length;
  const totalExported = exportJobs.filter((j) => j.status === 'completed').length;
  const lastProject = projects[0];
  const recentProjects = projects.slice(0, 4);

  const handleDeleteConfirm = () => {
    const data = modalData as { projectId?: string; projectName?: string } | undefined;
    if (data?.projectId) {
      deleteProject(data.projectId);
      addToast({
        message: t('dashboard.projectDeletedSuccess', 'تم حذف المشروع بنجاح'),
        type: 'success',
      });
      closeModal();
    }
  };

  // 7 Daily Inspiring Verses Rotation (One for each day of the week)
  const dailyAyah = getTodayDailyVerse();

  const handleCreateDailyAyahReel = () => {
    const tpl = studioTemplates.find((t) => t.id === 'aesthetic_rain') || studioTemplates[0];
    const newProj = createDefaultProject({
      name: `ريلز سورة ${dailyAyah.surahName} — ${dailyAyah.theme}`,
      reciter: dailyAyah.reciter,
      reciterId: dailyAyah.reciterId,
      surah: dailyAyah.surahName,
      surahNumber: dailyAyah.surahNumber,
      fromAyah: dailyAyah.fromAyah,
      toAyah: dailyAyah.toAyah,
      aspectRatio: '9:16',
      backgroundType: 'video',
      backgroundUrl:
        'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
      backgroundOpacity: 0.7,
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
        fontFamily: 'Amiri',
        wordHighlightEnabled: true,
        wordHighlightStyle: 'goldGlow',
        ...tpl.textSettings,
      },
      audioSettings: {
        recitationVolume: 90,
        fadeIn: true,
        fadeOut: true,
        fadeDuration: 2,
        backgroundVolume: 25,
        ...tpl.audioSettings,
      },
    });
    addProject(newProj);
    setCurrentProject(newProj);
    addToast({
      message: t('dashboard.dailyAyahPrepared', 'تم تجهيز مشروع آية اليوم في المحرر بنجاح'),
      type: 'success',
    });
    setCurrentPage('editor');
  };

  // Dynamic daily featured templates rotation
  const dayIndex = new Date().getDate();
  const featuredTemplates = Array.from(
    { length: 4 },
    (_, i) => studioTemplates[(dayIndex + i) % studioTemplates.length]
  );

  const handleOpenTemplateModal = (tpl: StudioTemplate) => {
    setSelectedTemplateForConfirm(tpl);
    setTemplateSurahNum(1);
    setTemplateFromAyah(1);
    setTemplateToAyah(7);
    setTemplateReciterId('alafasy_128');
  };

  const handleConfirmCreateProject = () => {
    if (!selectedTemplateForConfirm) return;
    const tpl = selectedTemplateForConfirm;
    const selectedSurahObj = surahs.find((s) => s.number === templateSurahNum) || surahs[0];
    const selectedReciterObj = reciters.find((r) => r.id === templateReciterId) || reciters[0];

    const newProj = createDefaultProject({
      name: `ريلز ${selectedSurahObj.name} — ${tpl.name}`,
      reciter: selectedReciterObj.name,
      reciterId: selectedReciterObj.id,
      surah: selectedSurahObj.name,
      surahNumber: selectedSurahObj.number,
      fromAyah: templateFromAyah,
      toAyah: templateToAyah,
      aspectRatio: '9:16',
      transition: tpl.transition || 'fadeScale',
      videoEffect: tpl.videoEffect || 'none',
      activeTemplateId: tpl.id,
      backgroundType: tpl.backgroundUrl?.includes('.mp4') ? 'video' : 'image',
      backgroundUrl:
        tpl.backgroundUrl ||
        'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
      backgroundOpacity: tpl.backgroundOpacity ?? 0.65,
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
        fontFamily: 'Amiri',
        wordHighlightEnabled: true,
        wordHighlightStyle: 'goldGlow',
        ...tpl.textSettings,
      },
      audioSettings: {
        recitationVolume: 88,
        fadeIn: true,
        fadeOut: true,
        fadeDuration: 2,
        backgroundVolume: 22,
        ...tpl.audioSettings,
      },
    });
    addProject(newProj);
    setCurrentProject(newProj);
    setSelectedTemplateForConfirm(null);
    addToast({
      message: t(
        'dashboard.templateAppliedSuccess',
        'تم تطبيق قالب "{template}" وتجهيز المحرر لـ ({surah}) ✨'
      )
        .replace('{template}', tpl.name)
        .replace('{surah}', selectedSurahObj.name),
      type: 'success',
    });
    setCurrentPage('editor');
  };

  if (isLoadingProjects) {
    return (
      <AppLayout
        title={t('nav.dashboard', 'الرئيسية')}
        subtitle={t('dashboard.welcomeSubtitle', 'لوحة التحكم واستوديو الإنتاج السريع')}
      >
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={t('nav.dashboard', 'الرئيسية')}
      subtitle={t('dashboard.welcomeSubtitle', 'لوحة التحكم واستوديو الإنتاج السريع')}
    >
      <div className="p-6 space-y-6 animate-in max-w-7xl mx-auto">
        {/* Daily Ayah Hero Card */}
        <motion.div
          data-tour="daily-ayah"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl bg-surface-900 border border-gold-500/25 p-6 shadow-lg overflow-hidden group hover:border-gold-500/40 transition-all duration-200 min-h-[160px] flex flex-col justify-center"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-start max-w-2xl">
              <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-gold-500/10 text-gold-300 font-semibold border border-gold-500/20">
                  {t('dashboard.dailyAyahBadge', 'آية اليوم')}
                </span>
                <span className="text-xs text-surface-300 font-medium">
                  سورة {dailyAyah.surahName} • الآية ({dailyAyah.fromAyah}
                  {dailyAyah.toAyah !== dailyAyah.fromAyah ? `-${dailyAyah.toAyah}` : ''})
                </span>
                <span className="text-xs text-surface-400">
                  {t('dashboard.reciterVoice', 'بصوت القارئ: {reciter}').replace(
                    '{reciter}',
                    dailyAyah.reciter
                  )}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-arabic font-bold text-surface-50 leading-loose selectable-text min-h-[3rem] flex items-center">
                « {dailyAyah.text} »
              </h2>
              <p className="text-xs text-gold-300/80 font-medium">
                {t('dashboard.dailyAyahTheme', 'الموضوع: {theme}').replace(
                  '{theme}',
                  dailyAyah.theme
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCreateDailyAyahReel}
                className="btn-gold text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>{t('dashboard.createDailyAyahVideo', 'إنشاء فيديو للآية')}</span>
                <ArrowLeft size={14} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Creative Production Studios Launchpad */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-surface-50 tracking-tight flex items-center gap-2">
              <span>{t('dashboard.productionStudios', 'استوديوهات الإنتاج والتصميم')}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-surface-800 text-surface-300 border border-surface-700/30 font-medium">
                {t('dashboard.studiosCountBadge', '4 استوديوهات')}
              </span>
            </h2>
            <span className="text-xs text-surface-400 hidden sm:inline">
              {t('dashboard.clickToOpen', 'اضغط للفتح المباشر')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Quran Reels */}
            <button
              type="button"
              onClick={() => setCurrentPage('create')}
              className="p-3.5 rounded-xl bg-surface-900/90 hover:bg-surface-850 border border-surface-700/30 hover:border-gold-500/40 transition-all duration-150 text-start group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-surface-800 text-gold-400 border border-surface-700/30 group-hover:border-gold-500/30 transition-colors">
                  <Film size={18} />
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-800/80 text-surface-300 border border-surface-700/30">
                  فيديو
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-surface-50 group-hover:text-gold-300 transition-colors">
                  {t('dashboard.studioQuranReelsTitle', 'ريلز قرآني سينمائي')}
                </h3>
                <p className="text-[11px] text-surface-400 line-clamp-2 leading-relaxed">
                  {t(
                    'dashboard.studioQuranReelsDesc',
                    'فيديوهات قصيرة لكبار القراء مع كاريوكي التلاوة ومؤثرات كين بيرنز FHD'
                  )}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-surface-700/30 flex items-center justify-between text-xs font-semibold text-gold-400 group-hover:text-gold-300">
                <span>{t('dashboard.studioQuranReelsAction', 'إنشاء ريلز جديد')}</span>
                <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 2. Azkar & Hadith */}
            <button
              type="button"
              onClick={() => setCurrentPage('azkar')}
              className="p-3.5 rounded-xl bg-surface-900/90 hover:bg-surface-850 border border-surface-700/30 hover:border-accent-500/40 transition-all duration-150 text-start group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-surface-800 text-accent-400 border border-surface-700/30 group-hover:border-accent-500/30 transition-colors">
                  <BookHeart size={18} />
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-800/80 text-surface-300 border border-surface-700/30">
                  تسبيح
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-surface-50 group-hover:text-accent-300 transition-colors">
                  {t('dashboard.studioAzkarTitle', 'أذكار وأحاديث نبوية')}
                </h3>
                <p className="text-[11px] text-surface-400 line-clamp-2 leading-relaxed">
                  {t(
                    'dashboard.studioAzkarDesc',
                    'أذكار الصباح والمساء وحصن المسلم مع عدّاد تسبيح تفاعلي وتحويل لريلز'
                  )}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-surface-700/30 flex items-center justify-between text-xs font-semibold text-accent-400 group-hover:text-accent-300">
                <span>{t('dashboard.studioAzkarAction', 'فتح استوديو الأذكار')}</span>
                <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 3. Quote Cards & Posts */}
            <button
              type="button"
              onClick={() => setCurrentPage('quotes')}
              className="p-3.5 rounded-xl bg-surface-900/90 hover:bg-surface-850 border border-surface-700/30 hover:border-gold-500/40 transition-all duration-150 text-start group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-surface-800 text-gold-400 border border-surface-700/30 group-hover:border-gold-500/30 transition-colors">
                  <ImageIcon size={18} />
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-800/80 text-surface-300 border border-surface-700/30">
                  بطاقات
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-surface-50 group-hover:text-gold-300 transition-colors">
                  {t('dashboard.studioQuotesTitle', 'كروت وبوستات الصور')}
                </h3>
                <p className="text-[11px] text-surface-400 line-clamp-2 leading-relaxed">
                  {t(
                    'dashboard.studioQuotesDesc',
                    'تصميم بوستات دعوية وبطاقات آيات جاهزة لإنستغرام وواتساب بنقرة زر'
                  )}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-surface-700/30 flex items-center justify-between text-xs font-semibold text-gold-400 group-hover:text-gold-300">
                <span>{t('dashboard.studioQuotesAction', 'تصميم بوست الآن')}</span>
                <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 4. Voice Studio & 8D Reverb */}
            <button
              type="button"
              onClick={() => setCurrentPage('voice-studio')}
              className="p-3.5 rounded-xl bg-surface-900/90 hover:bg-surface-850 border border-surface-700/30 hover:border-accent-500/40 transition-all duration-150 text-start group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-surface-800 text-accent-400 border border-surface-700/30 group-hover:border-accent-500/30 transition-colors">
                  <Mic size={18} />
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-800/80 text-surface-300 border border-surface-700/30">
                  صوت 8D
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-surface-50 group-hover:text-accent-300 transition-colors">
                  {t('dashboard.studioVoiceTitle', 'التلقين والتسجيل 8D')}
                </h3>
                <p className="text-[11px] text-surface-400 line-clamp-2 leading-relaxed">
                  {t(
                    'dashboard.studioVoiceDesc',
                    'مصحف ملقن متحرك لتسجيل تلاوتك بصوتك مع صدى الحرم ثلاثي الأبعاد'
                  )}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-surface-700/30 flex items-center justify-between text-xs font-semibold text-accent-400 group-hover:text-accent-300">
                <span>{t('dashboard.studioVoiceAction', 'بدء التسجيل الصوتي')}</span>
                <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Featured Templates Shelf */}
        <div data-tour="trending-templates" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-surface-50 tracking-tight flex items-center gap-2">
                <span>{t('dashboard.featuredTemplates', 'قوالب سينمائية مختارة')}</span>
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-surface-800 text-surface-300 border border-surface-700/30 font-medium">
                {t('dashboard.dailyRenew', 'تتجدد يومياً')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-tour="tour-help-btn"
                onClick={startTour}
                className="text-xs text-surface-300 hover:text-gold-300 font-medium flex items-center gap-1.5 cursor-pointer bg-surface-800/60 hover:bg-surface-800 px-3 py-1.5 rounded-lg border border-surface-700/30 min-h-[32px] transition-all"
                title={t(
                  'dashboard.guidedTourTooltip',
                  'جولة إرشادية تفاعلية للتعرف على الأدوات'
                )}
              >
                <HelpCircle size={14} />
                <span>{t('dashboard.guidedTour', 'جولة إرشادية')}</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage('create')}
                className="text-xs text-surface-300 hover:text-surface-50 font-medium cursor-pointer bg-surface-800/60 hover:bg-surface-800 px-3 py-1.5 rounded-lg border border-surface-700/30 min-h-[32px] flex items-center gap-1 transition-all"
              >
                <span>{t('dashboard.viewAllTemplates', 'عرض كل القوالب')}</span>
                <ArrowLeft size={13} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {featuredTemplates.map((tpl) => (
              <button
                type="button"
                key={tpl.id}
                onClick={() => handleOpenTemplateModal(tpl)}
                aria-label={`${t('dashboard.customizeTemplate', 'تخصيص واستخدام القالب')} ${tpl.name}`}
                className="group relative rounded-xl bg-surface-900 border border-surface-700/25 hover:border-gold-500/35 p-3 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-black/30 flex flex-col justify-between text-start w-full focus:outline-none focus-visible:outline-accent-500"
              >
                {tpl.backgroundUrl && (
                  <div className="h-28 rounded-lg overflow-hidden mb-2.5 relative w-full">
                    <img
                      src={tpl.backgroundUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute bottom-2 end-2.5 text-xs font-bold text-white">
                      {tpl.name}
                    </span>
                  </div>
                )}
                <p className="text-xs text-surface-400 line-clamp-1 mb-2.5 leading-relaxed w-full font-normal">
                  {tpl.description}
                </p>
                <div className="flex items-center justify-between text-xs font-medium text-gold-400 group-hover:text-gold-300 pt-2 border-t border-surface-700/25 w-full">
                  <span>{t('dashboard.customizeTemplate', 'تخصيص واستخدام القالب')}</span>
                  <ArrowLeft
                    size={13}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats (Responsive 1/2/4 grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title={t('dashboard.statSavedProjects', 'مشاريعك المحفوظة')}
            value={totalProjects > 0 ? totalProjects : '0'}
            trend={totalProjects === 0 ? t('dashboard.statCreateFirst', 'أنشئ أول ريلز') : undefined}
            icon={FolderOpen}
            color="accent"
            delay={0}
          />
          <StatCard
            title={t('dashboard.statExportedVideos', 'الفيديوهات المصدّرة')}
            value={totalExported > 0 ? totalExported : '0'}
            trend={totalExported === 0 ? t('dashboard.statQuality1080p', 'بجودة 1080p') : undefined}
            icon={Download}
            color="gold"
            delay={0.04}
          />
          <StatCard
            title={t('dashboard.statLastActive', 'آخر مشروع نشط')}
            value={lastProject?.name || t('dashboard.statNoneYet', 'لا يوجد بعد')}
            trend={!lastProject ? t('dashboard.statChooseTemplate', 'اختر قالباً للبدء') : undefined}
            icon={Clock}
            color="emerald"
            delay={0.08}
          />
          <StatCard
            title={t('dashboard.statTotalReach', 'إجمالي النشر والأثر')}
            value={
              projects.reduce((sum, p) => sum + (p.exportCount || 0), 0) > 0
                ? projects.reduce((sum, p) => sum + (p.exportCount || 0), 0)
                : '0'
            }
            trend={t('dashboard.statOngoingCharity', 'صدقة جارية')}
            icon={TrendingUp}
            color="surface"
            delay={0.12}
          />
        </div>

        {/* Recent projects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-surface-50 tracking-tight flex items-center gap-2">
              <Film size={18} className="text-gold-400" />
              <span>{t('dashboard.recentProjects', 'المشاريع الأخيرة')}</span>
            </h2>
            {projects.length > 0 && (
              <button
                onClick={() => setCurrentPage('projects')}
                className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 font-semibold cursor-pointer bg-gold-500/10 hover:bg-gold-500/15 px-3 py-1.5 rounded-lg border border-gold-500/20 min-h-[32px] transition-all"
              >
                <span>{t('dashboard.viewAllProjects', 'عرض كل المشاريع')}</span>
                <ArrowLeft size={13} />
              </button>
            )}
          </div>

          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
            </div>
          ) : recentProjects.length === 0 ? (
            <EmptyState
              variant="first-time"
              title={t('dashboard.emptyProjectsTitle', 'لا توجد مشاريع بعد')}
              description={t(
                'dashboard.emptyProjectsDesc',
                'أنشئ مشروعك الأول لتبدأ في إنشاء ريلز قرآنية سينمائية واحترافية'
              )}
              actionLabel={t('dashboard.emptyProjectsAction', 'إنشاء مشروع جديد')}
              onAction={() => setCurrentPage('create')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
              {recentProjects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Onboarding Welcome Modal */}
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />

      {/* AI Auto-Reels Generator Modal */}
      <AutoReelModal isOpen={isAutoReelModalOpen} onClose={() => setIsAutoReelModalOpen(false)} />

      {/* Template Quick Customization & Review Modal */}
      {selectedTemplateForConfirm && (
        <Modal
          isOpen={Boolean(selectedTemplateForConfirm)}
          onClose={() => setSelectedTemplateForConfirm(null)}
          title={t('dashboard.customizeModalTitle', 'تخصيص القالب — {name} 🎬').replace(
            '{name}',
            selectedTemplateForConfirm.name
          )}
          size="md"
        >
          <div className="space-y-4 text-start">
            <div className="relative h-28 rounded-2xl overflow-hidden border border-surface-700/40 shadow-md">
              <img
                src={selectedTemplateForConfirm.backgroundUrl}
                alt={selectedTemplateForConfirm.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{selectedTemplateForConfirm.icon}</span>
                  <span>{selectedTemplateForConfirm.name}</span>
                </span>
                <span className="text-xs text-white/80">
                  {selectedTemplateForConfirm.description}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-900 border border-surface-700/40 space-y-3">
              <div>
                <label className="block text-xs font-bold text-surface-300 mb-1">
                  {t('dashboard.surahSelectionLabel', 'السورة القرآنية 📖:')}
                </label>
                <select
                  value={templateSurahNum}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    setTemplateSurahNum(num);
                    setTemplateFromAyah(1);
                    const s = surahs.find((x) => x.number === num);
                    setTemplateToAyah(Math.min(7, s?.ayahCount || 7));
                  }}
                  className="w-full p-2 rounded-xl bg-surface-950 border border-surface-700/50 text-xs font-bold text-surface-50 cursor-pointer"
                >
                  {surahs.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. سورة {s.name} ({s.ayahCount} آية)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-surface-300 mb-1">
                    {t('dashboard.fromAyahLabel', 'من الآية:')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={surahs.find((s) => s.number === templateSurahNum)?.ayahCount || 7}
                    value={templateFromAyah}
                    onChange={(e) => setTemplateFromAyah(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2 rounded-xl bg-surface-950 border border-surface-700/50 text-xs font-bold text-center text-surface-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-300 mb-1">
                    {t('dashboard.toAyahLabel', 'إلى الآية:')}
                  </label>
                  <input
                    type="number"
                    min={templateFromAyah}
                    max={surahs.find((s) => s.number === templateSurahNum)?.ayahCount || 7}
                    value={templateToAyah}
                    onChange={(e) =>
                      setTemplateToAyah(
                        Math.min(
                          surahs.find((s) => s.number === templateSurahNum)?.ayahCount || 7,
                          Number(e.target.value)
                        )
                      )
                    }
                    className="w-full p-2 rounded-xl bg-surface-950 border border-surface-700/50 text-xs font-bold text-center text-surface-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-300 mb-1">
                  {t('dashboard.reciterVoiceLabel', 'صوت القارئ 🎙️:')}
                </label>
                <select
                  value={templateReciterId}
                  onChange={(e) => setTemplateReciterId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-surface-950 border border-surface-700/50 text-xs font-bold text-surface-50 cursor-pointer"
                >
                  {reciters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} • {r.style}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmCreateProject}
                className="btn-gold flex-1 text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <span>{t('dashboard.startDesigningBtn', 'إنشاء والبدء في التصميم')}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplateForConfirm(null)}
                className="py-2.5 px-4 rounded-xl bg-surface-800/60 hover:bg-surface-800 text-surface-300 hover:text-surface-50 text-xs font-semibold cursor-pointer transition-all"
              >
                {t('dashboard.deleteCancelBtn', 'إلغاء')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={activeModal === 'confirm-delete'}
        onClose={closeModal}
        onConfirm={handleDeleteConfirm}
        title={t('dashboard.deleteProjectTitle', 'حذف المشروع')}
        message={t(
          'dashboard.deleteProjectConfirm',
          'هل أنت متأكد من حذف المشروع "{name}"؟ لا يمكن التراجع عن هذا الإجراء.'
        ).replace('{name}', (modalData as { projectName?: string })?.projectName || '')}
        confirmLabel={t('dashboard.deleteConfirmBtn', 'حذف')}
        cancelLabel={t('dashboard.deleteCancelBtn', 'إلغاء')}
        variant="danger"
      />
    </AppLayout>
  );
};
