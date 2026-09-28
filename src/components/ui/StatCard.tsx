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
    bg: 'bg-surface-900/90',
    icon: 'bg-surface-800 text-gold-400 border border-surface-700/30',
    border: 'border-surface-700/30',
  },
  gold: {
    bg: 'bg-surface-900/90',
    icon: 'bg-surface-800 text-gold-400 border border-surface-700/30',
    border: 'border-surface-700/30',
  },
  emerald: {
    bg: 'bg-surface-900/90',
    icon: 'bg-surface-800 text-accent-400 border border-surface-700/30',
    border: 'border-surface-700/30',
  },
  surface: {
    bg: 'bg-surface-900/90',
    icon: 'bg-surface-800 text-surface-300 border border-surface-700/30',
    border: 'border-surface-700/30',
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: [0.4, 0, 0.2, 1] }}
      className={`
        rounded-xl ${colors.bg} border ${colors.border}
        p-4 hover:border-gold-500/30 transition-all duration-150
        shadow-sm group cursor-default overflow-hidden
      `}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs text-surface-400 font-medium mb-1 truncate">
            {title}
          </p>
          <p
            className={`${
              isTextValue
                ? 'text-sm sm:text-base font-bold leading-snug font-arabic'
                : 'text-2xl sm:text-3xl font-bold font-mono'
            } text-surface-50 truncate block w-full tracking-tight`}
            title={String(value)}
          >
            {value}
          </p>
          {trend && <p className="text-xs text-gold-400/90 mt-1 font-medium truncate">{trend}</p>}
        </div>
        <div
          className={`w-10 h-10 rounded-xl shrink-0 ${colors.icon} flex items-center justify-center transition-transform duration-150 shadow-sm`}
        >
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
};
