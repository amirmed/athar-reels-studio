import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-800/50 border border-white/[0.06] flex items-center justify-center mb-4">
        <Icon size={28} className="text-white/20" />
      </div>
      <h3 className="text-base font-semibold text-white/60 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-white/30 max-w-sm text-center leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary-sm mt-5">
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};
