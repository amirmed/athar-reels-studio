import React from 'react';
import { motion } from 'framer-motion';
import { WaveformStyle } from '../../types';

interface AudioWaveformBarProps {
  isPlaying: boolean;
  style?: WaveformStyle;
  color?: string;
  height?: number;
  opacity?: number;
  barCount?: number;
}

export const AudioWaveformBar: React.FC<AudioWaveformBarProps> = React.memo(
  ({
    isPlaying = false,
    style = 'bars',
    color = '#fbbf24',
    height = 28,
    opacity = 0.85,
    barCount = 28,
  }) => {
    // Pre-calculated heights for natural audio frequency waveform look
    const barHeights = [
      0.3, 0.5, 0.8, 0.4, 0.9, 0.6, 0.75, 1.0, 0.85, 0.5, 0.7, 0.95, 0.6, 0.4, 0.8, 1.0, 0.7, 0.55,
      0.9, 0.65, 0.45, 0.8, 0.6, 0.35, 0.5, 0.75, 0.4, 0.6,
    ];

    if (style === 'wave') {
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
              d="M0 20 Q 50 5, 100 20 T 200 20 T 300 20 T 400 20"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}
              animate={
                isPlaying
                  ? {
                      d: [
                        'M0 20 Q 50 5, 100 20 T 200 20 T 300 20 T 400 20',
                        'M0 20 Q 50 35, 100 20 T 200 20 T 300 20 T 400 20',
                        'M0 20 Q 50 10, 100 20 T 200 20 T 300 20 T 400 20',
                        'M0 20 Q 50 5, 100 20 T 200 20 T 300 20 T 400 20',
                      ],
                    }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            />
            <motion.path
              d="M0 20 Q 50 30, 100 20 T 200 20 T 300 20 T 400 20"
              stroke={color}
              strokeWidth="1.5"
              strokeOpacity="0.5"
              strokeLinecap="round"
              animate={
                isPlaying
                  ? {
                      d: [
                        'M0 20 Q 50 30, 100 20 T 200 20 T 300 20 T 400 20',
                        'M0 20 Q 50 8, 100 20 T 200 20 T 300 20 T 400 20',
                        'M0 20 Q 50 30, 100 20 T 200 20 T 300 20 T 400 20',
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
          {Array.from({ length: 16 }).map((_, i) => (
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
                      y: [0, -8 * (0.4 + (i % 5) * 0.2), 0],
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 1, 0.6],
                    }
                  : { y: 0, scale: 1, opacity: 0.6 }
              }
              transition={{
                repeat: Infinity,
                duration: 0.8 + (i % 4) * 0.15,
                delay: i * 0.06,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      );
    }

    if (style === 'pulse') {
      return (
        <div className="w-full flex items-center justify-center py-1 relative" style={{ opacity }}>
          <motion.div
            className="h-1 rounded-full w-4/5"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}`,
            }}
            animate={
              isPlaying
                ? {
                    scaleX: [0.85, 1.05, 0.85],
                    opacity: [0.5, 1, 0.5],
                    boxShadow: [`0 0 6px ${color}`, `0 0 16px ${color}`, `0 0 6px ${color}`],
                  }
                : { scaleX: 0.9, opacity: 0.5 }
            }
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
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
          const factor = barHeights[i % barHeights.length];
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
                        `${Math.max(minHeight, targetHeight * 0.4)}px`,
                        `${targetHeight * 0.85}px`,
                        `${minHeight}px`,
                      ],
                    }
                  : { height: `${minHeight}px` }
              }
              transition={{
                repeat: Infinity,
                duration: 0.9 + (i % 6) * 0.12,
                delay: (i * 0.04) % 0.4,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>
    );
  }
);
