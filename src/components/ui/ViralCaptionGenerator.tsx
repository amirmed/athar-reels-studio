import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Hash,
  FileText,
} from 'lucide-react';
import { generateViralCaption, CaptionTone } from '../../services/captionGeneratorService';
import { useAppStore } from '../../store/useAppStore';

interface ViralCaptionGeneratorProps {
  surahName?: string;
  ayahRange?: string;
  ayahText?: string;
  translationText?: string;
  customTitle?: string;
}

export const ViralCaptionGenerator: React.FC<ViralCaptionGeneratorProps> = ({
  surahName = 'سورة الفاتحة',
  ayahRange = '1 - 7',
  ayahText = '',
  translationText = '',
  customTitle = '',
}) => {
  const addToast = useAppStore((s) => s.addToast);
  const [tone, setTone] = useState<CaptionTone>('spiritual');
  const [customizedText, setCustomizedText] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'all' | 'tags' | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const generated = useMemo(() => {
    return generateViralCaption({
      surahName,
      ayahRange,
      ayahText,
      translationText,
      customTitle,
      tone,
    });
  }, [surahName, ayahRange, ayahText, translationText, customTitle, tone, refreshSeed]);

  const activeCaption = customizedText || generated.fullCaption;

  const handleCopyAll = () => {
    navigator.clipboard.writeText(activeCaption);
    setCopiedType('all');
    addToast({
      message: 'تم نسخ الكابشن والهاشتاجات بنجاح! جاهز للنشر في تيك توك وإنستغرام 🚀',
      type: 'success',
    });
    setTimeout(() => setCopiedType(null), 2200);
  };

  const handleCopyTags = () => {
    navigator.clipboard.writeText(generated.hashtags.join(' '));
    setCopiedType('tags');
    addToast({ message: 'تم نسخ الهاشتاجات الفيروسية بنجاح ✓', type: 'success' });
    setTimeout(() => setCopiedType(null), 2200);
  };

  const tones: { id: CaptionTone; label: string; icon: string }[] = [
    { id: 'spiritual', label: '🌿 روحاني وسكينة', icon: '✨' },
    { id: 'engagement', label: '⚡ تفاعل وخوارزميات', icon: '🔥' },
    { id: 'reflection', label: '💡 تدبر وعبرة', icon: '📖' },
    { id: 'bilingual', label: '🌍 عالمي (عربي/إنجليزي)', icon: '🌐' },
  ];

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-accent-500 text-black flex items-center justify-center font-bold shadow-md">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-surface-50">
              مولد الكابشن والهاشتاجات الفيروسية (AI Copy)
            </h4>
            <p className="text-[11px] text-surface-400">
              وصف وخطاف احترافي للريلز وتيك توك مع أقوى الهاشتاجات
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setRefreshSeed((s) => s + 1);
            setCustomizedText('');
            addToast({ message: 'تم توليد صيغة بديلة ✨', type: 'success' });
          }}
          className="p-1.5 rounded-lg bg-surface-800/80 hover:bg-surface-700 text-surface-400 hover:text-surface-50 transition-all flex items-center gap-1 text-[11px] border border-surface-700/30"
          title="توليد صيغة جديدة"
        >
          <RefreshCw size={12} />
          <span>توليد جديد</span>
        </button>
      </div>

      {/* Tone Switcher */}
      <div className="grid grid-cols-2 gap-1.5">
        {tones.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTone(t.id);
              setCustomizedText('');
            }}
            className={`p-2 rounded-xl text-xs font-bold border transition-all text-start flex items-center gap-1.5 ${
              tone === t.id
                ? 'bg-gold-500/20 border-gold-400 text-surface-50 shadow-sm'
                : 'bg-surface-900/60 border-surface-700/30 text-surface-400 hover:text-surface-50'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Generated Caption Box */}
      <div className="relative rounded-2xl bg-surface-950/90 border border-surface-700/40 p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-700/30">
          <span className="text-xs font-bold text-gold-400 flex items-center gap-1">
            <FileText size={12} />
            معاينة نص المنشور (قابلة للتعديل)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-800 text-surface-400 font-mono border border-surface-700/30">
            {activeCaption.length} حرف
          </span>
        </div>

        <textarea
          value={activeCaption}
          onChange={(e) => setCustomizedText(e.target.value)}
          rows={7}
          className="w-full bg-transparent text-surface-100 text-xs leading-relaxed focus:outline-none resize-none select-text cursor-text"
          placeholder="جاري صياغة الكابشن والهاشتاجات..."
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-surface-700/30">
          <button
            onClick={handleCopyAll}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all ${
              copiedType === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-gold-400 to-accent-500 hover:from-gold-300 hover:to-accent-400 text-surface-950 shadow-gold-500/20 hover:scale-[1.02]'
            }`}
          >
            {copiedType === 'all' ? <Check size={14} /> : <Copy size={14} />}
            <span>
              {copiedType === 'all' ? 'تم نسخ المنشور بالكامل!' : 'نسخ المنشور والهاشتاجات'}
            </span>
          </button>

          <button
            onClick={handleCopyTags}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 shrink-0 ${
              copiedType === 'tags'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-surface-800 hover:bg-surface-700 border-surface-700/40 text-surface-200'
            }`}
            title="نسخ الهاشتاجات فقط"
          >
            <Hash size={13} className="text-gold-400" />
            <span>{copiedType === 'tags' ? 'تم النسخ' : 'الهاشتاجات فقط'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
