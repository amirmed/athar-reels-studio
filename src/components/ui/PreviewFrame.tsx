import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Monitor, Square, Sparkles, Move, Headphones } from 'lucide-react';
import { AyahData } from '../../services/quranApi';
import { TextSettings, QuranWord } from '../../types';
import { getAudioPeaksCached, extractAudioPeaksFromUrl } from '../../services/audioPeakExtractor';
import {
  PreviewBackground,
  PreviewText,
  PreviewWatermark,
  PreviewWaveform,
  PreviewOrnaments,
} from './preview';

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
          {/* Modular Background */}
          <PreviewBackground
            activeBackgroundUrl={activeBackgroundUrl}
            backgroundOpacity={backgroundOpacity}
            isPerf={isPerf}
            textSettings={textSettings}
            videoEffect={videoEffect}
          />

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
              className="group/drag relative pointer-events-auto cursor-grab active:cursor-grabbing select-none gpu-layer"
            >
              {/* Drag Handle Indicator */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/drag:opacity-100 transition-opacity bg-black/85 px-2 py-0.5 rounded-full text-[10px] text-white/70 border border-white/[0.08] flex items-center gap-1 shadow-md pointer-events-none whitespace-nowrap z-20">
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

              {/* Modular Verse and Subtitle Text */}
              <PreviewText
                displayText={displayText}
                displayAyahNumber={displayAyahNumber}
                displayTranslation={displayTranslation}
                tafsirText={tafsirText}
                showTranslation={showTranslation}
                showTafsir={showTafsir}
                textSettings={textSettings}
                fontFamily={fontFamily}
                isSynced={isSynced}
                currentAyahIndex={currentAyahIndex}
                currentTime={currentTime}
                currentAyah={currentAyah ?? undefined}
                ayahs={ayahs}
                isPlaying={isPlaying}
                size={size}
                activeVariant={activeVariant}
                onWordClick={onWordClick}
              />
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

          {/* Modular Islamic Ornaments & Cinematic Progress Bar */}
          <PreviewOrnaments
            textSettings={textSettings}
            ayahs={ayahs}
            currentAyahIndex={currentAyahIndex}
            currentTime={currentTime}
            isPlaying={isPlaying}
          />

          {/* Modular Interactive Audio Waveform Visualizer */}
          <PreviewWaveform
            showWaveform={textSettings?.showWaveform}
            isPlaying={isPlaying}
            textSettings={textSettings}
            size={size}
            isPerf={isPerf}
            peaks={livePeaks}
            currentTimeSec={currentTime}
            totalDurationSec={activeAyahObj?.duration || 15}
          />

          {/* Modular Freeform Watermark */}
          <PreviewWatermark
            watermark={watermark}
            textSettings={textSettings}
            size={size}
            onWatermarkDragEnd={onWatermarkDragEnd}
          />

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

export default PreviewFrame;
