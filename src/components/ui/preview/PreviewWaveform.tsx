import React from 'react';
import { AudioWaveformBar } from '../AudioWaveformBar';
import { TextSettings } from '../../../types';

interface PreviewWaveformProps {
  showWaveform?: boolean;
  isPlaying?: boolean;
  textSettings?: TextSettings;
  size?: 'normal' | 'fullscreen';
  isPerf?: boolean;
  peaks?: number[];
  currentTimeSec?: number;
  totalDurationSec?: number;
}

export const PreviewWaveform: React.FC<PreviewWaveformProps> = React.memo(
  ({
    showWaveform = false,
    isPlaying = false,
    textSettings,
    size = 'normal',
    isPerf = false,
    peaks,
    currentTimeSec = 0,
    totalDurationSec = 15,
  }) => {
    if (!showWaveform && !textSettings?.showWaveform) {
      return null;
    }

    return (
      <div className="absolute bottom-7 inset-x-0 z-20 flex justify-center pointer-events-none px-4">
        <AudioWaveformBar
          isPlaying={isPlaying}
          style={textSettings?.waveformStyle || 'bars'}
          color={textSettings?.waveformColor || '#fbbf24'}
          height={textSettings?.waveformHeight || (size === 'fullscreen' ? 36 : 22)}
          opacity={textSettings?.waveformOpacity ?? 0.85}
          peaks={peaks}
          currentTimeSec={currentTimeSec}
          totalDurationSec={totalDurationSec}
          barCount={
            isPerf ? (size === 'fullscreen' ? 14 : 10) : size === 'fullscreen' ? 36 : 26
          }
        />
      </div>
    );
  }
);
