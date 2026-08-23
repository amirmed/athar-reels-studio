import React from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

interface AudioControlPanelProps {
  recitationVolume: number;
  onRecitationVolumeChange: (value: number) => void;
  backgroundVolume: number;
  onBackgroundVolumeChange: (value: number) => void;
  fadeIn: boolean;
  onFadeInChange: (value: boolean) => void;
  fadeOut: boolean;
  onFadeOutChange: (value: boolean) => void;
  fadeDuration: number;
  onFadeDurationChange: (value: number) => void;
}

export const AudioControlPanel: React.FC<AudioControlPanelProps> = ({
  recitationVolume,
  onRecitationVolumeChange,
  backgroundVolume,
  onBackgroundVolumeChange,
  fadeIn,
  onFadeInChange,
  fadeOut,
  onFadeOutChange,
  fadeDuration,
  onFadeDurationChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Recitation volume */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/50 font-medium flex items-center gap-1.5">
            <Volume2 size={14} className="text-accent-400" />
            مستوى صوت التلاوة
          </label>
          <span className="text-xs text-white/40 font-mono">{recitationVolume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={recitationVolume}
          onChange={(e) => onRecitationVolumeChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Background volume */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/50 font-medium flex items-center gap-1.5">
            <Music size={14} className="text-gold-400" />
            صوت الخلفية
          </label>
          <span className="text-xs text-white/40 font-mono">{backgroundVolume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={backgroundVolume}
          onChange={(e) => onBackgroundVolumeChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Fade controls */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onFadeInChange(!fadeIn)}
          className={`
            flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border
            ${
              fadeIn
                ? 'bg-accent-500/10 text-accent-400 border-accent-500/20'
                : 'bg-surface-800/40 text-white/40 border-white/[0.06] hover:bg-surface-800/60'
            }
          `}
        >
          تلاشي الدخول
          <span className="text-[11px]">{fadeIn ? '✓' : ''}</span>
        </button>
        <button
          onClick={() => onFadeOutChange(!fadeOut)}
          className={`
            flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border
            ${
              fadeOut
                ? 'bg-accent-500/10 text-accent-400 border-accent-500/20'
                : 'bg-surface-800/40 text-white/40 border-white/[0.06] hover:bg-surface-800/60'
            }
          `}
        >
          تلاشي الخروج
          <span className="text-[11px]">{fadeOut ? '✓' : ''}</span>
        </button>
      </div>

      {/* Fade duration */}
      {(fadeIn || fadeOut) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/50 font-medium">مدة التلاشي</label>
            <span className="text-xs text-white/40  font-mono">{fadeDuration}ث</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={fadeDuration}
            onChange={(e) => onFadeDurationChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};
