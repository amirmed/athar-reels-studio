import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, Square, Sparkles, Move, Headphones } from 'lucide-react';
import { AyahData } from '../../services/quranApi';
import { TextSettings, QuranWord } from '../../types';
import { AudioWaveformBar } from './AudioWaveformBar';
import { isVideoMedia } from '../../utils/imageUtils';
import { getAudioPeaksCached, extractAudioPeaksFromUrl } from '../../services/audioPeakExtractor';

const CURATED_SCENE_FALLBACKS = [
  'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
  'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
  'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
  'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
  'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=1280',
  'https://images.pexels.com/photos/2440024/pexels-photo-2440024.jpeg?auto=compress&cs=tinysrgb&w=1280',
];

interface PreviewFrameProps {
  aspectRatio: '9:16' | '16:9' | '1:1';
  ayahText?: string;
  translationText?: string;
  tafsirText?: string;
  textSettings?: TextSettings;
  showTranslation?: boolean;
  showTafsir?: boolean;
  backgroundUrl?: string;
  backgroundOpacity?: number;
  watermark?: string;
  surahName?: string;
  reciterName?: string;
  ayahRange?: string;
  currentAyahIndex?: number;
  currentTime?: number;
  ayahs?: AyahData[];
  translations?: { numberInSurah: number; text: string }[];
  isPlaying?: boolean;
  transition?: string;
  videoEffect?: string;
  size?: 'normal' | 'fullscreen';
  performanceMode?: 'balanced' | 'quality' | 'performance';
  audioPeaks?: number[];
  onWordClick?: (ayahIndex: number, word: QuranWord) => void;
  onWatermarkDragEnd?: (x: number, y: number) => void;
}

const aspectDimensions = {
  '9:16': { width: 270, height: 480 },
  '16:9': { width: 480, height: 270 },
  '1:1': { width: 340, height: 340 },
};

const ratioIcons = {
  '9:16': Smartphone,
  '16:9': Monitor,
  '1:1': Square,
};

export const PreviewFrame: React.FC<PreviewFrameProps> = React.memo(
  ({
    aspectRatio = '9:16',
    ayahText = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translationText,
    tafsirText,
    textSettings,
    showTranslation = false,
    showTafsir = false,
    backgroundUrl,
    backgroundOpacity = 0.6,
    watermark,
    surahName = 'الفاتحة',
    reciterName,
    ayahRange = '1 - 7',
    currentAyahIndex = -1,
    currentTime = 0,
    ayahs = [],
    translations = [],
    isPlaying = false,
    transition = 'fadeScale',
    videoEffect = 'none',
    size = 'normal',
    performanceMode = 'balanced',
    audioPeaks,
    onWordClick,
    onWatermarkDragEnd,
  }) => {
    const isPerf = performanceMode === 'performance';

    const activeAyahObj = ayahs.length > 0 && currentAyahIndex >= 0 ? ayahs[currentAyahIndex] : ayahs[0];
    const currentAudioUrl = activeAyahObj?.audioUrl;
    const [livePeaks, setLivePeaks] = React.useState<number[] | undefined>(audioPeaks);

    React.useEffect(() => {
      if (audioPeaks && audioPeaks.length > 0) {
        setLivePeaks(audioPeaks);
        return;
      }
      if (!currentAudioUrl) {
        setLivePeaks(undefined);
        return;
      }
      const cached = getAudioPeaksCached(currentAudioUrl);
      if (cached) {
        setLivePeaks(cached);
        return;
      }
      let isCancelled = false;
      extractAudioPeaksFromUrl(currentAudioUrl).then((p) => {
        if (!isCancelled && p && p.length > 0) {
          setLivePeaks(p);
        }
      }).catch(() => {});
      return () => {
        isCancelled = true;
      };
    }, [audioPeaks, currentAudioUrl]);

    const baseDims = aspectDimensions[aspectRatio] || aspectDimensions['9:16'];
    const scaleFactor = size === 'fullscreen' ? 1.55 : 1.0;
    const dims = {
      width: Math.round(baseDims.width * scaleFactor),
      height: Math.round(baseDims.height * scaleFactor),
    };
    const RatioIcon = ratioIcons[aspectRatio];

    const positionClasses = {
      top: 'items-start pt-12',
      center: 'items-center',
      bottom: 'items-end pb-12',
    };

    const position = textSettings?.position || 'center';
    const fontFamily = textSettings?.fontFamily || 'Amiri';

    // Determine what text to show (Memoized)
    const displayInfo = React.useMemo(() => {
      const isSynced = ayahs.length > 0;
      const currentAyah = isSynced && currentAyahIndex >= 0 ? ayahs[currentAyahIndex] : null;
      const currentTrans =
        isSynced && currentAyahIndex >= 0 ? translations[currentAyahIndex] : null;

      let displayText = ayahText;
      let displayTranslation = translationText || '';
      let displayAyahNumber = '';

      if (isSynced) {
        if (isPlaying && currentAyah) {
          displayText = currentAyah.text;
          displayTranslation = currentTrans?.text || '';
          displayAyahNumber = `﴿ ${currentAyah.numberInSurah} ﴾`;
        } else if (!isPlaying && ayahs.length > 0) {
          displayText = ayahs[0].text;
          displayTranslation = translations[0]?.text || '';
          displayAyahNumber = `﴿ ${ayahs[0].numberInSurah} ﴾`;
        }
      }
      return { isSynced, currentAyah, displayText, displayTranslation, displayAyahNumber };
    }, [ayahs, currentAyahIndex, translations, isPlaying, ayahText, translationText]);

    const { isSynced, currentAyah, displayText, displayTranslation, displayAyahNumber } = displayInfo;

    // Cinematic transition variants (Memoized)
    const activeVariant = React.useMemo(() => {
      const variants: Record<string, { initial: Record<string, number | string>; animate: Record<string, number | string>; exit: Record<string, number | string> }> = {
        fadeScale: {
          initial: { opacity: 0, scale: isPerf ? 1 : 0.92 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: isPerf ? 1 : 1.06 },
        },
        slideUp: {
          initial: { opacity: 0, y: isPerf ? 20 : 60 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: isPerf ? -20 : -60 },
        },
        slideRight: {
          initial: { opacity: 0, x: isPerf ? -30 : -80 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: isPerf ? 30 : 80 },
        },
        zoomIn: {
          initial: { opacity: 0, scale: isPerf ? 0.8 : 0.5 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: isPerf ? 1.1 : 1.5 },
        },
        flip: {
          initial: { opacity: 0, rotateX: isPerf ? 0 : 90 },
          animate: { opacity: 1, rotateX: 0 },
          exit: { opacity: 0, rotateX: isPerf ? 0 : -90 },
        },
        blur: {
          initial: { opacity: 0, filter: isPerf ? 'none' : 'blur(20px)' },
          animate: { opacity: 1, filter: 'blur(0px)' },
          exit: { opacity: 0, filter: isPerf ? 'none' : 'blur(20px)' },
        },
      };
      return variants[transition] || variants.fadeScale;
    }, [transition, isPerf]);

    const activeBackgroundUrl = React.useMemo(() => {
      return (
        textSettings?.sceneBackgrounds?.[currentAyahIndex] ||
        backgroundUrl ||
        CURATED_SCENE_FALLBACKS[Math.max(0, currentAyahIndex) % CURATED_SCENE_FALLBACKS.length]
      );
    }, [textSettings?.sceneBackgrounds, currentAyahIndex, backgroundUrl]);

    return (
      <motion.div
        initial={{ opacity: 0, scale: isPerf ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: isPerf ? 0.2 : 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Frame info */}
        <div className="flex items-center gap-3 text-xs text-white/40">
          <RatioIcon size={14} />
          <span>{aspectRatio}</span>
          <span className="w-px h-3 bg-white/10"></span>
          <span>سورة {surahName}</span>
          <span className="w-px h-3 bg-white/10"></span>
          <span>آية {ayahRange}</span>
        </div>

        {/* Preview container */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/[0.08]"
          style={{ width: dims.width, height: dims.height }}
          id="preview-canvas-container"
        >
          {/* Background with Multi-Scene Crossfade */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-800 via-surface-900 to-black">
            {activeBackgroundUrl &&
              (() => {
                const isVideo = isVideoMedia(activeBackgroundUrl);
                return isVideo ? (
                  <video
                    key={activeBackgroundUrl}
                    src={activeBackgroundUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: backgroundOpacity }}
                  />
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeBackgroundUrl}
                      src={activeBackgroundUrl}
                      alt=""
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={(() => {
                        if (isPerf) {
                          return { opacity: backgroundOpacity, scale: 1, x: 0, y: 0, rotate: 0 };
                        }
                        const motionType =
                          textSettings?.cameraMotion ||
                          (videoEffect === 'kenBurns' ? 'slowZoom' : 'none');
                        if (motionType === 'slowZoom') {
                          return { opacity: backgroundOpacity, scale: [1, 1.15, 1.02] };
                        }
                        if (motionType === 'panRight') {
                          return { opacity: backgroundOpacity, scale: 1.12, x: [-18, 18, -18] };
                        }
                        if (motionType === 'panLeft') {
                          return { opacity: backgroundOpacity, scale: 1.12, x: [18, -18, 18] };
                        }
                        if (motionType === 'subtle3D') {
                          return {
                            opacity: backgroundOpacity,
                            scale: [1, 1.1, 1],
                            rotate: [0, 0.6, -0.6, 0],
                            y: [0, -8, 8, 0],
                          };
                        }
                        return { opacity: backgroundOpacity, scale: 1, x: 0, y: 0, rotate: 0 };
                      })()}
                      exit={{ opacity: 0 }}
                      transition={(() => {
                        if (isPerf) {
                          return { duration: 0.2, ease: 'easeOut' };
                        }
                        const motionType =
                          textSettings?.cameraMotion ||
                          (videoEffect === 'kenBurns' ? 'slowZoom' : 'none');
                        if (motionType !== 'none') {
                          return { duration: 22, repeat: Infinity, ease: 'easeInOut' };
                        }
                        return { duration: 0.6, ease: 'easeInOut' };
                      })()}
                      className="absolute inset-0 w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </AnimatePresence>
                );
              })()}
            <div className="absolute inset-0 pattern-dots opacity-20"></div>
          </div>

          {/* Video Effect Overlays */}
          {videoEffect === 'vignette' && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
              }}
            />
          )}
          {videoEffect === 'cinematic' && (
            <>
              <div className="absolute top-0 inset-x-0 h-10 bg-black pointer-events-none z-10" />
              <div className="absolute bottom-0 inset-x-0 h-10 bg-black pointer-events-none z-10" />
            </>
          )}
          {videoEffect === 'glow' && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(20,184,166,0.18) 0%, transparent 70%)',
              }}
            />
          )}
          {videoEffect === 'particles' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-accent-400/60"
                  style={{ left: `${10 + i * 12}%`, top: `${20 + (i % 3) * 20}%` }}
                  animate={{ y: [-20, 20, -20], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>
          )}

          {/* Cinematic Color Grading & Mood Overlays */}
          {textSettings?.colorGrading === 'royalGold' && (
            <div
              className="absolute inset-0 pointer-events-none z-10 mix-blend-color-dodge opacity-60"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.25) 0%, rgba(180, 83, 9, 0.4) 65%, rgba(0, 0, 0, 0.8) 100%)',
              }}
            />
          )}
          {textSettings?.colorGrading === 'andalusianTwilight' && (
            <div
              className="absolute inset-0 pointer-events-none z-10 mix-blend-soft-light opacity-75"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.2) 0%, rgba(30, 27, 75, 0.6) 65%, rgba(0, 0, 0, 0.9) 100%)',
              }}
            />
          )}
          {textSettings?.colorGrading === 'dawnMist' && (
            <div
              className="absolute inset-0 pointer-events-none z-10 mix-blend-screen opacity-50"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(224, 242, 254, 0.25) 0%, rgba(12, 74, 110, 0.4) 75%, rgba(0, 0, 0, 0.8) 100%)',
              }}
            />
          )}
          {textSettings?.colorGrading === 'matteSilver' && (
            <div
              className="absolute inset-0 pointer-events-none z-10 backdrop-grayscale-[40%] backdrop-contrast-[115%]"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.75) 100%)',
              }}
            />
          )}
          {textSettings?.colorGrading === 'emeraldNoor' && (
            <div
              className="absolute inset-0 pointer-events-none z-10 mix-blend-color-dodge opacity-65"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(52, 211, 153, 0.25) 0%, rgba(6, 78, 59, 0.45) 70%, rgba(0, 0, 0, 0.85) 100%)',
              }}
            />
          )}

          {/* Safe area guides */}
          <div className="absolute inset-3 border border-dashed border-white/[0.06] rounded-xl pointer-events-none"></div>

          {/* Content area (Draggable on Canvas) */}
          <div
            className={`absolute inset-0 flex flex-col justify-center ${positionClasses[position as keyof typeof positionClasses]} px-5 pointer-events-none z-10`}
          >
            <motion.div
              drag
              dragMomentum={false}
              dragConstraints={{ left: -100, right: 100, top: -150, bottom: 150 }}
              whileHover={{ scale: 1.01 }}
              whileDrag={{ scale: 1.02, zIndex: 50 }}
              className="group/drag relative pointer-events-auto cursor-grab active:cursor-grabbing select-none"
            >
              {/* Drag Handle Indicator */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/drag:opacity-100 transition-opacity bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white/70 border border-white/[0.08] flex items-center gap-1 shadow-md pointer-events-none whitespace-nowrap z-20">
                <Move size={10} className="text-gold-400" />
                <span>اسحب للتحريك في أي مكان</span>
              </div>

              {/* Header Title & Reciter Badge */}
              {textSettings?.showTitleBadge !== false &&
                (surahName || reciterName || (ayahs.length > 0 && ayahs[0]?.surahName)) && (
                  <div className="text-center mb-2 flex items-center justify-center gap-1.5 flex-wrap">
                    {(surahName || (ayahs.length > 0 && ayahs[0]?.surahName)) && (
                      <span className="text-[11px] text-white/70 bg-white/[0.08] border border-white/[0.06] px-3 py-0.5 rounded-full font-medium shadow-sm">
                        {(() => {
                          const title = surahName || ayahs[0]?.surahName || '';
                          if (
                            title.startsWith('سورة') ||
                            title.includes('حديث') ||
                            title.includes('دعاء') ||
                            title.includes('موعظة') ||
                            title.includes('تسجيل') ||
                            title.includes('كلمة')
                          ) {
                            return title;
                          }
                          return `سورة ${title}`;
                        })()}
                      </span>
                    )}
                    {reciterName && (
                      <span className="text-[10px] text-gold-300 bg-gold-500/10 border border-gold-400/20 px-2.5 py-0.5 rounded-full font-medium shadow-sm flex items-center gap-1">
                        <span>🎙️</span>
                        <span>{reciterName}</span>
                      </span>
                    )}
                    {textSettings?.wordHighlightEnabled !== false && isPlaying && (
                      <span className="text-[10px] text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <Sparkles size={10} />
                        تزامن
                      </span>
                    )}
                  </div>
                )}

              {/* 8D Binaural Spatial Audio Badge */}
              {textSettings?.show8DBadge && (
                <div className="text-center mb-2 flex items-center justify-center">
                  <span className="text-[10px] text-amber-300 bg-black/70 border border-amber-400/50 px-2.5 py-0.5 rounded-full font-bold shadow-md flex items-center gap-1.5 animate-pulse">
                    <Headphones size={11} className="text-amber-400" />
                    <span>🎧 يُفضل ارتداء السماعات • صوت الحرم 8D Spatial</span>
                  </span>
                </div>
              )}

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
                  {/* Word-by-word, chunked, or continuous text rendering */}
                  {(() => {
                    const displayMode = textSettings?.displayMode || 'chunked';

                    // Mode 3: Continuous Mushaf Page Mode (All ayahs in range with active highlighted)
                    const textAlign = textSettings?.textAlign || 'center';
                    const justifyClass =
                      textAlign === 'right'
                        ? 'justify-start text-start'
                        : textAlign === 'left'
                          ? 'justify-end text-end'
                          : 'justify-center text-center';

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
                            fontFamily: fontFamily,
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

                    // Find active word index in allWords with dynamic duration stretching for Mujawwad recitations
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
                      const targetAyah = isSynced && currentAyah ? currentAyah : ayahs[0];
                      if (targetAyah?.chunks && targetAyah.chunks.length > 1) {
                        let activeChunk = targetAyah.chunks[0];

                        // 1. Precise match by active word ID
                        if (activeWordIdx >= 0 && allWords && allWords[activeWordIdx]) {
                          const currentWordId = allWords[activeWordIdx].id;
                          const foundByWord = targetAyah.chunks.find((c) =>
                            c.words.some((w) => w.id === currentWordId)
                          );
                          if (foundByWord) {
                            activeChunk = foundByWord;
                          }
                        } else if (normalizedCurTime > 0) {
                          // 2. Match by normalized time
                          const foundByTime = targetAyah.chunks.find(
                            (c) => normalizedCurTime >= c.startTime && normalizedCurTime < c.endTime
                          );
                          if (foundByTime) {
                            activeChunk = foundByTime;
                          } else if (
                            normalizedCurTime >=
                            targetAyah.chunks[targetAyah.chunks.length - 1].startTime
                          ) {
                            // At the end of the recitation: STAY on the last chunk!
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
                        const chunkIdx =
                          activeWordIdx >= 0 ? Math.floor(activeWordIdx / chunkSize) : 0;
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

                    // Base Typography & FX Styles
                    const baseLineHeight = textSettings?.lineHeight ?? 2.2;
                    const baseWordSpacing = textSettings?.wordSpacing
                      ? `${textSettings.wordSpacing}px`
                      : undefined;
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

                    // Gradient
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
                            fontFamily: fontFamily,
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

                            // Dynamic style for active word
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

                    // Default static text fallback with typography styles
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
                          fontFamily: fontFamily,
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

              {/* Multi-Language Subtitles (Dynamic Synchronized Cinema Subtitles) */}
              {showTranslation &&
                displayTranslation &&
                (() => {
                  const displayMode = textSettings?.displayMode || 'single_ayah';
                  const targetAyah = isSynced && currentAyah ? currentAyah : ayahs[0];
                  const allWords = targetAyah?.words || [];
                  const curTime = currentTime || 0;

                  let renderedTranslation = displayTranslation;

                  if (displayMode === 'chunked') {
                    // 1. Try to extract words from active chunk
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
                        // Proportional slicing matching active chunk
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
                      // 2. Fallback slicing if chunks array not yet populated
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
                        className="mt-2.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg max-w-[88%] mx-auto"
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
            </motion.div>
          </div>

          {/* Bottom gradient */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* Playing indicator */}
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-3 start-3 flex items-center gap-1"
            >
              <div className="flex items-end gap-[2px] h-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-accent-400 rounded-full"
                    animate={{ height: ['4px', '12px', '4px'] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Islamic Ornaments Overlay */}
          {textSettings?.showIslamicOrnaments !== false &&
            textSettings?.ornamentStyle &&
            textSettings.ornamentStyle !== 'none' &&
            (() => {
              const style = textSettings.ornamentStyle || 'geometricArabesque';
              const color = textSettings.ornamentColor || '#fbbf24';
              const opacity = textSettings.ornamentOpacity ?? 0.75;

              if (style === 'royalFrame') {
                return (
                  <div
                    className="absolute inset-2 border border-dashed rounded-xl pointer-events-none z-10 flex flex-col justify-between p-2"
                    style={{ borderColor: `${color}66`, opacity }}
                  >
                    {/* Top header flourish */}
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className="w-12 h-px"
                        style={{ background: `linear-gradient(to right, transparent, ${color})` }}
                      />
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                      >
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
                    {/* Bottom footer flourish */}
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className="w-12 h-px"
                        style={{ background: `linear-gradient(to right, transparent, ${color})` }}
                      />
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v10M7 12h10" />
                      </svg>
                      <span
                        className="w-12 h-px"
                        style={{ background: `linear-gradient(to left, transparent, ${color})` }}
                      />
                    </div>
                  </div>
                );
              }

              if (style === 'geometricArabesque') {
                return (
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
                );
              }

              if (style === 'domeCrescent') {
                return (
                  <div
                    className="absolute top-2 inset-x-0 flex flex-col items-center pointer-events-none z-10"
                    style={{ opacity }}
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill={color}>
                      <path d="M12 2C8.5 2 6 5 6 9c0 4 6 11 6 11s6-7 6-11c0-4-2.5-7-6-7zm0 2c1.5 0 3 1.5 3 3.5S13.5 11 12 11 9 9.5 9 7.5 10.5 4 12 4z" />
                    </svg>
                  </div>
                );
              }

              if (style === 'floralCorners') {
                return (
                  <div className="absolute inset-1 pointer-events-none z-10" style={{ opacity }}>
                    <svg
                      className="absolute top-1 right-1 w-7 h-7"
                      viewBox="0 0 28 28"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                    >
                      <path d="M2 2 H26 V26" />
                      <path d="M6 6 H22 V22" strokeWidth="0.8" strokeDasharray="2 2" />
                      <circle cx="14" cy="14" r="3" fill={`${color}44`} />
                    </svg>
                    <svg
                      className="absolute top-1 left-1 w-7 h-7"
                      viewBox="0 0 28 28"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                    >
                      <path d="M26 2 H2 V26" />
                      <path d="M22 6 H6 V22" strokeWidth="0.8" strokeDasharray="2 2" />
                      <circle cx="14" cy="14" r="3" fill={`${color}44`} />
                    </svg>
                    <svg
                      className="absolute bottom-1 right-1 w-7 h-7"
                      viewBox="0 0 28 28"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                    >
                      <path d="M2 26 H26 V2" />
                      <path d="M6 22 H22 V6" strokeWidth="0.8" strokeDasharray="2 2" />
                      <circle cx="14" cy="14" r="3" fill={`${color}44`} />
                    </svg>
                    <svg
                      className="absolute bottom-1 left-1 w-7 h-7"
                      viewBox="0 0 28 28"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                    >
                      <path d="M26 26 H2 V2" />
                      <path d="M22 22 H6 V6" strokeWidth="0.8" strokeDasharray="2 2" />
                      <circle cx="14" cy="14" r="3" fill={`${color}44`} />
                    </svg>
                  </div>
                );
              }

              return null;
            })()}

          {/* Cinematic Progress Bar */}
          {textSettings?.showProgressBar !== false &&
            (() => {
              const barStyle = textSettings?.progressBarStyle || 'neonGlow';
              const barColor = textSettings?.progressBarColor || '#fbbf24';
              const barHeight = textSettings?.progressBarHeight || 3;

              // Compute overall progress across all ayahs
              const totalAyahs = Math.max(1, ayahs.length);
              const currentIdx = Math.max(0, currentAyahIndex);
              const singleAyahDuration = ayahs[currentIdx]?.duration || 5;
              const currentSec = currentTime || 0;
              const currentAyahFraction = Math.min(1, currentSec / singleAyahDuration);

              const overallProgress = isPlaying
                ? ((currentIdx + currentAyahFraction) / totalAyahs) * 100
                : 0;

              if (barStyle === 'dots') {
                return (
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
                );
              }

              return (
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
              );
            })()}

          {/* Interactive Audio Waveform Visualizer */}
          {textSettings?.showWaveform && (
            <div className="absolute bottom-7 inset-x-0 z-20 flex justify-center pointer-events-none px-4">
              <AudioWaveformBar
                isPlaying={isPlaying}
                style={textSettings.waveformStyle || 'bars'}
                color={textSettings.waveformColor || '#fbbf24'}
                height={textSettings.waveformHeight || (size === 'fullscreen' ? 36 : 22)}
                opacity={textSettings.waveformOpacity ?? 0.85}
                peaks={livePeaks}
                currentTimeSec={currentTime}
                totalDurationSec={activeAyahObj?.duration || 15}
                barCount={
                  isPerf ? (size === 'fullscreen' ? 14 : 10) : size === 'fullscreen' ? 36 : 26
                }
              />
            </div>
          )}

          {/* Watermark with Freeform Drag & Drop directly on Canvas */}
          {watermark && textSettings?.showWatermark !== false && (
            <div
              className={`absolute z-30 flex pointer-events-none transition-all duration-300 ${
                textSettings?.watermarkPosition === 'topLeft'
                  ? 'top-3 start-4 justify-start text-start'
                  : textSettings?.watermarkPosition === 'top'
                    ? 'top-3 inset-x-0 justify-center text-center'
                    : textSettings?.watermarkPosition === 'topRight'
                      ? 'top-3 end-4 justify-end text-end'
                      : textSettings?.watermarkPosition === 'bottomLeft'
                        ? 'bottom-3 start-4 justify-start text-start'
                        : textSettings?.watermarkPosition === 'bottomRight'
                          ? 'bottom-3 end-4 justify-end text-end'
                          : textSettings?.watermarkPosition === 'center'
                            ? 'top-1/2 inset-x-0 -translate-y-1/2 justify-center text-center'
                            : 'bottom-3 inset-x-0 justify-center text-center'
              }`}
            >
              <motion.div
                drag
                dragMomentum={false}
                dragConstraints={{ left: -140, right: 140, top: -200, bottom: 200 }}
                whileHover={{ scale: 1.06 }}
                whileDrag={{ scale: 1.12, zIndex: 60 }}
                onDragEnd={(_e, info) => {
                  if (onWatermarkDragEnd) {
                    onWatermarkDragEnd(info.offset.x, info.offset.y);
                  }
                }}
                className="group/watermark relative pointer-events-auto cursor-grab active:cursor-grabbing select-none"
                style={{
                  opacity: textSettings?.watermarkOpacity ?? 0.65,
                }}
              >
                {/* Drag Handle Indicator */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/watermark:opacity-100 transition-opacity bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] text-gold-300 border border-gold-500/30 flex items-center gap-1 shadow-lg pointer-events-none whitespace-nowrap z-40">
                  <Move size={9} className="text-gold-400" />
                  <span>اسحب باليد ✋</span>
                </div>

                <span
                  className="font-sans font-medium tracking-wide px-2.5 py-1 rounded-lg transition-all group-hover/watermark:bg-black/40 group-hover/watermark:border group-hover/watermark:border-gold-400/40 inline-block"
                  style={{
                    fontSize: `${textSettings?.watermarkFontSize || (size === 'fullscreen' ? 13 : 11)}px`,
                    color: textSettings?.watermarkColor || textSettings?.textColor || '#ffffff',
                    textShadow: '0 1px 4px rgba(0,0,0,0.85)',
                  }}
                >
                  {watermark}
                </span>
              </motion.div>
            </div>
          )}

          {/* Decorative corners */}
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent-500/20 rounded-tr-lg"></div>
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent-500/20 rounded-tl-lg"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent-500/20 rounded-br-lg"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent-500/20 rounded-bl-lg"></div>
        </div>
      </motion.div>
    );
  }
);
