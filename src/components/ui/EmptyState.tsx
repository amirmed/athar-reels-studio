import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export type EmptyStateVariant = 'first-time' | 'search' | 'error' | 'default';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  iconClassName?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const IllustrationFirstTime: React.FC = () => (
  <svg
    className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-xl"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="goldGrad" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
        <stop stopColor="#cbb06b" />
        <stop offset="1" stopColor="#b89849" />
      </linearGradient>
      <radialGradient id="sunGrad" cx="80" cy="80" r="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#cbb06b" stopOpacity="0.2" />
        <stop offset="1" stopColor="#cbb06b" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ambient Glow */}
    <circle cx="80" cy="80" r="60" fill="url(#sunGrad)" />

    {/* Islamic 8-point geometric star backdrop */}
    <path
      d="M80 32 L92 48 L114 48 L114 70 L130 80 L114 90 L114 112 L92 112 L80 128 L68 112 L46 112 L46 90 L30 80 L46 70 L46 48 L68 48 Z"
      fill="rgba(var(--color-surface-800), 0.7)"
      stroke="url(#goldGrad)"
      strokeWidth="1.5"
      strokeOpacity="0.5"
    />

    {/* Film Reel Frame */}
    <rect
      x="54"
      y="48"
      width="52"
      height="64"
      rx="10"
      fill="rgba(var(--color-surface-900), 0.9)"
      stroke="url(#goldGrad)"
      strokeWidth="2"
    />
    <line x1="54" y1="60" x2="106" y2="60" stroke="url(#goldGrad)" strokeWidth="1.2" strokeDasharray="3 3" />
    <line x1="54" y1="100" x2="106" y2="100" stroke="url(#goldGrad)" strokeWidth="1.2" strokeDasharray="3 3" />

    {/* Play Triangle / Center Sparkle */}
    <path d="M74 72 L90 80 L74 88 Z" fill="url(#goldGrad)" />

    {/* Floating Magic Stars */}
    <circle cx="42" cy="40" r="3" fill="#cbb06b" />
    <path d="M122 42 L124 46 L128 48 L124 50 L122 54 L120 50 L116 48 L120 46 Z" fill="#cbb06b" />
    <circle cx="120" cy="116" r="2.5" fill="#b89849" />
    <path d="M38 110 L40 113 L43 114 L40 115 L38 118 L36 115 L33 114 L36 113 Z" fill="#ddc997" />
  </svg>
);

const IllustrationSearch: React.FC = () => (
  <svg
    className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-xl"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="skyGrad" x1="30" y1="30" x2="130" y2="130" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
      <radialGradient id="skyGlow" cx="80" cy="80" r="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" stopOpacity="0.2" />
        <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ambient Glow */}
    <circle cx="80" cy="80" r="55" fill="url(#skyGlow)" />

    {/* Background Document Plate */}
    <rect
      x="46"
      y="40"
      width="68"
      height="80"
      rx="12"
      fill="rgba(var(--color-surface-800), 0.85)"
      stroke="rgba(var(--color-surface-600), 0.6)"
      strokeWidth="1.5"
    />
    <line x1="58" y1="56" x2="94" y2="56" stroke="rgba(var(--color-surface-500), 0.5)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="58" y1="68" x2="102" y2="68" stroke="rgba(var(--color-surface-500), 0.5)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="58" y1="80" x2="86" y2="80" stroke="rgba(var(--color-surface-500), 0.5)" strokeWidth="2.5" strokeLinecap="round" />

    {/* Magnifying Glass */}
    <circle
      cx="92"
      cy="92"
      r="22"
      fill="rgba(var(--color-surface-900), 0.95)"
      stroke="url(#skyGrad)"
      strokeWidth="3.5"
    />
    <line
      x1="108"
      y1="108"
      x2="126"
      y2="126"
      stroke="url(#skyGrad)"
      strokeWidth="4"
      strokeLinecap="round"
    />

    {/* Small Search Particle dots */}
    <circle cx="92" cy="92" r="5" fill="#38bdf8" fillOpacity="0.4" />
    <circle cx="36" cy="62" r="3" fill="#38bdf8" />
    <circle cx="126" cy="46" r="2.5" fill="#7dd3fc" />
  </svg>
);

const IllustrationError: React.FC = () => (
  <svg
    className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-xl"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="roseGrad" x1="30" y1="30" x2="130" y2="130" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fb7185" />
        <stop offset="1" stopColor="#e11d48" />
      </linearGradient>
      <radialGradient id="roseGlow" cx="80" cy="80" r="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" stopOpacity="0.2" />
        <stop offset="1" stopColor="#f43f5e" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ambient Glow */}
    <circle cx="80" cy="80" r="55" fill="url(#roseGlow)" />

    {/* Shield Base */}
    <path
      d="M80 36 L114 50 C114 82 96 106 80 122 C64 106 46 82 46 50 Z"
      fill="rgba(var(--color-surface-800), 0.9)"
      stroke="url(#roseGrad)"
      strokeWidth="2"
    />

    {/* Exclamation Mark */}
    <line x1="80" y1="62" x2="80" y2="84" stroke="url(#roseGrad)" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="80" cy="96" r="3" fill="#fb7185" />

    {/* Satellite Nodes */}
    <circle cx="34" cy="50" r="3" fill="#fda4af" />
    <circle cx="128" cy="74" r="2.5" fill="#fb7185" />
  </svg>
);

const IllustrationDefault: React.FC = () => (
  <svg
    className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-xl"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="defGoldGrad" x1="30" y1="30" x2="130" y2="130" gradientUnits="userSpaceOnUse">
        <stop stopColor="#cbb06b" />
        <stop offset="1" stopColor="#b89849" />
      </linearGradient>
      <radialGradient id="defGoldGlow" cx="80" cy="80" r="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#cbb06b" stopOpacity="0.18" />
        <stop offset="1" stopColor="#cbb06b" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ambient Glow */}
    <circle cx="80" cy="80" r="55" fill="url(#defGoldGlow)" />

    {/* Folder Body */}
    <path
      d="M42 54 C42 48 46 44 52 44 L70 44 L80 54 L108 54 C114 54 118 48 118 64 L118 104 C118 110 114 114 108 114 L52 114 C46 114 42 110 42 104 Z"
      fill="rgba(var(--color-surface-800), 0.9)"
      stroke="url(#defGoldGrad)"
      strokeWidth="2"
    />

    {/* Inner Folder Sheet */}
    <rect
      x="54"
      y="62"
      width="52"
      height="38"
      rx="6"
      fill="rgba(var(--color-surface-700), 0.5)"
      stroke="url(#defGoldGrad)"
      strokeWidth="1.5"
    />

    {/* Small Star Sparkles */}
    <circle cx="44" cy="38" r="2.5" fill="#ddc997" />
    <circle cx="124" cy="50" r="3" fill="#cbb06b" />
    <path d="M120 104 L122 107 L125 108 L122 109 L120 112 L118 109 L115 108 L118 107 Z" fill="#cbb06b" />
  </svg>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  icon: Icon,
  iconClassName,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  const renderIllustration = () => {
    switch (variant) {
      case 'first-time':
        return <IllustrationFirstTime />;
      case 'search':
        return <IllustrationSearch />;
      case 'error':
        return <IllustrationError />;
      case 'default':
      default:
        if (Icon) {
          return (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-gold-500/15 via-surface-800/80 to-surface-850 border border-gold-500/30 shadow-xl shadow-gold-500/5 flex items-center justify-center mb-1">
              <Icon size={30} className={iconClassName || 'text-gold-400'} />
            </div>
          );
        }
        return <IllustrationDefault />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-4 flex items-center justify-center"
      >
        {renderIllustration()}
      </motion.div>

      <h3 className="text-base sm:text-lg font-bold text-surface-100 mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-surface-300 max-w-md leading-relaxed">{description}</p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 mt-5 flex-wrap justify-center">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="btn-primary-sm cursor-pointer shadow-md active:scale-95 transition-all"
            >
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="btn-ghost text-xs py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};
