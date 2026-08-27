import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  Volume2,
  Sparkles,
  X,
  Check,
  Radio,
  Sliders,
  RotateCcw,
  Zap,
  Music,
  Flame,
} from 'lucide-react';
import { MosqueReverbPreset, AudioSettings } from '../../types';
import { voiceStudioEngine } from '../../services/voiceStudioEngine';
import { savePersistentAudio } from '../../services/persistentAudioStorage';
import { useAppStore } from '../../store/useAppStore';
import { useHotkeys } from '../../hooks/useHotkeys';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAudio: (audioData: {
    audioUrl: string;
    duration: number;
    audioSettings: Partial<AudioSettings>;
  }) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onApplyAudio,
}) => {
  const addToast = useAppStore((s) => s.addToast);

  const [activeMode, setActiveMode] = useState<'record' | 'upload'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio Mastering & Reverb settings
  const [reverbPreset, setReverbPreset] = useState<MosqueReverbPreset>('grandMosque');
  const [reverbLevel, setReverbLevel] = useState<number>(45);
  const [enableNoiseGate, setEnableNoiseGate] = useState<boolean>(true);
  const [enableClarity, setEnableClarity] = useState<boolean>(true);
  const [enableWarmth, setEnableWarmth] = useState<boolean>(true);
  const [enablePitchPolish, setEnablePitchPolish] = useState<boolean>(true);
  const [pitchPolishLevel, setPitchPolishLevel] = useState<number>(55);
  const [recitationVolume, setRecitationVolume] = useState<number>(90);

  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      voiceStudioEngine.stopPreview();
      setIsPlaying(false);
      if (isRecording) {
        voiceStudioEngine.stopRecording().catch(() => {});
        setIsRecording(false);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, isRecording]);

  useHotkeys('Escape', onClose, { enabled: isOpen });

  const handleStartRecord = async () => {
    try {
      setAudioBlobUrl(null);
      recordedBlobRef.current = null;
      setRecordingSeconds(0);
      voiceStudioEngine.stopPreview();
      setIsPlaying(false);

      await voiceStudioEngine.startRecording((level) => {
        setAudioLevel(level);
      });

      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      addToast({ message: 'بدأ التسجيل.. اقرأ بخشوع 🎙️', type: 'info' });
    } catch {
      addToast({ message: 'تعذر الوصول إلى المايكروفون. يرجى منح الإذن.', type: 'error' });
    }
  };

  const handleStopRecord = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setAudioLevel(0);

    try {
      const result = await voiceStudioEngine.stopRecording();
      recordedBlobRef.current = result.blob;
      setAudioBlobUrl(result.url);
      setAudioDuration(result.duration);
      addToast({
        message: 'تم إيقاف التسجيل بنجاح! يمكنك الآن تجربة صدى المسجد ✨',
        type: 'success',
      });
    } catch {
      addToast({ message: 'حدث خطأ أثناء معالجة التسجيل', type: 'error' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      voiceStudioEngine.stopPreview();
      setIsPlaying(false);

      const result = await voiceStudioEngine.loadAudioFile(file);
      recordedBlobRef.current = result.blob;
      setAudioBlobUrl(result.url);
      setAudioDuration(result.duration);
      addToast({ message: `تم رفع ملف «${file.name}» بنجاح! 🎵`, type: 'success' });
    } catch {
      addToast({ message: 'تعذر تحميل الملف الصوتي، يرجى اختيار ملف MP3 أو WAV', type: 'error' });
    }
  };

  const handleTogglePreview = () => {
    if (isPlaying) {
      voiceStudioEngine.stopPreview();
      setIsPlaying(false);
    } else {
      voiceStudioEngine.playPreview(
        {
          reverbPreset,
          reverbLevel,
          enableNoiseGate,
          enableClarity,
          enableWarmth,
          recitationVolume,
          enablePitchPolish,
          pitchPolishLevel,
        },
        () => setIsPlaying(false)
      );
      setIsPlaying(true);
    }
  };

  const handleApply = async () => {
    if (!audioBlobUrl) {
      addToast({ message: 'يرجى تسجيل صوت أو رفع ملف أولاً', type: 'warning' });
      return;
    }

    voiceStudioEngine.stopPreview();
    setIsPlaying(false);

    const audioKey = `voice_rec_${Date.now()}`;
    let permanentUrl = audioBlobUrl;

    if (recordedBlobRef.current) {
      try {
        permanentUrl = await savePersistentAudio(audioKey, recordedBlobRef.current, audioDuration);
      } catch (err) {
        console.warn('[VoiceRecorderModal] Error persisting to IndexedDB:', err);
      }
    }

    onApplyAudio({
      audioUrl: permanentUrl,
      duration: audioDuration,
      audioSettings: {
        recitationVolume,
        reverbPreset,
        reverbLevel,
        enableNoiseGate,
        enableStudioClarity: enableClarity,
        enableVoiceWarmth: enableWarmth,
        enablePitchPolish,
        pitchPolishLevel,
        customAudioKey: audioKey,
        customRecordedAudioUrl: permanentUrl,
        customAudioDuration: audioDuration,
      },
    });

    addToast({
      message: 'تم تطبيق تلاوتك الخاصة وحفظها بشكل دائم في التطبيق! 🎙️✨',
      type: 'success',
    });
    onClose();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const reverbPresetsList: { id: MosqueReverbPreset; name: string; icon: string; desc: string }[] =
    [
      { id: 'none', name: 'بدون صدى', icon: '🎙️', desc: 'استوديو نقي وجاف' },
      { id: 'smallRoom', name: 'غرفة هادئة', icon: '🏠', desc: 'صدى طبيعي ناعم (1.0s)' },
      { id: 'grandMosque', name: 'المسجد الكبير', icon: '🕌', desc: 'صدى قباب المساجد (3.0s)' },
      { id: 'makkahHaram', name: 'الحرم المكي', icon: '🕋', desc: 'صدى الحرم الشريف (4.8s)' },
      {
        id: 'celestialEcho',
        name: 'صدى إيماني واسع',
        icon: '✨',
        desc: 'أجواء روحانية واسعة (6.5s)',
      },
    ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label="استوديو تسجيل التلاوة وصدى المسجد"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-surface-950 border border-gold-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 text-black shadow-lg">
                <Mic size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  استوديو تسجيل التلاوة وصدى المسجد 🎙️🕌
                </h3>
                <p className="text-xs text-white/50">
                  سجل صوتك أو ارفع تلاوتك مع محاكاة صدى الحرم المكي وفلاتر الاستوديو الاحترافية
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-900 text-white/60 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="my-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-900/80 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setActiveMode('record')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMode === 'record'
                    ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-surface-950 shadow-md font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Radio size={15} />
                <span>تسجيل مباشر بالمايكروفون 🎙️</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('upload')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMode === 'upload'
                    ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-surface-950 shadow-md font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Upload size={15} />
                <span>رفع ملف صوتي خارجي (MP3 / WAV) 📁</span>
              </button>
            </div>

            {/* Tab 1: Live Recorder Box */}
            {activeMode === 'record' && (
              <div className="p-6 rounded-3xl bg-gradient-to-b from-surface-900/90 to-surface-950 border border-white/[0.08] text-center space-y-4 shadow-xl relative overflow-hidden">
                {/* Visual Level Ring */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  {isRecording && (
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-red-500/20 border-2 border-red-500/50"
                    />
                  )}

                  <button
                    type="button"
                    onClick={isRecording ? handleStopRecord : handleStartRecord}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/40 animate-pulse'
                        : 'bg-gradient-to-br from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-surface-950 shadow-gold-500/30 hover:scale-105'
                    }`}
                  >
                    {isRecording ? <Square size={28} /> : <Mic size={32} />}
                  </button>
                </div>

                <div>
                  <span className="text-2xl font-mono font-bold text-white block">
                    {formatSeconds(recordingSeconds)}
                  </span>
                  <p className="text-xs text-white/50 mt-1">
                    {isRecording
                      ? 'جاري التسجيل الآن.. اضغط المربع للإيقاف'
                      : 'اضغط على زر المايكروفون لبدء التسجيل'}
                  </p>
                </div>

                {/* Real-time VU meter bar */}
                {isRecording && (
                  <div className="max-w-xs mx-auto space-y-1">
                    <div className="w-full h-2 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-gold-400 to-red-500 transition-all duration-75"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-white/40 font-mono">
                      مستوى الصوت: {audioLevel}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Upload File Box */}
            {activeMode === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-3xl bg-surface-900/60 border-2 border-dashed border-white/20 hover:border-gold-400/60 text-center space-y-3 cursor-pointer transition-all hover:bg-surface-900/80 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-gold-400/15 border border-gold-400/30 text-gold-300 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-gold-300 transition-colors">
                    اختر ملفاً صوتياً أو اسحبه هنا
                  </h4>
                  <p className="text-xs text-white/50 mt-1">
                    يدعم صيغ MP3, WAV, M4A, AAC بأعلى جودة
                  </p>
                </div>
              </div>
            )}

            {/* Playback & Effects Section (Active when audio is ready) */}
            {audioBlobUrl && (
              <div className="space-y-4 p-4 rounded-3xl bg-surface-900/90 border border-gold-500/20 shadow-xl">
                {/* Audio Status & Preview Player Bar */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-950 border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTogglePreview}
                      className="w-10 h-10 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-surface-950 flex items-center justify-center font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="mr-0.5" />}
                    </button>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isPlaying
                          ? 'تشغيل المعاينة المباشرة مع الصدى...'
                          : 'معاينة التسجيل مع التأثيرات'}
                      </span>
                      <span className="text-xs text-gold-400 font-mono">
                        المدة: {formatSeconds(audioDuration)}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    جاهز للتطبيق ✓
                  </span>
                </div>

                {/* Mosque Spatial Reverb Section */}
                <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={14} className="text-gold-400" />
                      <span>صدى المسجد الحرام (Mosque Spatial Reverb) 🕌</span>
                    </label>
                    <span className="text-[11px] text-white/40">3D Acoustics</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {reverbPresetsList.map((rev) => {
                      const isSelected = reverbPreset === rev.id;
                      return (
                        <button
                          key={rev.id}
                          type="button"
                          onClick={() => {
                            setReverbPreset(rev.id);
                            if (isPlaying) {
                              voiceStudioEngine.playPreview({
                                reverbPreset: rev.id,
                                reverbLevel,
                                enableNoiseGate,
                                enableClarity,
                                enableWarmth,
                                recitationVolume,
                              });
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gold-500/20 border-gold-400 text-white shadow-md'
                              : 'bg-surface-950/60 border-white/[0.06] text-white/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{rev.icon}</span>
                            {isSelected && <span className="text-xs text-gold-400">✓</span>}
                          </div>
                          <div>
                            <span className="text-xs font-bold block">{rev.name}</span>
                            <span className="text-[10px] text-white/40 block truncate">
                              {rev.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {reverbPreset !== 'none' && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-1">
                        <span>قوة الصدى وعمق الارتداد</span>
                        <span className="font-mono text-gold-400">{reverbLevel}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={reverbLevel}
                        onChange={(e) => setReverbLevel(Number(e.target.value))}
                        className="w-full accent-gold-400"
                      />
                    </div>
                  )}
                </div>

                {/* Studio Audio Mastering & Noise Gate */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders size={14} className="text-emerald-400" />
                    <span>فلاتر الاستوديو ونقاء الصوت (Mastering & Clarity) 🎛️</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Filter 1: Noise Gate */}
                    <button
                      type="button"
                      onClick={() => setEnableNoiseGate(!enableNoiseGate)}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                        enableNoiseGate
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-surface-950/60 border-white/[0.06] text-white/40'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">⚡ عزل الضوضاء</span>
                        <span className="text-[10px] text-white/40">Noise Gate 85Hz</span>
                      </div>
                      <span className="text-xs">{enableNoiseGate ? '✓' : ''}</span>
                    </button>

                    {/* Filter 2: Tajweed Clarity */}
                    <button
                      type="button"
                      onClick={() => setEnableClarity(!enableClarity)}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                        enableClarity
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-surface-950/60 border-white/[0.06] text-white/40'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">💎 نقاء التجويد</span>
                        <span className="text-[10px] text-white/40">Clarity Boost</span>
                      </div>
                      <span className="text-xs">{enableClarity ? '✓' : ''}</span>
                    </button>

                    {/* Filter 3: Vocal Warmth */}
                    <button
                      type="button"
                      onClick={() => setEnableWarmth(!enableWarmth)}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                        enableWarmth
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-surface-950/60 border-white/[0.06] text-white/40'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">🎙️ دفء الصوت</span>
                        <span className="text-[10px] text-white/40">Warmth & Body</span>
                      </div>
                      <span className="text-xs">{enableWarmth ? '✓' : ''}</span>
                    </button>
                  </div>
                </div>

                {/* Auto-Pitch Polish */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="p-3 rounded-2xl bg-surface-950/70 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Flame size={13} className="text-amber-400" />
                        <span>تنعيم النبرة والهارمونيك (Auto-Pitch Polish) 💎</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEnablePitchPolish(!enablePitchPolish)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          enablePitchPolish
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                            : 'text-white/40 border-white/10'
                        }`}
                      >
                        {enablePitchPolish ? 'مفعل ✓' : 'معطل'}
                      </button>
                    </div>
                    {enablePitchPolish && (
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={pitchPolishLevel}
                        onChange={(e) => setPitchPolishLevel(Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer & Apply Action */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface-900 hover:bg-surface-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            {audioBlobUrl && (
              <button
                type="button"
                onClick={handleApply}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-surface-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-gold-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Zap size={15} />
                <span>استخدام هذا التسجيل في الريلز 🚀</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
