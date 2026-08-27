import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { Project, ColorGradingFilter, AspectRatio } from '../../types';
import { AyahData } from '../../services/quranApi';
import {
  generateViralThumbnailBlob,
  ThumbnailConfig,
} from '../../services/thumbnailGeneratorService';
import { useHotkeys } from '../../hooks/useHotkeys';

interface ThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  ayahs: AyahData[];
  currentAyahIndex: number;
}

export const ThumbnailModal: React.FC<ThumbnailModalProps> = ({
  isOpen,
  onClose,
  project,
  ayahs,
  currentAyahIndex,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || '9:16');
  const [reciterName, setReciterName] = useState<string>(
    project.customReciterName ||
      project.reciter ||
      (project.reciterId === 'custom_voice' ? 'تلاوتي الخاصة 🎙️' : 'تلاوة مباركة')
  );
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeAyah = ayahs[currentAyahIndex] || ayahs[0];
  const isQuran = project.contentType === 'quran' || !project.contentType;
  const ayahRangeText = isQuran
    ? ayahs.length > 1
      ? `${project.fromAyah} - ${project.toAyah}`
      : `${project.fromAyah}`
    : 'مختارة';

  const fullText = isQuran
    ? ayahs.length > 1
      ? ayahs
          .map((a) => {
            const t = a.text?.trim() || (a.words ? a.words.map((w) => w.text).join(' ') : '');
            return `${t} ۝${a.numberInSurah || ''}`;
          })
          .join(' ')
      : activeAyah?.text || (activeAyah?.words ? activeAyah.words.map((w) => w.text).join(' ') : '')
    : project.customText || activeAyah?.text || '';

  const renderThumbnail = async () => {
    setIsGenerating(true);
    try {
      const config: ThumbnailConfig = {
        surahName: isQuran ? project.surah || 'الفاتحة' : project.customTitle || 'موعظة طيبة',
        ayahRange: ayahRangeText,
        ayahText: fullText,
        reciterName: reciterName.trim() || project.reciter || 'تلاوة مباركة 🎙️',
        backgroundUrl: project.backgroundUrl,
        colorGrading: project.textSettings?.colorGrading,
        aspectRatio: aspectRatio,
        watermark: project.watermark || 'atar-studio.com',
      };

      const res = await generateViralThumbnailBlob(config);
      setDataUrl(res.dataUrl);
    } catch (e) {
      console.error('[ThumbnailModal] Error generating thumbnail:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      renderThumbnail();
    }
  }, [isOpen, aspectRatio, project, currentAyahIndex, reciterName]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `thumbnail-${project.surah}-ayah-${project.fromAyah}-${aspectRatio}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyImage = async () => {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write error:', e);
    }
  };

  useHotkeys('Escape', onClose, { enabled: isOpen });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label="مولد الغلاف وبوسترات 4K"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-xl bg-surface-900 border border-gold-500/30 rounded-3xl p-6 shadow-2xl shadow-gold-500/10 flex flex-col text-right max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-800 hover:bg-surface-700 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5 justify-end">
                  <span>مولد غلاف الريلز الفيروسي</span>
                  <Sparkles size={18} className="text-gold-400" />
                </h3>
                <p className="text-xs text-white/50">
                  صورة غلاف سينمائية 4K جاهزة للنشر لزيادة النقرات والمشاهدات
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gold-500/20 text-gold-400 flex items-center justify-center shrink-0">
                <ImageIcon size={22} />
              </div>
            </div>
          </div>

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center justify-between gap-2 my-3 p-1 bg-surface-950/80 rounded-xl border border-white/[0.06]">
            {[
              { id: '9:16' as const, label: '📱 9:16 (ريلز وتيك توك)' },
              { id: '16:9' as const, label: '🖥️ 16:9 (يوتيوب)' },
              { id: '1:1' as const, label: '⏹️ 1:1 (مربع إنستغرام)' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setAspectRatio(r.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  aspectRatio === r.id
                    ? 'bg-gold-500 text-black shadow-md shadow-gold-500/20 font-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Reciter Name Live Editor Field */}
          <div className="space-y-1 mb-3 bg-surface-950/90 p-2.5 rounded-xl border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gold-300 flex items-center gap-1">
                <span>🎙️ اسم القارئ / صاحب الصوت على الغلاف:</span>
              </span>
              <span className="text-[10px] text-white/40 font-mono">تعديل فوري ⚡</span>
            </div>
            <input
              type="text"
              value={reciterName}
              onChange={(e) => setReciterName(e.target.value)}
              placeholder="مثال: القارئ محمد طه / تلاوتي الخاصة"
              className="w-full p-2 rounded-lg bg-surface-900 border border-gold-400/30 text-white text-xs font-bold placeholder-white/30 focus:border-gold-400 focus:outline-none"
            />
          </div>

          {/* Canvas Live Preview */}
          <div className="flex-1 min-h-[300px] max-h-[420px] bg-surface-950 rounded-2xl border border-white/[0.08] p-3 flex items-center justify-center overflow-hidden relative">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 text-gold-400">
                <Loader2 size={32} className="animate-spin" />
                <span className="text-xs font-bold text-white/60">جاري رسم الغلاف بدقة 4K...</span>
              </div>
            ) : dataUrl ? (
              <img
                src={dataUrl}
                alt="Thumbnail Preview"
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-gold-500/20"
              />
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.08] mt-3">
            <button
              onClick={renderThumbnail}
              disabled={isGenerating}
              className="p-3 rounded-xl bg-surface-800 hover:bg-surface-700 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="إعادة التوليد"
            >
              <RefreshCw size={18} className={isGenerating ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleCopyImage}
              disabled={!dataUrl || isGenerating}
              className="flex-1 py-3 px-4 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/[0.08] transition-all cursor-pointer"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{copied ? 'تم نسخ الصورة ✓' : 'نسخ للحافظة 📋'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={!dataUrl || isGenerating}
              className="flex-[1.5] py-3 px-4 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-surface-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Download size={16} />
              <span>تحميل صورة الغلاف (PNG 4K) 📥</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
