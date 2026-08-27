import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, Sparkles, Send, MessageCircle, Hash } from 'lucide-react';
import { Project } from '../../types';
import { AyahData } from '../../services/quranApi';
import {
  generateViralCaption,
  getSocialShareLinks,
  triggerNativeShare,
} from '../../services/viralCaptionService';
import { useAppStore } from '../../store/useAppStore';
import { useHotkeys } from '../../hooks/useHotkeys';

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

  useHotkeys('Escape', onClose, { enabled: isOpen });

  if (!isOpen) return null;

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
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label="مولد الكابشن والهاشتاجات الفيروسية"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-surface-900 border border-gold-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Decorative ambient background */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gold-500/15 border border-gold-500/30 text-gold-400">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  مولد الكابشن والهاشتاجات الفيروسية 🚀
                </h3>
                <p className="text-xs text-white/50">
                  جاهز للنشر المباشر على تيك توك، إنستغرام ريلز، ويوتيوب شورتس
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-800 text-white/60 hover:text-white hover:bg-surface-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body content */}
          <div className="my-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {/* Quick 1-Click Social Share Row */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-surface-950 via-gold-950/20 to-surface-950 border border-gold-500/20 space-y-2">
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
                <label className="text-xs font-bold text-white/80">
                  الوصف المقترح للريلز (Caption & Tags):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(captionData.hashtagsText, 'hashtags')}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-white/70 border border-white/10 transition-all active:scale-95 cursor-pointer"
                  >
                    <Hash size={12} className="text-gold-400" />
                    <span>نسخ الهاشتاجات فقط</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(captionData.fullCaption, 'all')}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-accent-500 hover:from-gold-400 hover:to-accent-400 text-surface-950 font-bold shadow-md transition-all active:scale-95 cursor-pointer"
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
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
            <span className="text-xs text-white/40">
              💡 نصيحة: انسخ النص والصقه مباشرة في إنستغرام ريلز أو تيك توك لزيادة الانتشار.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
