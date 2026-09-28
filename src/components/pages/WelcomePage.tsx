import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n';
import {
  Sparkles,
  ArrowLeft,
  Mic,
  Languages,
  Headphones,
  Video,
  Heart,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import { MotherDuaModal } from '../ui/MotherDuaModal';

export const WelcomePage: React.FC = () => {
  const { t } = useTranslation();
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addToast = useAppStore((s) => s.addToast);
  const startTour = useAppStore((s) => s.startTour);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const [showMotherDua, setShowMotherDua] = useState(false);

  const handleStartNow = () => {
    try {
      localStorage.setItem('athar_has_onboarded', 'true');
    } catch {
      // Ignore localStorage errors
    }
    setCurrentPage('dashboard');
    addToast({
      message: t('welcome.welcomeToast', 'مرحباً بك في أَثَــر ستوديو! 🌟 استكشف أدواتك لصناعة ريلز قرآني احترافي.'),
      type: 'success',
      duration: 8000,
      action: {
        label: t('welcome.tourAction', 'جولة سريعة (دقيقتين)'),
        onClick: () => {
          startTour();
        },
      },
    });
  };

  const featureTiles = [
    {
      icon: <Video className="text-gold-400" size={24} />,
      title: t('welcome.tile1Title', 'صانع ريلز المنصات الحديثة'),
      desc: t('welcome.tile1Desc', 'قوالب 9:16 احترافية مخصصة لمنصات TikTok و Instagram Reels و YouTube Shorts بتصميم متزن.'),
      badge: t('welcome.tile1Badge', 'تصميم سينمائي'),
      color: 'border-surface-700/40 bg-surface-900',
    },
    {
      icon: <Mic className="text-emerald-400" size={24} />,
      title: t('welcome.tile2Title', 'مكتبة كبار القراء والأصوات الخاشعة'),
      desc: t('welcome.tile2Desc', 'أكثر من 70+ قارئ معتمد بمصاحف كاملة (ياسر الدوسري، ناصر القطامي، العوسي، إدريس أبكر، وأئمة الحرمين وروايات ورش وشعبة).'),
      badge: t('welcome.tile2Badge', '70+ قارئ'),
      color: 'border-surface-700/40 bg-surface-900',
    },
    {
      icon: <Sparkles className="text-gold-400" size={24} />,
      title: t('welcome.tile3Title', 'تظليل الكلمات والموجات الصوتية'),
      desc: t('welcome.tile3Desc', 'تزامن كاريوكي فائق الدقة كلمة بكلمة مع موجات صوتية تفاعلية تنبض بنبرة صوت القارئ.'),
      badge: t('welcome.tile3Badge', 'تزامن ذكي'),
      color: 'border-surface-700/40 bg-surface-900',
    },
    {
      icon: <Languages className="text-sky-400" size={24} />,
      title: t('welcome.tile4Title', 'ترجمة فورية لـ 6 لغات عالمية'),
      desc: t('welcome.tile4Desc', 'الإنجليزية، الفرنسية، الأوردو، التركية، الإسبانية، والإندونيسية لنشر رسالة القرآن حول العالم.'),
      badge: t('welcome.tile4Badge', 'جمهور عالمي'),
      color: 'border-surface-700/40 bg-surface-900',
    },
    {
      icon: <Headphones className="text-purple-400" size={24} />,
      title: t('welcome.tile5Title', 'استوديو الصوت ثلاثي الأبعاد 8D'),
      desc: t('welcome.tile5Desc', 'صدى الحرم والمساجد الكبرى مع دمج أصوات الطبيعة (المطر، ركوب الخيل، أمواج البحر) بدقة مكانية حية.'),
      badge: t('welcome.tile5Badge', 'صوت 8D'),
      color: 'border-surface-700/40 bg-surface-900',
    },
    {
      icon: <Video className="text-rose-400" size={24} />,
      title: t('welcome.tile6Title', 'تصدير سينمائي فائق الدقة 1080p 60fps'),
      desc: t('welcome.tile6Desc', 'توليد وتصدير الفيديو بنقرة زر واحدة بأعلى معدل بت (Ultra Bitrate) مُحسّن لخوارزميات الريلز وتيك توك بدون ضغط مشوه.'),
      badge: t('welcome.tile6Badge', 'FHD 60fps'),
      color: 'border-surface-700/40 bg-surface-900',
    },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-950 overflow-y-auto text-start select-none">
      {/* Background Ambient Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-gold-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 flex-1 flex flex-col justify-between">
        {/* Top Badges */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-900 border border-surface-700/40 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-gold-400" />
            <span className="text-xs font-semibold text-surface-300">
              {t('welcome.proBadge', 'أَثَــر ستوديو • الإصدار الاحترافي v2.0')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowMotherDua(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 hover:text-gold-200 border border-gold-500/25 text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
            title={t('welcome.motherDuaTitle', 'فتح نافذة الدعاء والصدقة الجارية')}
          >
            <Heart size={14} className="text-rose-400 fill-rose-400/30" />
            <span>{t('welcome.motherDuaButton', 'صدقة جارية عن الوالدة تيجاني عائشة رحمها الله')}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark'
                ? t('welcome.toggleThemeLight', 'التبديل للوضع النهاري (فاتح)')
                : t('welcome.toggleThemeDark', 'التبديل للوضع الليلي (داكن)')
            }
            title={
              theme === 'dark'
                ? t('welcome.toggleThemeLight', 'التبديل للوضع النهاري (فاتح)')
                : t('welcome.toggleThemeDark', 'التبديل للوضع الليلي (داكن)')
            }
            className="w-8 h-8 rounded-full bg-surface-900 border border-surface-700/40 flex items-center justify-center text-surface-400 hover:text-surface-50 hover:border-gold-400/40 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} className="text-gold-400" />
            )}
          </button>
        </motion.div>

        {/* Hero Section */}
        <div className="text-center space-y-6 my-auto py-4">
          {/* Main App Icon Logo */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className="flex justify-center"
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-surface-800 border border-gold-500/30 shadow-xl">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-surface-900">
                <img
                  src="/icon.png"
                  alt="Athar Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Title & Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-2.5"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-50 tracking-tight">
              {t('welcome.appTitlePrefix', 'أَثَــر')} <span className="text-gold-400">{t('welcome.appTitleSuffix', 'ستوديو')}</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-surface-400 font-sans">
              {t('welcome.appSubTitle', 'Athar Reels Studio • Quranic Video Creator')}
            </p>
            <p className="text-sm sm:text-base text-surface-200 max-w-2xl mx-auto leading-relaxed font-normal">
              {t('welcome.heroDescription', 'المنصة الاحترافية الأولى لإنتاج الريلز والفيديوهات القرآنية بأعلى جودة وتصميم سينمائي متزن.')}
            </p>
          </motion.div>

          {/* Spiritual Verse Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="max-w-3xl mx-auto rounded-2xl bg-surface-900 border border-gold-500/20 p-6 shadow-lg relative overflow-hidden text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-md bg-surface-800 border border-surface-700/40 text-surface-300 text-xs font-semibold shadow-sm">
              <span>{t('welcome.spiritualBadge', 'سر تسمية «أَثَــر» • الصدقة الجارية')}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-arabic text-gold-300 tracking-wide leading-relaxed selectable-text">
              {t('welcome.spiritualVerse', '﴿إِنَّا نَحْنُ نُحْيِي الْمَوْتَىٰ وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ﴾')}
            </h2>

            <p className="text-xs sm:text-sm text-surface-300 max-w-2xl mx-auto leading-relaxed font-normal">
              {t('welcome.spiritualText', 'كل دقيقة تقضيها هنا في صناعة ونشر تلاوة، هي أثر مبارك وحسنات جارية تضيء لك في قبرك ويمتد أجرها بعد رحيلك.. كم من قلبٍ يلين، وكم من مكروبٍ ينفرج همّه بآية نشرتها!')}
            </p>
          </motion.div>

          {/* Primary Call-to-Action */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="pt-2 flex flex-col items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={handleStartNow}
              className="btn-gold px-8 py-3.5 text-sm sm:text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-98"
            >
              <span>{t('welcome.startNowBtn', 'ابدأ الآن واصنع أثرك القرآني')}</span>
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-5 text-xs text-surface-400 font-normal">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-accent-400" />
                {t('welcome.instantTemplates', 'قوالب جاهزة بضغطة واحدة')}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-accent-400" />
                {t('welcome.interactiveTour', 'جولة إرشادية تفاعلية للتعرف على الأدوات')}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Feature Showcase Grid */}
        <div className="py-6 border-t border-surface-700/40">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-surface-50 mb-1">{t('welcome.featuresTitle', 'مميزات وإمكانيات «أَثَــر ستوديو»')}</h2>
            <p className="text-xs text-surface-400">
              {t('welcome.featuresSubtitle', 'كل ما تحتاجه لصناعة محتوى قرآني يحقق ملايين المشاهدات')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureTiles.map((tile, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i + 0.2, duration: 0.3 }}
                className={`p-4 sm:p-5 rounded-xl border ${tile.color} hover:border-gold-500/30 transition-all group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-surface-800/60">{tile.icon}</div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-surface-800/60 text-surface-400">
                    {tile.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-surface-50 mb-1.5 group-hover:text-gold-300 transition-colors">
                  {tile.title}
                </h3>
                <p className="text-xs text-surface-400 leading-relaxed font-normal">{tile.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Banner CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-5 rounded-xl bg-surface-900 border border-surface-700/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start"
        >
          <div>
            <h4 className="text-sm font-bold text-surface-50">{t('welcome.bottomBannerTitle', 'جاهز لنشر آيات الله وإحياء أثرك؟')}</h4>
            <p className="text-xs text-surface-400 mt-0.5">
              {t('welcome.bottomBannerSubtitle', 'ادخل مباشرة إلى لوحة التحكم واستكشف القوالب الرائجة')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartNow}
            className="px-5 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-50 hover:text-accent-500 border border-surface-700/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>{t('welcome.goToDashboard', 'انطلق إلى لوحة التحكم')}</span>
            <ArrowLeft size={14} />
          </button>
        </motion.div>
      </div>

      {/* Mother Dua & Ongoing Charity Modal */}
      <MotherDuaModal isOpen={showMotherDua} onClose={() => setShowMotherDua(false)} />
    </div>
  );
};
