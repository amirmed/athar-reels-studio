import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  Volume2,
  Sparkles,
  Sliders,
  RotateCcw,
  Zap,
  ArrowRight,
  BookOpen,
  BookHeart,
  FileText,
  ChevronDown,
  Download,
  Settings,
  Flame,
  Radio,
  Share2,
  Maximize2,
  FastForward,
  Rewind,
  Eye,
  FlipHorizontal,
} from 'lucide-react';
import { surahs } from '../../data/mockData';
import { initialAzkarList } from '../../data/azkarHadithData';
import { fetchAyahsWithAudio, AyahData } from '../../services/quranApi';
import { MosqueReverbPreset, AudioSettings, AzkarItem, Project, Spatial8DStyle } from '../../types';
import { voiceStudioEngine } from '../../services/voiceStudioEngine';
import {
  savePersistentAudio,
  getPersistentAudioBlob,
  deletePersistentAudio,
} from '../../services/persistentAudioStorage';
import { quranCacheService } from '../../services/quranCacheService';
import { ambientSounds, proceduralAmbientEngine } from '../../data/ambientSounds';
import { Spatial8DRadar } from '../ui/Spatial8DRadar';
import { Headphones } from 'lucide-react';

type PrompterMode = 'quran' | 'hadith' | 'dua' | 'custom';
type PrompterTheme = 'obsidian' | 'emerald' | 'parchment' | 'midnight';

export const VoiceStudioPage: React.FC = () => {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const addProject = useAppStore((s) => s.addProject);
  const addToast = useAppStore((s) => s.addToast);

  // Mode & Content State
  const [prompterMode, setPrompterMode] = useState<PrompterMode>('quran');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(7);
  const [selectedZikrId, setSelectedZikrId] = useState<string>(initialAzkarList[0]?.id || 'm-1');
  const [customText, setCustomText] = useState<string>(
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝'
  );

  // Loaded Quran Ayahs
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);

  // Teleprompter Visual Controls
  const [fontSize, setFontSize] = useState<number>(36);
  const [fontFamily, setFontFamily] = useState<string>('Amiri');
  const [prompterTheme, setPrompterTheme] = useState<PrompterTheme>('obsidian');
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(0.45); // Calm natural recitation tempo
  const [isMirrored, setIsMirrored] = useState<boolean>(false);

  // Voice Recording & Audio DSP State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  // Reverb & Mastering Settings
  const [reverbPreset, setReverbPreset] = useState<MosqueReverbPreset>('grandMosque');
  const [reverbLevel, setReverbLevel] = useState<number>(45);
  const [enableNoiseGate, setEnableNoiseGate] = useState<boolean>(true);
  const [enableClarity, setEnableClarity] = useState<boolean>(true);
  const [enableWarmth, setEnableWarmth] = useState<boolean>(true);
  const [enablePitchPolish, setEnablePitchPolish] = useState<boolean>(true);
  const [pitchPolishLevel, setPitchPolishLevel] = useState<number>(55);
  // 8D Binaural Spatial Audio State
  const [enable8DAudio, setEnable8DAudio] = useState<boolean>(false);
  const [eightDSpeed, setEightDSpeed] = useState<number>(0.12);
  const [eightDDepth, setEightDDepth] = useState<number>(85);
  const [eightDStyle, setEightDStyle] = useState<Spatial8DStyle>('orbit360');
  const [show8DBadge, setShow8DBadge] = useState<boolean>(true);

  const [recitationVolume, setRecitationVolume] = useState<number>(90);
  const [customReciterName, setCustomReciterName] = useState<string>('تلاوتي الخاصة 🎙️');
  const [ambientSoundId, setAmbientSoundId] = useState<string>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0);
  const [isTestingAmbient, setIsTestingAmbient] = useState<boolean>(false);

  // Refs
  const prompterContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentAudioBlobRef = useRef<Blob | null>(null);

  const selectedSurah = surahs.find((s) => s.number === selectedSurahNumber);

  // Load Quran Ayahs when Surah or range changes
  useEffect(() => {
    if (prompterMode !== 'quran') return;
    let isMounted = true;
    setIsLoadingAyahs(true);

    fetchAyahsWithAudio(selectedSurahNumber, fromAyah, toAyah, 'alafasy_128')
      .then((data) => {
        if (isMounted) {
          setAyahs(data);
          setIsLoadingAyahs(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingAyahs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSurahNumber, fromAyah, toAyah, prompterMode]);

  // Countdown State
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const countdownIntervalRef = useRef<number | null>(null);

  // Audio tone synthesizer for countdown with guaranteed context disposal
  const playCountdownChime = (freq = 520, duration = 0.15) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);

      setTimeout(
        () => {
          try {
            ctx.close();
          } catch {}
        },
        (duration + 0.1) * 1000
      );
    } catch {}
  };

  // Clean up audio preview, stream & timers on unmount (keep audioBlobUrl alive for project usage)
  useEffect(() => {
    return () => {
      voiceStudioEngine.stopPreview();
      proceduralAmbientEngine.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, []);

  // Restore Draft Recording from IndexedDB on page load so recordings are never lost
  useEffect(() => {
    let isMounted = true;
    getPersistentAudioBlob('athar_voice_studio_draft')
      .then(async (blob) => {
        if (!blob || !isMounted) return;
        currentAudioBlobRef.current = blob;
        const res = await voiceStudioEngine.loadAudioBlob(blob);
        if (isMounted) {
          setAudioBlobUrl(res.url);
          setAudioDuration(res.duration);
          const metaStr = localStorage.getItem('athar_voice_studio_draft_meta');
          if (metaStr) {
            try {
              const meta = JSON.parse(metaStr);
              if (meta.prompterMode) setPrompterMode(meta.prompterMode);
              if (meta.selectedSurahNumber) setSelectedSurahNumber(meta.selectedSurahNumber);
              if (meta.fromAyah) setFromAyah(meta.fromAyah);
              if (meta.toAyah) setToAyah(meta.toAyah);
              if (meta.customText) setCustomText(meta.customText);
              if (meta.selectedZikrId) setSelectedZikrId(meta.selectedZikrId);
              if (meta.customReciterName) setCustomReciterName(meta.customReciterName);
            } catch {}
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (!isAutoScrolling) {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
      return;
    }

    const scrollLoop = () => {
      if (prompterContainerRef.current) {
        prompterContainerRef.current.scrollTop += scrollSpeed * 0.75;
      }
      scrollAnimRef.current = requestAnimationFrame(scrollLoop);
    };

    scrollAnimRef.current = requestAnimationFrame(scrollLoop);
    return () => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Recording Controls with 3-2-1 Countdown
  const handleInitiateRecord = () => {
    if (isRecording) {
      handleStopRecord();
      return;
    }

    if (isCountingDown) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setIsCountingDown(false);
      return;
    }

    setIsCountingDown(true);
    setCountdownValue(3);
    playCountdownChime(523.25, 0.18); // Note C5

    let count = 3;
    countdownIntervalRef.current = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownValue(count);
        playCountdownChime(523.25 + (3 - count) * 80, 0.18);
      } else if (count === 0) {
        setCountdownValue(0);
        playCountdownChime(1046.5, 0.35); // High Note C6
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setIsCountingDown(false);
        handleStartRecord();
      }
    }, 900);
  };

  const handleStartRecord = async () => {
    try {
      setAudioBlobUrl(null);
      setRecordingSeconds(0);
      voiceStudioEngine.stopPreview();
      setIsPlayingPreview(false);

      await voiceStudioEngine.startRecording((level) => {
        setAudioLevel(level);
      });

      setIsRecording(true);
      setIsAutoScrolling(true); // Start teleprompter automatically on record!

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      addToast({ message: 'بدأ التسجيل وتحريك المصحف الملقّن.. اقرأ بخشوع 🎙️✨', type: 'info' });
    } catch {
      addToast({
        message: 'تعذر الوصول إلى المايكروفون. يرجى التأكد من منحه الإذن.',
        type: 'error',
      });
    }
  };

  const handleStopRecord = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsCountingDown(false);
    setIsRecording(false);
    setIsAutoScrolling(false);
    setAudioLevel(0);

    try {
      const result = await voiceStudioEngine.stopRecording();
      currentAudioBlobRef.current = result.blob;
      setAudioBlobUrl(result.url);
      setAudioDuration(result.duration);
      if (result.blob) {
        savePersistentAudio('athar_voice_studio_draft', result.blob, result.duration).catch(
          () => {}
        );
        localStorage.setItem(
          'athar_voice_studio_draft_meta',
          JSON.stringify({
            prompterMode,
            selectedSurahNumber,
            fromAyah,
            toAyah,
            customText,
            selectedZikrId,
            customReciterName,
            duration: result.duration,
          })
        );
        quranCacheService.cacheAudioBlob(result.url, result.blob).catch(() => {});
      }
      addToast({
        message: 'تم حفظ تسجيلك الصوتي بنجاح! يمكنك الآن تجربة صدى المسجد وفلاتر الاستوديو ✨',
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
      setIsPlayingPreview(false);

      const result = await voiceStudioEngine.loadAudioFile(file);
      currentAudioBlobRef.current = result.blob;
      setAudioBlobUrl(result.url);
      setAudioDuration(result.duration);
      if (result.blob) {
        savePersistentAudio('athar_voice_studio_draft', result.blob, result.duration).catch(
          () => {}
        );
        localStorage.setItem(
          'athar_voice_studio_draft_meta',
          JSON.stringify({
            prompterMode,
            selectedSurahNumber,
            fromAyah,
            toAyah,
            customText,
            selectedZikrId,
            customReciterName,
            duration: result.duration,
          })
        );
      }
      quranCacheService.cacheAudioBlob(result.url, file).catch(() => {});
      addToast({ message: `تم رفع ملف «${file.name}» بنجاح! 🎵`, type: 'success' });
    } catch {
      addToast({ message: 'تعذر تحميل الملف الصوتي، يرجى اختيار ملف MP3 أو WAV', type: 'error' });
    }
  };

  const handleTogglePreview = () => {
    if (isPlayingPreview) {
      voiceStudioEngine.stopPreview();
      proceduralAmbientEngine.stop();
      setIsPlayingPreview(false);
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
          enable8DAudio,
          eightDSpeed,
          eightDDepth,
          eightDStyle,
        },
        () => {
          setIsPlayingPreview(false);
          proceduralAmbientEngine.stop();
        }
      );

      if (ambientSoundId && ambientSoundId !== 'none') {
        proceduralAmbientEngine.play(ambientSoundId, ambientVolume);
      }

      setIsPlayingPreview(true);
    }
  };

  // Convert to Video Project & Open Editor
  const handleConvertToReel = async () => {
    if (!audioBlobUrl) {
      addToast({ message: 'يرجى تسجيل الصوت أولاً قبل التحويل للريلز', type: 'warning' });
      return;
    }

    voiceStudioEngine.stopPreview();
    proceduralAmbientEngine.stop();
    setIsPlayingPreview(false);

    const isQuran = prompterMode === 'quran';
    const isHadith = prompterMode === 'hadith';
    const isDua = prompterMode === 'dua';
    const isCustom = prompterMode === 'custom';

    let resolvedTitle = 'تسجيل صوتي خاص';
    let resolvedText: string | undefined = undefined;
    let resolvedContentType: 'quran' | 'hadith' | 'azkar' | 'custom' = 'quran';

    if (isQuran) {
      resolvedTitle = `سورة ${selectedSurah?.name || 'الفاتحة'} (${fromAyah}-${toAyah})`;
      resolvedContentType = 'quran';
      resolvedText = undefined;
    } else if (isHadith) {
      const h =
        initialAzkarList.find((z) => z.id === selectedZikrId && z.category === 'hadith') ||
        initialAzkarList.find((z) => z.category === 'hadith');
      resolvedTitle = h ? h.title : 'حديث نبوي شريف';
      resolvedText = h ? h.arabicText : customText;
      resolvedContentType = 'hadith';
    } else if (isDua) {
      const z =
        initialAzkarList.find((item) => item.id === selectedZikrId && item.category !== 'hadith') ||
        initialAzkarList[0];
      resolvedTitle = z ? z.title : 'دعاء وذكر خاشع';
      resolvedText = z ? z.arabicText : customText;
      resolvedContentType = 'azkar';
    } else {
      resolvedTitle = 'موعظة وكلمة طيبة';
      resolvedContentType = 'custom';
      resolvedText = customText;
    }

    const resolvedReciter = customReciterName.trim() || 'تلاوتي الخاصة 🎙️';
    const newProjectId = `voice-reel-${Date.now()}`;
    let permanentAudioUrl = audioBlobUrl;

    if (currentAudioBlobRef.current) {
      try {
        permanentAudioUrl = await savePersistentAudio(
          newProjectId,
          currentAudioBlobRef.current,
          audioDuration
        );
      } catch (err) {
        console.warn('[VoiceStudioPage] Error saving to IndexedDB:', err);
      }
    }

    const newProject: Project = {
      id: newProjectId,
      name: resolvedTitle,
      reciter: resolvedReciter,
      reciterId: 'custom_voice',
      customReciterName: resolvedReciter,
      surah: isQuran ? selectedSurah?.name || 'الفاتحة' : '',
      surahNumber: isQuran ? selectedSurahNumber : 1,
      fromAyah: isQuran ? Number(fromAyah) : 1,
      toAyah: isQuran ? Number(toAyah) : 1,
      customAudioUrl: permanentAudioUrl,
      customAudioKey: newProjectId,
      contentType: resolvedContentType,
      customTitle: resolvedTitle,
      customText: isQuran ? undefined : resolvedText,
      aspectRatio: '9:16' as const,
      backgroundType: 'image' as const,
      backgroundUrl:
        'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
      backgroundOpacity: 0.8,
      watermark: 'atar-studio.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'editing' as const,
      exportCount: 0,
      translationEnabled: false,
      tafsirEnabled: false,
      audioSettings: {
        recitationVolume,
        customReciterName: resolvedReciter,
        fadeIn: true,
        fadeOut: true,
        fadeDuration: 1.5,
        backgroundVolume: 25,
        ambientSoundId,
        ambientSoundVolume: ambientVolume,
        reverbPreset,
        reverbLevel,
        enableNoiseGate,
        enableStudioClarity: enableClarity,
        enableVoiceWarmth: enableWarmth,
        enablePitchPolish,
        pitchPolishLevel,
        enable8DAudio,
        eightDSpeed,
        eightDDepth,
        eightDStyle,
        show8DBadge,
        customAudioKey: newProjectId,
        customRecordedAudioUrl: permanentAudioUrl,
        customAudioDuration: audioDuration,
      },
      textSettings: {
        fontSize: 26,
        fontWeight: 'bold' as const,
        textAlign: 'center' as const,
        textColor: '#ffffff',
        bgColor: '#000000',
        bgOpacity: 0.45,
        position: 'center' as const,
        translationFontSize: 13,
        translationColor: '#e2e8f0',
        translationLanguage: 'en' as const,
        fontFamily: fontFamily,
        displayMode: 'chunked' as const,
        wordHighlightEnabled: true,
        wordHighlightStyle: 'goldGlow' as const,
        wordHighlightColor: '#fbbf24',
        showProgressBar: true,
        progressBarStyle: 'neonGlow' as const,
        progressBarColor: '#fbbf24',
        showWaveform: true,
        waveformStyle: 'bars' as const,
        waveformColor: '#fbbf24',
        colorGrading: 'royalGold',
        cameraMotion: 'slowZoom',
        showTitleBadge: isQuran,
        show8DBadge: enable8DAudio && show8DBadge,
        showReciterBadge: true,
      },
    };

    addProject(newProject);
    setCurrentProject(newProject);
    deletePersistentAudio('athar_voice_studio_draft').catch(() => {});
    localStorage.removeItem('athar_voice_studio_draft_meta');
    addToast({
      message: 'تم تحويل تسجيلك الصوتي بنجاح إلى مشروع ريلز احترافي! 🚀✨',
      type: 'success',
    });
    setTimeout(() => {
      setCurrentPage('editor');
    }, 200);
  };

  const handleClearDraft = async () => {
    voiceStudioEngine.stopPreview();
    proceduralAmbientEngine.stop();
    setIsPlayingPreview(false);
    setAudioBlobUrl(null);
    setAudioDuration(0);
    currentAudioBlobRef.current = null;
    await deletePersistentAudio('athar_voice_studio_draft').catch(() => {});
    localStorage.removeItem('athar_voice_studio_draft_meta');
    addToast({ message: 'تم مسح التسجيل المسودة والبدء من جديد ✨', type: 'info' });
  };

  const handleDownloadAudio = () => {
    if (!audioBlobUrl) {
      addToast({ message: 'لا يوجد تسجيل صوتي لتحميله', type: 'warning' });
      return;
    }
    const a = document.createElement('a');
    a.href = audioBlobUrl;
    a.download = `Athar-Studio-Recitation-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast({ message: 'تم بدء تحميل الملف الصوتي بنجاح 💾', type: 'success' });
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const themeStyles = {
    obsidian:
      'bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950 border-gold-500/30 text-amber-100',
    emerald:
      'bg-gradient-to-b from-emerald-950/90 via-surface-950 to-emerald-950/90 border-emerald-500/30 text-emerald-100',
    parchment:
      'bg-gradient-to-b from-[#2a241b] via-[#1f1a13] to-[#2a241b] border-amber-600/40 text-amber-200',
    midnight:
      'bg-gradient-to-b from-blue-950/80 via-surface-950 to-indigo-950/80 border-sky-500/30 text-sky-100',
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-950 text-white overflow-hidden font-sans">
      {/* Top Professional Studio Header */}
      <header className="h-14 bg-surface-950/95 backdrop-blur-2xl border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-white/70 hover:text-white border border-white/[0.06] transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowRight size={15} />
            <span>الرئيسية</span>
          </button>

          <div className="w-px h-5 bg-white/[0.08]" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-amber-500 text-surface-950 flex items-center justify-center font-bold shadow-md">
              <Mic size={16} />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                استوديو التسجيل الصوتي والمصحف الملقّن 🎙️📖
              </h1>
              <p className="text-[11px] text-gold-400/80 hidden sm:block">
                تلقين الآيات بالرسم العثماني • صدى الحرم المكي • معالجة الاستوديو
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {audioBlobUrl && (
            <>
              <button
                type="button"
                onClick={handleDownloadAudio}
                className="px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-800 text-white/80 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-white/[0.08] transition-all cursor-pointer"
                title="تنزيل الملف الصوتي"
              >
                <Download size={14} />
                <span className="hidden sm:inline">تحميل الصوت 💾</span>
              </button>

              <button
                type="button"
                onClick={handleConvertToReel}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-surface-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-gold-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Zap size={14} />
                <span>تحويل إلى فيديو ريلز 🎬</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Studio Dual-Column Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 sm:p-4 gap-4">
        {/* ======================================================== */}
        {/* LEFT COLUMN: المصحف الملقّن الذكي (Smart Quran Teleprompter) */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col bg-surface-900/60 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Prompter Toolbar */}
          <div className="p-3 bg-surface-950/80 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2.5">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-900 border border-white/[0.06] flex-wrap">
              <button
                type="button"
                onClick={() => setPrompterMode('quran')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  prompterMode === 'quran'
                    ? 'bg-gold-400 text-surface-950 shadow-sm font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <BookOpen size={13} />
                <span>القرآن الكريم 📖</span>
              </button>

              <button
                type="button"
                onClick={() => setPrompterMode('hadith')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  prompterMode === 'hadith'
                    ? 'bg-gold-400 text-surface-950 shadow-sm font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <BookHeart size={13} />
                <span>حديث نبوي 📜</span>
              </button>

              <button
                type="button"
                onClick={() => setPrompterMode('dua')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  prompterMode === 'dua'
                    ? 'bg-gold-400 text-surface-950 shadow-sm font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Sparkles size={13} />
                <span>دعاء ومناجاة 🤲</span>
              </button>

              <button
                type="button"
                onClick={() => setPrompterMode('custom')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  prompterMode === 'custom'
                    ? 'bg-gold-400 text-surface-950 shadow-sm font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>تسجيل حر / موعظة 🎙️</span>
              </button>
            </div>

            {/* Teleprompter Controls: Font size, Speed presets, Slider, Play/Pause Scroll */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Speed Presets & Slider */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-900 border border-white/[0.06] text-xs">
                <span className="text-[11px] text-white/50 px-1 font-bold">سرعة التلقين:</span>
                {[
                  { speed: 0.28, label: '🐢 هادئ' },
                  { speed: 0.45, label: '📖 ترتيل' },
                  { speed: 0.75, label: '⚡ حدر' },
                ].map((sp) => (
                  <button
                    key={sp.speed}
                    type="button"
                    onClick={() => setScrollSpeed(sp.speed)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      Math.abs(scrollSpeed - sp.speed) < 0.05
                        ? 'bg-gold-400 text-surface-950 shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-surface-800'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
                <input
                  type="range"
                  min={0.15}
                  max={1.2}
                  step={0.05}
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  className="w-16 accent-gold-400 cursor-pointer ml-1"
                  title={`السرعة: ${Math.round(scrollSpeed * 100)}%`}
                />
              </div>

              <div className="flex items-center gap-1 text-xs text-white/60">
                <span className="text-[11px]">الخط:</span>
                <input
                  type="range"
                  min={22}
                  max={64}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-16 accent-gold-400 cursor-pointer"
                  title={`حجم الخط: ${fontSize}px`}
                />
              </div>

              {/* Theme selector */}
              <div className="flex items-center gap-1">
                {(['obsidian', 'emerald', 'parchment', 'midnight'] as const).map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => setPrompterTheme(th)}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      prompterTheme === th
                        ? 'scale-110 border-white ring-2 ring-gold-400/50'
                        : 'opacity-40 hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor:
                        th === 'obsidian'
                          ? '#18181b'
                          : th === 'emerald'
                            ? '#064e3b'
                            : th === 'parchment'
                              ? '#78350f'
                              : '#1e1b4b',
                    }}
                  />
                ))}
              </div>

              {/* Mirror Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsMirrored(!isMirrored)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isMirrored
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 ring-1 ring-purple-400/40'
                    : 'bg-surface-800 border-white/5 text-white/60 hover:text-white'
                }`}
                title="عكس الشاشة لزجاج التلقين (Mirror Mode 🪞)"
              >
                <FlipHorizontal size={14} />
              </button>

              {/* Auto-Scroll Toggle Button */}
              <button
                type="button"
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAutoScrolling
                    ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                    : 'bg-gold-400/20 border-gold-400/40 text-gold-300 hover:bg-gold-400/30'
                }`}
              >
                {isAutoScrolling ? <Pause size={12} /> : <Play size={12} />}
                <span>{isAutoScrolling ? 'إيقاف التلقين' : 'بدء التلقين'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (prompterContainerRef.current) prompterContainerRef.current.scrollTop = 0;
                }}
                className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-white/60 hover:text-white text-xs cursor-pointer"
                title="الرجوع للبداية"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Sub-selector Header (Surah & Ayah Pickers or Hadith/Dua Selector) */}
          <div className="p-2.5 bg-surface-950/40 border-b border-white/[0.04] flex items-center gap-3 flex-wrap">
            {prompterMode === 'quran' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/50 font-bold">السورة:</label>
                  <select
                    value={selectedSurahNumber}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setSelectedSurahNumber(num);
                      setFromAyah(1);
                      const target = surahs.find((s) => s.number === num);
                      setToAyah(Math.min(7, target?.ayahCount || 7));
                    }}
                    className="p-1.5 rounded-xl bg-surface-900 border border-white/10 text-xs font-bold text-white cursor-pointer"
                  >
                    {surahs.map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.number}. {s.name} ({s.ayahCount} آية)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/50 font-bold">من الآية:</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedSurah?.ayahCount || 7}
                    value={fromAyah}
                    onChange={(e) => setFromAyah(Math.max(1, Number(e.target.value)))}
                    className="w-14 p-1 rounded-xl bg-surface-900 border border-white/10 text-xs font-bold text-center text-white"
                  />
                  <label className="text-xs text-white/50 font-bold">إلى:</label>
                  <input
                    type="number"
                    min={fromAyah}
                    max={selectedSurah?.ayahCount || 7}
                    value={toAyah}
                    onChange={(e) =>
                      setToAyah(Math.min(selectedSurah?.ayahCount || 7, Number(e.target.value)))
                    }
                    className="w-14 p-1 rounded-xl bg-surface-900 border border-white/10 text-xs font-bold text-center text-white"
                  />
                </div>
              </>
            )}

            {prompterMode === 'hadith' && (
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-white/50 font-bold">اختر الحديث النبوي:</label>
                <select
                  value={selectedZikrId}
                  onChange={(e) => setSelectedZikrId(e.target.value)}
                  className="flex-1 p-1.5 rounded-xl bg-surface-900 border border-white/10 text-xs font-bold text-white cursor-pointer"
                >
                  {initialAzkarList
                    .filter((z) => z.category === 'hadith')
                    .map((z: AzkarItem) => (
                      <option key={z.id} value={z.id}>
                        {z.title} • {z.reference}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {prompterMode === 'dua' && (
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-white/50 font-bold">اختر الدعاء أو الذكر:</label>
                <select
                  value={selectedZikrId}
                  onChange={(e) => setSelectedZikrId(e.target.value)}
                  className="flex-1 p-1.5 rounded-xl bg-surface-900 border border-white/10 text-xs font-bold text-white cursor-pointer"
                >
                  {initialAzkarList
                    .filter((z) => z.category !== 'hadith')
                    .map((z: AzkarItem) => (
                      <option key={z.id} value={z.id}>
                        {z.title} • {z.categoryNameAr}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {prompterMode === 'custom' && (
              <div className="text-xs text-white/60">
                <span>
                  ✍️ اكتب أو الصق موعظتك أو خاطرتك، أو سجل مباشرة بصوتك بدون كتابة إجبارية.
                </span>
              </div>
            )}
          </div>

          {/* The Teleprompter Canvas Viewport */}
          <div
            ref={prompterContainerRef}
            className={`flex-1 overflow-y-auto p-8 sm:p-12 text-center transition-all duration-300 relative ${themeStyles[prompterTheme]}`}
            style={{
              fontFamily,
              transform: isMirrored ? 'scaleX(-1)' : 'none',
            }}
          >
            {/* Elegant Islamic Header in Prompter */}
            {prompterMode === 'quran' && selectedSurahNumber !== 9 && fromAyah === 1 && (
              <div className="mb-8 text-gold-400/90 font-serif text-xl sm:text-2xl select-none">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            )}

            {/* Quran Verses Content */}
            {prompterMode === 'quran' && (
              <>
                {isLoadingAyahs ? (
                  <div className="h-full flex items-center justify-center text-gold-400 text-sm animate-pulse">
                    جاري تحميل الآيات بالتشكيل العثماني...
                  </div>
                ) : (
                  <div
                    className="leading-[2.4] font-medium tracking-wide max-w-3xl mx-auto select-none"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {ayahs.map((ayah) => (
                      <span
                        key={ayah.numberInSurah}
                        className="inline transition-colors hover:text-gold-300"
                      >
                        {ayah.text}{' '}
                        <span className="inline-flex items-center justify-center mx-1 text-gold-400 font-serif text-lg sm:text-xl">
                          ۝{ayah.numberInSurah}
                        </span>{' '}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Hadith Content */}
            {prompterMode === 'hadith' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <h3 className="text-xl font-bold text-gold-400 mb-4">
                  {initialAzkarList.find(
                    (z: AzkarItem) => z.id === selectedZikrId && z.category === 'hadith'
                  )?.title || initialAzkarList.find((z) => z.category === 'hadith')?.title}
                </h3>
                <p
                  className="leading-[2.4] font-medium tracking-wide text-white select-none"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {initialAzkarList.find(
                    (z: AzkarItem) => z.id === selectedZikrId && z.category === 'hadith'
                  )?.arabicText ||
                    initialAzkarList.find((z) => z.category === 'hadith')?.arabicText}
                </p>
                <div className="pt-4 text-xs text-white/50 font-sans">
                  {initialAzkarList.find(
                    (z: AzkarItem) => z.id === selectedZikrId && z.category === 'hadith'
                  )?.reference || 'صحيح البخاري'}
                </div>
              </div>
            )}

            {/* Dua Content */}
            {prompterMode === 'dua' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <h3 className="text-xl font-bold text-gold-400 mb-4">
                  {initialAzkarList.find(
                    (z: AzkarItem) => z.id === selectedZikrId && z.category !== 'hadith'
                  )?.title || initialAzkarList[0]?.title}
                </h3>
                <p
                  className="leading-[2.4] font-medium tracking-wide text-white select-none"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {initialAzkarList.find(
                    (z: AzkarItem) => z.id === selectedZikrId && z.category !== 'hadith'
                  )?.arabicText || initialAzkarList[0]?.arabicText}
                </p>
                <div className="pt-4 text-xs text-white/50 font-sans">
                  {initialAzkarList.find(
                    (z: AzkarItem) => z.id === selectedZikrId && z.category !== 'hadith'
                  )?.reference || 'حصن المسلم'}
                </div>
              </div>
            )}

            {/* Custom Text Content */}
            {prompterMode === 'custom' && (
              <div className="max-w-3xl mx-auto">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={8}
                  placeholder="اكتب أو الصق موعظتك، كلمتك الطيبة، أو فكرتك هنا لتظهر أمامك أثناء التسجيل (أو اتركها فارغة للتسجيل الحر)..."
                  className="w-full p-4 rounded-2xl bg-surface-900/60 border border-white/10 text-white text-center leading-[2.2] focus:outline-none focus:border-gold-400 resize-none"
                  style={{ fontSize: `${fontSize}px`, fontFamily }}
                />
              </div>
            )}

            {/* 3-2-1 Countdown Overlay in Prompter */}
            <AnimatePresence>
              {isCountingDown && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                >
                  <motion.div
                    key={countdownValue}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1.1, opacity: 1 }}
                    exit={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-gold-400 via-amber-500 to-amber-600 text-surface-950 flex items-center justify-center font-black text-5xl sm:text-6xl shadow-2xl shadow-gold-500/50 mb-4 border-4 border-gold-300">
                      {countdownValue > 0 ? countdownValue : '🎙️'}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      {countdownValue === 3 && 'خُذ نفساً عميقاً واستعد.. 🌿'}
                      {countdownValue === 2 && 'تهيأ للتلاوة والخشوع.. ✨'}
                      {countdownValue === 1 && 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ 📖'}
                      {countdownValue === 0 && 'ابدأ التلاوة الآن! 🚀'}
                    </h3>
                    <p className="text-xs text-gold-300/80">
                      العد التنازلي التمهيدي للاستعداد التام
                    </p>
                  </motion.div>

                  <button
                    type="button"
                    onClick={() => {
                      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                      setIsCountingDown(false);
                    }}
                    className="mt-6 px-4 py-1.5 rounded-full bg-surface-800 hover:bg-surface-700 text-white/70 hover:text-white text-xs border border-white/10 transition-all cursor-pointer"
                  >
                    إلغاء ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Padding bottom for comfortable scrolling */}
            <div className="h-48" />
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: استوديو التسجيل وهندسة الصوت (Audio Control Deck) */}
        {/* ======================================================== */}
        <div className="w-full lg:w-[420px] h-full max-h-full flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar pb-16 pr-1">
          {/* 1. Live Recording & VU Deck */}
          <div className="p-5 rounded-3xl bg-surface-900/95 border border-gold-500/30 shadow-2xl relative overflow-hidden text-center space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-white/70">
              <span className="flex items-center gap-1.5 text-gold-400">
                <Radio
                  size={14}
                  className={
                    isRecording
                      ? 'animate-pulse text-red-500'
                      : isCountingDown
                        ? 'animate-bounce text-amber-400'
                        : ''
                  }
                />
                <span>
                  {isRecording
                    ? 'جاري التسجيل الحي الآن 🔴'
                    : isCountingDown
                      ? 'الاستعداد التمهيدي ⏳'
                      : 'منصة التسجيل المباشر 🎙️'}
                </span>
              </span>
              <span className="font-mono text-white text-sm">
                {formatSeconds(recordingSeconds)}
              </span>
            </div>

            {/* Big Record / Countdown Button */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center my-1">
              {(isRecording || isCountingDown) && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.65, 0.25] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                  className={`absolute inset-0 rounded-full border-2 ${
                    isRecording
                      ? 'bg-red-500/20 border-red-500/60'
                      : 'bg-gold-500/20 border-gold-400/60'
                  }`}
                />
              )}

              <button
                type="button"
                onClick={handleInitiateRecord}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl cursor-pointer ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/50 animate-pulse'
                    : isCountingDown
                      ? 'bg-amber-400 text-surface-950 font-black text-3xl shadow-amber-500/50 scale-105'
                      : 'bg-gradient-to-br from-gold-400 via-amber-500 to-amber-600 hover:from-gold-300 hover:to-amber-400 text-surface-950 shadow-gold-500/40 hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <Square size={28} />
                ) : isCountingDown ? (
                  <span>{countdownValue > 0 ? countdownValue : '🎙️'}</span>
                ) : (
                  <Mic size={32} />
                )}
              </button>
            </div>

            {/* VU Meter & Instruction */}
            {isRecording ? (
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-surface-950 overflow-hidden border border-white/[0.04]">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-gold-400 to-red-500 transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
                <span className="text-[11px] text-white/40 font-mono">
                  مستوى الصوت: {audioLevel}%
                </span>
              </div>
            ) : isCountingDown ? (
              <div className="text-xs font-bold text-gold-300 animate-pulse">
                {countdownValue === 3 && '3.. خُذ نفساً عميقاً 🌿'}
                {countdownValue === 2 && '2.. استعد للتلاوة ✨'}
                {countdownValue === 1 && '1.. بِسْمِ اللَّه 📖'}
                {countdownValue === 0 && 'انطلق الآن 🎙️'}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 pt-1">
                <span className="text-xs text-white/50">أو</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-gold-400 hover:text-gold-300 underline font-bold cursor-pointer"
                >
                  رفع ملف MP3 من جهازك 📁
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* 2. Processed Preview Bar (Active when audio is ready) */}
          {audioBlobUrl && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-gold-500/10 via-surface-900 to-amber-500/10 border border-gold-400/40 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTogglePreview}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-surface-950 flex items-center justify-center font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {isPlayingPreview ? <Pause size={18} /> : <Play size={18} className="mr-0.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {isPlayingPreview
                      ? 'معاينة حية مع الصدى والطبيعة 🎧'
                      : 'استمع لتسجيلك مع التأثيرات'}
                  </div>
                  <div className="text-xs text-gold-400 font-mono">
                    المدة: {formatSeconds(audioDuration)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConvertToReel}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-surface-950 font-black text-xs flex items-center gap-1 shadow-md shadow-gold-500/20 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Zap size={13} />
                  <span>تحويل لريلز 🎬</span>
                </button>
              </div>

              {/* Custom Reciter Name Input */}
              <div className="pt-2 border-t border-white/[0.08] space-y-1">
                <label className="text-[11px] font-bold text-gold-300 flex items-center justify-between">
                  <span>اسمك / اسم القارئ (يظهر في الفيديو والغلاف):</span>
                  <span className="text-[9px] text-white/40">تعديل</span>
                </label>
                <input
                  type="text"
                  value={customReciterName}
                  onChange={(e) => setCustomReciterName(e.target.value)}
                  placeholder="مثال: القارئ محمد طه / تلاوتي الخاصة"
                  className="glass-input w-full p-2 rounded-xl text-xs bg-surface-950 border border-gold-400/30 text-white placeholder-white/30 focus:border-gold-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 3. Mosque Spatial Reverb (صدى المسجد الحرام) */}
          <div className="p-4 rounded-3xl bg-surface-900/80 border border-purple-500/20 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-400" />
                <span>صدى المسجد الحرام (Mosque Spatial Reverb) 🕌</span>
              </label>
              <span className="text-[11px] font-bold text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/15">
                3D Sound
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { id: 'none', name: 'بدون صدى', icon: '🎙️' },
                { id: 'smallRoom', name: 'غرفة هادئة', icon: '🏠' },
                { id: 'grandMosque', name: 'المسجد الكبير', icon: '🕌' },
                { id: 'makkahHaram', name: 'الحرم المكي', icon: '🕋' },
                { id: 'celestialEcho', name: 'صدى إيماني', icon: '✨' },
              ].map((rev) => {
                const isSelected = reverbPreset === rev.id;
                return (
                  <button
                    key={rev.id}
                    type="button"
                    onClick={() => {
                      setReverbPreset(rev.id as any);
                      if (isPlayingPreview) {
                        voiceStudioEngine.playPreview({
                          reverbPreset: rev.id as any,
                          reverbLevel,
                          enableNoiseGate,
                          enableClarity,
                          enableWarmth,
                          recitationVolume,
                        });
                      }
                    }}
                    className={`p-2 rounded-xl text-right transition-all cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-400 text-white font-bold shadow-sm'
                        : 'bg-surface-950/60 border-white/[0.04] text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">{rev.icon}</span>
                    <span className="text-xs truncate">{rev.name}</span>
                  </button>
                );
              })}
            </div>

            {reverbPreset !== 'none' && (
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-1">
                  <span>قوة الصدى والارتداد</span>
                  <span className="font-mono text-purple-400">{reverbLevel}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={reverbLevel}
                  onChange={(e) => setReverbLevel(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 4. Studio DSP Audio Mastering */}
          <div className="p-4 rounded-3xl bg-surface-900/80 border border-emerald-500/20 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-400" />
                <span>فلاتر الاستوديو ونقاء الصوت (Mastering) 🎛️</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-bold">Studio DSP</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setEnableNoiseGate(!enableNoiseGate)}
                className={`p-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                  enableNoiseGate
                    ? 'bg-emerald-500/20 border-emerald-400 text-white'
                    : 'bg-surface-950/60 border-white/[0.04] text-white/40'
                }`}
              >
                <div>⚡ عزل الضوضاء</div>
                <div className="text-[10px] text-white/40">
                  {enableNoiseGate ? 'مفعل ✓' : 'معطل'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEnableClarity(!enableClarity)}
                className={`p-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                  enableClarity
                    ? 'bg-emerald-500/20 border-emerald-400 text-white'
                    : 'bg-surface-950/60 border-white/[0.04] text-white/40'
                }`}
              >
                <div>💎 نقاء التجويد</div>
                <div className="text-[10px] text-white/40">{enableClarity ? 'مفعل ✓' : 'معطل'}</div>
              </button>

              <button
                type="button"
                onClick={() => setEnableWarmth(!enableWarmth)}
                className={`p-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                  enableWarmth
                    ? 'bg-emerald-500/20 border-emerald-400 text-white'
                    : 'bg-surface-950/60 border-white/[0.04] text-white/40'
                }`}
              >
                <div>🎙️ دفء الصوت</div>
                <div className="text-[10px] text-white/40">{enableWarmth ? 'مفعل ✓' : 'معطل'}</div>
              </button>
            </div>
          </div>

          {/* 5. Auto-Pitch Polish & Harmonic Sweetener */}
          <div className="p-4 rounded-3xl bg-surface-900/80 border border-amber-500/25 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400" />
                <span>تنعيم النبرة والهارمونيك (Auto-Pitch Polish) 💎</span>
              </label>
              <button
                type="button"
                onClick={() => setEnablePitchPolish(!enablePitchPolish)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                  enablePitchPolish
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                    : 'bg-surface-950/60 border-white/10 text-white/40'
                }`}
              >
                {enablePitchPolish ? 'مفعل ✓' : 'معطل'}
              </button>
            </div>

            {enablePitchPolish && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-white/60">
                  <span>درجة التنعيم واللمعان الصوتي</span>
                  <span className="font-mono text-amber-400">{pitchPolishLevel}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={95}
                  value={pitchPolishLevel}
                  onChange={(e) => setPitchPolishLevel(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <p className="text-[10px] text-white/40">
                  يضيف نعومة مخملية للنبرة مع إبراز النقاء والتناغم الصوتي
                </p>
              </div>
            )}
          </div>

          {/* 6. 🎧 8D Binaural Spatial Audio Deck */}
          <div className="p-4 rounded-3xl bg-surface-900/80 border border-gold-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Headphones size={14} className="text-gold-400" />
                <span>صوت الحرم المكاني (8D Spatial) 🎧</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !enable8DAudio;
                  setEnable8DAudio(nextVal);
                  if (isPlayingPreview) {
                    voiceStudioEngine.stopPreview();
                    setIsPlayingPreview(false);
                  }
                }}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                  enable8DAudio
                    ? 'bg-gold-500/20 border-gold-400 text-gold-300 shadow-sm'
                    : 'bg-surface-950/60 border-white/10 text-white/40'
                }`}
              >
                {enable8DAudio ? 'مفعل ✓' : 'معطل'}
              </button>
            </div>

            {/* Interactive 3D Spatial Radar Visualizer */}
            <Spatial8DRadar
              isEnabled={enable8DAudio}
              style={eightDStyle}
              speed={eightDSpeed}
              depth={eightDDepth}
            />

            {enable8DAudio && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-white/60 text-xs font-bold mb-1.5">
                    مسار الطواف 360°
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'orbit360', name: '🕋 طواف الكعبة 360°' },
                      { id: 'makkahDome', name: '🕌 قبة الحرم' },
                      { id: 'pendulum', name: '🕊️ بندول السكينة' },
                      { id: 'floatingClouds', name: '☁️ سحب النور' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setEightDStyle(st.id as any)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-right cursor-pointer ${
                          eightDStyle === st.id
                            ? 'bg-gold-500/20 border-gold-400 text-white shadow-sm'
                            : 'bg-surface-950/60 border-white/[0.04] text-white/60 hover:text-white'
                        }`}
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-1">
                    <span>سرعة الدوران المداري</span>
                    <span className="font-mono text-gold-400">
                      {Math.round(eightDSpeed * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={30}
                    value={Math.round(eightDSpeed * 100)}
                    onChange={(e) => setEightDSpeed(Number(e.target.value) / 100)}
                    className="w-full accent-gold-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                  <span className="text-xs text-white/70 font-medium">
                    إظهار شارة السماعات 🎧 على الفيديو
                  </span>
                  <input
                    type="checkbox"
                    checked={show8DBadge}
                    onChange={(e) => setShow8DBadge(e.target.checked)}
                    className="toggle accent-gold-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 7. Ambient Sounds Layering */}
          <div className="p-4 rounded-3xl bg-surface-900/80 border border-sky-500/20 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Volume2 size={14} className="text-sky-400" />
                <span>مزج صوت الطبيعة في الخلفية (Ambient) 🌿</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {ambientSounds.slice(0, 4).map((snd) => {
                const isSelected = ambientSoundId === snd.id;
                return (
                  <button
                    key={snd.id}
                    type="button"
                    onClick={() => {
                      setAmbientSoundId(snd.id);
                      if (isPlayingPreview && snd.id !== 'none') {
                        proceduralAmbientEngine.play(snd.id, ambientVolume);
                      } else if (snd.id === 'none') {
                        proceduralAmbientEngine.stop();
                      }
                    }}
                    className={`p-2 rounded-xl text-right text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 text-white'
                        : 'bg-surface-950/60 border-white/[0.04] text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="mr-1">{snd.icon}</span>
                    <span>{snd.name}</span>
                  </button>
                );
              })}
            </div>

            {ambientSoundId !== 'none' && (
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-1">
                  <span>مستوى صوت الطبيعة</span>
                  <span className="font-mono text-sky-400">{ambientVolume}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
