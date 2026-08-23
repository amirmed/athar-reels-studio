import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Check,
  Download,
  Wand2,
  Image as ImageIcon,
  Loader2,
  History,
  Zap,
  Crown,
} from 'lucide-react';
import { aiPromptPresets, buildAiImageUrl } from '../../services/aiImageService';

interface AiBackgroundGeneratorProps {
  onSelectBackground: (url: string) => void;
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

export const AiBackgroundGenerator: React.FC<AiBackgroundGeneratorProps> = ({
  onSelectBackground,
  aspectRatio = '9:16',
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [appliedUrl, setAppliedUrl] = useState<string | null>(null);
  const [modelMode, setModelMode] = useState<'turbo' | 'flux'>('flux');
  const [elapsedSec, setElapsedSec] = useState(0);

  const activeRequestIdRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  // Timer counter during generation
  useEffect(() => {
    if (isGenerating) {
      setElapsedSec(0);
      timerRef.current = setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSec(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  const handleGenerate = (customPrompt?: string) => {
    const targetPrompt = customPrompt || prompt || aiPromptPresets[0].name;
    const currentRequestId = Date.now() + Math.random();
    activeRequestIdRef.current = currentRequestId;

    setIsGenerating(true);

    const seed = Math.floor(Math.random() * 9999999) + (Date.now() % 10000);
    const imageUrl = buildAiImageUrl(targetPrompt, aspectRatio, seed, modelMode);

    // Preload image with safe timeout
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const finishGeneration = (url: string) => {
      if (activeRequestIdRef.current === currentRequestId) {
        setGeneratedUrl(url);
        setHistory((prev) => [url, ...prev.filter((u) => u !== url).slice(0, 7)]);
        setIsGenerating(false);
      }
    };

    // Auto fallback after 12s if slow network
    const timeoutId = setTimeout(
      () => {
        finishGeneration(imageUrl);
      },
      modelMode === 'turbo' ? 6000 : 12000
    );

    img.onload = () => {
      clearTimeout(timeoutId);
      finishGeneration(imageUrl);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      finishGeneration(imageUrl);
    };

    img.src = imageUrl;
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = aiPromptPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setPrompt(preset.name);
    handleGenerate(preset.englishPrompt);
  };

  const handleApply = (url: string) => {
    onSelectBackground(url);
    setAppliedUrl(url);
  };

  return (
    <div className="space-y-4">
      {/* Header with Model Selector */}
      <div className="p-3 bg-gradient-to-br from-accent-500/15 via-surface-900 to-surface-950 rounded-2xl border border-accent-500/20 space-y-2.5 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent-500/20 flex items-center justify-center text-accent-400 shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">توليد خلفيات بالذكاء الاصطناعي</h4>
              <p className="text-[11px] text-white/40">توليد فوري لخلفيات إسلامية وطبيعية</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
            مجاني 100%
          </span>
        </div>

        {/* Model switcher - Clean Responsive 2-Column Segmented Control */}
        <div className="grid grid-cols-2 gap-1.5 bg-surface-950/80 p-1 rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setModelMode('turbo')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              modelMode === 'turbo'
                ? 'bg-accent-500 text-white shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-surface-800/50'
            }`}
            title="توليد فائق السرعة في 1-2 ثانية"
          >
            <Zap size={12} className={modelMode === 'turbo' ? 'text-yellow-300' : ''} />
            <span>Turbo سريع (1.5ث)</span>
          </button>
          <button
            type="button"
            onClick={() => setModelMode('flux')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              modelMode === 'flux'
                ? 'bg-gold-500 text-black shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-surface-800/50'
            }`}
            title="جودة سينمائية 8K في 5-7 ثوانٍ"
          >
            <Crown size={12} />
            <span>FLUX سينمائي (8K)</span>
          </button>
        </div>
      </div>

      {/* Preset Chips */}
      <div>
        <label className="text-[11px] text-white/40 mb-1.5 block">اقتراحات سريعة بضغطة زر:</label>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
          {aiPromptPresets.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              disabled={isGenerating}
              className={`p-2 rounded-xl border text-right transition-all flex items-center gap-2 ${
                selectedPresetId === p.id
                  ? 'bg-accent-500/20 border-accent-500/40 text-white shadow-sm'
                  : 'bg-surface-800/40 border-white/[0.04] text-white/60 hover:bg-surface-800/70 hover:text-white'
              }`}
            >
              <span className="text-base shrink-0">{p.icon}</span>
              <span className="text-[11px] font-medium truncate leading-tight">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Input */}
      <div>
        <label className="text-[11px] text-white/40 mb-1.5 block">
          أو اكتب وصفاً مخصصاً (بالعربية أو الإنجليزية):
        </label>
        <div className="relative">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setSelectedPresetId(null);
            }}
            placeholder="مثال: محراب مسجد رخامي مع إضاءة شمس ذهبية وأقواس أندلسية..."
            className="glass-input w-full text-xs resize-none pr-3 pl-10 rounded-xl"
            disabled={isGenerating}
          />
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="absolute left-2 top-2 p-2 rounded-lg bg-accent-500 hover:bg-accent-400 text-white transition-all disabled:opacity-50"
            title="توليد الصورة"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          </button>
        </div>
      </div>

      {/* Generation Status & Preview */}
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="aspect-[9/12] max-h-56 rounded-2xl bg-surface-900/80 border border-accent-500/30 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-accent-500/10 via-transparent to-transparent animate-pulse" />
            <Loader2 size={32} className="text-accent-400 animate-spin mb-3" />
            <p className="text-xs font-bold text-white mb-1">
              جاري توليد الخلفية بنموذج{' '}
              {modelMode === 'turbo' ? 'Turbo فائق السرعة' : 'FLUX السينمائي'}...
            </p>
            <p className="text-[11px] text-accent-400 font-mono">
              الوقت المستغرق: {elapsedSec} ثانية{' '}
              {modelMode === 'turbo' ? '(يكتمل خلال 1.5-2 ثوانٍ)' : '(يكتمل خلال 5-7 ثوانٍ)'}
            </p>
          </motion.div>
        ) : generatedUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2.5"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] group bg-black shadow-lg">
              <img
                src={generatedUrl}
                alt="AI Generated Background"
                className="w-full aspect-[9/12] max-h-60 object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] text-white/70 truncate">
                  {prompt || 'خلفية إسلامية ذكية'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApply(generatedUrl)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  appliedUrl === generatedUrl
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-accent-500 hover:bg-accent-400 text-white shadow-lg shadow-accent-500/20'
                }`}
              >
                {appliedUrl === generatedUrl ? (
                  <>
                    <Check size={14} />
                    تم التطبيق كخلفية ✓
                  </>
                ) : (
                  <>
                    <ImageIcon size={14} />
                    استخدام كخلفية
                  </>
                )}
              </button>
              <button
                onClick={() => handleGenerate()}
                title="توليد صورة جديدة أخرى فوراً"
                className="p-2 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-white/70 hover:text-white border border-white/[0.06] transition-all flex items-center gap-1"
              >
                <RefreshCw size={14} />
                <span className="text-[11px] font-bold pr-0.5">مرة أخرى</span>
              </button>
              <a
                href={generatedUrl}
                download="ai-islamic-background.jpg"
                target="_blank"
                rel="noreferrer"
                title="تحميل الصورة"
                className="p-2 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-white/70 hover:text-white border border-white/[0.06] transition-all"
              >
                <Download size={14} />
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* History Strip */}
      {history.length > 1 && (
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-2">
            <History size={12} className="text-white/40" />
            <span className="text-[11px] text-white/40">الخلفيات المولدة مؤخراً:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {history.map((url, i) => (
              <button
                key={i}
                onClick={() => {
                  setGeneratedUrl(url);
                  handleApply(url);
                }}
                className={`relative rounded-lg overflow-hidden shrink-0 border transition-all ${
                  appliedUrl === url
                    ? 'border-accent-400 scale-105'
                    : 'border-white/[0.06] opacity-70 hover:opacity-100'
                }`}
              >
                <img src={url} alt="History" className="w-12 h-12 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
