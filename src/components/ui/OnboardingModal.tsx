import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { studioTemplates } from '../../data/templates';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const addProject = useAppStore((s) => s.addProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addToast = useAppStore((s) => s.addToast);

  const handleInstantDemoReel = () => {
    const tpl = studioTemplates.find((t) => t.id === 'aesthetic_rain') || studioTemplates[0];
    const demoProject = {
      id: `proj-demo-${Date.now()}`,
      name: 'ريلز تجريبي — سورة الإخلاص',
      reciter: 'مشاري راشد العفاسي',
      reciterId: 'alafasy_128',
      surah: 'الإخلاص',
      surahNumber: 112,
      fromAyah: 1,
      toAyah: 4,
      aspectRatio: '9:16' as const,
      backgroundType: 'image' as const,
      backgroundUrl:
        tpl.backgroundUrl ||
        'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
      backgroundOpacity: 0.7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft' as const,
      exportCount: 0,
      watermark: 'atar-studio.com',
      textSettings: {
        fontSize: 30,
        fontWeight: 'bold' as const,
        textAlign: 'center' as const,
        textColor: '#ffffff',
        bgColor: '#000000',
        bgOpacity: 0.55,
        position: 'center' as const,
        translationFontSize: 16,
        translationColor: '#e2e8f0',
        fontFamily: 'Amiri',
        wordHighlightEnabled: true,
        wordHighlightStyle: 'goldGlow' as const,
        ...tpl.textSettings,
      },
      audioSettings: {
        recitationVolume: 90,
        fadeIn: true,
        fadeOut: true,
        fadeDuration: 2,
        backgroundVolume: 20,
        ...tpl.audioSettings,
      },
      translationEnabled: false,
      tafsirEnabled: false,
    };

    addProject(demoProject);
    setCurrentProject(demoProject);
    addToast({
      message: 'تم توليد الريل التجريبي الأول بنجاح! مرحباً بك في المحرر 🚀',
      type: 'success',
    });
    onClose();
    setCurrentPage('editor');
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in"
        role="dialog"
        aria-modal="true"
        aria-label="دليل البدء السريع"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg rounded-3xl bg-surface-900 border border-gold-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-gold-400 to-amber-500 text-black flex items-center justify-center shadow-xl shadow-gold-500/20">
              <Sparkles size={28} />
            </div>
            <h2 className="text-xl font-bold text-white">مرحباً بك في أثر ستوديو 👋</h2>
            <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
              الاستوديو الاحترافي لإنتاج ريلز وبوستات إسلامية سينمائية لمنصات التواصل في ثوانٍ
              معدودة.
            </p>
          </div>

          {/* 3 Simple Steps Highlight */}
          <div className="space-y-3 mb-6">
            <div className="p-3 rounded-2xl bg-surface-950/60 border border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-500/20 text-accent-300 flex items-center justify-center shrink-0 font-bold text-xs">
                1
              </div>
              <div className="text-right min-w-0">
                <h4 className="text-xs font-bold text-white">اختر السورة والآيات</h4>
                <p className="text-[11px] text-white/65">أكثر من 70+ قارئ معتمد بمصاحف كاملة</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-950/60 border border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gold-500/20 text-gold-300 flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div className="text-right min-w-0">
                <h4 className="text-xs font-bold text-white">اختر القالب والخلفية السينمائية</h4>
                <p className="text-[11px] text-white/65">
                  قوالب سينمائية جاهزة، مطر، كعبة، نجوم، وصوت 8D
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-950/60 border border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 font-bold text-xs">
                3
              </div>
              <div className="text-right min-w-0">
                <h4 className="text-xs font-bold text-white">تصدير فوري بنقرة واحدة</h4>
                <p className="text-[11px] text-white/65">
                  جاهز للتيك توك، إنستغرام ريلز، وشورتس يوتيوب
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5">
            <button
              onClick={handleInstantDemoReel}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-gold-500/20 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Wand2 size={16} />
              <span>أنشئ أول ريل تجريبي في 5 ثوانٍ ⚡</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium text-xs transition-all cursor-pointer"
            >
              أريد استكشاف الاستوديو بنفسي
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
