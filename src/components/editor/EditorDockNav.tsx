import React from 'react';
import {
  Mic,
  Image as ImageIcon,
  Type,
  Layers,
  Headphones,
  Palette,
  Sliders,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  Zap,
} from 'lucide-react';

export type DockTabType =
  'reciter' | 'bg' | 'text' | 'ornaments' | 'ambient' | 'templates' | 'branding';

interface EditorDockNavProps {
  activeTab: DockTabType;
  onTabChange: (tab: DockTabType) => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  isProMode?: boolean;
  onToggleProMode?: () => void;
}

const ALL_TABS: { id: DockTabType; label: string; icon: LucideIcon; isPro?: boolean }[] = [
  { id: 'reciter', label: 'القارئ', icon: Mic },
  { id: 'bg', label: 'الخلفية', icon: ImageIcon },
  { id: 'text', label: 'الخطوط', icon: Type },
  { id: 'templates', label: 'القوالب', icon: Palette },
  { id: 'ornaments', label: 'الزخارف', icon: Layers, isPro: true },
  { id: 'ambient', label: 'صوت 8D', icon: Headphones, isPro: true },
  { id: 'branding', label: 'الحقوق', icon: Sliders, isPro: true },
];

export const EditorDockNav: React.FC<EditorDockNavProps> = ({
  activeTab,
  onTabChange,
  isInspectorOpen,
  onToggleInspector,
  isProMode = false,
  onToggleProMode,
}) => {
  const visibleTabs = isProMode ? ALL_TABS : ALL_TABS.filter((t) => !t.isPro);

  return (
    <aside className="w-20 border-e border-surface-700/40 bg-surface-900 flex flex-col items-center py-3 gap-2 shrink-0 z-20">
      <div className="flex-1 flex flex-col gap-2 w-full px-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onTabChange(tab.id);
                if (!isInspectorOpen) onToggleInspector();
              }}
              className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-gold-500/15 text-gold-300 font-bold border border-gold-400/40 shadow-md shadow-gold-500/10'
                  : 'text-surface-400 hover:text-surface-50 hover:bg-surface-800/60'
              }`}
              title={tab.label}
              aria-label={tab.label}
              aria-selected={isActive}
            >
              <Icon size={19} />
              <span className="text-xs font-bold tracking-tight">{tab.label}</span>
              {tab.isPro && (
                <span className="absolute -top-1 -end-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-300 font-bold">
                  PRO
                </span>
              )}
            </button>
          );
        })}

        {/* Pro Mode Switch Button */}
        {onToggleProMode && (
          <button
            type="button"
            onClick={onToggleProMode}
            className={`w-full mt-2 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isProMode
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30'
                : 'bg-surface-800/80 border-surface-700/40 text-surface-400 hover:text-surface-50 hover:border-gold-400/40'
            }`}
            title={isProMode ? 'تبديل للوضع المبسط' : 'فتح الوضع الاحترافي الكامل (Pro)'}
            aria-label={isProMode ? 'تبديل للوضع المبسط' : 'فتح الوضع الاحترافي الكامل (Pro)'}
          >
            <Zap size={14} className={isProMode ? 'text-purple-400' : 'text-gold-400'} />
            <span className="text-[11px] font-bold">{isProMode ? 'PRO' : 'متقدم'}</span>
          </button>
        )}
      </div>

      {/* Collapse/Expand Inspector toggle button */}
      <div className="px-2 w-full pt-2 border-t border-surface-700/30">
        <button
          type="button"
          onClick={onToggleInspector}
          className="w-full py-2 rounded-xl bg-surface-800/60 hover:bg-surface-800 text-surface-400 hover:text-surface-50 flex items-center justify-center transition-all cursor-pointer"
          title={isInspectorOpen ? 'إخفاء لوحة التحكم' : 'إظهار لوحة التحكم'}
          aria-label={isInspectorOpen ? 'إخفاء لوحة التحكم' : 'إظهار لوحة التحكم'}
        >
          {isInspectorOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};
