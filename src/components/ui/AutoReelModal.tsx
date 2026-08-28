import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { autoReelThemes, AutoReelTheme } from '../../data/autoReelPresets';
import { buildProjectFromTheme, generateRandomViralAutoReel } from '../../services/autoReelService';
import {
  Sparkles,
  Wand2,
  Play,
  Flame,
  Zap,
  Loader2,
} from 'lucide-react';
import { Modal } from './Modal';

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
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const randomProject = generateRandomViralAutoReel();
    addProject(randomProject);
    setCurrentProject(randomProject);
    addToast({
      message: 'تم توليد ريل فيروسي عشوائي بنجاح! 🚀 تم ضبط جميع المؤثرات تلقائياً',
      type: 'success',
    });

    setGeneratingThemeId(null);
    onClose();
    setCurrentPage('editor');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="صانع الريلز التلقائي بالذكاء الاصطناعي"
      subtitle="توليد ريل فيديو متكامل بضغطة زر واحدة: نص مشكول + خلفية سينمائية + صوت طبيعة + تظليل"
      headerIcon={<Wand2 size={22} className="text-gold-400" />}
      size="xl"
    >
      <div className="space-y-5">
        {/* Instant 1-Click Generator Hero Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-accent-500/20 via-surface-900 to-gold-500/20 border border-gold-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-black/40">
          <div className="flex items-center gap-3.5 text-right">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gold-400 to-amber-500 flex items-center justify-center text-surface-950 shadow-md shadow-gold-500/20 shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>توليد ريل عشوائي ذكي (Smart Random)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 font-bold border border-gold-400/30">
                  خوارزمية الانتشار 🔥
                </span>
              </h4>
              <p className="text-xs text-white/60 mt-0.5">
                يقوم النظام باختيار آية مؤثرة، خلفية سينمائية، وتظليل ذهبي مناسب بضغطة واحدة
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateRandom}
            disabled={generatingThemeId !== null}
            className="btn-gold py-3 px-6 text-xs sm:text-sm font-black whitespace-nowrap shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {generatingThemeId === 'random' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري التوليد السحري...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>توليد فوري الآن ⚡</span>
              </>
            )}
          </button>
        </div>

        {/* Categorized Themes Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white/90 flex items-center gap-2">
              <Flame size={14} className="text-gold-400" />
              <span>أو اختر قالباً جاهزاً وموضوعاً محدداً:</span>
            </h4>
            <span className="text-[11px] text-white/40 font-mono">
              {autoReelThemes.length} نمط متوفر
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
            {autoReelThemes.map((theme) => {
              const isGeneratingThis = generatingThemeId === theme.id;

              return (
                <motion.div
                  key={theme.id}
                  whileHover={{ y: -3 }}
                  onClick={() => !generatingThemeId && handleGenerateTheme(theme)}
                  className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.08] hover:border-gold-400/40 transition-all flex flex-col justify-between group cursor-pointer shadow-md relative overflow-hidden"
                >
                  {/* Thumbnail / Image Preview Header */}
                  <div className="relative h-28 w-full rounded-xl overflow-hidden mb-3 bg-surface-950">
                    <img
                      src={theme.backgroundUrl}
                      alt={theme.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                        ? 'btn-gold shadow-md'
                        : 'glass-button hover:bg-gold-500 hover:text-black'
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
                        <span>بدء التصميم</span>
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
