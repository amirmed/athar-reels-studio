import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuoteCardSettings } from '../../types';
import {
  MotionStyle,
  AnimatedQuoteConfig,
  initParticles,
  drawMotionFrame,
  exportAnimatedQuoteVideo,
} from '../../services/animatedQuoteExportService';
import { renderQuoteToCanvas } from '../../services/imageExportService';
import { ambientSounds } from '../../data/ambientSounds';
import { useHotkeys } from '../../hooks/useHotkeys';
import {
  X,
  Sparkles,
  Download,
  Film,
  Volume2,
  Clock,
  Wand2,
} from 'lucide-react';

interface AnimatedQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: QuoteCardSettings;
  addToast: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void;
}

export const AnimatedQuoteModal: React.FC<AnimatedQuoteModalProps> = ({
  isOpen,
  onClose,
  settings,
  addToast,
}) => {
  const [motionStyle, setMotionStyle] = useState<MotionStyle>('stardust');
  const [durationSeconds, setDurationSeconds] = useState<number>(8);
  const [ambientSoundId, setAmbientSoundId] = useState<string>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0);

  // Render & Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [_exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  // Preview Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useHotkeys('Escape', onClose, { enabled: isOpen });

  // 1. Prepare Base Card & Run Continuous Motion Preview
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const setupPreview = async () => {
      try {
        const baseCard = await renderQuoteToCanvas(settings, false);
        if (!isMounted) return;
        baseCanvasRef.current = baseCard;

        const targetCanvas = previewCanvasRef.current;
        if (!targetCanvas) return;

        targetCanvas.width = baseCard.width;
        targetCanvas.height = baseCard.height;
        const ctx = targetCanvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const particles = initParticles(baseCard.width, baseCard.height, motionStyle);
        startTimeRef.current = Date.now();

        const previewLoop = () => {
          if (!isMounted) return;
          const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
          drawMotionFrame(
            ctx,
            baseCard,
            baseCard.width,
            baseCard.height,
            elapsedSec,
            motionStyle,
            particles
          );
          animFrameIdRef.current = requestAnimationFrame(previewLoop);
        };

        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = requestAnimationFrame(previewLoop);
      } catch (err) {
        console.error('[AnimatedQuoteModal] Preview setup error:', err);
      }
    };

    setupPreview();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isOpen, settings, motionStyle]);

  // 2. Export Video Action
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportedVideoUrl(null);

    try {
      const config: AnimatedQuoteConfig = {
        settings,
        motionStyle,
        durationSeconds,
        ambientSoundId,
        ambientVolume,
        fps: 30,
      };

      const result = await exportAnimatedQuoteVideo(config, (_sec, _total, percent) => {
        setExportProgress(percent);
      });

      setExportedVideoUrl(result.url);

      // Trigger automatic file download
      const filename = `story_${settings.title ? settings.title.replace(/\s+/g, '_') : 'quote'}_${Date.now()}.mp4`;
      const a = document.createElement('a');
      a.href = result.url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      addToast({
        message: 'تم تصدير وتحميل فيديو الستوري المتحرك بنجاح! 🎬✨',
        type: 'success',
      });
    } catch (err) {
      console.error('[AnimatedQuoteModal] Export error:', err);
      addToast({
        message: 'حدث خطأ أثناء تصدير الفيديو. يرجى المحاولة مرة أخرى.',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const motionStylesList = [
    {
      id: 'stardust',
      name: 'جزيئات النور الذهبي ✨',
      desc: 'حبات نور متألقة تتهادى بنعومة وتضفي بريقاً ساحراً',
      color: 'border-gold-400/40 bg-gold-400/10 text-gold-300',
    },
    {
      id: 'breathingZoom',
      name: 'تنفس وزوم سينمائي 🌌',
      desc: 'حركة كاميرا ثلاثية الأبعاد هادئة ومريحة للتأمل',
      color: 'border-accent-400/40 bg-accent-400/10 text-accent-300',
    },
    {
      id: 'celestialRays',
      name: 'الأشعة السماوية 🕊️',
      desc: 'تموجات أشعة نور مهيبة تنبض بالسكينة والخشوع',
      color: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    },
    {
      id: 'gentleRain',
      name: 'رذاذ المطر والندى 🌧️',
      desc: 'قطرات ماطرة خفيفة انسيابية مع ضباب صباحي هادئ',
      color: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-surface-900 border border-gold-400/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-surface-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-gold-400 to-amber-500 text-surface-950 flex items-center justify-center font-bold shadow-lg shadow-gold-500/20">
                <Film size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>تصدير كرت ستوري متحرك</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/30 font-bold">
                    MP4 / Story HD 🎬
                  </span>
                </h2>
                <p className="text-xs text-white/50">
                  تحويل الكرت إلى فيديو ستوري سينمائي عالي الدقة لحالات واتساب وإنستغرام
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isExporting}
              className="p-2 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-white/60 hover:text-white transition-all cursor-pointer disabled:opacity-40"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left/Center Column: Live Motion Canvas Preview (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-[280px] rounded-2xl overflow-hidden border-2 border-gold-400/40 shadow-2xl bg-black/60 relative group">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-auto object-contain block select-none"
                  style={{
                    aspectRatio:
                      settings.aspectRatio === '1:1'
                        ? '1/1'
                        : settings.aspectRatio === '9:16'
                          ? '9/16'
                          : settings.aspectRatio === '4:5'
                            ? '4/5'
                            : '16/9',
                  }}
                />

                {/* Live Preview Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-gold-300 flex items-center gap-1">
                  <Sparkles size={10} className="text-gold-400 animate-pulse" />
                  <span>معاينة حية 60 FPS</span>
                </div>
              </div>

              <p className="text-xs text-white/40 mt-3 text-center">
                يتم تصدير الفيديو بجودة 1080p بمعدل 30 إطار في الثانية
              </p>
            </div>

            {/* Right Column: Settings & Customization Controls (7 cols) */}
            <div className="md:col-span-7 space-y-5">
              {/* 1. Motion Style Selector */}
              <div>
                <label className="text-xs font-bold text-white/80 mb-2.5 flex items-center gap-1.5">
                  <Wand2 size={14} className="text-gold-400" />
                  <span>اختر التأثير البصري الحركي:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {motionStylesList.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setMotionStyle(st.id as MotionStyle)}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                        motionStyle === st.id
                          ? `${st.color} ring-2 ring-gold-400/50 shadow-lg`
                          : 'border-white/[0.08] bg-surface-950/60 hover:bg-surface-800 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold mb-1">{st.name}</div>
                      <p className="text-[11px] opacity-75 line-clamp-2">{st.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Duration Selector */}
              <div>
                <label className="text-xs font-bold text-white/80 mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" />
                  <span>مدة فيديو الستوري (Story Duration):</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { sec: 5, label: '5 ثوانٍ', desc: 'سريع للواتساب' },
                    { sec: 8, label: '8 ثوانٍ', desc: 'مثالي للإنستغرام' },
                    { sec: 12, label: '12 ثانية', desc: 'مريح للتأمل' },
                  ].map((dur) => (
                    <button
                      key={dur.sec}
                      type="button"
                      onClick={() => setDurationSeconds(dur.sec)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        durationSeconds === dur.sec
                          ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-bold shadow-md'
                          : 'border-white/[0.08] bg-surface-950/60 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{dur.label}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">{dur.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Ambient Sound Selector */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                    <Volume2 size={14} className="text-emerald-400" />
                    <span>صوت الطبيعة الخلفي (مدمج في الفيديو):</span>
                  </label>
                  {ambientSoundId !== 'none' && (
                    <span className="text-xs font-mono text-emerald-400">{ambientVolume}%</span>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {ambientSounds.slice(0, 5).map((sound) => (
                    <button
                      key={sound.id}
                      type="button"
                      onClick={() => setAmbientSoundId(sound.id)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        ambientSoundId === sound.id
                          ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300 font-bold shadow-md'
                          : 'border-white/[0.08] bg-surface-950/60 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="text-base mb-0.5">{sound.icon}</div>
                      <div className="text-[11px] truncate">{sound.name}</div>
                    </button>
                  ))}
                </div>

                {ambientSoundId !== 'none' && (
                  <div className="pt-1">
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={ambientVolume}
                      onChange={(e) => setAmbientVolume(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer / Action Bar */}
          <div className="p-5 border-t border-white/[0.08] bg-surface-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            {isExporting ? (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>جاري تسجيل وتصدير الفيديو السينمائي...</span>
                  <span className="font-mono text-gold-300">{exportProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.1] overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold-400 via-amber-500 to-accent-500 rounded-full"
                    style={{ width: `${exportProgress}%` }}
                    transition={{ ease: 'linear' }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs text-white/50 hidden sm:block">
                  جاهز للنشر على Instagram Reels, WhatsApp Status, TikTok 📱
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-xs font-bold transition-all cursor-pointer w-full sm:w-auto"
                  >
                    إلغاء
                  </button>

                  <button
                    type="button"
                    onClick={handleExport}
                    className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 via-amber-500 to-amber-600 hover:from-gold-300 hover:to-amber-500 text-surface-950 font-black text-xs sm:text-sm shadow-xl shadow-gold-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                  >
                    <Download size={16} />
                    <span>تحميل فيديو ستوري 🎬✨</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
