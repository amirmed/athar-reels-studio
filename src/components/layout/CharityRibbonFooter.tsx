import React from 'react';
import { Heart } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface CharityRibbonFooterProps {
  onOpenMotherDua?: () => void;
}

export const CharityRibbonFooter: React.FC<CharityRibbonFooterProps> = React.memo(
  ({ onOpenMotherDua }) => {
    const addToast = useAppStore((s) => s.addToast);

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
      <footer className="w-full bg-gradient-to-r from-surface-950 via-gold-900/25 to-surface-950 border-t border-gold-400/20 py-2.5 px-4 shrink-0 z-20 shadow-lg select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-start">
          {/* Main Charity Message */}
          <div
            onClick={handlePrayDua}
            className="flex items-center gap-2 text-xs text-white/80 leading-relaxed font-medium cursor-pointer hover:text-white transition-colors"
          >
            <span className="text-sm">🌿</span>
            <p>
              هذا العمل صُنع خالصاً ومجانياً كصدقة جارية عن الوالدة الغالية:{' '}
              <strong className="text-gold-300 font-bold underline decoration-gold-400/40 underline-offset-4">
                تيجاني عائشة
              </strong>{' '}
              (رحمها الله) ولكل والدين • أهدِ دعاءً لوالديك واكسب الأجر المشترك 🌸🤲
            </p>
          </div>

          {/* Interactive Dua / Ameen Button & Official Domain Badge */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center sm:justify-end">
            <a
              href="https://atar-studio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 min-h-[34px] rounded-full bg-white/[0.05] hover:bg-gold-500/15 border border-white/[0.08] hover:border-gold-400/30 text-xs font-mono text-white/70 hover:text-gold-300 transition-all shadow-sm cursor-pointer"
              title="الموقع الرسمي • أَثَـر ستوديو"
            >
              <span className="text-gold-400 font-sans text-xs">🌐</span>
              <span className="font-bold tracking-wide">atar-studio.com</span>
              <span className="text-[11px] text-white/40">© 2026</span>
            </a>

            <button
              onClick={handlePrayDua}
              className="group flex items-center gap-1.5 px-3.5 py-1.5 min-h-[34px] rounded-full bg-gradient-to-r from-gold-500/20 to-amber-500/20 hover:from-gold-500/30 hover:to-amber-500/30 text-gold-300 hover:text-gold-200 border border-gold-400/40 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="فتح ركن بر الوالدين وبطاقات الإهداء"
            >
              <Heart
                size={13}
                className="text-rose-400 group-hover:scale-110 transition-transform fill-rose-400/30"
              />
              <span>🌸 ركن بر الوالدين وإهداء بطاقة 4K 🤲</span>
            </button>
          </div>
        </div>
      </footer>
    );
  }
);
