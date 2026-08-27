import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Check, Flame, Layers, Wand2 } from 'lucide-react';
import { studioTemplates } from '../../data/templates';
import { StudioTemplate } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useHotkeys } from '../../hooks/useHotkeys';

interface PresetTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: StudioTemplate) => void;
  activeTemplateId?: string;
}

export const PresetTemplatesModal: React.FC<PresetTemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  activeTemplateId,
}) => {
  const addToast = useAppStore((s) => s.addToast);
  const [selectedId, setSelectedId] = useState<string | null>(activeTemplateId || null);

  useHotkeys('Escape', onClose, { enabled: isOpen });

  if (!isOpen) return null;

  const handleSelectAndApply = (tpl: StudioTemplate) => {
    setSelectedId(tpl.id);
    onApplyTemplate(tpl);
    addToast({
      message: `تم تطبيق قالب «${tpl.name}» بنجاح في ثانية واحدة! ✨`,
      type: 'success',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 text-right select-none"
        role="dialog"
        aria-modal="true"
        aria-label="قوالب الريلز الجاهزة الفيروسية"
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
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-surface-900 border border-gold-400/30 rounded-3xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/[0.08] bg-surface-950/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-gold-500/20 to-amber-500/20 border border-gold-400/30 text-gold-300 flex items-center justify-center shadow-lg shadow-gold-500/10">
                <Wand2 size={22} className="text-gold-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>مكتبة القوالب السينمائية الجاهزة</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold-400/15 text-gold-300 border border-gold-400/30 font-bold">
                    1-Click Styles 🔥
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  تطبيق فوري لجميع إعدادات الخطوط، الخلفيات، التظليل، الموجات الصوتية والمؤثرات
                  بضغطة واحدة
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white/60 hover:text-white transition-all border border-white/[0.06]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Templates Grid */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 custom-scrollbar">
            {studioTemplates.map((tpl) => {
              const isSelected = selectedId === tpl.id;
              return (
                <motion.div
                  key={tpl.id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleSelectAndApply(tpl)}
                  className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all shadow-lg group flex flex-col justify-between ${
                    isSelected
                      ? 'border-gold-400 shadow-gold-500/20 bg-surface-950'
                      : 'border-white/[0.08] hover:border-gold-400/50 bg-surface-950/80'
                  }`}
                >
                  {/* Thumbnail Banner */}
                  <div className="relative h-32 w-full overflow-hidden bg-surface-900">
                    <img
                      src={tpl.backgroundUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/30 to-transparent" />

                    {/* Tag Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-sm">
                        {tpl.tag}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="absolute bottom-2 right-3 text-2xl drop-shadow-md">
                      {tpl.icon}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1 group-hover:text-gold-300 transition-colors flex items-center justify-between">
                        <span>{tpl.name}</span>
                        <span className="text-[11px] text-white/40 font-normal">
                          {tpl.englishName}
                        </span>
                      </h4>
                      <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>

                    {/* Features Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.06] text-[11px] text-white/50">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.04]">
                        خط: {tpl.textSettings.fontFamily}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.04]">
                        توهج: {tpl.textSettings.wordHighlightStyle}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.04]">
                        موجات: {tpl.textSettings.waveformStyle || 'pulse'}
                      </span>
                    </div>

                    {/* Apply Button */}
                    <button
                      type="button"
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-gold-500 text-black shadow-md shadow-gold-500/20'
                          : 'bg-surface-800 hover:bg-gold-400 hover:text-black text-white/80'
                      }`}
                    >
                      {isSelected ? <Check size={14} /> : <Wand2 size={14} />}
                      <span>
                        {isSelected ? 'القالب المطبق حالياً' : 'تطبيق هذا القالب بنقرة واحدة'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="p-4 bg-surface-950 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/50">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-gold-400" />
              <span>يمكنك تعديل أي تفصيلة لاحقاً من لوحة الإعدادات بعد تطبيق القالب.</span>
            </div>
            <button
              onClick={onClose}
              className="py-1.5 px-4 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
