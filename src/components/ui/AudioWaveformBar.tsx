import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { WaveformStyle } from '../../types';
import { getSampledWaveformHeights } from '../../services/audioPeakExtractor';

interface AudioWaveformBarProps {
  isPlaying: boolean;
  style?: WaveformStyle;
  color?: string;
  height?: number;
  opacity?: number;
  barCount?: number;
  peaks?: number[];
  currentTimeSec?: number;
  totalDurationSec?: number;
}

export const AudioWaveformBar: React.FC<AudioWaveformBarProps> = React.memo(
  ({
    isPlaying = false,
    style = 'bars',
    color = '#fbbf24',
    height = 28,
    opacity = 0.85,
    barCount = 28,
    peaks,
    currentTimeSec = 0,
    totalDurationSec = 15,
  }) => {
    // Sample real acoustic peaks if provided, otherwise natural harmonic envelope
    const sampledHeights = useMemo(() => {
      if (peaks && peaks.length > 0) {
        return getSampledWaveformHeights(peaks, currentTimeSec, totalDurationSec, barCount, 0);
      }
      return [
        0.3, 0.5, 0.8, 0.4, 0.9, 0.6, 0.75, 1.0, 0.85, 0.5, 0.7, 0.95, 0.6, 0.4, 0.8, 1.0, 0.7, 0.55,
        0.9, 0.65, 0.45, 0.8, 0.6, 0.35, 0.5, 0.75, 0.4, 0.6,
      ];
    }, [peaks, currentTimeSec, totalDurationSec, barCount]);

    const avgAmplitude = useMemo(() => {
      return sampledHeights.reduce((acc, h) => acc + h, 0) / (sampledHeights.length || 1);
    }, [sampledHeights]);

    if (style === 'wave') {
      const waveAmplitude = Math.max(5, avgAmplitude * 18);
      return (
        <div
          className="w-full flex items-center justify-center overflow-hidden py-1"
          style={{ opacity }}
        >
          <svg
            viewBox="0 0 400 40"
            className="w-full h-8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d={`M0 20 Q 50 ${20 - waveAmplitude}, 100 20 T 200 20 T 300 20 T 400 20`}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}
              animate={
                isPlaying
                  ? {
                      d: [
                        `M0 20 Q 50 ${20 - waveAmplitude}, 100 20 T 200 20 T 300 20 T 400 20`,
                        `M0 20 Q 50 ${20 + waveAmplitude}, 100 20 T 200 20 T 300 20 T 400 20`,
                        `M0 20 Q 50 ${20 - waveAmplitude * 0.5}, 100 20 T 200 20 T 300 20 T 400 20`,
                        `M0 20 Q 50 ${20 - waveAmplitude}, 100 20 T 200 20 T 300 20 T 400 20`,
                      ],
                    }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            />
            <motion.path
              d={`M0 20 Q 50 ${20 + waveAmplitude * 0.6}, 100 20 T 200 20 T 300 20 T 400 20`}
              stroke={color}
              strokeWidth="1.5"
              strokeOpacity="0.5"
              strokeLinecap="round"
              animate={
                isPlaying
                  ? {
                      d: [
                        `M0 20 Q 50 ${20 + waveAmplitude * 0.6}, 100 20 T 200 20 T 300 20 T 400 20`,
                        `M0 20 Q 50 ${20 - waveAmplitude * 0.6}, 100 20 T 200 20 T 300 20 T 400 20`,
                        `M0 20 Q 50 ${20 + waveAmplitude * 0.6}, 100 20 T 200 20 T 300 20 T 400 20`,
                      ],
                    }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      );
    }

    if (style === 'dots') {
      return (
        <div className="w-full flex items-center justify-center gap-1.5 py-1" style={{ opacity }}>
          {Array.from({ length: 16 }).map((_, i) => {
            const dotFactor = sampledHeights[i % sampledHeights.length] || 0.4;
            const bounce = -10 * dotFactor;

            return (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
                animate={
                  isPlaying
                    ? {
                        y: [0, bounce, 0],
                        scale: [1, 1.1 + dotFactor * 0.3, 1],
                        opacity: [0.5, 0.8 + dotFactor * 0.2, 0.5],
                      }
                    : { y: 0, scale: 1, opacity: 0.6 }
                }
                transition={{
                  repeat: Infinity,
                  duration: 0.7 + (i % 4) * 0.12,
                  delay: (i * 0.05) % 0.3,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </div>
      );
    }

    if (style === 'pulse') {
      const pulseScale = 0.75 + avgAmplitude * 0.45;
      return (
        <div className="w-full flex items-center justify-center py-1 relative" style={{ opacity }}>
          <motion.div
            className="h-1 rounded-full w-4/5"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 ${10 + avgAmplitude * 10}px ${color}`,
            }}
            animate={
              isPlaying
                ? {
                    scaleX: [pulseScale * 0.9, pulseScale * 1.1, pulseScale * 0.9],
                    opacity: [0.5, Math.min(1, 0.6 + avgAmplitude * 0.4), 0.5],
                    boxShadow: [
                      `0 0 6px ${color}`,
                      `0 0 ${12 + avgAmplitude * 12}px ${color}`,
                      `0 0 6px ${color}`,
                    ],
                  }
                : { scaleX: 0.85, opacity: 0.5 }
            }
            transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
          />
        </div>
      );
    }

    // Default: 'bars'
    return (
      <div
        className="w-full flex items-end justify-center gap-[3px] px-4"
        style={{ height: `${height}px`, opacity }}
      >
        {Array.from({ length: barCount }).map((_, i) => {
          const factor = sampledHeights[i % sampledHeights.length] || 0.3;
          const minHeight = 4;
          const maxHeight = height;
          const targetHeight = Math.max(minHeight, factor * maxHeight);

          return (
            <motion.div
              key={i}
              className="w-1 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: isPlaying ? `0 0 8px ${color}` : 'none',
                minHeight: `${minHeight}px`,
              }}
              animate={
                isPlaying
                  ? {
                      height: [
                        `${minHeight}px`,
                        `${targetHeight}px`,
                        `${Math.max(minHeight, targetHeight * 0.5)}px`,
                        `${targetHeight * 0.9}px`,
                        `${minHeight}px`,
                      ],
                    }
                  : { height: `${Math.max(minHeight, targetHeight * 0.5)}px` }
              }
              transition={{
                repeat: Infinity,
                duration: 0.8 + (i % 6) * 0.1,
                delay: (i * 0.03) % 0.3,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>
    );
  }
);
