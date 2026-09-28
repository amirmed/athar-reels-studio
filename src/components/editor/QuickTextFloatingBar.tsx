import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpToLine,
  AlignCenterVertical,
  ArrowDownToLine,
  X,
  Languages,
  Check,
  Sparkles,
} from 'lucide-react';
import { TextSettings } from '../../types';
import { useTranslation } from '../../i18n';

interface QuickTextFloatingBarProps {
  textSettings: TextSettings;
  setTextSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
  showTranslation?: boolean;
  setShowTranslation?: (val: boolean | ((prev: boolean) => boolean)) => void;
  onClose: () => void;
}

const QUICK_COLORS = [
  { color: '#ffffff', nameKey: 'quickText.colorWhite', defaultName: 'أبيض ناصع', border: 'border-white/40' },
  { color: '#cbb06b', nameKey: 'quickText.colorGold', defaultName: 'ذهب عتيق', border: 'border-amber-400/40' },
  { color: '#fef3c7', nameKey: 'quickText.colorIvory', defaultName: 'عاجي دافئ', border: 'border-amber-200/40' },
  { color: '#6ee7b7', nameKey: 'quickText.colorEmerald', defaultName: 'زمردي ناعم', border: 'border-emerald-400/40' },
  { color: '#18181b', nameKey: 'quickText.colorCharcoal', defaultName: 'فحمي داكن', border: 'border-surface-600' },
];

export const QuickTextFloatingBar: React.FC<QuickTextFloatingBarProps> = React.memo(
  ({ textSettings, setTextSettings, showTranslation, setShowTranslation, onClose }) => {
    const { t } = useTranslation();
    const currentSize = textSettings.fontSize || 26;
    const currentPos = textSettings.position || 'center';
    const isAyahNumVisible = textSettings.showAyahNumber !== false;

    const changeFontSize = (delta: number) => {
      setTextSettings((prev) => ({
        ...prev,
        fontSize: Math.max(14, Math.min(56, (prev.fontSize || 26) + delta)),
      }));
    };

    const setPosition = (position: 'top' | 'center' | 'bottom') => {
      setTextSettings((prev) => ({
        ...prev,
        position,
      }));
    };

    const setColor = (textColor: string) => {
      setTextSettings((prev) => ({
        ...prev,
        textColor,
      }));
    };

    const toggleAyahNumber = () => {
      setTextSettings((prev) => ({
        ...prev,
        showAyahNumber: prev.showAyahNumber === false ? true : false,
      }));
    };

    return (
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
          y: textSettings.position === 'bottom' ? -8 : 8,
        }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: textSettings.position === 'bottom' ? -8 : 8,
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-surface-900/95 backdrop-blur-2xl border border-surface-700/80 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1.5 md:gap-2 flex-wrap z-40 select-none max-w-full justify-center ring-1 ring-white/10"
        role="toolbar"
        aria-label={t('quickText.toolbarAria', 'شريط أدوات النص السريع')}
      >
        {/* Label indicator */}
        <div className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-gold-400 bg-gold-500/10 rounded-lg border border-gold-500/20">
          <Sparkles size={11} className="animate-pulse text-gold-400" />
          <span>{t('quickText.badge', 'تحرير النص')}</span>
        </div>

        <div className="w-px h-4 bg-surface-700/60" />

        {/* 1. Quick Font Size Adjuster */}
        <div className="flex items-center gap-1 bg-surface-800/90 p-0.5 rounded-xl border border-surface-700/50">
          <button
            type="button"
            onClick={() => changeFontSize(-2)}
            disabled={currentSize <= 14}
            className="w-6 h-6 rounded-lg text-xs font-black text-surface-200 hover:text-white hover:bg-surface-700 disabled:opacity-30 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title={t('quickText.decreaseFontSize', 'تصغير حجم الخط (2px-)')}
            aria-label={t('quickText.decreaseFontSizeAria', 'تصغير حجم الخط')}
          >
            A-
          </button>
          <span className="font-mono text-[11px] font-bold text-white min-w-[28px] text-center">
            {currentSize}
          </span>
          <button
            type="button"
            onClick={() => changeFontSize(2)}
            disabled={currentSize >= 56}
            className="w-6 h-6 rounded-lg text-xs font-black text-surface-200 hover:text-white hover:bg-surface-700 disabled:opacity-30 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title={t('quickText.increaseFontSize', 'تكبير حجم الخط (2px+)')}
            aria-label={t('quickText.increaseFontSizeAria', 'تكبير حجم الخط')}
          >
            A+
          </button>
        </div>

        <div className="w-px h-4 bg-surface-700/60" />

        {/* 2. Curated Quick Colors */}
        <div className="flex items-center gap-1 bg-surface-800/90 p-1 rounded-xl border border-surface-700/50">
          {QUICK_COLORS.map((c) => {
            const isSelected =
              textSettings.textColor?.toLowerCase() === c.color.toLowerCase();
            const colorName = t(c.nameKey, c.defaultName);
            return (
              <button
                key={c.color}
                type="button"
                onClick={() => setColor(c.color)}
                className={`w-5 h-5 rounded-full transition-all flex items-center justify-center active:scale-90 cursor-pointer ${
                  c.border
                } ${
                  isSelected
                    ? 'ring-2 ring-gold-400 ring-offset-1 ring-offset-surface-900 scale-110 shadow-sm'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.color }}
                title={colorName}
                aria-label={colorName}
              >
                {isSelected && (
                  <Check
                    size={10}
                    className={
                      c.color === '#ffffff' || c.color === '#fef3c7'
                        ? 'text-black font-bold'
                        : 'text-white font-bold'
                    }
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="w-px h-4 bg-surface-700/60" />

        {/* 3. Fast Vertical Alignment */}
        <div className="flex items-center gap-0.5 bg-surface-800/90 p-0.5 rounded-xl border border-surface-700/50">
          {[
            {
              id: 'top' as const,
              labelKey: 'quickText.alignTop',
              titleKey: 'quickText.alignTopTitle',
              defaultLabel: 'أعلى',
              defaultTitle: 'نقل النص إلى الأعلى',
              icon: ArrowUpToLine,
            },
            {
              id: 'center' as const,
              labelKey: 'quickText.alignCenter',
              titleKey: 'quickText.alignCenterTitle',
              defaultLabel: 'وسط',
              defaultTitle: 'نقل النص إلى الوسط',
              icon: AlignCenterVertical,
            },
            {
              id: 'bottom' as const,
              labelKey: 'quickText.alignBottom',
              titleKey: 'quickText.alignBottomTitle',
              defaultLabel: 'أسفل',
              defaultTitle: 'نقل النص إلى الأسفل',
              icon: ArrowDownToLine,
            },
          ].map((pos) => {
            const Icon = pos.icon;
            const isSelected = currentPos === pos.id;
            const label = t(pos.labelKey, pos.defaultLabel);
            const title = t(pos.titleKey, pos.defaultTitle);
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => setPosition(pos.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30 font-black shadow-xs'
                    : 'text-surface-400 hover:text-white hover:bg-surface-700'
                }`}
                title={title}
                aria-label={title}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-4 bg-surface-700/60" />

        {/* 4. Quick Toggles (Ayah Number & Translation) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleAyahNumber}
            className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1 ${
              isAyahNumVisible
                ? 'bg-gold-500/15 border-gold-400/30 text-gold-300'
                : 'bg-surface-800 border-surface-700 text-surface-500 hover:text-surface-300'
            }`}
            title={t('quickText.toggleAyahNumberTitle', 'إظهار أو إخفاء رقم الآية')}
            aria-label={t('quickText.toggleAyahNumberAria', 'تبديل رقم الآية')}
          >
            <span>﴿١﴾</span>
            <span className="hidden md:inline">{t('quickText.ayahNumberLabel', 'الرقم')}</span>
          </button>

          {setShowTranslation && (
            <button
              type="button"
              onClick={() => setShowTranslation((v) => !v)}
              className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                showTranslation
                  ? 'bg-sky-500/20 border-sky-400/40 text-sky-300'
                  : 'bg-surface-800 border-surface-700 text-surface-500 hover:text-surface-300'
              }`}
              title={t('quickText.toggleTranslationTitle', 'إظهار أو إخفاء شريط الترجمة')}
              aria-label={t('quickText.toggleTranslationAria', 'تبديل الترجمة')}
            >
              <Languages size={12} />
              <span className="hidden md:inline">{t('quickText.translationLabel', 'الترجمة')}</span>
            </button>
          )}
        </div>

        <div className="w-px h-4 bg-surface-700/60" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer"
          title={t('quickText.closeTitle', 'إغلاق شريط التعديل السريع (Esc)')}
          aria-label={t('quickText.closeAria', 'إغلاق')}
        >
          <X size={14} />
        </button>
      </motion.div>
    );
  }
);

QuickTextFloatingBar.displayName = 'QuickTextFloatingBar';
