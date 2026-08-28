import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, Wand2 } from 'lucide-react';
import { studioTemplates } from '../../data/templates';
import { StudioTemplate } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from './Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="مكتبة القوالب السينمائية الجاهزة"
      subtitle="تطبيق فوري لجميع إعدادات الخطوط، الخلفيات، والتأثيرات بضغطة واحدة"
      headerIcon={<Wand2 size={20} className="text-gold-400" />}
      size="xl"
    >
      <div className="space-y-4">
        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="absolute top-2.5 end-2.5">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-sm">
                      {tpl.tag}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="absolute bottom-2 start-3 text-2xl drop-shadow-md">
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
                        ? 'btn-gold shadow-md'
                        : 'glass-button hover:bg-gold-500 hover:text-black'
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
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/50">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-gold-400" />
            <span>يمكنك تعديل أي تفصيلة لاحقاً من لوحة الإعدادات بعد تطبيق القالب.</span>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost py-1.5 px-4 text-xs font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
};
