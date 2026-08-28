import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
import {
  Sparkles,
  Download,
  Film,
  Volume2,
  Clock,
  Wand2,
} from 'lucide-react';
import { Modal } from './Modal';

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
  const [ambientVolume, setAmbientVolume] = useState<number>(30);

  // Render & Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [_exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  // Preview Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const startTimeRef = useRef<number>(Date.now());

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

        previewLoop();
      } catch (err) {
        console.error('[AnimatedQuoteModal] Failed to init preview:', err);
      }
    };

    setupPreview();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isOpen, settings, motionStyle, durationSeconds]);

  // Motion Styles Data
  const motionStylesData: { id: MotionStyle; name: string; desc: string; icon: string }[] = [
    { id: 'stardust', name: 'غبار النجوم الذهبي', desc: 'جزيئات ذهبية متطايرة للأعلى بنعومة', icon: '✨' },
    { id: 'celestialRays', name: 'شعاع النور السينمائي', desc: 'بريق ضوء يمر بانسيابية عبر النص', icon: '🌟' },
    { id: 'breathingZoom', name: 'توهج وتكبير بطيء', desc: 'حركة كاميرا سينمائية خفية وتوهج متناغم', icon: '💫' },
    { id: 'gentleRain', name: 'قطرات وندى مبارك', desc: 'قطرات مضيئة تتساقط برقة وسكون', icon: '🌧️' },
  ];

  // 2. Handle MP4 Video Export
  const handleExport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      setExportProgress(0);

      const exportConfig: AnimatedQuoteConfig = {
        settings,
        motionStyle,
        durationSeconds,
        ambientSoundId: ambientSoundId !== 'none' ? ambientSoundId : undefined,
        ambientVolume,
        fps: 30,
      };

      const result = await exportAnimatedQuoteVideo(exportConfig, (_r, _t, pct) => {
        setExportProgress(pct);
      });
      const url = result.url;
      setExportedVideoUrl(url);

      const a = document.createElement('a');
      a.href = url;
      a.download = `story-${settings.title?.slice(0, 15).replace(/\s+/g, '-') || 'quote'}-${motionStyle}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      addToast({
        message: 'تم تصدير وتحميل فيديو الستوري بنجاح! 🎬✨',
        type: 'success',
      });
    } catch (err: any) {
      console.error('[AnimatedQuoteModal] Export error:', err);
      addToast({
        message: `تعذر تصدير الفيديو: ${err.message || 'حدث خطأ غير متوقع'}`,
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isExporting ? () => {} : onClose}
      title="تصدير كرت ستوري متحرك"
      subtitle="تحويل الكرت إلى فيديو ستوري سينمائي عالي الدقة لحالات واتساب وإنستغرام"
      headerIcon={<Film size={22} className="text-gold-400" />}
      size="xl"
    >
      <div className="space-y-4">
        {/* Body grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
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
              <div className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-gold-300 flex items-center gap-1">
                <Sparkles size={10} className="text-gold-400 animate-pulse" />
                <span>معاينة حية 60 FPS</span>
              </div>
            </div>

            <p className="text-xs text-surface-400 mt-3 text-center">
              يتم تصدير الفيديو بجودة 1080p بمعدل 30 إطار في الثانية
            </p>
          </div>

          {/* Right Column: Settings & Customization Controls (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {/* 1. Motion Style Selector */}
            <div>
              <label className="text-xs font-bold text-surface-50 mb-2 flex items-center gap-1.5">
                <Wand2 size={14} className="text-gold-400" />
                <span>اختر التأثير البصري الحركي:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {motionStylesData.map((st) => {
                  const isSelected = motionStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setMotionStyle(st.id)}
                      className={`p-3 rounded-2xl border text-start transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-r from-gold-500/20 to-amber-500/20 border-gold-400 shadow-md shadow-gold-500/10'
                          : 'bg-surface-950/60 border-surface-700/40 hover:border-surface-700/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{st.icon}</span>
                        <span className="text-xs font-bold text-surface-50">{st.name}</span>
                      </div>
                      <span className="text-[10px] text-surface-400 leading-relaxed">{st.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Duration Selector */}
            <div>
              <label className="text-xs font-bold text-surface-50 mb-2 flex items-center gap-1.5">
                <Clock size={14} className="text-sky-400" />
                <span>مدة الفيديو:</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 8, 12, 15].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDurationSeconds(sec)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      durationSeconds === sec
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                        : 'bg-surface-950/60 border-surface-700/40 text-surface-300 hover:text-surface-50'
                    }`}
                  >
                    {sec} ثوانٍ
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Ambient Audio Selector */}
            <div>
              <label className="text-xs font-bold text-surface-50 mb-2 flex items-center gap-1.5">
                <Volume2 size={14} className="text-emerald-400" />
                <span>صوت الخلفية التفاعلي (اختياري):</span>
              </label>
              <select
                value={ambientSoundId}
                onChange={(e) => {
                  setAmbientSoundId(e.target.value);
                  if (e.target.value !== 'none' && ambientVolume === 0) {
                    setAmbientVolume(30);
                  }
                }}
                className="w-full bg-surface-950/80 border border-surface-700/40 rounded-xl p-2.5 text-xs text-surface-50 focus:outline-none focus:border-gold-400/60"
              >
                <option value="none">بدون صوت (فيديو صامت)</option>
                {ambientSounds.map((snd) => (
                  <option key={snd.id} value={snd.id}>
                    {snd.icon} {snd.name} — {snd.category}
                  </option>
                ))}
              </select>

              {ambientSoundId !== 'none' && (
                <div className="mt-2 p-3 rounded-xl bg-surface-950/60 border border-surface-700/40 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-surface-400">
                    <span>مستوى صوت الخلفية:</span>
                    <span className="font-mono text-emerald-400">{ambientVolume}%</span>
                  </div>
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
        <div className="pt-3 border-t border-surface-700/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          {isExporting ? (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-surface-50">
                <span>جاري تسجيل وتصدير الفيديو السينمائي...</span>
                <span className="font-mono text-gold-300">{exportProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-700/40 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-gold-400 via-amber-500 to-accent-500 rounded-full"
                  style={{ width: `${exportProgress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="text-xs text-surface-400 hidden sm:block">
                جاهز للنشر على Instagram Reels, WhatsApp Status, TikTok 📱
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost px-5 py-2.5 text-xs font-bold w-full sm:w-auto"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  className="btn-gold px-7 py-2.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl w-full sm:w-auto"
                >
                  <Download size={16} />
                  <span>تحميل فيديو ستوري 🎬✨</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
