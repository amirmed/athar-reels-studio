import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n';
import {
  Search,
  Sun,
  Moon,
  Bell,
  User,
  ChevronDown,
  CheckCircle2,
  HelpCircle,
  Keyboard,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onOpenSearch?: () => void;
  onOpenMotherDua?: () => void;
  onOpenShortcuts?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  actions,
  onOpenSearch,
  onOpenMotherDua: _onOpenMotherDua,
  onOpenShortcuts,
}) => {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const exportJobs = useAppStore((s) => s.exportJobs);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const startTour = useAppStore((s) => s.startTour);
  const { t } = useTranslation();

  const [showNotifications, setShowNotifications] = useState(false);

  // Track seen/read export notifications in localStorage
  const [seenIds, setSeenIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('athar_seen_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const markAllAsSeen = () => {
    const allCompletedIds = exportJobs.filter((j) => j.status === 'completed').map((j) => j.id);
    const updated = Array.from(new Set([...seenIds, ...allCompletedIds]));
    setSeenIds(updated);
    try {
      localStorage.setItem('athar_seen_notifications', JSON.stringify(updated));
    } catch (err) {
      console.debug('[Topbar] Save seen notifications error:', err);
    }
  };

  const markSingleAsSeen = (id: string) => {
    const updated = Array.from(new Set([...seenIds, id]));
    setSeenIds(updated);
    try {
      localStorage.setItem('athar_seen_notifications', JSON.stringify(updated));
    } catch (err) {
      console.debug('[Topbar] Save seen notification error:', err);
    }
  };

  // Consider recently completed exports as notifications
  const recentExports = exportJobs
    .filter((j) => j.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const unreadExportsCount = recentExports.filter((j) => !seenIds.includes(j.id)).length;

  return (
    <header className="h-14 bg-surface-950/30 backdrop-blur-md border-b border-surface-700/30 flex items-center justify-between px-6 shrink-0 z-20">
      {/* Right side: Title (H1 Level) */}
      <div className="flex items-center gap-4">
        {title && (
          <div>
            <h1 className="text-lg sm:text-xl font-black text-surface-50 tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-[13px] text-surface-300 mt-0.5 font-medium">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Left side: Actions */}
      <div className="flex items-center gap-3">
        {actions}

        {/* Search */}
        <div className="relative">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label={t('topbar.globalSearch', 'فتح البحث في السور والقراء')}
            className="flex items-center gap-2 bg-surface-800/40 border border-surface-700/40 hover:border-gold-400/40 rounded-xl px-3 py-2 w-56 hover:bg-surface-800/70 transition-all cursor-pointer group shadow-sm active:scale-95 text-start"
          >
            <Search
              size={15}
              className="text-gold-400/70 group-hover:text-gold-400 transition-colors shrink-0"
            />
            <span className="text-xs text-surface-400 group-hover:text-surface-50 transition-colors font-medium truncate">
              {t('topbar.searchPlaceholder', 'بحث في السور، القراء...')}
            </span>
            <div className="ms-auto flex items-center gap-1 bg-surface-700/60 border border-surface-700/50 rounded-md px-1.5 py-0.5 shrink-0">
              <span className="text-[11px] text-surface-400 font-bold">Ctrl+K</span>
            </div>
          </button>
        </div>

        {/* Keyboard Shortcuts Button */}
        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            aria-label="دليل اختصارات لوحة المفاتيح (?)"
            title="اختصارات لوحة المفاتيح (? / Shift+?)"
            className="w-9 h-9 rounded-xl bg-surface-800/40 border border-surface-700/40 flex items-center justify-center text-surface-400 hover:text-gold-300 hover:bg-surface-700/50 hover:border-gold-400/30 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
          >
            <Keyboard size={16} />
          </button>
        )}

        {/* Interactive Tour Guide Button */}
        <button
          type="button"
          onClick={startTour}
          aria-label={t('topbar.tourGuide', 'بدء الجولة الإرشادية')}
          className="w-9 h-9 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center text-gold-400 hover:text-gold-300 hover:bg-gold-400/20 hover:border-gold-400/40 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
          title={t('topbar.tourGuide', 'بدء الجولة الإرشادية التفاعلية للأدوات')}
        >
          <HelpCircle size={16} />
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark'
              ? t('topbar.themeToggleLight', 'التبديل للوضع النهاري')
              : t('topbar.themeToggleDark', 'التبديل للوضع الليلي')
          }
          title={
            theme === 'dark'
              ? t('topbar.themeToggleLight', 'التبديل للوضع النهاري (فاتح)')
              : t('topbar.themeToggleDark', 'التبديل للوضع الليلي (داكن)')
          }
          className="w-9 h-9 rounded-xl bg-surface-800/40 border border-surface-700/40 flex items-center justify-center text-surface-400 hover:text-surface-50 hover:bg-surface-700/50 hover:border-surface-600 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
        >
          {theme === 'dark' ? (
            <Sun size={16} className="text-amber-400 hover:text-amber-300 transition-colors" />
          ) : (
            <Moon size={16} className="text-gold-400 hover:text-gold-300 transition-colors" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const next = !showNotifications;
              setShowNotifications(next);
              if (next && unreadExportsCount > 0) {
                markAllAsSeen();
              }
            }}
            aria-label={`الإشعارات ${unreadExportsCount > 0 ? `(${unreadExportsCount} جديدة)` : ''}`}
            title="الإشعارات والتنبيهات"
            className="w-9 h-9 rounded-xl bg-surface-800/40 border border-surface-700/40 flex items-center justify-center text-surface-400 hover:text-surface-50 hover:bg-surface-700/50 hover:border-surface-600 transition-all duration-200 relative cursor-pointer"
          >
            <Bell size={16} />
            {unreadExportsCount > 0 && (
              <span className="absolute -top-0.5 -start-0.5 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-surface-950 animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute start-0 top-full mt-2 w-80 bg-surface-900 border border-surface-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden text-start"
                >
                  <div className="p-3.5 border-b border-surface-700/30 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-surface-50">الإشعارات والتنبيهات 🔔</h3>
                    {recentExports.length > 0 && unreadExportsCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsSeen}
                        className="text-[11px] text-accent-400 hover:text-accent-300 font-bold hover:underline cursor-pointer"
                      >
                        تحديد الكل كمقروء ✓
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {recentExports.length > 0 ? (
                      recentExports.map((job) => {
                        const isUnread = !seenIds.includes(job.id);
                        return (
                          <div
                            key={job.id}
                            className={`p-3 border-b border-surface-700/20 hover:bg-surface-800/40 transition-colors cursor-pointer flex gap-3 items-start ${
                              isUnread ? 'bg-accent-500/10' : ''
                            }`}
                            onClick={() => {
                              markSingleAsSeen(job.id);
                              setShowNotifications(false);
                              setCurrentPage('export');
                            }}
                          >
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isUnread
                                  ? 'bg-accent-500/20 text-accent-400'
                                  : 'bg-surface-800 text-surface-400'
                              }`}
                            >
                              <CheckCircle2 size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-surface-50">
                                  اكتمل التصدير بنجاح
                                </p>
                                {isUnread && (
                                  <span
                                    className="w-2 h-2 rounded-full bg-accent-400 shrink-0"
                                    title="جديد"
                                  />
                                )}
                              </div>
                              <p className="text-xs text-surface-300 mt-0.5 truncate">
                                {job.projectName} • {job.aspectRatio}
                              </p>
                              <p className="text-[10px] text-surface-400 mt-1 font-mono">
                                {new Date(job.createdAt).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-surface-400">
                        لا توجد إشعارات جديدة
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-surface-700/40"></div>

        {/* Settings button */}
        <button
          type="button"
          onClick={() => setCurrentPage('settings')}
          aria-label="إعدادات التطبيق"
          title="إعدادات التطبيق"
          className="flex items-center gap-2 bg-surface-800/40 border border-surface-700/40 rounded-xl px-3 py-2 hover:bg-surface-700/50 hover:border-surface-600 transition-all duration-200 group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
            <User size={13} className="text-white" />
          </div>
          <span className="text-sm text-surface-300 group-hover:text-surface-50 transition-colors">
            الإعدادات
          </span>
          <ChevronDown size={13} className="text-surface-400" />
        </button>
      </div>
    </header>
  );
};
