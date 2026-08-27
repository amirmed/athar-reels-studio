import React from 'react';
import { Volume2, VolumeX, Music, Clock } from 'lucide-react';
import { Slider } from './Slider';

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
      <Slider
        label="مستوى صوت التلاوة"
        icon={<Volume2 size={14} className="text-teal-400" />}
        min={0}
        max={100}
        value={recitationVolume}
        accentColor="teal"
        unit="%"
        onChange={onRecitationVolumeChange}
      />

      {/* Background volume */}
      <Slider
        label="صوت الخلفية"
        icon={<Music size={14} className="text-gold-400" />}
        min={0}
        max={100}
        value={backgroundVolume}
        accentColor="gold"
        unit="%"
        onChange={onBackgroundVolumeChange}
      />

      {/* Fade controls */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onFadeInChange(!fadeIn)}
          className={`
            flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border
            ${
              fadeIn
                ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
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
                ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
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
        <Slider
          label="مدة التلاشي"
          icon={<Clock size={14} className="text-white/50" />}
          min={1}
          max={5}
          step={0.5}
          value={fadeDuration}
          accentColor="teal"
          unit="ث"
          onChange={onFadeDurationChange}
        />
      )}
    </div>
  );
};
