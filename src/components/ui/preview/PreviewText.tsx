import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AyahData } from '../../../services/quranApi';
import { TextSettings, QuranWord } from '../../../types';

interface PreviewTextProps {
  displayText: string;
  displayAyahNumber: string;
  displayTranslation?: string;
  tafsirText?: string;
  showTranslation?: boolean;
  showTafsir?: boolean;
  textSettings?: TextSettings;
  fontFamily: string;
  isSynced: boolean;
  currentAyahIndex: number;
  currentTime: number;
  currentAyah?: AyahData;
  ayahs: AyahData[];
  isPlaying: boolean;
  size?: 'normal' | 'fullscreen';
  activeVariant: {
    initial?: any;
    animate?: any;
    exit?: any;
  };
  onWordClick?: (ayahIndex: number, word: QuranWord) => void;
}

export const PreviewText: React.FC<PreviewTextProps> = React.memo(
  ({
    displayText,
    displayAyahNumber,
    displayTranslation,
    tafsirText,
    showTranslation = false,
    showTafsir = false,
    textSettings,
    fontFamily,
    isSynced,
    currentAyahIndex,
    currentTime,
    currentAyah,
    ayahs,
    isPlaying,
    size = 'normal',
    activeVariant,
    onWordClick,
  }) => {
    const displayMode = textSettings?.displayMode || 'chunked';
    const textAlign = textSettings?.textAlign || 'center';
    const justifyClass =
      textAlign === 'right'
        ? 'justify-start text-start'
        : textAlign === 'left'
          ? 'justify-end text-end'
          : 'justify-center text-center';

    const baseLineHeight = textSettings?.lineHeight ?? 2.2;
    const baseWordSpacing = textSettings?.wordSpacing ? `${textSettings.wordSpacing}px` : undefined;
    const baseLetterSpacing = textSettings?.letterSpacing
      ? `${textSettings.letterSpacing}px`
      : undefined;

    // Drop Shadow & Glow Calculator
    const shadows: string[] = [];
    if (textSettings?.enableShadow !== false) {
      const sX = textSettings?.shadowOffsetX ?? 0;
      const sY = textSettings?.shadowOffsetY ?? 3;
      const sBlur = textSettings?.shadowBlur ?? 14;
      const sColor = textSettings?.shadowColor || 'rgba(0,0,0,0.95)';
      shadows.push(`${sX}px ${sY}px ${sBlur}px ${sColor}`);
    }
    if (textSettings?.enableGlow) {
      const gColor = textSettings?.glowColor || '#fbbf24';
      const gIntensity = textSettings?.glowIntensity ?? 16;
      shadows.push(`0 0 ${gIntensity}px ${gColor}dd`);
      shadows.push(`0 0 ${gIntensity * 1.8}px ${gColor}66`);
    }
    const combinedShadow = shadows.length > 0 ? shadows.join(', ') : undefined;

    // Stroke
    const strokeStyle = textSettings?.enableStroke
      ? `${textSettings?.strokeWidth ?? 1}px ${textSettings?.strokeColor || '#000000'}`
      : undefined;

    // Gradient Fills
    const gradientFills: Record<string, string> = {
      gold: 'linear-gradient(135deg, #fef08a 0%, #fbbf24 50%, #d97706 100%)',
      silver: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #64748b 100%)',
      emerald: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #059669 100%)',
      amber: 'linear-gradient(135deg, #fed7aa 0%, #f97316 50%, #c2410c 100%)',
      celestial: 'linear-gradient(135deg, #bae6fd 0%, #38bdf8 50%, #6366f1 100%)',
    };
    const activeGrad =
      textSettings?.textGradient && textSettings.textGradient !== 'none'
        ? gradientFills[textSettings.textGradient]
        : null;

    return (
      <>
        {/* Ayah text with cinematic transition & Word-by-Word Karaoke Highlight */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isSynced ? `ayah-${currentAyahIndex}` : 'static'}
            initial={isSynced ? activeVariant.initial : false}
            animate={activeVariant.animate}
            exit={isSynced ? activeVariant.exit : undefined}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="text-center px-3 py-4 rounded-xl relative overflow-hidden"
            style={{
              backgroundColor: textSettings
                ? `${textSettings.bgColor}${Math.round((textSettings.bgOpacity || 0.5) * 255)
                    .toString(16)
                    .padStart(2, '0')}`
                : 'rgba(0, 0, 0, 0.4)',
            }}
          >
            {(() => {
              // Mode 3: Continuous Mushaf Page Mode
              if (displayMode === 'continuous' && isSynced && ayahs.length > 1) {
                return (
                  <div
                    className={`quran-text w-full leading-[2.5] flex flex-wrap ${justifyClass} items-center gap-x-2 gap-y-2 max-h-[220px] overflow-y-auto px-1 custom-scrollbar`}
                    style={{
                      fontSize: textSettings
                        ? `${Math.max(textSettings.fontSize * 0.48, 11)}px`
                        : '13px',
                      fontWeight:
                        textSettings?.fontWeight === 'bold'
                          ? 800
                          : textSettings?.fontWeight === 'light'
                            ? 300
                            : 500,
                      fontFamily,
                      direction: 'rtl',
                      textAlign: (textAlign as React.CSSProperties['textAlign']) || 'center',
                    }}
                  >
                    {ayahs.map((a, aIdx) => {
                      const isCurrentAyah = currentAyahIndex === aIdx;
                      return (
                        <span
                          key={a.number}
                          className={`transition-all duration-300 ${
                            isCurrentAyah
                              ? 'text-gold-300 font-bold bg-gold-500/15 px-2 py-0.5 rounded-lg border border-gold-400/30 shadow-sm'
                              : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {a.text}
                          <span className="text-[11px] text-gold-400/80 ms-1.5 font-sans">
                            ﴿{a.numberInSurah}﴾
                          </span>
                        </span>
                      );
                    })}
                  </div>
                );
              }

              const allWords =
                isSynced && currentAyah?.words && currentAyah.words.length > 0
                  ? currentAyah.words
                  : ayahs.length > 0 &&
                      !isPlaying &&
                      ayahs[0]?.words &&
                      ayahs[0].words.length > 0
                    ? ayahs[0].words
                    : null;

              // Normalized current time calculation
              const curTime = currentTime || 0;
              const targetAyah = isSynced && currentAyah ? currentAyah : ayahs[0];
              const wordsBaseDur =
                allWords && allWords.length > 0
                  ? allWords[allWords.length - 1].endTime || 5
                  : 5;
              const effectiveAyahDur = targetAyah?.duration || wordsBaseDur;
              const timeScale =
                wordsBaseDur > 0 && effectiveAyahDur > 0
                  ? effectiveAyahDur / wordsBaseDur
                  : 1;
              const normalizedCurTime = timeScale > 0 ? curTime / timeScale : curTime;

              let activeWordIdx = -1;
              if (isPlaying && allWords) {
                activeWordIdx = allWords.findIndex(
                  (w) => normalizedCurTime >= w.startTime && normalizedCurTime < w.endTime
                );
                if (activeWordIdx === -1 && normalizedCurTime > 0) {
                  for (let i = allWords.length - 1; i >= 0; i--) {
                    if (normalizedCurTime >= allWords[i].startTime) {
                      activeWordIdx = i;
                      break;
                    }
                  }
                }
              }

              // Mode 2: Smart Waqf-Aware Chunking
              let wordsToDisplay = allWords;
              let displayOffset = 0;
              if (displayMode === 'chunked') {
                if (targetAyah?.chunks && targetAyah.chunks.length > 1) {
                  let activeChunk = targetAyah.chunks[0];
                  if (activeWordIdx >= 0 && allWords && allWords[activeWordIdx]) {
                    const currentWordId = allWords[activeWordIdx].id;
                    const foundByWord = targetAyah.chunks.find((c) =>
                      c.words.some((w) => w.id === currentWordId)
                    );
                    if (foundByWord) {
                      activeChunk = foundByWord;
                    }
                  } else if (normalizedCurTime > 0) {
                    const foundByTime = targetAyah.chunks.find(
                      (c) => normalizedCurTime >= c.startTime && normalizedCurTime < c.endTime
                    );
                    if (foundByTime) {
                      activeChunk = foundByTime;
                    } else if (
                      normalizedCurTime >=
                      targetAyah.chunks[targetAyah.chunks.length - 1].startTime
                    ) {
                      activeChunk = targetAyah.chunks[targetAyah.chunks.length - 1];
                    }
                  }

                  wordsToDisplay = activeChunk.words;
                  displayOffset = allWords
                    ? allWords.findIndex((w) => w.id === activeChunk.words[0]?.id)
                    : 0;
                  if (displayOffset < 0) displayOffset = 0;
                } else if (allWords && allWords.length > 12) {
                  const chunkSize = 7;
                  const chunkIdx = activeWordIdx >= 0 ? Math.floor(activeWordIdx / chunkSize) : 0;
                  displayOffset = chunkIdx * chunkSize;
                  wordsToDisplay = allWords.slice(displayOffset, displayOffset + chunkSize);
                }
              }

              const isKaraokeActive =
                textSettings?.wordHighlightEnabled !== false &&
                wordsToDisplay &&
                wordsToDisplay.length > 0;
              const highlightStyle = textSettings?.wordHighlightStyle || 'goldGlow';
              const highlightColor =
                textSettings?.wordHighlightColor ||
                (highlightStyle === 'emeraldGlow'
                  ? '#34d399'
                  : highlightStyle === 'amberEmber'
                    ? '#f97316'
                    : highlightStyle === 'radiantWhite'
                      ? '#ffffff'
                      : '#fbbf24');
              const inactiveOpacity = textSettings?.inactiveWordOpacity ?? 0.6;
              const shouldScale = textSettings?.highlightScale !== false;

              if (isKaraokeActive && wordsToDisplay) {
                return (
                  <div
                    className={`quran-text w-full flex flex-wrap ${justifyClass} items-center gap-x-2 gap-y-1`}
                    style={{
                      fontSize: textSettings
                        ? `${Math.max(textSettings.fontSize * (displayMode === 'chunked' ? 0.72 : 0.6), 13)}px`
                        : '16px',
                      fontWeight:
                        textSettings?.fontWeight === 'bold'
                          ? 800
                          : textSettings?.fontWeight === 'light'
                            ? 300
                            : 500,
                      fontFamily,
                      direction: 'rtl',
                      textAlign: (textAlign as React.CSSProperties['textAlign']) || 'center',
                      lineHeight: baseLineHeight,
                      wordSpacing: baseWordSpacing,
                      letterSpacing: baseLetterSpacing,
                      textShadow: combinedShadow,
                      WebkitTextStroke: strokeStyle,
                    }}
                  >
                    {wordsToDisplay.map((word, wIdx) => {
                      const actualIdx = displayOffset + wIdx;
                      const isCurrent = isPlaying && activeWordIdx === actualIdx;

                      let wordStyle: React.CSSProperties = {
                        color: textSettings?.textColor || '#ffffff',
                        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity:
                          isPlaying && activeWordIdx !== -1
                            ? isCurrent
                              ? 1.0
                              : inactiveOpacity
                            : 1.0,
                        cursor: onWordClick ? 'pointer' : 'default',
                        display: 'inline-block',
                        letterSpacing: baseLetterSpacing,
                      };

                      if (activeGrad && !isCurrent) {
                        wordStyle.backgroundImage = activeGrad;
                        wordStyle.WebkitBackgroundClip = 'text';
                        (wordStyle as React.CSSProperties & { WebkitTextFillColor?: string }).WebkitTextFillColor = 'transparent';
                      }

                      if (isCurrent) {
                        if (highlightStyle === 'goldGlow') {
                          wordStyle = {
                            ...wordStyle,
                            color: highlightColor,
                            backgroundImage: undefined,
                            WebkitTextFillColor: 'initial',
                            textShadow: `0 0 16px ${highlightColor}ee, 0 0 32px ${highlightColor}88, 0 2px 4px rgba(0,0,0,0.9)`,
                            transform: shouldScale ? 'scale(1.12)' : 'none',
                            zIndex: 10,
                          };
                        } else if (highlightStyle === 'radiantWhite') {
                          wordStyle = {
                            ...wordStyle,
                            color: '#ffffff',
                            backgroundImage: undefined,
                            WebkitTextFillColor: 'initial',
                            textShadow:
                              '0 0 16px rgba(255, 255, 255, 0.95), 0 0 32px rgba(56, 189, 248, 0.8), 0 2px 6px rgba(0,0,0,0.9)',
                            transform: shouldScale ? 'scale(1.1)' : 'none',
                            zIndex: 10,
                          };
                        } else if (highlightStyle === 'amberEmber') {
                          wordStyle = {
                            ...wordStyle,
                            color: highlightColor,
                            backgroundImage: undefined,
                            WebkitTextFillColor: 'initial',
                            textShadow: `0 0 18px ${highlightColor}ee, 0 0 36px rgba(234, 88, 12, 0.7), 0 2px 4px rgba(0,0,0,0.9)`,
                            transform: shouldScale ? 'scale(1.12)' : 'none',
                            zIndex: 10,
                          };
                        } else if (highlightStyle === 'emeraldGlow') {
                          wordStyle = {
                            ...wordStyle,
                            color: highlightColor,
                            backgroundImage: undefined,
                            WebkitTextFillColor: 'initial',
                            textShadow: `0 0 18px ${highlightColor}ee, 0 0 36px rgba(16, 185, 129, 0.7), 0 2px 4px rgba(0,0,0,0.9)`,
                            transform: shouldScale ? 'scale(1.12)' : 'none',
                            zIndex: 10,
                          };
                        } else if (highlightStyle === 'pillBadge') {
                          wordStyle = {
                            ...wordStyle,
                            color: '#ffffff',
                            backgroundImage: undefined,
                            WebkitTextFillColor: 'initial',
                            backgroundColor: `${highlightColor}33`,
                            borderRadius: '8px',
                            padding: '1px 8px',
                            boxShadow: `0 0 16px ${highlightColor}44, inset 0 0 10px ${highlightColor}22`,
                            border: `1px solid ${highlightColor}88`,
                            transform: shouldScale ? 'scale(1.08)' : 'none',
                            zIndex: 10,
                          };
                        } else if (highlightStyle === 'underlineWave') {
                          wordStyle = {
                            ...wordStyle,
                            color: highlightColor,
                            backgroundImage: undefined,
                            WebkitTextFillColor: 'initial',
                            borderBottom: `3px solid ${highlightColor}`,
                            paddingBottom: '2px',
                            textShadow: `0 0 12px ${highlightColor}99`,
                            transform: shouldScale ? 'scale(1.06)' : 'none',
                            zIndex: 10,
                          };
                        }
                      }

                      return (
                        <span
                          key={`${word.id}-${wIdx}`}
                          onClick={() =>
                            onWordClick &&
                            onWordClick(currentAyahIndex >= 0 ? currentAyahIndex : 0, word)
                          }
                          style={wordStyle}
                          className="relative select-none"
                          title={
                            word.translation
                              ? `${word.text} (${word.translation})`
                              : word.text
                          }
                        >
                          {word.text}
                        </span>
                      );
                    })}
                  </div>
                );
              }

              return (
                <p
                  className="quran-text"
                  style={{
                    fontSize: textSettings
                      ? `${Math.max(textSettings.fontSize * 0.6, 12)}px`
                      : '16px',
                    fontWeight:
                      textSettings?.fontWeight === 'bold'
                        ? 800
                        : textSettings?.fontWeight === 'light'
                          ? 300
                          : 500,
                    color: textSettings?.textColor || '#ffffff',
                    textAlign: (textSettings?.textAlign as React.CSSProperties['textAlign']) || 'center',
                    fontFamily,
                    lineHeight: baseLineHeight,
                    wordSpacing: baseWordSpacing,
                    letterSpacing: baseLetterSpacing,
                    textShadow: combinedShadow,
                    WebkitTextStroke: strokeStyle,
                    backgroundImage: activeGrad || undefined,
                    WebkitBackgroundClip: activeGrad ? 'text' : undefined,
                    WebkitTextFillColor: activeGrad ? 'transparent' : undefined,
                  }}
                >
                  {displayText}
                </p>
              );
            })()}

            {displayAyahNumber && (
              <p className="text-center text-xs text-gold-400 mt-2 font-medium">
                {displayAyahNumber}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Multi-Language Subtitles */}
        {showTranslation &&
          displayTranslation &&
          (() => {
            const targetAyah = isSynced && currentAyah ? currentAyah : ayahs[0];
            const allWords = targetAyah?.words || [];
            const curTime = currentTime || 0;

            let renderedTranslation = displayTranslation;

            if (displayMode === 'chunked') {
              if (targetAyah?.chunks && targetAyah.chunks.length > 1) {
                const wordsBaseDur =
                  allWords && allWords.length > 0
                    ? allWords[allWords.length - 1]?.endTime || 5
                    : 5;
                const effectiveAyahDur = targetAyah?.duration || wordsBaseDur;
                const timeScale =
                  wordsBaseDur > 0 && effectiveAyahDur > 0
                    ? effectiveAyahDur / wordsBaseDur
                    : 1;
                const normalizedCurTime = timeScale > 0 ? curTime / timeScale : curTime;

                let activeChunk = targetAyah.chunks[0];
                const foundByTime = targetAyah.chunks.find(
                  (c) => normalizedCurTime >= c.startTime && normalizedCurTime < c.endTime
                );
                if (foundByTime) {
                  activeChunk = foundByTime;
                } else if (
                  normalizedCurTime >=
                  targetAyah.chunks[targetAyah.chunks.length - 1].startTime
                ) {
                  activeChunk = targetAyah.chunks[targetAyah.chunks.length - 1];
                }

                const chunkWordTranslations = activeChunk.words
                  .map((w) => w.translation)
                  .filter(Boolean)
                  .join(' ');
                if (chunkWordTranslations && chunkWordTranslations.length > 5) {
                  renderedTranslation = chunkWordTranslations;
                } else {
                  const chunkIdx = Math.max(0, targetAyah.chunks.indexOf(activeChunk));
                  const transTokens = displayTranslation.trim().split(/\s+/);
                  const wordsPerChunk = Math.ceil(
                    transTokens.length / targetAyah.chunks.length
                  );
                  const start = chunkIdx * wordsPerChunk;
                  renderedTranslation = transTokens
                    .slice(start, start + wordsPerChunk)
                    .join(' ');
                }
              } else if (allWords.length > 7) {
                const chunkSize = 6;
                const wordsBaseDur = allWords[allWords.length - 1]?.endTime || 5;
                const effectiveAyahDur = targetAyah?.duration || wordsBaseDur;
                const timeScale =
                  wordsBaseDur > 0 && effectiveAyahDur > 0
                    ? effectiveAyahDur / wordsBaseDur
                    : 1;
                const normalizedCurTime = timeScale > 0 ? curTime / timeScale : curTime;

                let activeWordIdx = allWords.findIndex(
                  (w) => normalizedCurTime >= w.startTime && normalizedCurTime < w.endTime
                );
                if (activeWordIdx === -1 && normalizedCurTime > 0) activeWordIdx = 0;
                const totalChunks = Math.ceil(allWords.length / chunkSize);
                const chunkIdx = Math.max(
                  0,
                  Math.min(
                    totalChunks - 1,
                    Math.floor(Math.max(0, activeWordIdx) / chunkSize)
                  )
                );

                const transTokens = displayTranslation.trim().split(/\s+/);
                const wordsPerChunk = Math.ceil(transTokens.length / totalChunks);
                const start = chunkIdx * wordsPerChunk;
                renderedTranslation = transTokens
                  .slice(start, start + wordsPerChunk)
                  .join(' ');
              }
            }

            if (!renderedTranslation) return null;

            return (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`trans-${currentAyahIndex}-${renderedTranslation.slice(0, 15)}`}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.25 }}
                  className="mt-2.5 px-3 py-1 rounded-full bg-black/80 border border-white/10 shadow-lg max-w-[88%] mx-auto"
                >
                  <p
                    className="text-center leading-relaxed font-sans font-medium tracking-wide"
                    style={{
                      fontSize: textSettings?.translationFontSize
                        ? `${Math.min(size === 'fullscreen' ? textSettings.translationFontSize * 0.95 : textSettings.translationFontSize * 0.72, 13.5)}px`
                        : `${size === 'fullscreen' ? 11 : 9.5}px`,
                      color: textSettings?.translationColor || 'rgba(255,255,255,0.92)',
                      direction: textSettings?.translationLanguage === 'ur' ? 'rtl' : 'ltr',
                    }}
                  >
                    {renderedTranslation}
                  </p>
                </motion.div>
              </AnimatePresence>
            );
          })()}

        {/* Tafsir */}
        {showTafsir && tafsirText && (
          <p className="text-center text-[10px] text-white/30 mt-2 px-2 leading-relaxed italic">
            {tafsirText}
          </p>
        )}
      </>
    );
  }
);
