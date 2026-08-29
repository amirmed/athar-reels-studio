import React from 'react';
import { StudioTemplate } from '../../../types';
import { studioTemplates } from '../../../data/templates';
import { Sparkles, Film } from 'lucide-react';

interface TemplatesPanelProps {
  activeTemplateId: string | null;
  onApplyTemplate: (template: StudioTemplate) => void;
  onOpenPresetModal: () => void;
  onOpenClipLibrary?: () => void;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  activeTemplateId,
  onApplyTemplate,
  onOpenPresetModal,
  onOpenClipLibrary,
}) => {
  return (
    <div className="space-y-2.5 animate-in">
      {onOpenClipLibrary && (
        <button
          type="button"
          onClick={onOpenClipLibrary}
          className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-surface-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-gold-500/20 transition-all active:scale-95 mb-1 cursor-pointer"
        >
          <Film size={15} />
          <span>مكتبة المقاطع الجاهزة (أذكار وجمعة) 🎬</span>
        </button>
      )}

      <button
        type="button"
        onClick={onOpenPresetModal}
        className="w-full py-2 px-3 rounded-xl bg-surface-900 border border-gold-400/30 hover:border-gold-400/60 text-gold-700 dark:text-gold-300 hover:text-gold-600 dark:hover:text-gold-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
      >
        <Sparkles size={14} className="text-gold-500 dark:text-gold-400" />
        <span>معاينة القوالب السينمائية بالصور 🖼️</span>
      </button>

      <p className="text-xs text-surface-300 pt-1 font-medium">أو اختر قالباً سريعاً بنقرة واحدة:</p>
      <div className="space-y-2">
        {studioTemplates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => onApplyTemplate(tpl)}
            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 group ${
              activeTemplateId === tpl.id
                ? 'bg-gold-500/15 border-gold-400/50 shadow-sm'
                : 'bg-surface-900 hover:bg-surface-800 border-surface-700/40 hover:border-gold-400/40'
            }`}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-950 shrink-0 border border-surface-700/40 relative">
              <img src={tpl.backgroundUrl} alt={tpl.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-sm">
                {tpl.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-surface-50 group-hover:text-gold-300 transition-colors text-xs">
                  {tpl.name}
                </h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-800 text-surface-300 border border-surface-700/40">
                  {tpl.tag}
                </span>
              </div>
              <p className="text-xs text-surface-400 truncate mt-0.5">{tpl.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
