import React, { useState } from 'react';
import { Heart, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { loadFromLocal, saveToLocal } from '../../utils/localStorage';

interface CharityRibbonFooterProps {
  onOpenMotherDua?: () => void;
}

const STORAGE_KEY_CHARITY_COLLAPSED = 'athar_charity_ribbon_collapsed';

export const CharityRibbonFooter: React.FC<CharityRibbonFooterProps> = React.memo(
  ({ onOpenMotherDua }) => {
    const addToast = useAppStore((s) => s.addToast);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
      const saved = loadFromLocal<boolean>(STORAGE_KEY_CHARITY_COLLAPSED);
      return saved !== null ? saved : true; // Collapsed by default for 100% full-height workspace
    });

    const toggleCollapsed = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const next = !isCollapsed;
      setIsCollapsed(next);
      saveToLocal(STORAGE_KEY_CHARITY_COLLAPSED, next);
    };

    const handlePrayDua = () => {
      if (onOpenMotherDua) {
        onOpenMotherDua();
      } else {
        addToast({
          message:
            'جزاك الله خيراً وتقبل الله دعاءك الطيب للوالدة تيجاني عائشة رحمها الله وأسكنها الفردوس الأعلى 🤍🤲',
          type: 'success',
        });
      }
    };

    return (
      <aside aria-label="ركن الصدقة الجارية وبر الوالدين" className="select-none pointer-events-none">
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            /* 1. Floating Collapsed Pill / FAB (Takes 0px vertical layout space) */
            <motion.div
              key="collapsed-fab"
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-3 end-4 z-40 pointer-events-auto"
            >
              <div className="flex items-center gap-1 p-1 bg-surface-900/90 hover:bg-surface-850 border border-gold-500/35 rounded-full shadow-2xl shadow-gold-500/10 backdrop-blur-xl transition-all group">
                <button
                  type="button"
                  onClick={handlePrayDua}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gold-300 group-hover:text-gold-200 cursor-pointer"
                  title="فتح ركن بر الوالدين والصدقة الجارية • اضغط للدعاء أو إهداء بطاقة"
                >
                  <Heart
                    size={14}
                    className="text-rose-400 fill-rose-400/40 group-hover:scale-110 transition-transform"
                  />
                  <span>صدقة جارية عن الوالدة (رحمها الله)</span>
                </button>

                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="p-1 rounded-full text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors cursor-pointer"
                  title="توسيع شريط الصدقة الجارية"
                  aria-label="توسيع شريط الصدقة الجارية"
                >
                  <ChevronUp size={14} />
                </button>
              </div>
            </motion.div>
          ) : (
            /* 2. Floating Expanded Card / Ribbon */
            <motion.div
              key="expanded-ribbon"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed bottom-3 inset-x-4 max-w-5xl mx-auto z-40 pointer-events-auto"
            >
              <div className="bg-surface-900/95 border border-gold-500/25 rounded-xl p-3 sm:px-5 sm:py-2.5 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
                {/* Main Charity Message */}
                <button
                  type="button"
                  onClick={handlePrayDua}
                  title="فتح ركن بر الوالدين والصدقة الجارية • اضغط للدعاء أو إهداء بطاقة"
                  aria-label="فتح ركن بر الوالدين والصدقة الجارية • اضغط للدعاء أو إهداء بطاقة"
                  className="flex items-center gap-2.5 text-xs text-surface-200 leading-relaxed font-normal cursor-pointer hover:text-surface-50 transition-colors flex-1 text-start focus-visible:ring-1 focus-visible:ring-gold-400 rounded-lg p-1"
                >
                  <p>
                    هذا العمل صُنع خالصاً ومجانياً كصدقة جارية عن الوالدة الغالية:{' '}
                    <strong className="text-gold-300 font-bold underline decoration-gold-400/40 underline-offset-4">
                      تيجاني عائشة
                    </strong>{' '}
                    (رحمها الله) ولكل والدين • أهدِ دعاءً لوالديك واكسب الأجر المشترك
                  </p>
                </button>

                {/* Actions & Minimize Button */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center sm:justify-end">
                  <a
                    href="https://atar-studio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-800/60 hover:bg-gold-500/15 border border-surface-700/40 hover:border-gold-400/30 text-[11px] font-mono text-surface-300 hover:text-gold-300 transition-all shadow-sm cursor-pointer"
                    title="الموقع الرسمي • أَثَـر ستوديو"
                  >
                    <span className="font-semibold tracking-wide">atar-studio.com</span>
                  </a>

                  <button
                    type="button"
                    onClick={handlePrayDua}
                    className="group flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 hover:text-gold-200 border border-gold-500/25 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
                    title="فتح ركن بر الوالدين وبطاقات الإهداء"
                  >
                    <Heart
                      size={13}
                      className="text-rose-400 group-hover:scale-110 transition-transform fill-rose-400/30"
                    />
                    <span>ركن بر الوالدين</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    className="p-1 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors cursor-pointer"
                    title="تصغير الشريط إلى زر عائم"
                    aria-label="تصغير الشريط"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    );
  }
);
