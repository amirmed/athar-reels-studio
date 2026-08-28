import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Lightbulb,
  Layers,
  Wand2,
  Zap,
} from 'lucide-react';

interface TourStep {
  targetSelector?: string;
  page?: 'dashboard' | 'create' | 'editor';
  title: string;
  description: string;
  tip?: string;
  icon: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="sidebar-nav"]',
    page: 'dashboard',
    title: 'الشريط الجانبي الذكي 🗂️',
    description:
      'تنقل بسهولة بين 4 أقطاب رئيسية: الرئيسية، استوديو الإنشاء الشامل، مشاريعك وتصديراتك، والإعدادات.',
    tip: 'تم تبسيط القائمة لتقليل التشتيت مع الحفاظ على كل الأدوات بنقرة واحدة.',
    icon: <Layers className="text-gold-400" size={24} />,
    position: 'right',
  },
  {
    targetSelector: '[data-tour="daily-ayah"]',
    page: 'dashboard',
    title: 'آية اليوم والتوليد الفوري ⚡',
    description:
      'كل يوم آية مختارة بتصميم سينمائي وتظليل الكلمات. اضغط على الزر لتوليد ريل كامل في 3 ثوانٍ فقط!',
    tip: 'جاهزة بأصوات كبار القراء وخلفيات سينمائية فائقة النقاء وصوت الطبيعة الهادئ.',
    icon: <Sparkles className="text-amber-400" size={24} />,
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="trending-templates"]',
    page: 'dashboard',
    title: 'القوالب السينمائية الجاهزة 🎨',
    description:
      'اختر قالباً جاهزاً كنقطة انطلاق (مطر، صحراء، كعبة ومساجد، نجوم ومجرات) للتصدير فوراً.',
    tip: 'القالب يضبط لك الصوت، التدرج اللوني، وتظليل الخطوط الذهبي تلقائياً.',
    icon: <Wand2 className="text-pink-400" size={24} />,
    position: 'top',
  },
  {
    targetSelector: '[data-tour="create-formats"]',
    page: 'create',
    title: 'استوديو الإنشاء الشامل 🕌',
    description:
      'اختر ما تريد إنتاجه: ريلز قرآني، أذكار وأحاديث، كروت صور وبوستات HD، أو تسجيل تلاوتك بصوتك الخاص مع صدى المساجد.',
    tip: 'أكثر من 70+ قارئ معتمد بمصاحف كاملة مع إمكانية تحديد الآيات بدقة.',
    icon: <Zap className="text-gold-400" size={24} />,
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="editor-mode-toggle"]',
    page: 'editor',
    title: 'المحرر الذكي: وضع مبسط ووضع PRO 🎯',
    description:
      'إذا كنت مبتدئاً، استخدم الوضع المبسط (القارئ، الخلفية، الخط). وإذا أردت احترافية كاملة، فعّل وضع PRO للتحكم في رادار 8D وصوت المساجد!',
    tip: 'يمكنك التبديل بين الوضعين بنقرة واحدة في أي وقت.',
    icon: <Lightbulb className="text-purple-400" size={24} />,
    position: 'bottom',
  },
  {
    page: 'dashboard',
    title: 'أنت الآن جاهز لصناعة أول ريل مبارك! 🚀',
    description:
      'ابدأ الآن بصناعة محتواك الإسلامي وانشره على تيك توك، إنستغرام ريلز، وشورتس يوتيوب ليكون أثراً طيباً في ميزان حسناتك.',
    tip: 'يمكنك استدعاء هذه الجولة الإرشادية في أي وقت بالضغط على أيقونة المساعدة (؟).',
    icon: <CheckCircle2 className="text-emerald-400" size={28} />,
    position: 'center',
  },
];

export const InteractiveTourGuide: React.FC = () => {
  const isTourActive = useAppStore((s) => s.isTourActive);
  const tourStep = useAppStore((s) => s.tourStep);
  const stopTour = useAppStore((s) => s.stopTour);
  const nextTourStep = useAppStore((s) => s.nextTourStep);
  const prevTourStep = useAppStore((s) => s.prevTourStep);
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addToast = useAppStore((s) => s.addToast);

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStepData = TOUR_STEPS[tourStep];

  // Measure and update target bounding box
  const updateTargetPosition = useCallback(() => {
    if (!isTourActive || !currentStepData) {
      setTargetRect(null);
      return;
    }

    if (!currentStepData.targetSelector) {
      setTargetRect(null);
      return;
    }

    const elem = document.querySelector(currentStepData.targetSelector);
    if (elem) {
      const rect = elem.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isTourActive, currentStepData]);

  // Navigate to step's required page if different
  useEffect(() => {
    if (isTourActive && currentStepData?.page && currentPage !== currentStepData.page) {
      setCurrentPage(currentStepData.page);
    }
  }, [isTourActive, currentStepData, currentPage, setCurrentPage]);

  // Update target on step change, resize, scroll
  useEffect(() => {
    if (!isTourActive) return;

    // Small delay to allow page rendering
    const timer = setTimeout(() => {
      updateTargetPosition();
    }, 150);

    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [isTourActive, tourStep, currentPage, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopTour();
        addToast({ message: 'تم إغلاق الجولة التعليمية', type: 'info' });
      } else if (e.key === 'ArrowLeft') {
        if (tourStep < TOUR_STEPS.length - 1) nextTourStep();
      } else if (e.key === 'ArrowRight') {
        if (tourStep > 0) prevTourStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, tourStep, stopTour, nextTourStep, prevTourStep, addToast]);

  if (!isTourActive || !currentStepData) return null;

  const isLastStep = tourStep === TOUR_STEPS.length - 1;
  const isFirstStep = tourStep === 0;

  // Calculate Tooltip position based on targetRect
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || currentStepData.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed',
      };
    }

    const margin = 16;
    const tooltipWidth = 360;
    const tooltipHeight = 260;

    let top = targetRect.bottom + margin;
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

    if (currentStepData.position === 'top') {
      top = Math.max(margin, targetRect.top - tooltipHeight - margin);
    } else if (currentStepData.position === 'right') {
      top = Math.max(margin, targetRect.top + targetRect.height / 2 - tooltipHeight / 2);
      left = targetRect.left - tooltipWidth - margin;
    } else if (currentStepData.position === 'left') {
      top = Math.max(margin, targetRect.top + targetRect.height / 2 - tooltipHeight / 2);
      left = targetRect.right + margin;
    }

    // Keep within window boundaries
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));

    return {
      top: `${top}px`,
      left: `${left}px`,
      position: 'fixed',
    };
  };

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-auto">
      {/* SVG Spotlight Cutout Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers entire screen */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight area around target element */}
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="18"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Dark backdrop using mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.78)"
          mask="url(#tour-spotlight-mask)"
          className="transition-all duration-300"
        />
      </svg>

      {/* Target Element Glowing Border Box */}
      {targetRect && (
        <motion.div
          layoutId="tour-spotlight-border"
          initial={false}
          animate={{
            x: targetRect.left - 6,
            y: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="absolute rounded-2xl border-2 border-gold-400 shadow-[0_0_35px_rgba(251,191,36,0.5)] pointer-events-none z-10 animate-pulse"
        />
      )}

      {/* Floating Tour Guide Tooltip Card */}
      <motion.div
        key={tourStep}
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 8 }}
        transition={{ duration: 0.25 }}
        style={getTooltipStyle()}
        className="w-[360px] max-w-[calc(100vw-32px)] rounded-3xl bg-surface-900/98 border border-gold-500/40 p-5 shadow-2xl backdrop-blur-2xl text-start z-20 pointer-events-auto"
      >
        {/* Header: Icon & Step Indicator & Close */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center shadow-md shadow-gold-500/10">
              {currentStepData.icon}
            </div>
            <div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30">
                الخطوة {tourStep + 1} من {TOUR_STEPS.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopTour();
              addToast({ message: 'تم إغلاق الجولة التعليمية', type: 'info' });
            }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
            title="تخطي الجولة (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5 mb-3">
          <h3 className="text-sm font-bold text-white tracking-tight">{currentStepData.title}</h3>
          <p className="text-xs text-white/80 leading-relaxed">{currentStepData.description}</p>
        </div>

        {/* Pro Tip Box */}
        {currentStepData.tip && (
          <div className="p-2.5 rounded-xl bg-surface-950/80 border border-white/[0.08] flex items-start gap-2 mb-4">
            <Lightbulb size={14} className="text-gold-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gold-200/90 leading-snug">{currentStepData.tip}</p>
          </div>
        )}

        {/* Step Progress Dots */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === tourStep
                    ? 'w-5 bg-gold-400 shadow-sm shadow-gold-400/50'
                    : idx < tourStep
                      ? 'w-2 bg-gold-400/40'
                      : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                type="button"
                onClick={prevTourStep}
                className="py-1.5 px-3 rounded-xl bg-surface-800 hover:bg-surface-700 text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <ArrowRight size={12} />
                <span>السابق</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  stopTour();
                  addToast({
                    message: 'مبروك! أنت الآن جاهز لصناعة ريلز احترافي 🚀✨',
                    type: 'success',
                  });
                } else {
                  nextTourStep();
                }
              }}
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-black text-xs font-bold flex items-center gap-1 shadow-md shadow-gold-500/20 hover:scale-105 transition-all cursor-pointer"
            >
              <span>{isLastStep ? 'ابدأ الآن 🚀' : 'التالي'}</span>
              {!isLastStep && <ArrowLeft size={12} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
