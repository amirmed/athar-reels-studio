import React from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { studioTemplates } from '../../data/templates';
import { createDefaultProject } from '../../utils/projectDefaults';
import { Modal } from './Modal';

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
    const demoProject = createDefaultProject({
      name: 'ريلز تجريبي — سورة الإخلاص',
      reciter: 'مشاري راشد العفاسي',
      reciterId: 'alafasy_128',
      surah: 'الإخلاص',
      surahNumber: 112,
      fromAyah: 1,
      toAyah: 4,
      aspectRatio: '9:16',
      backgroundType: 'image',
      backgroundUrl:
        tpl.backgroundUrl ||
        'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
      backgroundOpacity: 0.7,
      watermark: 'atar-studio.com',
      textSettings: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        textColor: '#ffffff',
        bgColor: '#000000',
        bgOpacity: 0.55,
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
        backgroundVolume: 20,
        ...tpl.audioSettings,
      },
    });

    addProject(demoProject);
    setCurrentProject(demoProject);
    addToast({
      message: 'تم توليد الريل التجريبي الأول بنجاح! مرحباً بك في المحرر 🚀',
      type: 'success',
    });
    onClose();
    setCurrentPage('editor');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="مرحباً بك في أثر ستوديو 👋"
      subtitle="الاستوديو الاحترافي لإنتاج ريلز وبوستات إسلامية سينمائية"
      headerIcon={<Sparkles size={20} className="text-gold-400" />}
      size="md"
    >
      <div className="space-y-5">
        {/* 3 Simple Steps Highlight */}
        <div className="space-y-2.5">
          <div className="p-3 rounded-2xl bg-surface-900 border border-surface-700/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-500/20 text-accent-600 dark:text-accent-300 flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div className="text-start min-w-0">
              <h4 className="text-xs font-bold text-surface-50">اختر السورة والآيات</h4>
              <p className="text-[11px] text-surface-400">أكثر من 70+ قارئ معتمد بمصاحف كاملة</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-900 border border-surface-700/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold-500/20 text-gold-600 dark:text-gold-300 flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div className="text-start min-w-0">
              <h4 className="text-xs font-bold text-surface-50">اختر القالب والخلفية السينمائية</h4>
              <p className="text-[11px] text-surface-400">
                قوالب سينمائية جاهزة، مطر، كعبة، نجوم، وصوت 8D
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-900 border border-surface-700/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div className="text-start min-w-0">
              <h4 className="text-xs font-bold text-surface-50">تصدير فوري بنقرة واحدة</h4>
              <p className="text-[11px] text-surface-400">
                جاهز للتيك توك، إنستغرام ريلز، وشورتس يوتيوب
              </p>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="space-y-2 pt-2 border-t border-surface-700/40">
          <button
            onClick={handleInstantDemoReel}
            className="btn-gold w-full py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
          >
            <Wand2 size={16} />
            <span>أنشئ أول ريل تجريبي في 5 ثوانٍ ⚡</span>
          </button>

          <button
            onClick={onClose}
            className="btn-ghost w-full py-2.5 px-4 rounded-xl text-xs font-medium"
          >
            أريد استكشاف الاستوديو بنفسي
          </button>
        </div>
      </div>
    </Modal>
  );
};
