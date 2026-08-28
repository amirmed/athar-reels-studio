import React, { useState, useEffect } from 'react';
import {
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Project, AspectRatio } from '../../types';
import { AyahData } from '../../services/quranApi';
import {
  generateViralThumbnailBlob,
  ThumbnailConfig,
} from '../../services/thumbnailGeneratorService';
import { Modal } from './Modal';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="مولد غلاف الريلز الفيروسي"
      subtitle="صورة غلاف سينمائية 4K جاهزة للنشر لزيادة النقرات والمشاهدات"
      headerIcon={<ImageIcon size={20} className="text-gold-400" />}
      size="lg"
    >
      <div className="space-y-3">
        {/* Aspect Ratio Switcher */}
        <div className="flex items-center justify-between gap-2 p-1 bg-surface-950/80 rounded-xl border border-white/[0.06]">
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
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Reciter Name Live Editor Field */}
        <div className="space-y-1 bg-surface-950/90 p-2.5 rounded-xl border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gold-300 flex items-center gap-1">
              <span>🎙️ اسم القارئ / صاحب الصوت على الغلاف:</span>
            </span>
            <span className="text-[10px] text-white/50 font-mono">تعديل فوري ⚡</span>
          </div>
          <input
            type="text"
            value={reciterName}
            onChange={(e) => setReciterName(e.target.value)}
            placeholder="مثال: القارئ محمد طه / تلاوتي الخاصة"
            className="glass-input w-full py-2 text-xs"
          />
        </div>

        {/* Canvas Live Preview */}
        <div className="min-h-[260px] max-h-[380px] bg-surface-950 rounded-2xl border border-white/[0.08] p-3 flex items-center justify-center overflow-hidden relative">
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
        <div className="flex items-center gap-2.5 pt-3 border-t border-white/[0.08]">
          <button
            onClick={renderThumbnail}
            disabled={isGenerating}
            className="btn-ghost p-2.5"
            title="إعادة التوليد"
          >
            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleCopyImage}
            disabled={!dataUrl || isGenerating}
            className="btn-ghost flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            <span>{copied ? 'تم نسخ الصورة ✓' : 'نسخ للحافظة 📋'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!dataUrl || isGenerating}
            className="btn-gold flex-[1.4] py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            <Download size={15} />
            <span>تحميل الغلاف (PNG 4K) 📥</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
