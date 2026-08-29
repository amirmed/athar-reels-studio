import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../../types';
import { useHotkeys } from '../../hooks/useHotkeys';
import { useTranslation } from '../../i18n';
import {
  ArrowRight,
  Save,
  Download,
  Sparkles,
  Undo2,
  Redo2,
  BookOpen,
  Crown,
  Mic,
  Database,
  Keyboard,
  Image as ImageIcon,
  MoreHorizontal,
} from 'lucide-react';

interface EditorHeaderProps {
  currentProject: Project | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved';
  onOpenExport: () => void;
  onOpenAutoReel: () => void;
  onOpenPlaylists: () => void;
  onOpenEvents: () => void;
  onOpenVoiceRecorder: () => void;
  onOpenQuotes?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onBack: () => void;
  isProMode?: boolean;
  onToggleProMode?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  currentProject,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  saveStatus = 'saved',
  onOpenExport,
  onOpenAutoReel,
  onOpenPlaylists,
  onOpenEvents,
  onOpenVoiceRecorder,
  onOpenQuotes,
  onOpenKeyboardShortcuts,
  onBack,
  isProMode = false,
  onToggleProMode,
}) => {
  const { t } = useTranslation();
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };

    if (isToolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isToolsMenuOpen]);

  useHotkeys('Escape', () => setIsToolsMenuOpen(false), { enabled: isToolsMenuOpen });

  return (
    <header className="h-16 border-b border-surface-700/40 bg-surface-900/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Back & Project Title & Quick Actions */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-surface-800/60 hover:bg-surface-800 text-surface-300 hover:text-surface-50 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
          title={t('editor.backToHome', 'الرجوع للرئيسية')}
          aria-label={t('editor.backToHome', 'الرجوع للرئيسية')}
        >
          <ArrowRight size={18} />
          <span className="hidden sm:inline">{t('editor.home', 'الرئيسية')}</span>
        </button>

        <div className="h-5 w-[1px] bg-surface-700/40 mx-1 hidden sm:block shrink-0" />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-surface-50 max-w-[120px] sm:max-w-[180px] md:max-w-[240px] lg:max-w-[320px] truncate">
              {currentProject?.name || t('editor.defaultProjectName', 'مشروع ريلز قرآني')}
            </h1>
            {saveStatus === 'saving' ? (
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/20 animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>{t('editor.saving', 'جارٍ الحفظ...')}</span>
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 shrink-0">
                <Database size={11} className="text-emerald-500 dark:text-emerald-400" />
                <span>{t('editor.saved', '✓ تم الحفظ')}</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-gold-600 dark:text-gold-400 font-bold truncate">
            {currentProject?.aspectRatio === '9:16'
              ? t('editor.ratioVertical', 'ريلز عمودي 9:16')
              : currentProject?.aspectRatio === '1:1'
                ? t('editor.ratioSquare', 'مربع 1:1')
                : t('editor.ratioHorizontal', 'أفقي 16:9')}
          </p>
        </div>

        {/* Undo / Redo Buttons */}
        <div className="flex items-center bg-surface-800 p-0.5 sm:p-1 rounded-xl border border-surface-700/40 gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              canUndo
                ? 'text-surface-50 hover:text-gold-500 hover:bg-surface-700 cursor-pointer active:scale-95'
                : 'text-surface-400 cursor-not-allowed'
            }`}
            title={t('editor.undo', 'تراجع (Ctrl + Z)')}
            aria-label={t('editor.undo', 'تراجع (Ctrl + Z)')}
          >
            <Undo2 size={14} />
            <span className="hidden xl:inline text-xs">{t('editor.undoLabel', 'تراجع')}</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              canRedo
                ? 'text-surface-50 hover:text-gold-500 hover:bg-surface-700 cursor-pointer active:scale-95'
                : 'text-surface-400 cursor-not-allowed'
            }`}
            title={t('editor.redo', 'إعادة (Ctrl + Y)')}
            aria-label={t('editor.redo', 'إعادة (Ctrl + Y)')}
          >
            <Redo2 size={14} />
            <span className="hidden xl:inline text-xs">{t('editor.redoLabel', 'إعادة')}</span>
          </button>
        </div>
      </div>

      {/* Right: Clean & Structured Header Toolbar */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Mode Toggle Button */}
        {onToggleProMode && (
          <button
            type="button"
            data-tour="editor-mode-toggle"
            onClick={onToggleProMode}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isProMode
                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 shadow-sm'
                : 'bg-surface-800 text-surface-200 border-surface-700/40 hover:border-gold-400/40 hover:text-surface-50'
            }`}
            title={t('editor.modeToggleTooltip', 'التبديل بين الوضع المبسط والوضع المتقدم')}
            aria-label={t('editor.modeToggleTooltip', 'التبديل بين الوضع المبسط والوضع المتقدم')}
          >
            <span>{isProMode ? t('editor.proModeBadge', '⚡ وضع Pro') : t('editor.simpleModeBadge', '🎯 مبسط')}</span>
          </button>
        )}

        {/* Auto-Reel AI Button */}
        <button
          type="button"
          onClick={onOpenAutoReel}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-gold-500/20 hover:from-purple-600/30 hover:to-gold-500/30 text-purple-700 dark:text-purple-200 text-xs font-bold border border-purple-400/30 transition-all cursor-pointer shadow-sm active:scale-95"
          title={t('editor.autoReelTooltip', 'توليد ريلز تلقائي بالذكاء الاصطناعي')}
          aria-label={t('editor.autoReelTooltip', 'توليد ريلز تلقائي بالذكاء الاصطناعي')}
        >
          <Sparkles size={13} className="text-purple-500 dark:text-purple-300 animate-pulse" />
          <span className="hidden sm:inline">Auto-Reel AI</span>
        </button>

        {/* Compact Creative Tools Menu (⋯) */}
        <div className="relative" ref={toolsMenuRef}>
          <button
            type="button"
            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
              isToolsMenuOpen
                ? 'bg-gold-500/20 text-gold-700 dark:text-gold-300 border-gold-500/40'
                : 'bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-surface-50 border-surface-700/40'
            }`}
            title={t('editor.creativeToolsMore', 'المزيد من الأدوات الإبداعية والاستوديوهات')}
            aria-label={t('editor.creativeToolsMore', 'المزيد من الأدوات الإبداعية والاستوديوهات')}
            aria-expanded={isToolsMenuOpen}
            aria-haspopup="true"
          >
            <MoreHorizontal size={16} />
            <span className="hidden lg:inline text-xs">{t('editor.creativeTools', 'أدوات إبداعية')}</span>
          </button>

          <AnimatePresence>
            {isToolsMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute start-0 sm:end-auto mt-2 w-56 bg-surface-900 border border-gold-500/30 rounded-2xl p-2 shadow-2xl z-50 space-y-1 text-start"
              >
                <div className="px-3 py-1.5 border-b border-surface-700/40 text-[11px] font-bold text-surface-400">
                  {t('editor.additionalStudios', 'استوديوهات وأدوات إضافية:')}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenPlaylists();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gold-600 dark:text-gold-300 hover:bg-gold-500/15 transition-all text-start cursor-pointer"
                  aria-label={t('editor.quranPlaylists', 'مزاجات وقوائم قرآنية 🎧')}
                >
                  <BookOpen size={15} className="text-gold-500 dark:text-gold-400" />
                  <span>{t('editor.quranPlaylists', 'مزاجات وقوائم قرآنية 🎧')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenEvents();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-all text-start cursor-pointer"
                  aria-label={t('editor.islamicEvents', 'مواسم ومناسبات إسلامية 🌙')}
                >
                  <Crown size={15} className="text-emerald-500 dark:text-emerald-400" />
                  <span>{t('editor.islamicEvents', 'مواسم ومناسبات إسلامية 🌙')}</span>
                </button>

                {onOpenQuotes && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenQuotes();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-500/15 transition-all text-start cursor-pointer"
                    aria-label={t('editor.designQuote', 'تصميم بوست وبطاقة صورة 🖼️')}
                  >
                    <ImageIcon size={15} className="text-sky-500 dark:text-sky-400" />
                    <span>{t('editor.designQuote', 'تصميم بوست وبطاقة صورة 🖼️')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenVoiceRecorder();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 transition-all text-start cursor-pointer"
                  aria-label={t('editor.recordVoice', 'تسجيل صوتك وتلاوتك 🎙️')}
                >
                  <Mic size={15} className="text-amber-500 dark:text-amber-400" />
                  <span>{t('editor.recordVoice', 'تسجيل صوتك وتلاوتك 🎙️')}</span>
                </button>

                {onOpenKeyboardShortcuts && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenKeyboardShortcuts();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-surface-300 hover:bg-surface-800 hover:text-surface-50 transition-all text-start cursor-pointer border-t border-surface-700/30 pt-2"
                    aria-label={t('editor.keyboardShortcuts', 'اختصارات لوحة المفاتيح ⌨️')}
                  >
                    <Keyboard size={15} className="text-surface-400" />
                    <span>{t('editor.keyboardShortcuts', 'اختصارات لوحة المفاتيح ⌨️')}</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-50 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-surface-700/40 active:scale-95"
          title={t('editor.saveTooltip', 'حفظ المشروع (Ctrl + S)')}
          aria-label={t('editor.saveTooltip', 'حفظ المشروع (Ctrl + S)')}
        >
          <Save size={14} className="text-gold-400" />
          <span className="hidden sm:inline">{t('editor.saveBtn', 'حفظ')}</span>
        </button>

        {/* Export Video Button */}
        <button
          type="button"
          onClick={onOpenExport}
          className="px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-surface-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-gold-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
          aria-label={t('editor.exportTooltip', 'تصدير الفيديو النهائي')}
        >
          <Download size={14} />
          <span>{t('editor.exportBtn', 'تصدير 🚀')}</span>
        </button>
      </div>
    </header>
  );
};
