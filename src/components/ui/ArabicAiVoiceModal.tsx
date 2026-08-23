import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Volume2,
  Play,
  Pause,
  Sliders,
  Check,
  Zap,
  ArrowRight,
  Radio,
  Loader2,
  Headphones,
  FileText,
} from 'lucide-react';
import {
  ArabicVoice,
  ARABIC_AI_VOICES,
  synthesizeArabicSpeech,
} from '../../services/arabicTtsService';
import { AzkarItem, Project } from '../../types';

interface ArabicAiVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AzkarItem;
  onConfirmReel: (project: Project) => void;
}

export const ArabicAiVoiceModal: React.FC<ArabicAiVoiceModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirmReel,
}) => {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    item.category === 'hadith' ? 'ar-SA-HamedNeural' : 'ar-SA-ZariyahNeural'
  );
  const [speechRate, setSpeechRate] = useState<string>('+0%');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedVoice =
    ARABIC_AI_VOICES.find((v) => v.id === selectedVoiceId) || ARABIC_AI_VOICES[0];

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (audioRef.current) audioRef.current.pause();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingPreview(false);
    setPlayingVoiceId(null);
  };

  const handlePlayVoiceSample = async (voice: ArabicVoice) => {
    handleStopAudio();
    setSelectedVoiceId(voice.id);
    setIsSynthesizing(true);
    setPlayingVoiceId(voice.id);

    try {
      const result = await synthesizeArabicSpeech(voice.sampleText, voice.id, speechRate);
      setPreviewAudioUrl(result.audioUrl);

      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;
      audio.onplay = () => {
        setIsPlayingPreview(true);
        setPlayingVoiceId(voice.id);
      };
      audio.onended = () => {
        setIsPlayingPreview(false);
        setPlayingVoiceId(null);
      };
      audio.onerror = () => {
        setIsPlayingPreview(false);
        setPlayingVoiceId(null);
      };
      await audio.play();
    } catch (e) {
      console.warn('[ArabicAiVoiceModal] Voice preview error:', e);
      setIsPlayingPreview(false);
      setPlayingVoiceId(null);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePlayFullItem = async () => {
    if (isPlayingPreview) {
      handleStopAudio();
      return;
    }

    setIsSynthesizing(true);
    try {
      const result = await synthesizeArabicSpeech(item.arabicText, selectedVoiceId, speechRate);
      setPreviewAudioUrl(result.audioUrl);

      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;
      audio.onplay = () => setIsPlayingPreview(true);
      audio.onended = () => setIsPlayingPreview(false);
      audio.onerror = () => setIsPlayingPreview(false);
      await audio.play();
    } catch (e) {
      console.warn('[ArabicAiVoiceModal] Full audio synthesis error:', e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCreateReelWithVoice = async () => {
    setIsSynthesizing(true);
    handleStopAudio();

    try {
      const result = await synthesizeArabicSpeech(item.arabicText, selectedVoiceId, speechRate);

      const project: Project = {
        id: `azkar-ai-voice-${Date.now()}`,
        name: `${item.title} — صوت AI ${selectedVoice.name}`,
        contentType: item.category === 'hadith' ? 'hadith' : 'azkar',
        customText: item.arabicText,
        customTitle: item.title,
        customReference: item.reference,
        customAudioUrl: result.audioUrl,
        reciter: `${selectedVoice.name} (ذكاء اصطناعي)`,
        reciterId: selectedVoice.id,
        surah: item.title,
        surahNumber: 0,
        fromAyah: 1,
        toAyah: 1,
        aspectRatio: '9:16',
        backgroundType: 'image',
        backgroundUrl:
          'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
        backgroundOpacity: 0.7,
        watermark: 'atar-studio.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        exportCount: 0,
        textSettings: {
          fontSize: 27,
          fontWeight: 'bold',
          textAlign: 'center',
          textColor: '#ffffff',
          bgColor: '#000000',
          bgOpacity: 0.55,
          position: 'center',
          fontFamily: 'Amiri',
          wordHighlightEnabled: true,
          wordHighlightStyle: 'goldGlow',
          wordHighlightColor: '#fbbf24',
          inactiveWordOpacity: 0.55,
          highlightScale: true,
          showProgressBar: true,
          progressBarStyle: 'neonGlow',
          progressBarColor: '#fbbf24',
          progressBarHeight: 4,
          showIslamicOrnaments: true,
          ornamentStyle: 'royalFrame',
          ornamentColor: '#fbbf24',
          ornamentOpacity: 0.8,
          translationFontSize: 14,
          translationColor: '#e2e8f0',
        },
        audioSettings: {
          recitationVolume: 88,
          fadeIn: true,
          fadeOut: true,
          fadeDuration: 1.5,
          backgroundVolume: 20,
          ambientSoundId: 'none',
          ambientSoundVolume: 0,
          customRecordedAudioUrl: result.audioUrl,
        },
        translationEnabled: false,
        tafsirEnabled: false,
      };

      onConfirmReel(project);
      onClose();
    } catch (e) {
      console.warn('[ArabicAiVoiceModal] Failed to create project with voice:', e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-surface-900 border border-gold-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-surface-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-gold-500/20 to-amber-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>استوديو الأصوات العربية الذكية 🗣️</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-bold border border-gold-500/30">
                    Edge Neural AI
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  توليد تلاوة صوتية عربية فصيحة ومتقنة التشكيل للأحاديث والأذكار
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                handleStopAudio();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Active Content Preview */}
            <div className="p-3.5 rounded-2xl bg-surface-950/80 border border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span className="font-bold text-gold-400 flex items-center gap-1">
                  <FileText size={12} />
                  <span>{item.title}</span>
                </span>
                <span>{item.reference}</span>
              </div>
              <p className="text-sm font-arabic font-semibold text-white/90 leading-relaxed text-right line-clamp-3">
                « {item.arabicText} »
              </p>
            </div>

            {/* Voices Grid */}
            <div>
              <label className="block text-xs font-bold text-white mb-2 flex items-center justify-between">
                <span>اختر الصوت العربي المناسب:</span>
                <span className="text-[11px] text-white/40">6 أصوات نبرة نقية</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ARABIC_AI_VOICES.map((voice) => {
                  const isSelected = selectedVoiceId === voice.id;
                  return (
                    <div
                      key={voice.id}
                      onClick={() => {
                        setSelectedVoiceId(voice.id);
                        handlePlayVoiceSample(voice);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-gold-500/15 to-amber-500/15 border-gold-400 shadow-md shadow-gold-500/10'
                          : 'bg-surface-950/50 border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{voice.icon}</span>
                        <div className="min-w-0 text-right">
                          <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{voice.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/60">
                              {voice.region}
                            </span>
                          </h4>
                          <p className="text-[11px] text-white/50 truncate mt-0.5">
                            {voice.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {playingVoiceId === voice.id && (
                          <span className="p-1.5 rounded-xl bg-gold-500/20 text-gold-400 animate-pulse flex items-center gap-1">
                            <Volume2 size={13} />
                          </span>
                        )}
                        {isSelected && (
                          <span className="p-1 rounded-full bg-gold-500 text-surface-950">
                            <Check size={11} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Speed / Pace Controls */}
            <div className="p-3.5 rounded-2xl bg-surface-950/60 border border-white/[0.06] flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders size={14} className="text-sky-400" />
                <span>سرعة الإلقاء الصوتي:</span>
              </span>

              <div className="flex items-center gap-1 bg-surface-900 p-1 rounded-xl border border-white/5 text-xs font-bold">
                {[
                  { id: '-15%', label: 'هادئ ومتأنٍ' },
                  { id: '+0%', label: 'طبيعي معتدل' },
                  { id: '+15%', label: 'سريع وواضح' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSpeechRate(s.id)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      speechRate === s.id
                        ? 'bg-sky-500 text-white font-black shadow-sm'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-white/[0.08] bg-surface-950/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePlayFullItem}
              disabled={isSynthesizing}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSynthesizing ? (
                <Loader2 size={15} className="animate-spin text-gold-400" />
              ) : isPlayingPreview ? (
                <Pause size={15} className="text-rose-400" />
              ) : (
                <Volume2 size={15} className="text-gold-400" />
              )}
              <span>{isPlayingPreview ? 'إيقاف الاستماع' : 'استماع للنص كاملاً 🎧'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleStopAudio();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleCreateReelWithVoice}
                disabled={isSynthesizing}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-gold-500 via-amber-500 to-gold-400 hover:from-gold-400 hover:to-amber-400 text-surface-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-gold-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSynthesizing ? (
                  <Loader2 size={15} className="animate-spin text-surface-950" />
                ) : (
                  <Zap size={15} />
                )}
                <span>إنشاء ريلز بصوت الـ AI 🚀</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
