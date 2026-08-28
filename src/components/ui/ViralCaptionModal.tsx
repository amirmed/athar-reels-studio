import React, { useState, useMemo } from 'react';
import { Copy, Check, Share2, Sparkles, Send, MessageCircle, Hash } from 'lucide-react';
import { Project } from '../../types';
import { AyahData } from '../../services/quranApi';
import {
  generateViralCaption,
  getSocialShareLinks,
  triggerNativeShare,
} from '../../services/viralCaptionService';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from './Modal';

interface ViralCaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  ayahs?: AyahData[];
  translationText?: string;
}

export const ViralCaptionModal: React.FC<ViralCaptionModalProps> = ({
  isOpen,
  onClose,
  project,
  ayahs,
  translationText,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  const captionData = useMemo(() => {
    if (!isOpen) {
      return {
        title: '',
        hook: '',
        body: '',
        callToAction: '',
        fullCaption: '',
        hashtags: [],
        hashtagsText: '',
        surahName: '',
        reciterName: '',
        verseRange: '',
        broadHashtags: [],
        nicheHashtags: [],
        targetedHashtags: [],
        goldenHashtags: [],
        hashtagTiers: [],
      };
    }
    return generateViralCaption(project, ayahs, translationText);
  }, [isOpen, project, ayahs, translationText]);

  const shareLinks = useMemo(() => {
    if (!isOpen || !captionData.fullCaption) {
      return { whatsapp: '', telegram: '', x: '' };
    }
    return getSocialShareLinks(captionData.fullCaption);
  }, [isOpen, captionData.fullCaption]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    addToast({
      message:
        type === 'all'
          ? 'تم نسخ الكابشن والهاشتاجات بالكامل بنجاح 📋✨'
          : 'تم نسخ الهاشتاجات بنجاح 🏷️',
      type: 'success',
    });
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleNativeShare = async () => {
    const success = await triggerNativeShare(captionData.title, captionData.fullCaption);
    if (success) {
      addToast({ message: 'تم فتح نافذة المشاركة بنجاح 📲', type: 'success' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="مولد الكابشن والهاشتاجات الفيروسية 🚀"
      subtitle="جاهز للنشر المباشر على تيك توك، إنستغرام ريلز، ويوتيوب شورتس"
      headerIcon={<Sparkles size={20} className="text-gold-400" />}
      size="lg"
    >
      <div className="space-y-4">
        {/* Quick 1-Click Social Share Row */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-surface-950 via-gold-900/20 to-surface-950 border border-gold-500/20 space-y-2">
          <span className="text-xs font-bold text-gold-300 block">📲 مشاركة سريعة مباشرة:</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => window.open(shareLinks.whatsapp, '_blank')}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <MessageCircle size={15} />
              <span>واتساب (WhatsApp)</span>
            </button>

            <button
              type="button"
              onClick={() => window.open(shareLinks.telegram, '_blank')}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Send size={15} />
              <span>تيليجرام (Telegram)</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Share2 size={15} />
              <span>مشاركة الجهاز 📱</span>
            </button>
          </div>
        </div>

        {/* Generated Caption Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white/90">
              الوصف المقترح للريلز (Caption & Tags):
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(captionData.hashtagsText, 'hashtags')}
                className="btn-ghost py-1 px-2.5 text-xs flex items-center gap-1"
              >
                <Hash size={12} className="text-gold-400" />
                <span>نسخ الهاشتاجات فقط</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(captionData.fullCaption, 'all')}
                className="btn-gold py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-sm"
              >
                {copiedType === 'all' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedType === 'all' ? 'تم النسخ ✓' : 'نسخ الكابشن بالكامل 📋'}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={captionData.fullCaption}
              rows={8}
              className="w-full p-4 rounded-2xl bg-surface-950/80 border border-white/10 text-white/90 font-sans text-xs leading-relaxed focus:outline-none select-all custom-scrollbar resize-none"
            />
          </div>
        </div>

        {/* 2026 Categorized Algorithmic Hashtags Tiers */}
        <div className="space-y-2.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Hash size={14} className="text-gold-400" />
              <span>محرك الهاشتاجات المصنف لخوارزميات 2026 🏷️</span>
            </label>
            <span className="text-[11px] text-gold-300 font-bold px-2 py-0.5 rounded-full bg-gold-500/15 border border-gold-400/30">
              توزيع استراتيجي 💎
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {captionData.hashtagTiers.map((tier) => (
              <div
                key={tier.category}
                className="p-3 rounded-2xl bg-surface-950/70 border border-white/[0.08] hover:border-gold-400/30 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{tier.icon}</span>
                    <span className="text-xs font-bold text-white">{tier.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(tier.tags.join(' '), tier.category)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-gold-300 hover:text-gold-200 border border-white/10 font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedType === tier.category ? <Check size={10} /> : <Copy size={10} />}
                    <span>{copiedType === tier.category ? 'تم' : 'نسخ'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {tier.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md bg-white/[0.04] text-white/70 text-[11px] font-mono select-all hover:bg-gold-500/10 hover:text-gold-300 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/60">
            💡 نصيحة: انسخ النص والصقه مباشرة في إنستغرام ريلز أو تيك توك لزيادة الانتشار.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-5 py-2 text-xs font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
};
