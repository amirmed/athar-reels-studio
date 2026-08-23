import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  Sparkles,
  ArrowLeft,
  Flame,
  Mic,
  Languages,
  Layers,
  Headphones,
  Video,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { MotherDuaModal } from '../ui/MotherDuaModal';

export const WelcomePage: React.FC = () => {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addToast = useAppStore((s) => s.addToast);
  const startTour = useAppStore((s) => s.startTour);
  const [showMotherDua, setShowMotherDua] = useState(false);

  const handleStartNow = () => {
    try {
      localStorage.setItem('athar_has_onboarded', 'true');
    } catch {
      // Ignore localStorage errors
    }
    setCurrentPage('dashboard');
    addToast({
      message: 'مرحباً بك في أَثَــر ستوديو! 🌟 استكشف أدواتك لصناعة ريلز قرآني احترافي.',
      type: 'success',
      duration: 8000,
      action: {
        label: 'جولة سريعة (دقيقتين) 🚀',
        onClick: () => {
          startTour();
        },
      },
    });
  };

  const featureTiles = [
    {
      icon: <Flame className="text-amber-400" size={24} />,
      title: 'صانع الفيديوهات الفيروسية',
      desc: 'قوالب 9:16 مخصصة لخوارزميات TikTok و Instagram Reels و YouTube Shorts لتحقيق أعلى انتشار وتفاعل.',
      badge: 'إصدار 2026',
      color: 'border-white/[0.08] bg-surface-900',
    },
    {
      icon: <Mic className="text-emerald-400" size={24} />,
      title: 'مكتبة كبار القراء والأصوات الخاشعة',
      desc: 'أكثر من 70+ قارئ معتمد بمصاحف كاملة (ياسر الدوسري، ناصر القطامي، العوسي، إدريس أبكر، وأئمة الحرمين وروايات ورش وشعبة).',
      badge: '70+ قارئ',
      color: 'border-white/[0.08] bg-surface-900',
    },
    {
      icon: <Sparkles className="text-gold-400" size={24} />,
      title: 'تظليل الكلمات والموجات الصوتية',
      desc: 'تزامن كاريوكي فائق الدقة كلمة بكلمة مع موجات صوتية تفاعلية تنبض بنبرة صوت القارئ.',
      badge: 'تزامن ذكي',
      color: 'border-white/[0.08] bg-surface-900',
    },
    {
      icon: <Languages className="text-sky-400" size={24} />,
      title: 'ترجمة فورية لـ 6 لغات عالمية',
      desc: 'الإنجليزية، الفرنسية، الأوردو، التركية، الإسبانية، والإندونيسية لنشر رسالة القرآن حول العالم.',
      badge: 'جمهور عالمي',
      color: 'border-white/[0.08] bg-surface-900',
    },
    {
      icon: <Headphones className="text-purple-400" size={24} />,
      title: 'استوديو الصوت ثلاثي الأبعاد 8D',
      desc: 'صدى الحرم والمساجد الكبرى مع دمج أصوات الطبيعة (المطر، ركوب الخيل، أمواج البحر) بدقة مكانية حية.',
      badge: 'صوت 8D',
      color: 'border-white/[0.08] bg-surface-900',
    },
    {
      icon: <Video className="text-rose-400" size={24} />,
      title: 'تصدير سينمائي فائق الدقة 1080p 60fps',
      desc: 'توليد وتصدير الفيديو بنقرة زر واحدة بأعلى معدل بت (Ultra Bitrate) مُحسّن لخوارزميات الريلز وتيك توك بدون ضغط مشوه.',
      badge: 'FHD 60fps',
      color: 'border-white/[0.08] bg-surface-900',
    },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-950 overflow-y-auto text-right select-none">
      {/* Background Ambient Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-accent-500/10 via-surface-900/10 to-transparent rounded-full blur-[90px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 flex-1 flex flex-col justify-between">
        {/* Top Badges */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-900 border border-white/[0.08] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
            <span className="text-xs font-bold text-white/80">
              أَثَــر ستوديو • الإصدار الاحترافي v2.0
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowMotherDua(true)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/20 text-xs font-bold text-emerald-300 transition-all cursor-pointer active:scale-95"
          >
            <Heart size={13} className="text-rose-400 fill-rose-400/40" />
            <span>صدقة جارية للوالدة تيجاني عائشة (رحمها الله) • اضغط للدعاء</span>
          </button>
        </motion.div>

        {/* Hero Section */}
        <div className="text-center space-y-6 mb-10">
          {/* Official Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="relative w-28 h-28 mx-auto"
          >
            <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/[0.12] shadow-xl bg-surface-900">
              <img
                src="/logo.png"
                alt="Athar Reels Studio Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Title & Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-3"
          >
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              أَثَــر <span className="text-accent-400">ستوديو</span>
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-white/60 font-sans">
              Athar Reels Studio • Quranic Video Creator
            </p>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed font-medium">
              المنصة الاحترافية الأولى لإنتاج الريلز والفيديوهات القرآنية الفيروسية بأعلى جودة
              وتصميم سينمائي مبتكر.
            </p>
          </motion.div>

          {/* Spiritual Verse Card (Balanced Accent) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-3xl mx-auto rounded-3xl bg-surface-900 border border-gold-400/20 p-6 sm:p-7 shadow-xl relative overflow-hidden text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-800 border border-white/[0.06] text-white/70 text-xs font-bold shadow-sm">
              <span>سر تسمية «أَثَــر» • الصدقة الجارية</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-bold font-arabic text-gold-300 tracking-wide leading-relaxed selectable-text">
              ﴿إِنَّا نَحْنُ نُحْيِي الْمَوْتَىٰ وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ﴾
            </h2>

            <p className="text-sm text-white/75 max-w-2xl mx-auto leading-relaxed font-medium">
              كل دقيقة تقضيها هنا في صناعة ونشر تلاوة، هي{' '}
              <strong className="text-gold-300">أثر مبارك وحسنات جارية</strong> تضيء لك في قبرك
              ويمتد أجرها بعد رحيلك.. كم من قلبٍ يلين، وكم من مكروبٍ ينفرج همّه بآية نشرتها!
            </p>
          </motion.div>

          {/* 🌟 The Main Single Primary Call-to-Action (Focused Gold Hero) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="pt-2 flex flex-col items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={handleStartNow}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-gold-400 via-amber-500 to-amber-600 hover:from-gold-300 hover:to-amber-500 text-surface-950 font-black text-base sm:text-lg shadow-xl shadow-gold-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
              <span>ابدأ الآن واصنع أثرك القرآني</span>
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-5 text-xs text-white/60 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                قوالب جاهزة بضغطة واحدة
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                جولة إرشادية تفاعلية للتعرف على الأدوات
              </span>
            </div>
          </motion.div>
        </div>

        {/* Feature Showcase Grid */}
        <div className="py-6 border-t border-white/[0.06]">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-white mb-1">مميزات وإمكانيات «أَثَــر ستوديو»</h2>
            <p className="text-xs text-white/50">
              كل ما تحتاجه لصناعة محتوى قرآني يحقق ملايين المشاهدات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureTiles.map((tile, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i + 0.3, duration: 0.4 }}
                className={`p-4 sm:p-5 rounded-2xl border ${tile.color} hover:border-white/[0.15] transition-all hover:-translate-y-0.5 group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-white/[0.05]">{tile.icon}</div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/70">
                    {tile.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-accent-400 transition-colors">
                  {tile.title}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">{tile.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Banner CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-5 rounded-2xl bg-surface-900 border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right"
        >
          <div>
            <h4 className="text-sm font-bold text-white">جاهز لنشر آيات الله وإحياء أثرك؟</h4>
            <p className="text-xs text-white/60 mt-0.5">
              ادخل مباشرة إلى لوحة التحكم واستكشف القوالب الرائجة
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartNow}
            className="px-5 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white hover:text-accent-400 border border-white/[0.08] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>انطلق إلى لوحة التحكم</span>
            <ArrowLeft size={14} />
          </button>
        </motion.div>
      </div>

      {/* Mother Dua & Ongoing Charity Modal */}
      <MotherDuaModal isOpen={showMotherDua} onClose={() => setShowMotherDua(false)} />
    </div>
  );
};
