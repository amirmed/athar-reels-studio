import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { autoReelThemes, AutoReelTheme } from '../../data/autoReelPresets';
import { buildProjectFromTheme, generateRandomViralAutoReel } from '../../services/autoReelService';
import {
  Sparkles,
  Wand2,
  X,
  Play,
  Check,
  Flame,
  Volume2,
  Image as ImageIcon,
  Zap,
  ArrowLeft,
  Loader2,
  Layers,
} from 'lucide-react';

interface AutoReelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoReelModal: React.FC<AutoReelModalProps> = ({ isOpen, onClose }) => {
  const addProject = useAppStore((s) => s.addProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addToast = useAppStore((s) => s.addToast);
  const [generatingThemeId, setGeneratingThemeId] = useState<string | null>(null);

  const handleGenerateTheme = async (theme: AutoReelTheme) => {
    setGeneratingThemeId(theme.id);

    // 1.2s smooth generation animation
    await new Promise((resolve) => setTimeout(resolve, 800));

    const project = buildProjectFromTheme(theme);
    addProject(project);
    setCurrentProject(project);
    addToast({
      message: `تم توليد ريل "${theme.title}" بنجاح! ✨ جاهز للمعاينة والتصدير`,
      type: 'success',
    });

    setGeneratingThemeId(null);
    onClose();
    setCurrentPage('editor');
  };

  const handleGenerateRandom = async () => {
    setGeneratingThemeId('random');

    await new Promise((resolve) => setTimeout(resolve, 900));

    const project = generateRandomViralAutoReel();
    addProject(project);
    setCurrentProject(project);
    addToast({
      message: `تم توليد ريل "${project.name}" الفيروسي بنجاح! 🚀`,
      type: 'success',
    });

    setGeneratingThemeId(null);
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="صانع الريلز القرآني التلقائي الفيروسي"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-surface-950/95 border border-white/[0.1] shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-white/[0.06] flex items-center justify-between relative overflow-hidden bg-gradient-to-r from-accent-500/10 via-gold-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-gold-500 flex items-center justify-center text-white shadow-lg shadow-accent-500/30">
                <Wand2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    صانع الريلز التلقائي بالذكاء الاصطناعي
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gradient-to-r from-accent-500 to-gold-500 text-white font-bold shadow-sm">
                    AI Auto-Reels ⚡
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  توليد ريل فيديو متكامل بضغطة زر واحدة: نص مشكول + خلفية سينمائية متناسقة + صوت
                  طبيعة نقي + تظليل الكلمات
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-800/60 hover:bg-surface-700 text-white/60 hover:text-white flex items-center justify-center border border-white/[0.06] transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Surprise Viral Hero Card */}
            <div
              onClick={handleGenerateRandom}
              className="relative rounded-2xl bg-gradient-to-r from-accent-600/30 via-gold-500/20 to-purple-600/30 border border-accent-400/40 hover:border-gold-400/80 p-5 cursor-pointer transition-all duration-300 group shadow-xl hover:shadow-accent-500/20 overflow-hidden"
            >
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-right">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-accent-500 text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform shrink-0">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <h4 className="text-base font-bold text-white group-hover:text-gold-300 transition-colors">
                        توليد ريل اليوم الفيروسي (مفاجأة ذكية متكاملة)
                      </h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 font-bold border border-gold-400/40 animate-pulse">
                        نقرة واحدة 🚀
                      </span>
                    </div>
                    <p className="text-xs text-white/60">
                      يختار الذكاء الاصطناعي أفضل آية أو حديث لليوم، مع أفضل خلفية ومؤثرات صوتية
                      وقالب ذهبي جاهز للتصدير فوراً!
                    </p>
                  </div>
                </div>

                <button
                  disabled={generatingThemeId === 'random'}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-gold-400 to-accent-500 hover:from-gold-300 hover:to-accent-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-gold-500/20 group-hover:scale-105 transition-all shrink-0"
                >
                  {generatingThemeId === 'random' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>جاري التوليد...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>توليد الريل الفيروسي الآن</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Curated Theme Packs Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                  <Flame size={14} className="text-gold-400" />
                  أو اختر ثيماً وباقة سينمائية محددة:
                </h4>
                <span className="text-xs text-white/40">{autoReelThemes.length} ثيمات جاهزة</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {autoReelThemes.map((theme) => {
                  const isGeneratingThis = generatingThemeId === theme.id;

                  return (
                    <div
                      key={theme.id}
                      onClick={() => !generatingThemeId && handleGenerateTheme(theme)}
                      className="group relative rounded-2xl bg-surface-900/70 border border-white/[0.06] hover:border-white/[0.15] p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between hover:bg-surface-800/80 shadow-md hover:shadow-xl"
                    >
                      {/* Background Thumbnail Preview */}
                      <div className="relative h-28 rounded-xl overflow-hidden mb-3 bg-black">
                        <img
                          src={theme.backgroundUrl}
                          alt={theme.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white/90 font-bold border border-white/[0.1]">
                            {theme.badge}
                          </span>
                        </div>

                        <div className="absolute bottom-2 right-2 left-2 flex items-center justify-between">
                          <span className="text-xl">{theme.icon}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-gold-300 font-mono">
                            {theme.contentType === 'quran' ? theme.surahName : theme.customTitle}
                          </span>
                        </div>
                      </div>

                      {/* Info & Details */}
                      <div className="space-y-1 mb-3">
                        <h5 className="text-xs font-bold text-white group-hover:text-gold-300 transition-colors">
                          {theme.title}
                        </h5>
                        <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                          {theme.subtitle}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        disabled={isGeneratingThis}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isGeneratingThis
                            ? 'bg-accent-500 text-white'
                            : 'bg-surface-800 group-hover:bg-accent-500 text-white/80 group-hover:text-white border border-white/[0.06] group-hover:border-accent-400/50'
                        }`}
                      >
                        {isGeneratingThis ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>جاري التجهيز...</span>
                          </>
                        ) : (
                          <>
                            <Play
                              size={12}
                              className="group-hover:scale-110 transition-transform fill-current"
                            />
                            <span>توليد هذا الريل</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
