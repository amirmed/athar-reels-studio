import React from 'react';
import { TextSettings } from '../../../types';
import { AyahData } from '../../../services/quranApi';

interface PreviewOrnamentsProps {
  textSettings?: TextSettings;
  ayahs: AyahData[];
  currentAyahIndex: number;
  currentTime: number;
  isPlaying: boolean;
}

export const PreviewOrnaments: React.FC<PreviewOrnamentsProps> = React.memo(
  ({
    textSettings,
    ayahs,
    currentAyahIndex,
    currentTime,
    isPlaying,
  }) => {
    const style = textSettings?.ornamentStyle || 'geometricArabesque';
    const color = textSettings?.ornamentColor || '#cbb06b';
    const opacity = textSettings?.ornamentOpacity ?? 0.75;
    const showOrnaments =
      textSettings?.showIslamicOrnaments !== false &&
      textSettings?.ornamentStyle &&
      textSettings.ornamentStyle !== 'none';

    // Cinematic Progress Bar Calculation
    const barStyle = textSettings?.progressBarStyle || 'neonGlow';
    const barColor = textSettings?.progressBarColor || '#cbb06b';
    const barHeight = textSettings?.progressBarHeight || 3;
    const showProgressBar = textSettings?.showProgressBar !== false;

    const totalAyahs = Math.max(1, ayahs.length);
    const currentIdx = Math.max(0, currentAyahIndex);
    const singleAyahDuration = ayahs[currentIdx]?.duration || 5;
    const currentSec = currentTime || 0;
    const currentAyahFraction = Math.min(1, currentSec / singleAyahDuration);

    const overallProgress = isPlaying
      ? ((currentIdx + currentAyahFraction) / totalAyahs) * 100
      : 0;

    return (
      <>
        {/* Islamic Ornaments Motif */}
        {showOrnaments && (
          <>
            {style === 'royalFrame' && (
              <div
                className="absolute inset-2 border border-dashed rounded-xl pointer-events-none z-10 flex flex-col justify-between p-2"
                style={{ borderColor: `${color}66`, opacity }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="w-12 h-px"
                    style={{ background: `linear-gradient(to right, transparent, ${color})` }}
                  />
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <polygon
                      points="12 2 15 8 21 9 17 14 18 20 12 17 6 20 7 14 3 9 9 8 12 2"
                      fill={`${color}33`}
                    />
                  </svg>
                  <span
                    className="w-12 h-px"
                    style={{ background: `linear-gradient(to left, transparent, ${color})` }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="w-12 h-px"
                    style={{ background: `linear-gradient(to right, transparent, ${color})` }}
                  />
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v10M7 12h10" />
                  </svg>
                  <span
                    className="w-12 h-px"
                    style={{ background: `linear-gradient(to left, transparent, ${color})` }}
                  />
                </div>
              </div>
            )}

            {style === 'geometricArabesque' && (
              <div
                className="absolute inset-x-0 top-6 flex justify-center pointer-events-none z-10"
                style={{ opacity }}
              >
                <svg className="w-40 h-6" viewBox="0 0 160 24" fill="none">
                  <path d="M0 12 H60 M100 12 H160" stroke={color} strokeWidth="1" />
                  <path
                    d="M70 12 L80 2 L90 12 L80 22 Z"
                    fill={`${color}44`}
                    stroke={color}
                    strokeWidth="1.5"
                  />
                  <circle cx="80" cy="12" r="3" fill={color} />
                  <circle cx="60" cy="12" r="2" fill={color} />
                  <circle cx="100" cy="12" r="2" fill={color} />
                </svg>
              </div>
            )}

            {style === 'domeCrescent' && (
              <div
                className="absolute top-2 inset-x-0 flex flex-col items-center pointer-events-none z-10"
                style={{ opacity }}
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill={color}>
                  <path d="M12 2C8.5 2 6 5 6 9c0 4 6 11 6 11s6-7 6-11c0-4-2.5-7-6-7zm0 2c1.5 0 3 1.5 3 3.5S13.5 11 12 11 9 9.5 9 7.5 10.5 4 12 4z" />
                </svg>
              </div>
            )}

            {style === 'floralCorners' && (
              <div className="absolute inset-1 pointer-events-none z-10" style={{ opacity }}>
                <svg className="absolute top-1 right-1 w-7 h-7" viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.5">
                  <path d="M2 2 H26 V26" />
                  <path d="M6 6 H22 V22" strokeWidth="0.8" strokeDasharray="2 2" />
                  <circle cx="14" cy="14" r="3" fill={`${color}44`} />
                </svg>
                <svg className="absolute top-1 left-1 w-7 h-7" viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.5">
                  <path d="M26 2 H2 V26" />
                  <path d="M22 6 H6 V22" strokeWidth="0.8" strokeDasharray="2 2" />
                  <circle cx="14" cy="14" r="3" fill={`${color}44`} />
                </svg>
                <svg className="absolute bottom-1 right-1 w-7 h-7" viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.5">
                  <path d="M2 26 H26 V2" />
                  <path d="M6 22 H22 V6" strokeWidth="0.8" strokeDasharray="2 2" />
                  <circle cx="14" cy="14" r="3" fill={`${color}44`} />
                </svg>
                <svg className="absolute bottom-1 left-1 w-7 h-7" viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.5">
                  <path d="M26 26 H2 V2" />
                  <path d="M22 22 H6 V6" strokeWidth="0.8" strokeDasharray="2 2" />
                  <circle cx="14" cy="14" r="3" fill={`${color}44`} />
                </svg>
              </div>
            )}
          </>
        )}

        {/* Cinematic Progress Bar */}
        {showProgressBar && (
          barStyle === 'dots' ? (
            <div className="absolute bottom-1 inset-x-0 flex justify-center items-center gap-1.5 z-20 px-4">
              {ayahs.map((_, dotIdx) => {
                const isDotActive = isPlaying && currentAyahIndex === dotIdx;
                const isDotPassed = isPlaying && currentAyahIndex > dotIdx;
                return (
                  <div
                    key={dotIdx}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: isDotActive ? '16px' : '6px',
                      height: '4px',
                      backgroundColor:
                        isDotActive || isDotPassed ? barColor : 'rgba(255,255,255,0.2)',
                      boxShadow: isDotActive ? `0 0 8px ${barColor}` : 'none',
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div
              className="absolute bottom-0 inset-x-0 z-20 bg-black/40 overflow-hidden"
              style={{ height: `${barHeight}px` }}
            >
              <div
                className="h-full transition-all duration-150 ease-linear rounded-e-full"
                style={{
                  width: `${Math.min(100, Math.max(0, overallProgress))}%`,
                  background:
                    barStyle === 'gradientWave'
                      ? `linear-gradient(to right, #10b981, #fbbf24, #38bdf8)`
                      : barColor,
                  boxShadow:
                    barStyle === 'neonGlow'
                      ? `0 0 10px ${barColor}, 0 0 18px ${barColor}`
                      : 'none',
                }}
              />
            </div>
          )
        )}
      </>
    );
  }
);
