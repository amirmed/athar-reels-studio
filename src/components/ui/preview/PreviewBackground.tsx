import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isVideoMedia } from '../../../utils/imageUtils';
import { TextSettings } from '../../../types';

interface PreviewBackgroundProps {
  activeBackgroundUrl?: string;
  backgroundOpacity?: number;
  isPerf?: boolean;
  textSettings?: TextSettings;
  videoEffect?: string;
}

export const PreviewBackground: React.FC<PreviewBackgroundProps> = React.memo(
  ({
    activeBackgroundUrl,
    backgroundOpacity = 0.6,
    isPerf = false,
    textSettings,
    videoEffect = 'none',
  }) => {
    const isVideo = activeBackgroundUrl ? isVideoMedia(activeBackgroundUrl) : false;
    const [mediaLoaded, setMediaLoaded] = useState(false);

    useEffect(() => {
      setMediaLoaded(false);
    }, [activeBackgroundUrl]);

    return (
      <div className="absolute inset-0 bg-gradient-to-b from-surface-800 via-surface-900 to-black">
        {activeBackgroundUrl && (
          isVideo ? (
            <video
              key={activeBackgroundUrl}
              src={activeBackgroundUrl}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setMediaLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                mediaLoaded ? '' : 'opacity-0'
              }`}
              style={{ opacity: mediaLoaded ? backgroundOpacity : 0 }}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.img
                key={activeBackgroundUrl}
                src={activeBackgroundUrl}
                alt=""
                loading="lazy"
                onLoad={() => setMediaLoaded(true)}
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
          )
        )}
        <div className="absolute inset-0 pattern-dots opacity-20"></div>

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
      </div>
    );
  }
);
