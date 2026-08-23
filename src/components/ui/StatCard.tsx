import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'accent' | 'gold' | 'emerald' | 'surface';
  delay?: number;
}

const colorMap = {
  accent: {
    bg: 'from-accent-500/10 to-accent-600/5',
    icon: 'bg-accent-500/15 text-accent-400',
    border: 'border-accent-500/15',
    glow: 'shadow-accent-500/5',
  },
  gold: {
    bg: 'from-gold-500/10 to-gold-600/5',
    icon: 'bg-gold-500/15 text-gold-400',
    border: 'border-gold-500/15',
    glow: 'shadow-gold-500/5',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-600/5',
    icon: 'bg-emerald-500/15 text-emerald-400',
    border: 'border-emerald-500/15',
    glow: 'shadow-emerald-500/5',
  },
  surface: {
    bg: 'from-surface-800/60 to-surface-900/60',
    icon: 'bg-surface-700/60 text-white/70',
    border: 'border-white/[0.06]',
    glow: 'shadow-black/10',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'accent',
  delay = 0,
}) => {
  const colors = colorMap[color];
  const isTextValue = typeof value === 'string' && isNaN(Number(value)) && value !== '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className={`
        glass-card bg-gradient-to-bl ${colors.bg} border ${colors.border}
        p-5 hover:border-white/[0.1] transition-all duration-300
        hover:shadow-xl ${colors.glow} group cursor-default overflow-hidden
      `}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs sm:text-[13px] text-white/70 font-semibold mb-1.5 truncate">
            {title}
          </p>
          <p
            className={`${
              isTextValue
                ? 'text-base sm:text-lg font-bold leading-snug font-arabic'
                : 'text-2xl sm:text-3xl font-black font-mono'
            } text-white truncate block w-full tracking-tight`}
            title={String(value)}
          >
            {value}
          </p>
          {trend && <p className="text-xs text-accent-400 mt-1.5 font-bold truncate">{trend}</p>}
        </div>
        <div
          className={`w-11 h-11 rounded-2xl shrink-0 ${colors.icon} flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm`}
        >
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
};
