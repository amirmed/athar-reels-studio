import React from 'react';

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
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const displayVal = formatValue ? formatValue(value) : `${value}${unit}`;

  const accentClasses = {
    teal: 'accent-teal-500 text-teal-400 bg-teal-500/10 border-teal-500/20',
    gold: 'accent-gold-500 text-gold-400 bg-gold-500/10 border-gold-500/20',
    amber: 'accent-amber-500 text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'accent-emerald-500 text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'accent-sky-500 text-sky-400 bg-sky-500/10 border-sky-500/20',
  };

  return (
    <div className={`space-y-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      {(label || showValueBadge) && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-white/80 font-medium">
            {icon && <span className="text-white/60">{icon}</span>}
            {label && <span>{label}</span>}
          </div>
          {showValueBadge && (
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border ${accentClasses[accentColor]}`}
            >
              {displayVal}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500/50 ${accentClasses[accentColor]}`}
          style={{
            background: `linear-gradient(to right, ${
              accentColor === 'gold' ? '#fbbf24' : '#14b8a6'
            } 0%, ${
              accentColor === 'gold' ? '#fbbf24' : '#14b8a6'
            } ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`,
          }}
        />
      </div>

      {hint && <p className="text-[10px] text-white/40 leading-relaxed">{hint}</p>}
    </div>
  );
};
