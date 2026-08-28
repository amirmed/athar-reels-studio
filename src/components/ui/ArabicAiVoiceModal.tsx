import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  Pause,
  Sliders,
  Check,
  Zap,
  Loader2,
  FileText,
} from 'lucide-react';
import {
  ArabicVoice,
  ARABIC_AI_VOICES,
  synthesizeArabicSpeech,
} from '../../services/arabicTtsService';
import { Project, AzkarItem } from '../../types';
import { createDefaultProject } from '../../utils/projectDefaults';
import { Modal } from './Modal';

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
  const [_previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedVoice =
    ARABIC_AI_VOICES.find((v) => v.id === selectedVoiceId) || ARABIC_AI_VOICES[0];

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingPreview(false);
    setPlayingVoiceId(null);
  };

  const handleClose = () => {
    handleStopAudio();
    onClose();
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
        setIsSynthesizing(false);
      };
      audio.onended = () => {
        setIsPlayingPreview(false);
        setPlayingVoiceId(null);
      };
      audio.onerror = () => {
        setIsPlayingPreview(false);
        setIsSynthesizing(false);
        setPlayingVoiceId(null);
      };
      await audio.play();
    } catch (e) {
      console.warn('[ArabicAiVoiceModal] Failed to play preview voice:', e);
      setIsSynthesizing(false);
      setPlayingVoiceId(null);
    }
  };

  const handlePlayFullItem = async () => {
    if (isPlayingPreview) {
      handleStopAudio();
      return;
    }

    handleStopAudio();
    setIsSynthesizing(true);
    setPlayingVoiceId(selectedVoiceId);

    try {
      const result = await synthesizeArabicSpeech(item.arabicText, selectedVoiceId, speechRate);
      setPreviewAudioUrl(result.audioUrl);

      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;
      audio.onplay = () => {
        setIsPlayingPreview(true);
        setIsSynthesizing(false);
      };
      audio.onended = () => {
        setIsPlayingPreview(false);
        setPlayingVoiceId(null);
      };
      audio.onerror = () => {
        setIsPlayingPreview(false);
        setIsSynthesizing(false);
        setPlayingVoiceId(null);
      };
      await audio.play();
    } catch (e) {
      console.warn('[ArabicAiVoiceModal] Failed to synthesize full text:', e);
      setIsSynthesizing(false);
      setPlayingVoiceId(null);
    }
  };

  const handleCreateReelWithVoice = async () => {
    handleStopAudio();
    setIsSynthesizing(true);

    try {
      const result = await synthesizeArabicSpeech(item.arabicText, selectedVoiceId, speechRate);

      const project: Project = createDefaultProject({
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
          customRecordedAudioUrl: result.audioUrl,
        },
      });

      onConfirmReel(project);
      handleClose();
    } catch (e) {
      console.warn('[ArabicAiVoiceModal] Failed to create project with voice:', e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="استوديو الأصوات العربية الذكية 🗣️"
      subtitle="توليد تلاوة صوتية عربية فصيحة ومتقنة التشكيل للأحاديث والأذكار"
      headerIcon={<Sparkles size={20} className="text-gold-400" />}
      size="lg"
    >
      <div className="space-y-4">
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
                    <div className="min-w-0 text-start">
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

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePlayFullItem}
            disabled={isSynthesizing}
            className="btn-ghost py-2 px-3 text-xs flex items-center gap-2 disabled:opacity-50"
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
              onClick={handleClose}
              className="btn-ghost py-2 px-4 text-xs"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleCreateReelWithVoice}
              disabled={isSynthesizing}
              className="btn-gold py-2 px-5 text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
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
      </div>
    </Modal>
  );
};
