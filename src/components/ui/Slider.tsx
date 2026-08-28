import React, { useId } from 'react';

export interface SliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (val: number) => string | number;
  icon?: React.ReactNode;
  hint?: string;
  disabled?: boolean;
  accentColor?: 'teal' | 'gold' | 'amber' | 'emerald' | 'blue';
  onChange: (val: number) => void;
  className?: string;
  showValueBadge?: boolean;
}

const ACCENT_COLOR_HEX: Record<NonNullable<SliderProps['accentColor']>, string> = {
  teal: '#14b8a6',
  gold: '#fbbf24',
  amber: '#f59e0b',
  emerald: '#10b981',
  blue: '#0ea5e9',
};

const ACCENT_CLASSES: Record<NonNullable<SliderProps['accentColor']>, string> = {
  teal: 'accent-teal-500 text-teal-400 bg-teal-500/10 border-teal-500/20',
  gold: 'accent-gold-500 text-gold-400 bg-gold-500/10 border-gold-500/20',
  amber: 'accent-amber-500 text-amber-400 bg-amber-500/10 border-amber-500/20',
  emerald: 'accent-emerald-500 text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  blue: 'accent-sky-500 text-sky-400 bg-sky-500/10 border-sky-500/20',
};

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  formatValue,
  icon,
  hint,
  disabled = false,
  accentColor = 'teal',
  onChange,
  className = '',
  showValueBadge = true,
}) => {
  const inputId = useId();
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const displayVal = formatValue ? formatValue(value) : `${value}${unit}`;
  const activeHex = ACCENT_COLOR_HEX[accentColor] || ACCENT_COLOR_HEX.teal;

  return (
    <div className={`space-y-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      {(label || showValueBadge) && (
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor={inputId}
            className="flex items-center gap-1.5 text-white/90 font-medium cursor-pointer select-none"
          >
            {icon && <span className="text-white/60">{icon}</span>}
            {label && <span>{label}</span>}
          </label>
          {showValueBadge && (
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border ${ACCENT_CLASSES[accentColor]}`}
            >
              {displayVal}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-label={label || 'شريط تمرير'}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={String(displayVal)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-500/50 ${ACCENT_CLASSES[accentColor]}`}
          style={{
            background: `linear-gradient(to right, ${activeHex} 0%, ${activeHex} ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`,
          }}
        />
      </div>

      {hint && <p className="text-[11px] text-white/60 leading-relaxed">{hint}</p>}
    </div>
  );
};
