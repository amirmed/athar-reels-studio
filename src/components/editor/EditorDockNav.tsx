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
import { useTranslation } from '../../i18n';

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

export const EditorDockNav: React.FC<EditorDockNavProps> = ({
  activeTab,
  onTabChange,
  isInspectorOpen,
  onToggleInspector,
  isProMode = false,
  onToggleProMode,
}) => {
  const { t } = useTranslation();

  const allTabs: { id: DockTabType; label: string; icon: LucideIcon; isPro?: boolean }[] = [
    { id: 'reciter', label: t('editor.tabReciter', 'القارئ'), icon: Mic },
    { id: 'bg', label: t('editor.tabBackground', 'الخلفية'), icon: ImageIcon },
    { id: 'text', label: t('editor.tabText', 'الخطوط'), icon: Type },
    { id: 'templates', label: t('editor.tabTemplates', 'القوالب'), icon: Palette },
    { id: 'ornaments', label: t('editor.tabOrnaments', 'الزخارف'), icon: Layers, isPro: true },
    { id: 'ambient', label: t('editor.tabAmbient', 'صوت 8D'), icon: Headphones, isPro: true },
    { id: 'branding', label: t('editor.tabBranding', 'الحقوق'), icon: Sliders, isPro: true },
  ];

  const visibleTabs = isProMode ? allTabs : allTabs.filter((t) => !t.isPro);

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
                  ? 'bg-gold-500/15 text-gold-600 dark:text-gold-300 font-bold border border-gold-400/40 shadow-md shadow-gold-500/10'
                  : 'text-surface-400 hover:text-surface-50 hover:bg-surface-800/60'
              }`}
              title={tab.label}
              aria-label={tab.label}
              aria-selected={isActive}
            >
              <Icon size={19} />
              <span className="text-xs font-bold tracking-tight">{tab.label}</span>
              {tab.isPro && (
                <span className="absolute -top-1 -end-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold border border-purple-400/30">
                  {t('editor.proLabel', 'PRO')}
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
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/30'
                : 'bg-surface-800 border-surface-700/40 text-surface-400 hover:text-surface-50 hover:border-gold-400/40'
            }`}
            title={isProMode ? t('editor.switchToSimple', 'تبديل للوضع المبسط') : t('editor.switchToPro', 'فتح الوضع الاحترافي الكامل (Pro)')}
            aria-label={isProMode ? t('editor.switchToSimple', 'تبديل للوضع المبسط') : t('editor.switchToPro', 'فتح الوضع الاحترافي الكامل (Pro)')}
          >
            <Zap size={14} className={isProMode ? 'text-purple-500 dark:text-purple-400' : 'text-gold-500 dark:text-gold-400'} />
            <span className="text-[11px] font-bold">{isProMode ? t('editor.proLabel', 'PRO') : t('editor.advancedLabel', 'متقدم')}</span>
          </button>
        )}
      </div>

      {/* Collapse/Expand Inspector toggle button */}
      <div className="px-2 w-full pt-2 border-t border-surface-700/30">
        <button
          type="button"
          onClick={onToggleInspector}
          className="w-full py-2 rounded-xl bg-surface-800/60 hover:bg-surface-800 text-surface-400 hover:text-surface-50 flex items-center justify-center transition-all cursor-pointer"
          title={isInspectorOpen ? t('editor.hideInspector', 'إخفاء لوحة التحكم') : t('editor.showInspector', 'إظهار لوحة التحكم')}
          aria-label={isInspectorOpen ? t('editor.hideInspector', 'إخفاء لوحة التحكم') : t('editor.showInspector', 'إظهار لوحة التحكم')}
        >
          {isInspectorOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};
