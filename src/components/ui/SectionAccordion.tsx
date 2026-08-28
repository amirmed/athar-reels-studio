import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface SectionAccordionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

export const SectionAccordion: React.FC<SectionAccordionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-surface-700/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-surface-800/30 hover:bg-surface-800/50 transition-colors"
      >
        {icon && <span className="text-accent-400">{icon}</span>}
        <span className="text-sm font-semibold text-surface-200 flex-1 text-start">{title}</span>
        {badge && (
          <span className="text-[11px] bg-accent-500/15 text-accent-400 px-2 py-0.5 rounded-md font-medium">
            {badge}
          </span>
        )}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-surface-400"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 border-t border-surface-700/40 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
