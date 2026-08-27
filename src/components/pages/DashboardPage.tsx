import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppLayout } from '../layout/AppLayout';
import { StatCard } from '../ui/StatCard';
import { ProjectCard } from '../ui/ProjectCard';
import { EmptyState } from '../ui/EmptyState';
import { Modal, ConfirmDialog } from '../ui/Modal';
import { AutoReelModal } from '../ui/AutoReelModal';
import { createDefaultProject } from '../../utils/projectDefaults';
import {
  FolderOpen,
  Download,
  Film,
  Clock,
  ArrowLeft,
  TrendingUp,
  PlusCircle,
  Sparkles,
  HelpCircle,
  Sliders,
  Check,
  BookHeart,
  Image as ImageIcon,
  Mic,
} from 'lucide-react';

import { studioTemplates } from '../../data/templates';
import { surahs, reciters } from '../../data/mockData';
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
  const { t, language } = useTranslation();

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
    if (modalData?.projectId) {
      deleteProject(modalData.projectId);
      addToast({ message: 'تم حذف المشروع بنجاح', type: 'success' });
      closeModal();
    }
  };

  // 7 Daily Inspiring Verses Rotation (One for each day of the week)
  const DAILY_VERSES = [
    {
      day: 0, // Sunday
      surahName: 'الشرح',
      surahNumber: 94,
      fromAyah: 5,
      toAyah: 6,
      text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
      theme: 'الفرج والسكينة وتفريج الهموم',
      reciter: 'ياسر الدوسري',
      reciterId: 'yasser_128',
    },
    {
      day: 1, // Monday
      surahName: 'الضحى',
      surahNumber: 93,
      fromAyah: 5,
      toAyah: 5,
      text: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ',
      theme: 'العطاء والبشرى وجبر الخواطر',
      reciter: 'مشاري العفاسي',
      reciterId: 'alafasy_128',
    },
    {
      day: 2, // Tuesday
      surahName: 'الطلاق',
      surahNumber: 65,
      fromAyah: 2,
      toAyah: 3,
      text: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
      theme: 'التقوى وسعة الرزق والتوكل',
      reciter: 'عبد الرحمن العوسي',
      reciterId: 'abdulrahman_aloosi_128',
    },
    {
      day: 3, // Wednesday
      surahName: 'إبراهيم',
      surahNumber: 14,
      fromAyah: 7,
      toAyah: 7,
      text: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
      theme: 'بركة الشكر وزيادة النعم',
      reciter: 'ماهر المعيقلي',
      reciterId: 'maher_128',
    },
    {
      day: 4, // Thursday
      surahName: 'البقرة',
      surahNumber: 2,
      fromAyah: 186,
      toAyah: 186,
      text: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
      theme: 'قرب الله واستجابة الدعاء',
      reciter: 'عبد الباسط عبد الصمد',
      reciterId: 'abdulbasit_murat_192',
    },
    {
      day: 5, // Friday
      surahName: 'الكهف',
      surahNumber: 18,
      fromAyah: 10,
      toAyah: 10,
      text: 'رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا',
      theme: 'نور الجمعة وطلب الرشد والرحمة',
      reciter: 'سعود الشريم',
      reciterId: 'shuraim_128',
    },
    {
      day: 6, // Saturday
      surahName: 'الزمر',
      surahNumber: 39,
      fromAyah: 53,
      toAyah: 53,
      text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
      theme: 'سعة مغفرة الله والرجاء',
      reciter: 'ياسر الدوسري',
      reciterId: 'yasser_128',
    },
  ];

  const todayIndex = new Date().getDay() % 7;
  const dailyAyah = DAILY_VERSES[todayIndex] || DAILY_VERSES[0];

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
    addToast({ message: 'تم تجهيز مشروع آية اليوم في المحرر بنجاح', type: 'success' });
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
      message: `تم تطبيق قالب "${tpl.name}" وتجهيز المحرر لـ (${selectedSurahObj.name}) ✨`,
      type: 'success',
    });
    setCurrentPage('editor');
  };

  return (
    <AppLayout
      title={t('nav.dashboard', 'الرئيسية')}
      subtitle={t('dashboard.welcomeSubtitle', 'لوحة التحكم واستوديو الإنتاج السريع')}
    >
      <div className="p-6 space-y-6 animate-in max-w-7xl mx-auto">
        {/* 🌟 Daily Ayah Hero Card (Refined with Stable min-height to prevent Layout Shift) */}
        <motion.div
          data-tour="daily-ayah"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl bg-surface-900 border border-gold-500/25 p-6 sm:p-7 shadow-xl overflow-hidden group hover:border-gold-400/40 transition-all duration-300 min-h-[175px] flex flex-col justify-center"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2.5 text-center md:text-right max-w-2xl">
              <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full bg-gold-400/15 text-gold-300 font-bold border border-gold-400/25">
                  آية اليوم المختارة
                </span>
                <span className="text-xs text-white/70 font-semibold">
                  سورة {dailyAyah.surahName} • الآية ({dailyAyah.fromAyah}
                  {dailyAyah.toAyah !== dailyAyah.fromAyah ? `-${dailyAyah.toAyah}` : ''})
                </span>
                <span className="text-xs text-white/50">بصوت القارئ: {dailyAyah.reciter}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-arabic font-bold text-white/95 leading-loose selectable-text min-h-[3.5rem] flex items-center">
                « {dailyAyah.text} »
              </h2>
              <p className="text-sm text-gold-300/90 font-medium">الموضوع: {dailyAyah.theme}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCreateDailyAyahReel}
                className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-400 to-accent-500 hover:from-gold-300 hover:to-accent-400 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-gold-500/15 hover:scale-105 transition-all cursor-pointer min-h-[44px]"
              >
                <Sparkles size={16} />
                <span>إنشاء فيديو للآية فوراً</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* 🚀 Creative Production Studios Launchpad */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>استوديوهات الإنتاج والتصميم الإبداعي</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-400/10 text-gold-300 border border-gold-400/20 font-bold">
                4 استوديوهات متخصصة ✨
              </span>
            </h2>
            <span className="text-xs text-white/50 hidden sm:inline">اضغط للفتح المباشر</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Quran Reels */}
            <button
              type="button"
              onClick={() => setCurrentPage('create')}
              className="p-4 rounded-3xl bg-gradient-to-br from-gold-500/15 via-surface-900 to-surface-950 border border-gold-500/30 hover:border-gold-400 hover:shadow-xl hover:shadow-gold-500/10 hover:scale-[1.02] transition-all text-right group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-2xl bg-gold-400/15 text-gold-300 border border-gold-400/30 shadow-md group-hover:scale-110 transition-transform">
                  <Film size={22} />
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/30">
                  فيديو سينمائي 🎬
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-white group-hover:text-gold-300 transition-colors">
                  ريلز قرآني سينمائي
                </h3>
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                  فيديوهات قصيرة لكبار القراء مع كاريوكي التلاوة ومؤثرات كين بيرنز FHD
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-gold-400 group-hover:text-gold-300">
                <span>إنشاء ريلز جديد</span>
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 2. Azkar & Hadith */}
            <button
              type="button"
              onClick={() => setCurrentPage('azkar')}
              className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-surface-900 to-surface-950 border border-emerald-500/30 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.02] transition-all text-right group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-2xl bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 shadow-md group-hover:scale-110 transition-transform">
                  <BookHeart size={22} />
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  أذكار + تسبيح 📿
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-white group-hover:text-emerald-300 transition-colors">
                  أذكار وأحاديث نبوية
                </h3>
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                  أذكار الصباح والمساء وحصن المسلم مع عدّاد تسبيح تفاعلي وتحويل لريلز
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                <span>فتح استوديو الأذكار</span>
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 3. Quote Cards & Posts */}
            <button
              type="button"
              onClick={() => setCurrentPage('quotes')}
              className="p-4 rounded-3xl bg-gradient-to-br from-sky-500/15 via-surface-900 to-surface-950 border border-sky-500/30 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 hover:scale-[1.02] transition-all text-right group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-2xl bg-sky-400/15 text-sky-300 border border-sky-400/30 shadow-md group-hover:scale-110 transition-transform">
                  <ImageIcon size={22} />
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30">
                  بوستات HD 🖼️
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-white group-hover:text-sky-300 transition-colors">
                  كروت وبوستات الصور
                </h3>
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                  تصميم بوستات دعوية وبطاقات آيات جاهزة لإنستغرام وواتساب بنقرة زر
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-sky-400 group-hover:text-sky-300">
                <span>تصميم بوست الآن</span>
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 4. Voice Studio & 8D Reverb */}
            <button
              type="button"
              onClick={() => setCurrentPage('voice-studio')}
              className="p-4 rounded-3xl bg-gradient-to-br from-purple-500/15 via-surface-900 to-surface-950 border border-purple-500/30 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02] transition-all text-right group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-2xl bg-purple-400/15 text-purple-300 border border-purple-400/30 shadow-md group-hover:scale-110 transition-transform">
                  <Mic size={22} />
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-400/20 text-purple-300 border border-purple-400/30">
                  تسجيل 8D 🎧
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-white group-hover:text-purple-300 transition-colors">
                  التلقين والتسجيل 8D
                </h3>
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                  مصحف ملقن متحرك لتسجيل تلاوتك بصوتك مع صدى الحرم ثلاثي الأبعاد
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-purple-400 group-hover:text-purple-300">
                <span>بدء التسجيل الصوتي</span>
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Featured Templates Shelf */}
        <div data-tour="trending-templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>قوالب سينمائية مختارة</span>
                <span className="text-sm">✨</span>
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-800 text-white/70 border border-white/[0.06] font-medium">
                تتجدد يومياً
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                data-tour="tour-help-btn"
                onClick={startTour}
                className="text-xs sm:text-[13px] text-gold-400 hover:text-gold-300 font-bold flex items-center gap-1.5 cursor-pointer bg-gold-400/10 hover:bg-gold-400/20 px-3.5 py-2 rounded-xl border border-gold-400/25 min-h-[36px] transition-all"
                title="جولة إرشادية تفاعلية للتعرف على الأدوات"
              >
                <HelpCircle size={15} />
                <span>جولة إرشادية</span>
              </button>
              <button
                onClick={() => setCurrentPage('create')}
                className="text-xs sm:text-[13px] text-white/80 hover:text-white font-bold cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 rounded-xl border border-white/[0.06] min-h-[36px] flex items-center transition-all"
              >
                <span>عرض كل القوالب ←</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredTemplates.map((tpl) => (
              <button
                type="button"
                key={tpl.id}
                onClick={() => handleOpenTemplateModal(tpl)}
                aria-label={`استخدام وتخصيص قالب ${tpl.name}`}
                className="group relative rounded-2xl bg-surface-900 border border-white/[0.08] hover:border-gold-400/40 p-3.5 transition-all duration-300 cursor-pointer shadow-md hover:shadow-gold-500/10 flex flex-col justify-between text-right w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                {tpl.backgroundUrl && (
                  <div className="h-28 rounded-xl overflow-hidden mb-3 relative w-full">
                    <img
                      src={tpl.backgroundUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute bottom-2 right-2.5 text-xs font-bold text-white">
                      {tpl.name}
                    </span>
                  </div>
                )}
                <p className="text-xs sm:text-[13px] text-white/70 line-clamp-1 mb-3 leading-relaxed w-full font-medium">
                  {tpl.description}
                </p>
                <div className="flex items-center justify-between text-xs sm:text-[13px] font-bold text-gold-400 group-hover:text-gold-300 pt-2 border-t border-white/[0.04] w-full">
                  <span>تخصيص واستخدام القالب</span>
                  <ArrowLeft
                    size={14}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats (Responsive 1/2/4 grid with motivational empty-state copy) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="مشاريعك المحفوظة"
            value={totalProjects > 0 ? totalProjects : '0'}
            trend={totalProjects === 0 ? 'أنشئ أول ريلز 🚀' : undefined}
            icon={FolderOpen}
            color="accent"
            delay={0}
          />
          <StatCard
            title="الفيديوهات المصدّرة"
            value={totalExported > 0 ? totalExported : '0'}
            trend={totalExported === 0 ? 'بجودة 1080p Pro ✨' : undefined}
            icon={Download}
            color="gold"
            delay={0.06}
          />
          <StatCard
            title="آخر مشروع نشط"
            value={lastProject?.name || 'لا يوجد بعد'}
            trend={!lastProject ? 'اختر قالباً للبدء 🎬' : undefined}
            icon={Clock}
            color="emerald"
            delay={0.12}
          />
          <StatCard
            title="إجمالي النشر والأثر"
            value={
              projects.reduce((sum, p) => sum + (p.exportCount || 0), 0) > 0
                ? projects.reduce((sum, p) => sum + (p.exportCount || 0), 0)
                : '0'
            }
            trend="صدقة جارية 🌿"
            icon={TrendingUp}
            color="surface"
            delay={0.18}
          />
        </div>

        {/* Recent projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Film size={20} className="text-accent-400" />
              <span>المشاريع الأخيرة</span>
            </h2>
            {projects.length > 0 && (
              <button
                onClick={() => setCurrentPage('projects')}
                className="flex items-center gap-1.5 text-xs sm:text-[13px] text-accent-400 hover:text-accent-300 font-bold cursor-pointer bg-accent-500/10 hover:bg-accent-500/20 px-3.5 py-2 rounded-xl border border-accent-500/20 min-h-[36px] transition-all"
              >
                <span>عرض كل المشاريع</span>
                <ArrowLeft size={14} />
              </button>
            )}
          </div>

          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <div className="loader-spinner w-8 h-8 border-2 border-accent-500/20 border-t-accent-500 rounded-full animate-spin"></div>
            </div>
          ) : recentProjects.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="لا توجد مشاريع بعد"
              description="أنشئ مشروعك الأول لتبدأ في إنشاء ريلز قرآنية احترافية"
              actionLabel="إنشاء مشروع جديد"
              onAction={() => setCurrentPage('create')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              {recentProjects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Quick actions (Responsive grid 1/3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'إنشاء ريلز جديد',
              desc: 'ابدأ مشروع ريلز قرآني بخطوات بسيطة',
              icon: <PlusCircle size={20} />,
              action: () => setCurrentPage('create'),
              color: 'accent',
            },
            {
              title: 'تصدير مشروع',
              desc: 'صدّر مشاريعك بجودة سينمائية Full HD 1080p',
              icon: <Download size={20} />,
              action: () => setCurrentPage('export'),
              color: 'gold',
            },
            {
              title: 'إدارة المشاريع',
              desc: 'تصفح وإدارة ومتابعة جميع مشاريعك',
              icon: <FolderOpen size={20} />,
              action: () => setCurrentPage('projects'),
              color: 'emerald',
            },
          ].map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              onClick={item.action}
              className="glass-card p-5 text-right hover:border-white/[0.12] transition-all duration-300 group cursor-pointer"
            >
              <div
                className={`w-11 h-11 rounded-xl mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${
                  item.color === 'accent'
                    ? 'bg-accent-500/15 text-accent-400'
                    : item.color === 'gold'
                      ? 'bg-gold-500/15 text-gold-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {item.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
              <p className="text-xs sm:text-[13px] text-white/65 leading-relaxed font-medium">
                {item.desc}
              </p>
            </motion.button>
          ))}
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
          title={`تخصيص القالب — ${selectedTemplateForConfirm.name} 🎬`}
          size="md"
        >
          <div className="space-y-4 text-right">
            <div className="relative h-28 rounded-2xl overflow-hidden border border-white/10 shadow-md">
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
                <span className="text-xs text-white/60">
                  {selectedTemplateForConfirm.description}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-900 border border-white/10 space-y-3">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">
                  السورة القرآنية 📖:
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
                  className="w-full p-2 rounded-xl bg-surface-950 border border-white/10 text-xs font-bold text-white cursor-pointer"
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
                  <label className="block text-xs font-bold text-white/70 mb-1">من الآية:</label>
                  <input
                    type="number"
                    min={1}
                    max={surahs.find((s) => s.number === templateSurahNum)?.ayahCount || 7}
                    value={templateFromAyah}
                    onChange={(e) => setTemplateFromAyah(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2 rounded-xl bg-surface-950 border border-white/10 text-xs font-bold text-center text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">إلى الآية:</label>
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
                    className="w-full p-2 rounded-xl bg-surface-950 border border-white/10 text-xs font-bold text-center text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">صوت القارئ 🎙️:</label>
                <select
                  value={templateReciterId}
                  onChange={(e) => setTemplateReciterId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-surface-950 border border-white/10 text-xs font-bold text-white cursor-pointer"
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
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-surface-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <Sparkles size={15} />
                <span>إنشاء والبدء في التصميم 🚀</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplateForConfirm(null)}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold cursor-pointer transition-all"
              >
                إلغاء
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
        title="حذف المشروع"
        message={`هل أنت متأكد من حذف المشروع "${modalData?.projectName || ''}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
      />
    </AppLayout>
  );
};
