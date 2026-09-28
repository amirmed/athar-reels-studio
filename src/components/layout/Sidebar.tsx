import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n';
import { Page } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FolderOpen,
  Settings,
  Film,
  ChevronsLeft,
  ChevronsRight,
  BookHeart,
  Plus,
  Image as ImageIcon,
  Mic,
} from 'lucide-react';

interface NavItem {
  id: Page;
  label: { ar: string; en: string; fr: string };
  icon: React.ReactNode;
  activeMatch?: Page[];
  category?: 'main' | 'studios' | 'workspace';
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: { ar: 'الرئيسية', en: 'Dashboard', fr: 'Accueil' },
    icon: <Home size={18} />,
    activeMatch: ['dashboard'],
    category: 'main',
  },
  // Creative Studios
  {
    id: 'create',
    label: { ar: 'ريلز قرآني سينمائي', en: 'Quran Reels', fr: 'Reels Coraniques' },
    icon: <Film size={18} />,
    activeMatch: ['create', 'editor'],
    category: 'studios',
  },
  {
    id: 'azkar',
    label: { ar: 'أذكار وأحاديث نبوية', en: 'Azkar & Hadith', fr: 'Azkar & Hadiths' },
    icon: <BookHeart size={18} />,
    activeMatch: ['azkar'],
    category: 'studios',
  },
  {
    id: 'quotes',
    label: { ar: 'كروت وبوستات الصور', en: 'Quote Cards', fr: 'Citations 4K' },
    icon: <ImageIcon size={18} />,
    activeMatch: ['quotes'],
    category: 'studios',
  },
  {
    id: 'voice-studio',
    label: { ar: 'التلقين والتسجيل 8D', en: 'Voice Studio 8D', fr: 'Studio Voix 8D' },
    icon: <Mic size={18} />,
    activeMatch: ['voice-studio'],
    category: 'studios',
  },
  // Content Management & Library
  {
    id: 'projects',
    label: { ar: 'مشاريعي والتصدير', en: 'Projects & Exports', fr: 'Projets & Exports' },
    icon: <FolderOpen size={18} />,
    activeMatch: ['projects', 'export'],
    category: 'workspace',
  },
];

export const Sidebar: React.FC = React.memo(() => {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const { t, language } = useTranslation();

  const currentLangKey = language as 'ar' | 'en' | 'fr';
  const isSettingsActive = currentPage === 'settings';

  return (
    <motion.aside
      data-tour="sidebar-nav"
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-full bg-surface-950/50 backdrop-blur-xl border-e border-surface-700/30 flex flex-col shrink-0 relative z-30"
    >
      {/* Logo area */}
      <div className="p-4 flex items-center gap-3 border-b border-surface-700/30">
        <div className="w-10 h-10 rounded-xl bg-surface-900 border border-gold-400/30 overflow-hidden flex items-center justify-center shrink-0 shadow-lg shadow-gold-500/10">
          <img src="/logo.png" alt="Athar Studio Logo" className="w-full h-full object-cover" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="text-sm font-bold text-surface-50 whitespace-nowrap tracking-tight">
                {t('appName', 'أَثَــر ستوديو')}
              </div>
              <p className="text-xs text-gold-600 dark:text-gold-400 whitespace-nowrap font-medium">
                {t('appSubtitle', 'صانع الريلز القرآني')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item, idx) => {
          const isActive = item.activeMatch
            ? item.activeMatch.includes(currentPage)
            : currentPage === item.id;

          // Section Divider Labels
          const showStudiosHeader =
            item.category === 'studios' && (idx === 0 || navItems[idx - 1]?.category !== 'studios');
          const showWorkspaceHeader =
            item.category === 'workspace' && (idx === 0 || navItems[idx - 1]?.category !== 'workspace');

          return (
            <React.Fragment key={item.id}>
              {showStudiosHeader && !sidebarCollapsed && (
                <div className="pt-3 pb-1 px-3 text-[11px] font-semibold text-surface-400 tracking-wider">
                  <span>{t('nav.studios', 'الاستوديوهات الإبداعية')}</span>
                </div>
              )}

              {showWorkspaceHeader && !sidebarCollapsed && (
                <div className="pt-3 pb-1 px-3 text-[11px] font-semibold text-surface-400 tracking-wider">
                  <span>{t('nav.workspace', 'مساحة العمل والمكتبة')}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setCurrentPage(item.id)}
                title={item.label[currentLangKey] || item.label.ar}
                aria-label={item.label[currentLangKey] || item.label.ar}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  w-full flex items-center gap-2.5 rounded-xl transition-all duration-150 relative cursor-pointer
                  ${sidebarCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'}
                  ${
                    isActive
                      ? 'bg-gold-500/10 text-gold-300 font-semibold shadow-sm border border-gold-500/25'
                      : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-100 font-medium'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold-400 rounded-e-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <span className={`shrink-0 ${isActive ? 'text-gold-400' : 'text-surface-400'}`}>
                  {item.icon}
                </span>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center justify-between flex-1 overflow-hidden"
                    >
                      <span className="text-xs whitespace-nowrap overflow-hidden">
                        {item.label[currentLangKey] || item.label.ar}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* New Project shortcut */}
      <div className="px-2 mb-2">
        <button
          type="button"
          onClick={() => setCurrentPage('create')}
          aria-label={t('topbar.newProject', 'مشروع جديد')}
          className={`
            w-full flex items-center gap-2 rounded-xl transition-all duration-150 cursor-pointer
            bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/25
            ${sidebarCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3.5 py-2'}
          `}
        >
          <Plus size={16} className="text-gold-400 shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold text-gold-300 whitespace-nowrap"
              >
                {t('topbar.newProject', 'مشروع جديد')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Pinned Bottom Area: Settings & Collapse toggle */}
      <div className="border-t border-surface-700/30 p-2 space-y-1">
        {/* Settings pinned button */}
        <button
          type="button"
          onClick={() => setCurrentPage('settings')}
          title={t('topbar.settings', 'الإعدادات')}
          aria-label={t('topbar.settings', 'الإعدادات')}
          aria-current={isSettingsActive ? 'page' : undefined}
          className={`
            w-full flex items-center gap-2.5 rounded-xl transition-all duration-150 relative cursor-pointer
            ${sidebarCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'}
            ${
              isSettingsActive
                ? 'bg-gold-500/10 text-gold-300 font-semibold shadow-sm border border-gold-500/25'
                : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-100 font-medium'
            }
          `}
        >
          {isSettingsActive && (
            <motion.div
              layoutId="sidebar-indicator"
              className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold-400 rounded-e-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <Settings size={18} className={`shrink-0 ${isSettingsActive ? 'text-gold-400' : 'text-surface-400'}`} />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xs whitespace-nowrap overflow-hidden"
              >
                {t('topbar.settings', 'الإعدادات والتفضيلات')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 rounded-lg text-surface-400 hover:text-surface-50 hover:bg-surface-800/60 transition-all duration-200 cursor-pointer"
          title={
            sidebarCollapsed
              ? t('common.expandSidebar', 'توسيع القائمة')
              : t('common.collapseSidebar', 'تصغير القائمة')
          }
          aria-label={
            sidebarCollapsed
              ? t('common.expandSidebar', 'توسيع القائمة')
              : t('common.collapseSidebar', 'تصغير القائمة')
          }
        >
          {sidebarCollapsed ? (
            <ChevronsRight size={18} className="rtl:rotate-180 transition-transform duration-200" />
          ) : (
            <ChevronsLeft size={18} className="rtl:rotate-180 transition-transform duration-200" />
          )}
        </button>
      </div>
    </motion.aside>
  );
});
