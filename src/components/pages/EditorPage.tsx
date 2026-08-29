import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { TextSettings, QuranWord, AyahChunk, StudioTemplate, AudioSettings } from '../../types';
import { PreviewFrame } from '../ui/PreviewFrame';
import { ExportModal } from '../ui/ExportModal';
import { AutoReelModal } from '../ui/AutoReelModal';
import { ViralCaptionModal } from '../ui/ViralCaptionModal';
import { ReciterBrowserModal } from '../ui/ReciterBrowserModal';
import { PresetTemplatesModal } from '../ui/PresetTemplatesModal';
import { ThumbnailModal } from '../ui/ThumbnailModal';
import { QuranPlaylistModal } from '../ui/QuranPlaylistModal';
import { QuranPlaylistItem } from '../../data/quranPlaylists';
import { IslamicEventsModal } from '../ui/IslamicEventsModal';
import { ClipLibraryModal } from '../ui/ClipLibraryModal';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal';
import { IslamicEventItem } from '../../data/islamicEventsData';
import { VoiceRecorderModal } from '../ui/VoiceRecorderModal';
import { InteractiveTourGuide } from '../ui/InteractiveTourGuide';
import { reciters, surahs } from '../../data/mockData';
import {
  fetchAyahsWithAudio,
  fetchTranslation,
  AyahData,
  TranslationData,
} from '../../services/quranApi';
import { proceduralAmbientEngine } from '../../data/ambientSounds';
import { unifiedAudioEngine } from '../../services/unifiedAudioEngine';
import { resolveValidAudioUrl } from '../../services/persistentAudioStorage';
import { generateProjectThumbnailDataUrl } from '../../services/thumbnailGeneratorService';
import { synthesizeArabicSpeech } from '../../services/arabicTtsService';

// Modular Editor Components
import { EditorHeader } from '../editor/EditorHeader';
import { EditorDockNav, DockTabType } from '../editor/EditorDockNav';
import { EditorPreviewArea } from '../editor/EditorPreviewArea';
import { DraggableWaveformTimingEditor } from '../editor/DraggableWaveformTimingEditor';
import { useEditorHistory, EditorSnapshot } from '../editor/hooks/useEditorHistory';

// Modular Panels
import { ReciterPanel } from '../editor/panels/ReciterPanel';
import { BackgroundPanel } from '../editor/panels/BackgroundPanel';
import { TextStylePanel } from '../editor/panels/TextStylePanel';
import { OrnamentsPanel } from '../editor/panels/OrnamentsPanel';
import { AmbientAudioPanel } from '../editor/panels/AmbientAudioPanel';
import { TemplatesPanel } from '../editor/panels/TemplatesPanel';
import { BrandingPanel } from '../editor/panels/BrandingPanel';

import {
  Mic,
  Image as ImageIcon,
  Type,
  Layers,
  Headphones,
  Palette,
  Sliders,
  X,
  RotateCcw,
} from 'lucide-react';

export const EditorPage: React.FC = () => {
  const currentProject = useAppStore((s) => s.currentProject);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const updateProject = useAppStore((s) => s.updateProject);
  const addToast = useAppStore((s) => s.addToast);
  const settings = useAppStore((s) => s.settings);
  const activeModal = useAppStore((s) => s.activeModal);

  // Active Tool Dock Tab & Inspector visibility
  const [activeDockTab, setActiveDockTab] = useState<DockTabType>('reciter');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isProMode, setIsProMode] = useState(false);

  // Local editor state
  const [textSettings, setTextSettings] = useState<TextSettings>(
    (currentProject?.textSettings as TextSettings) || {
      fontSize: 28,
      fontWeight: 'bold' as const,
      textAlign: 'center' as const,
      textColor: '#ffffff',
      bgColor: '#000000',
      bgOpacity: 0.5,
      position: 'center' as const,
      translationFontSize: 16,
      translationColor: '#e2e8f0',
      fontFamily: 'Amiri',
      wordHighlightEnabled: true,
      wordHighlightStyle: 'goldGlow' as const,
      wordHighlightColor: '#fbbf24',
      inactiveWordOpacity: 0.6,
      highlightScale: true,
      showProgressBar: true,
      progressBarStyle: 'neonGlow',
      progressBarColor: '#fbbf24',
      progressBarHeight: 4,
      showIslamicOrnaments: true,
      ornamentStyle: 'royalFrame',
      ornamentColor: '#fbbf24',
      ornamentOpacity: 0.85,
    }
  );

  const [transition, setTransition] = useState<string>(
    currentProject?.transition || 'fadeScale'
  );
  const [videoEffect, setVideoEffect] = useState<string>(
    currentProject?.videoEffect || 'none'
  );
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAutoReelModal, setShowAutoReelModal] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  const [audioSettings, setAudioSettings] = useState<AudioSettings>(
    currentProject?.audioSettings || {
      recitationVolume: 85,
      fadeIn: true,
      fadeOut: true,
      fadeDuration: 2,
      backgroundVolume: 20,
      ambientSoundId: 'none',
      ambientSoundVolume: 0,
    }
  );

  const [showTranslation, setShowTranslation] = useState(
    currentProject?.translationEnabled || false
  );
  const [showTafsir, setShowTafsir] = useState(currentProject?.tafsirEnabled || false);
  const [backgroundFile, setBackgroundFile] = useState<string | undefined>(
    currentProject?.backgroundUrl
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState(
    currentProject?.backgroundOpacity ?? 0.6
  );
  const [watermark, setWatermark] = useState<string>(
    currentProject?.watermark ?? 'atar-studio.com'
  );
  const [reciterId, setReciterId] = useState(currentProject?.reciterId || 'alafasy_128');
  const [surahNumber, setSurahNumber] = useState(currentProject?.surahNumber || 1);
  const [fromAyah, setFromAyah] = useState(currentProject?.fromAyah || 1);
  const [toAyah, setToAyah] = useState(currentProject?.toAyah || 7);
  const [filterEditorAvailableOnly, setFilterEditorAvailableOnly] = useState(true);

  // Modals state
  const [isReciterModalOpen, setIsReciterModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isViralCaptionOpen, setIsViralCaptionOpen] = useState(false);
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isIslamicEventsModalOpen, setIsIslamicEventsModalOpen] = useState(false);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [isClipLibraryOpen, setIsClipLibraryOpen] = useState(false);
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState(false);
  const [isWaveformTimingModalOpen, setIsWaveformTimingModalOpen] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | undefined>(
    currentProject?.activeTemplateId
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>(
    (currentProject?.aspectRatio as '9:16' | '1:1' | '16:9') || '9:16'
  );

  // Real data state
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [translations, setTranslations] = useState<TranslationData[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lastLoadedKeyRef = useRef<string>('');
  const isSavingRef = useRef(false);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isTestingAmbient, setIsTestingAmbient] = useState(false);
  const playingRef = useRef(false);

  // Undo/Redo Engine
  const handleApplySnapshot = useCallback((snapshot: EditorSnapshot) => {
    setTextSettings(snapshot.textSettings);
    setAudioSettings(snapshot.audioSettings);
    setBackgroundFile(snapshot.backgroundFile);
    setBackgroundOpacity(snapshot.backgroundOpacity);
    setWatermark(snapshot.watermark);
    setReciterId(snapshot.reciterId);
    setSurahNumber(snapshot.surahNumber);
    setFromAyah(snapshot.fromAyah);
    setToAyah(snapshot.toAyah);
    setTransition(snapshot.transition);
    setVideoEffect(snapshot.videoEffect);
    setShowTranslation(snapshot.showTranslation);
    setShowTafsir(snapshot.showTafsir);
    setAspectRatio(snapshot.aspectRatio);
    if (snapshot.activeTemplateId !== undefined) {
      setActiveTemplateId(snapshot.activeTemplateId);
    }
  }, []);

  const isAnyModalOpen = Boolean(
    activeModal ||
      isReciterModalOpen ||
      isPresetModalOpen ||
      isViralCaptionOpen ||
      isThumbnailModalOpen ||
      isPlaylistModalOpen ||
      isIslamicEventsModalOpen ||
      isVoiceRecorderOpen ||
      isClipLibraryOpen ||
      isKeyboardModalOpen ||
      isWaveformTimingModalOpen
  );

  const { pushState, undo, redo, canUndo, canRedo } = useEditorHistory({
    onApplySnapshot: handleApplySnapshot,
    enabled: !isAnyModalOpen,
  });

  // Push state snapshot on changes
  useEffect(() => {
    pushState({
      textSettings,
      audioSettings,
      backgroundFile,
      backgroundOpacity,
      watermark,
      reciterId,
      surahNumber,
      fromAyah,
      toAyah,
      transition,
      videoEffect,
      showTranslation,
      showTafsir,
      aspectRatio,
      activeTemplateId,
    });
  }, [
    textSettings,
    audioSettings,
    backgroundFile,
    backgroundOpacity,
    watermark,
    reciterId,
    surahNumber,
    fromAyah,
    toAyah,
    transition,
    videoEffect,
    showTranslation,
    showTafsir,
    aspectRatio,
    activeTemplateId,
    pushState,
  ]);

  const selectedSurah = surahs.find((s) => s.number === surahNumber);

  // Sync state when project changes
  useEffect(() => {
    if (currentProject) {
      if (currentProject.surahNumber) setSurahNumber(currentProject.surahNumber);
      if (currentProject.fromAyah !== undefined) setFromAyah(currentProject.fromAyah);
      if (currentProject.toAyah !== undefined) setToAyah(currentProject.toAyah);
      if (currentProject.reciterId) setReciterId(currentProject.reciterId);
      if (currentProject.aspectRatio) setAspectRatio(currentProject.aspectRatio as '9:16' | '1:1' | '16:9');
      if (currentProject.backgroundUrl !== undefined)
        setBackgroundFile(currentProject.backgroundUrl);
      if (currentProject.backgroundOpacity !== undefined)
        setBackgroundOpacity(currentProject.backgroundOpacity);
      if (currentProject.textSettings) setTextSettings(currentProject.textSettings);
      if (currentProject.audioSettings) setAudioSettings(currentProject.audioSettings);
      if (currentProject.watermark !== undefined) setWatermark(currentProject.watermark);
      if (currentProject.translationEnabled !== undefined)
        setShowTranslation(currentProject.translationEnabled);
      if (currentProject.tafsirEnabled !== undefined) setShowTafsir(currentProject.tafsirEnabled);
      if (currentProject.transition) setTransition(currentProject.transition);
      if (currentProject.videoEffect) setVideoEffect(currentProject.videoEffect);
      if (currentProject.activeTemplateId !== undefined) setActiveTemplateId(currentProject.activeTemplateId);
      setCurrentAyahIndex(0);
      setAudioCurrentTime(0);
    }
  }, [currentProject?.id]);

  // Restore persistent audio on mount / project change if page was refreshed
  useEffect(() => {
    const rawVoice =
      audioSettings.customRecordedAudioUrl ||
      currentProject?.audioSettings?.customRecordedAudioUrl ||
      currentProject?.customAudioUrl;
    const customKey =
      audioSettings.customAudioKey ||
      currentProject?.audioSettings?.customAudioKey ||
      currentProject?.customAudioKey ||
      currentProject?.id;

    if (rawVoice || customKey) {
      resolveValidAudioUrl(rawVoice, currentProject?.id, customKey).then((validUrl) => {
        if (validUrl && validUrl !== audioSettings.customRecordedAudioUrl) {
          setAudioSettings((prev) => ({
            ...prev,
            customRecordedAudioUrl: validUrl,
          }));
          if (currentProject && updateProject) {
            updateProject(currentProject.id, {
              customAudioUrl: validUrl,
              audioSettings: {
                ...currentProject.audioSettings,
                customRecordedAudioUrl: validUrl,
              },
            });
          }
          setAyahs((prev) =>
            prev.map((a) =>
              a.audioUrl === rawVoice || !a.audioUrl ? { ...a, audioUrl: validUrl } : a
            )
          );
        }
      });
    }
  }, [currentProject?.id]);

  // Waveform Timing Editor Word Save Handler
  const handleSaveWords = useCallback(
    (ayahIdx: number, updatedWords: QuranWord[], updatedChunks: AyahChunk[], updatedText?: string) => {
      setAyahs((prevAyahs) => {
        const next = [...prevAyahs];
        if (next[ayahIdx]) {
          next[ayahIdx] = {
            ...next[ayahIdx],
            words: updatedWords,
            chunks: updatedChunks,
            text: updatedText || next[ayahIdx].text,
          };
        }
        return next;
      });
      addToast({ message: `تم تحديث وضبط كلمات وتوقيت الآية بنجاح ✨`, type: 'success' });
    },
    [addToast]
  );

  // Pro Template Applicator
  const applyTemplate = useCallback(
    (tpl: StudioTemplate) => {
      if (tpl.backgroundUrl) {
        setBackgroundFile(tpl.backgroundUrl);
      }
      if (tpl.backgroundOpacity !== undefined) {
        setBackgroundOpacity(tpl.backgroundOpacity);
      }
      if (tpl.videoEffect) {
        setVideoEffect(tpl.videoEffect);
      }
      if (tpl.transition) {
        setTransition(tpl.transition);
      }

      setTextSettings((prev) => {
        const nextSettings: TextSettings = {
          ...prev,
          ...tpl.textSettings,
          // Reset scene backgrounds so template background applies to ALL scenes cleanly
          sceneBackgrounds: tpl.textSettings?.sceneBackgrounds || {},
          enableMultiScene: tpl.textSettings?.enableMultiScene ?? false,
        };
        return nextSettings;
      });

      if (tpl.audioSettings) {
        setAudioSettings((prev) => ({ ...prev, ...tpl.audioSettings }));
      }

      if (currentProject) {
        updateProject(currentProject.id, {
          backgroundUrl: tpl.backgroundUrl || currentProject.backgroundUrl,
          backgroundOpacity: tpl.backgroundOpacity ?? currentProject.backgroundOpacity,
          transition: tpl.transition || currentProject.transition || 'fadeScale',
          videoEffect: tpl.videoEffect || currentProject.videoEffect || 'none',
          activeTemplateId: tpl.id,
          textSettings: {
            ...currentProject.textSettings,
            ...tpl.textSettings,
            sceneBackgrounds: tpl.textSettings?.sceneBackgrounds || {},
            enableMultiScene: tpl.textSettings?.enableMultiScene ?? false,
          },
        });
      }

      setActiveTemplateId(tpl.id);
      addToast({
        message: `تم تطبيق قالب "${tpl.name}" وتحديث جميع المشاهد بنجاح ✨`,
        type: 'success',
      });
    },
    [addToast, currentProject, updateProject]
  );

  // Ambient sound playback with strict cleanup
  useEffect(() => {
    if (isPlaying && audioSettings.ambientSoundId && audioSettings.ambientSoundId !== 'none') {
      const vol = audioSettings.ambientSoundVolume ?? 28;
      proceduralAmbientEngine.play(audioSettings.ambientSoundId, vol);
    } else if (!isTestingAmbient) {
      proceduralAmbientEngine.stop();
    }
    return () => {
      if (!isTestingAmbient) {
        proceduralAmbientEngine.stop();
      }
    };
  }, [isPlaying, audioSettings.ambientSoundId, audioSettings.ambientSoundVolume, isTestingAmbient]);

  // Fetch Ayahs & Audio with offline cache resilience and key-based de-duplication
  const loadAyahs = useCallback(async () => {
    // Support Hadiths, Azkar, and Non-Quran Custom Text Reels
    const isNonQuran =
      (currentProject?.contentType && currentProject.contentType !== 'quran') ||
      (!currentProject?.surahNumber &&
        (currentProject?.contentType === 'hadith' ||
          currentProject?.contentType === 'azkar' ||
          currentProject?.contentType === 'custom'));

    const effectiveSurahNumber = surahNumber || currentProject?.surahNumber || 1;
    const effectiveFromAyah = fromAyah || currentProject?.fromAyah || 1;
    const effectiveToAyah = toAyah || currentProject?.toAyah || 7;
    const effectiveReciter =
      reciterId === 'custom_voice' ||
      audioSettings.customRecordedAudioUrl ||
      currentProject?.customAudioUrl
        ? 'alafasy_128'
        : reciterId || 'alafasy_128';
    const effectiveLang = textSettings.translationLanguage || 'en';
    const rawVoice =
      audioSettings.customRecordedAudioUrl ||
      currentProject?.audioSettings?.customRecordedAudioUrl ||
      currentProject?.customAudioUrl ||
      '';
    const recordedDuration =
      audioSettings.customAudioDuration || currentProject?.audioSettings?.customAudioDuration || 0;

    const requestKey = isNonQuran
      ? `nonquran-${currentProject?.id || ''}-${currentProject?.customText || ''}-${rawVoice}-${recordedDuration}`
      : `quran-${effectiveSurahNumber}-${effectiveFromAyah}-${effectiveToAyah}-${effectiveReciter}-${showTranslation}-${effectiveLang}-${rawVoice}-${recordedDuration}`;

    if (lastLoadedKeyRef.current === requestKey && ayahs.length > 0) {
      return;
    }

    setIsLoadingAyahs(true);
    setLoadError(null);

    if (isNonQuran) {
      const text = currentProject?.customText || currentProject?.name || '';
      let audioUrl = currentProject?.customAudioUrl || '';
      const rawWords = text.split(/\s+/).filter(Boolean);
      const totalWords = Math.max(rawWords.length, 1);
      let estimatedTotalSec =
        recordedDuration && recordedDuration > 0 ? recordedDuration : Math.max(8, totalWords * 0.85);

      if (!audioUrl && text) {
        try {
          const ttsRes = await synthesizeArabicSpeech(text, 'ar-SA-HamedNeural');
          audioUrl = ttsRes.audioUrl;
          if (ttsRes.duration > 0 && (!recordedDuration || recordedDuration <= 0)) {
            estimatedTotalSec = ttsRes.duration;
          }
        } catch (ttsErr) {
          console.warn('[EditorPage] synthesizeArabicSpeech error:', ttsErr);
        }
      }

      const secPerWord = Math.max(0.1, estimatedTotalSec / totalWords);

      const words: QuranWord[] = rawWords.map((w, idx) => ({
        id: idx + 1,
        position: idx + 1,
        text: w,
        startTime: idx * secPerWord,
        endTime: (idx + 1) * secPerWord,
        charTypeName: 'word',
      }));

      const item: AyahData = {
        number: 1,
        numberInSurah: 1,
        surahNumber: 0,
        surahName: currentProject?.customTitle || currentProject?.name || 'مقطع مخصص',
        text: text,
        audioUrl: audioUrl,
        duration: estimatedTotalSec,
        juz: 1,
        page: 1,
        words,
      };

      lastLoadedKeyRef.current = requestKey;
      setAyahs([item]);
      setTranslations([]);
      setIsLoadingAyahs(false);
      return;
    }

    // Authentic Quran Mode:
    try {
      const [ayahData, translationData] = await Promise.all([
        fetchAyahsWithAudio(
          effectiveSurahNumber,
          effectiveFromAyah,
          effectiveToAyah,
          effectiveReciter
        ),
        showTranslation
          ? fetchTranslation(
              effectiveSurahNumber,
              effectiveFromAyah,
              effectiveToAyah,
              effectiveLang
            )
          : Promise.resolve([]),
      ]);

      const customKey =
        audioSettings.customAudioKey ||
        currentProject?.audioSettings?.customAudioKey ||
        currentProject?.customAudioKey ||
        currentProject?.id;
      const customVoice = rawVoice ? await resolveValidAudioUrl(rawVoice, currentProject?.id, customKey) : '';

      if (customVoice && ayahData.length > 0) {
        if (ayahData.length === 1) {
          const a = ayahData[0];
          a.audioUrl = customVoice;
          a.fallbackUrls = [];
          if (recordedDuration && recordedDuration > 0) {
            a.duration = recordedDuration;
            a.startTimeMs = 0;
            a.endTimeMs = Math.round(recordedDuration * 1000);
            a.isFullSurahFile = false;
            if (a.words && a.words.length > 0) {
              const origLastWordEnd = a.words[a.words.length - 1]?.endTime || a.duration || 1;
              const scale = recordedDuration / origLastWordEnd;
              a.words.forEach((w) => {
                w.startTime = Math.round(w.startTime * scale * 1000) / 1000;
                w.endTime = Math.round(w.endTime * scale * 1000) / 1000;
              });
            }
          }
        } else {
          // Multiple Ayahs sharing a single continuous custom recording
          const totalTargetDuration =
            recordedDuration && recordedDuration > 0
              ? recordedDuration
              : ayahData.reduce((acc, cur) => acc + (cur.duration || 5), 0);

          const standardDurations = ayahData.map((a) => {
            if (a.duration && a.duration > 0) return a.duration;
            const wc =
              a.words && a.words.length > 0 ? a.words.length : (a.text || '').split(/\s+/).length;
            return Math.max(1, wc);
          });
          const standardTotal = standardDurations.reduce((acc, d) => acc + d, 0) || 1;

          let accumulatedSec = 0;

          ayahData.forEach((a, idx) => {
            const fraction = standardDurations[idx] / standardTotal;
            const ayahAllocatedDur = Math.round(totalTargetDuration * fraction * 1000) / 1000;
            const startSec = accumulatedSec;
            const endSec =
              idx === ayahData.length - 1
                ? totalTargetDuration
                : Math.round((startSec + ayahAllocatedDur) * 1000) / 1000;
            const actualDur = Math.max(0.5, Math.round((endSec - startSec) * 1000) / 1000);

            accumulatedSec = endSec;

            a.audioUrl = customVoice;
            a.fallbackUrls = [];
            a.duration = actualDur;
            a.startTimeMs = Math.round(startSec * 1000);
            a.endTimeMs = Math.round(endSec * 1000);
            a.isFullSurahFile = true; // Enables slice playback in continuous audio track

            // Scale words for this ayah to fit its allocated slice [0, actualDur]
            if (a.words && a.words.length > 0) {
              const origLastWordEnd =
                a.words[a.words.length - 1]?.endTime || standardDurations[idx] || 1;
              const scale = actualDur / origLastWordEnd;
              a.words.forEach((w) => {
                w.startTime = Math.round(w.startTime * scale * 1000) / 1000;
                w.endTime = Math.round(w.endTime * scale * 1000) / 1000;
              });
            }
          });
        }
      }

      lastLoadedKeyRef.current = requestKey;
      setAyahs(ayahData);
      setTranslations(translationData);
    } catch (err: unknown) {
      setLoadError('فشل في تحميل الآيات. جاري استخدام الكاش المحلي...');
      console.error(err);
    } finally {
      setIsLoadingAyahs(false);
    }
  }, [
    currentProject?.id,
    currentProject?.contentType,
    currentProject?.customText,
    currentProject?.customTitle,
    currentProject?.customAudioUrl,
    currentProject?.surahNumber,
    currentProject?.fromAyah,
    currentProject?.toAyah,
    surahNumber,
    fromAyah,
    toAyah,
    reciterId,
    showTranslation,
    textSettings.translationLanguage,
    audioSettings.customRecordedAudioUrl,
    audioSettings.customAudioDuration,
    audioSettings.customAudioKey,
    ayahs.length,
  ]);

  useEffect(() => {
    loadAyahs();
  }, [loadAyahs]);

  // Connect Audio Engine volume & real-time 8D spatial and reverb DSP effects
  useEffect(() => {
    unifiedAudioEngine.setVolume((audioSettings.recitationVolume || 85) / 100);
    unifiedAudioEngine.configureAudioEffects(audioSettings);
  }, [
    audioSettings.recitationVolume,
    audioSettings.enable8DAudio,
    audioSettings.eightDSpeed,
    audioSettings.eightDDepth,
    audioSettings.eightDStyle,
    audioSettings.reverbPreset,
    audioSettings.reverbLevel,
    audioSettings.enableStudioClarity,
    audioSettings.enableVoiceWarmth,
    audioSettings.enableNoiseGate,
  ]);

  // Connect Audio Engine state listeners with strict teardown
  useEffect(() => {
    const unsubState = unifiedAudioEngine.onStateChange((state) => {
      const active = state === 'playing';
      setIsPlaying(active);
      playingRef.current = active;
    });

    const unsubComplete = unifiedAudioEngine.onItemComplete(() => {
      setCurrentAyahIndex((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx < ayahs.length) {
          setTimeout(() => playFromIndex(nextIdx), 25);
          return nextIdx;
        } else {
          playingRef.current = false;
          setIsPlaying(false);
          proceduralAmbientEngine.stop();
          return prevIdx;
        }
      });
    });

    let lastTimeUpdate = 0;
    let lastWordIndex = -1;

    unifiedAudioEngine.setProgressListener(({ currentTime, duration, activeWordIndex }) => {
      const now = performance.now();
      const wordChanged = activeWordIndex !== undefined && activeWordIndex !== lastWordIndex;

      // Update state when active word changes (instant karaoke) or every 80ms (smooth scrubber without 60fps thrashing)
      if (wordChanged || now - lastTimeUpdate >= 80) {
        lastTimeUpdate = now;
        if (activeWordIndex !== undefined) lastWordIndex = activeWordIndex;
        setAudioCurrentTime(currentTime);
        setAudioDuration(duration);
      }
    });

    const unsubError = unifiedAudioEngine.onError((_errorMsg) => {
      addToast({
        message:
          'تعذر تشغيل تلاوة القارئ. قد يكون هناك انقطاع في الاتصال أو عدم توفر السورة لهذا القارئ 🎙️',
        type: 'warning',
        duration: 8000,
        action: {
          label: 'تغيير القارئ 🔄',
          onClick: () => {
            setIsReciterModalOpen(true);
          },
        },
      });
      setIsPlaying(false);
      playingRef.current = false;
    });

    return () => {
      unsubState();
      unsubComplete();
      unsubError();
      unifiedAudioEngine.setProgressListener(null);
      unifiedAudioEngine.stop();
      proceduralAmbientEngine.stop();
    };
  }, [ayahs, surahNumber]);

  // Audio Playback Controls
  const playFromIndex = (index: number) => {
    if (index >= ayahs.length || index < 0) {
      stopAudio();
      return;
    }

    const ayah = ayahs[index];
    const customVoice =
      audioSettings.customRecordedAudioUrl ||
      currentProject?.audioSettings?.customRecordedAudioUrl ||
      currentProject?.customAudioUrl;
    const isUsingCustomVoice = !!(
      customVoice &&
      (reciterId === 'custom_voice' || ayah?.audioUrl === customVoice || !ayah?.audioUrl)
    );
    const finalAudioUrl = isUsingCustomVoice ? customVoice : ayah?.audioUrl || customVoice;

    if (!finalAudioUrl) {
      console.warn('[EditorPage] No audio URL for ayah', index);
      return;
    }

    setCurrentAyahIndex(index);
    setIsPlaying(true);
    playingRef.current = true;

    unifiedAudioEngine.play({
      id: `${surahNumber}:${ayah?.numberInSurah || index + 1}`,
      audioUrl: finalAudioUrl,
      fallbackUrls: isUsingCustomVoice ? [] : ayah?.fallbackUrls,
      duration: ayah?.duration,
      startTimeMs: ayah?.startTimeMs,
      endTimeMs: ayah?.endTimeMs,
      isFullSurahFile: !!ayah?.isFullSurahFile,
      text: ayah?.text,
      words: ayah?.words,
    });
  };

  const stopAudio = () => {
    playingRef.current = false;
    setIsPlaying(false);
    unifiedAudioEngine.stop();
    proceduralAmbientEngine.stop();
    setAudioCurrentTime(0);
  };

  const togglePlay = () => {
    if (playingRef.current || isPlaying) {
      stopAudio();
    } else {
      playingRef.current = true;
      setIsPlaying(true);
      const startIndex =
        currentAyahIndex === ayahs.length - 1 && audioCurrentTime >= (audioDuration || 1) - 0.5
          ? 0
          : currentAyahIndex >= 0
            ? currentAyahIndex
            : 0;
      playFromIndex(startIndex);
    }
  };

  const seekToAyah = (index: number) => {
    stopAudio();
    setCurrentAyahIndex(index);
    setTimeout(() => {
      playingRef.current = true;
      setIsPlaying(true);
      playFromIndex(index);
    }, 15);
  };

  const handleSave = useCallback(() => {
    if (currentProject) {
      updateProject(currentProject.id, {
        textSettings,
        audioSettings,
        translationEnabled: showTranslation,
        tafsirEnabled: showTafsir,
        backgroundUrl: backgroundFile,
        backgroundOpacity,
        watermark,
        reciterId,
        surahNumber,
        fromAyah,
        toAyah,
        aspectRatio,
        transition,
        videoEffect,
        activeTemplateId,
        updatedAt: new Date().toISOString(),
        status: 'editing',
      });
      setSaveStatus('saved');
    }
    addToast({ message: 'تم حفظ التغييرات بنجاح ✓', type: 'success' });
  }, [
    currentProject,
    updateProject,
    textSettings,
    audioSettings,
    showTranslation,
    showTafsir,
    backgroundFile,
    backgroundOpacity,
    watermark,
    reciterId,
    surahNumber,
    fromAyah,
    toAyah,
    aspectRatio,
    transition,
    videoEffect,
    activeTemplateId,
    addToast,
  ]);

  // Global Pro Keyboard Shortcuts Studio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      // Space -> Toggle Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // ArrowLeft -> Next Ayah
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentAyahIndex < ayahs.length - 1) {
          playFromIndex(currentAyahIndex + 1);
        }
        return;
      }

      // ArrowRight -> Previous Ayah
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentAyahIndex > 0) {
          playFromIndex(currentAyahIndex - 1);
        }
        return;
      }

      // Ctrl + E -> Export Modal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleSave();
        setShowExportModal(true);
        return;
      }

      // Ctrl + S -> Save Toast
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // M -> Toggle Ambient Sound
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setAudioSettings((s) => {
          const next = s.ambientSoundId === 'none' ? 'gentle_rain' : 'none';
          addToast({
            message: next === 'none' ? 'تم كتم صوت الطبيعة 🔇' : 'تم تفعيل صوت الطبيعة 🌧️',
            type: 'info',
          });
          return { ...s, ambientSoundId: next };
        });
        return;
      }

      // ? -> Open Keyboard Help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsKeyboardModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    currentAyahIndex,
    ayahs.length,
    togglePlay,
    playFromIndex,
    handleSave,
    addToast,
  ]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');

  // Debounced Autosave Engine with Snapshot Thumbnail Generator (Connected to Settings)
  useEffect(() => {
    if (!currentProject) return;
    if (settings.autoSave === false) {
      setSaveStatus('idle');
      return;
    }

    const debounceMs = Math.min(3000, Math.max(1000, (settings.autoSaveInterval || 1) * 1500));

    const timer = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setSaveStatus('saving');

      try {
        let thumb = currentProject.thumbnail;
        try {
          const generated = await generateProjectThumbnailDataUrl({
            surahName: surahs.find((s) => s.number === surahNumber)?.name || currentProject.surah,
            fromAyah,
            toAyah,
            backgroundUrl: backgroundFile,
            aspectRatio,
            textColor: textSettings.textColor,
          });
          if (generated) thumb = generated;
        } catch (e) {
          console.warn('[Autosave] Failed to generate project thumbnail snapshot', e);
        }

        updateProject(currentProject.id, {
          textSettings,
          audioSettings,
          translationEnabled: showTranslation,
          tafsirEnabled: showTafsir,
          backgroundUrl: backgroundFile,
          backgroundOpacity,
          watermark,
          reciterId,
          surahNumber,
          fromAyah,
          toAyah,
          aspectRatio,
          transition,
          videoEffect,
          activeTemplateId,
          thumbnail: thumb,
          updatedAt: new Date().toISOString(),
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('[Autosave] Error saving project:', err);
        setSaveStatus('idle');
      } finally {
        isSavingRef.current = false;
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [
    currentProject?.id,
    settings.autoSave,
    settings.autoSaveInterval,
    textSettings,
    audioSettings,
    showTranslation,
    showTafsir,
    backgroundFile,
    backgroundOpacity,
    watermark,
    reciterId,
    surahNumber,
    fromAyah,
    toAyah,
    aspectRatio,
    transition,
    videoEffect,
    activeTemplateId,
  ]);

  // Periodic background autosave interval (Heartbeat based on settings.autoSaveInterval)
  useEffect(() => {
    if (!currentProject || settings.autoSave === false) return;

    const intervalMs = Math.max(30000, (settings.autoSaveInterval || 1) * 60 * 1000);
    const intervalTimer = setInterval(() => {
      updateProject(currentProject.id, {
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus('saved');
    }, intervalMs);

    return () => clearInterval(intervalTimer);
  }, [currentProject?.id, settings.autoSave, settings.autoSaveInterval]);


  return (
    <div className="h-screen w-screen flex flex-col bg-surface-950 text-surface-50 overflow-hidden">
      {/* 1. Header with Undo/Redo, Save, Export, and Quick Hubs */}
      <EditorHeader
        currentProject={currentProject}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        saveStatus={saveStatus}
        onOpenExport={() => {
          handleSave();
          setShowExportModal(true);
        }}
        onOpenAutoReel={() => setShowAutoReelModal(true)}
        onOpenPlaylists={() => setIsPlaylistModalOpen(true)}
        onOpenEvents={() => setIsIslamicEventsModalOpen(true)}
        onOpenVoiceRecorder={() => setIsVoiceRecorderOpen(true)}
        onOpenQuotes={() => setCurrentPage('quotes')}
        onOpenKeyboardShortcuts={() => setIsKeyboardModalOpen(true)}
        isProMode={isProMode}
        onToggleProMode={() => setIsProMode(!isProMode)}
        onBack={() => {
          stopAudio();
          setCurrentPage('dashboard');
        }}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Loading Indicator */}
        {isLoadingAyahs && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-surface-900/90 border border-gold-500/30 text-gold-400 text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md animate-pulse pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-ping" />
            <span>جاري تحميل الآيات والصوت القرآني...</span>
          </div>
        )}

        {/* Load Error Notification with Retry Button */}
        {loadError && ayahs.length === 0 && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-full mx-auto px-5 py-4 rounded-2xl bg-surface-950 border border-red-500/40 text-surface-50 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center gap-3 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 text-xl font-black">
              ⚠️
            </div>
            <div>
              <h4 className="font-bold text-sm text-red-600 dark:text-red-300">تعذر تحميل بيانات الآيات والصوت</h4>
              <p className="text-xs text-surface-400 mt-1">
                يرجى التحقق من اتصال الإنترنت أو اختيار قارئ آخر
              </p>
            </div>
            <button
              onClick={() => loadAyahs()}
              className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-700 dark:text-red-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RotateCcw size={13} />
              <span>إعادة المحاولة الآن</span>
            </button>
          </div>
        )}

        {/* Left / Center Preview Area */}
        <EditorPreviewArea
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          ayahs={ayahs}
          translations={translations}
          currentAyahIndex={currentAyahIndex}
          audioCurrentTime={audioCurrentTime}
          audioDuration={audioDuration}
          isPlaying={isPlaying}
          textSettings={textSettings}
          setTextSettings={setTextSettings}
          showTranslation={showTranslation}
          showTafsir={showTafsir}
          backgroundFile={backgroundFile}
          backgroundOpacity={backgroundOpacity}
          watermark={watermark}
          surahName={selectedSurah?.name || currentProject?.customTitle || 'سورة الفاتحة'}
          fromAyah={fromAyah}
          toAyah={toAyah}
          transition={transition}
          videoEffect={videoEffect}
          audioSettings={audioSettings}
          togglePlay={togglePlay}
          seekToAyah={seekToAyah}
          onOpenPresetModal={() => setIsPresetModalOpen(true)}
          onOpenThumbnailModal={() => setIsThumbnailModalOpen(true)}
          onOpenViralCaption={() => setIsViralCaptionOpen(true)}
          onOpenFullscreen={() => setIsFullscreenPreview(true)}
          onOpenWaveformTimingEditor={() => setIsWaveformTimingModalOpen(true)}
        />

        {/* Right: Sliding Tool Inspector Panel */}
        <AnimatePresence mode="wait">
          {isInspectorOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="glass-inspector h-full flex flex-col shrink-0 overflow-hidden z-20 border-r border-surface-700/40"
            >
              {/* Panel Header */}
              <div className="p-4 border-b border-surface-700/40 flex items-center justify-between bg-surface-900">
                <div className="flex items-center gap-2">
                  {activeDockTab === 'reciter' && <Mic size={16} className="text-gold-400" />}
                  {activeDockTab === 'bg' && <ImageIcon size={16} className="text-sky-400" />}
                  {activeDockTab === 'text' && <Type size={16} className="text-gold-400" />}
                  {activeDockTab === 'ornaments' && (
                    <Layers size={16} className="text-emerald-400" />
                  )}
                  {activeDockTab === 'ambient' && (
                    <Headphones size={16} className="text-purple-400" />
                  )}
                  {activeDockTab === 'templates' && <Palette size={16} className="text-pink-400" />}
                  {activeDockTab === 'branding' && <Sliders size={16} className="text-amber-400" />}
                  <span className="font-bold text-xs text-surface-50">
                    {activeDockTab === 'reciter' && 'القارئ والسورة القرآنية'}
                    {activeDockTab === 'bg' && 'الخلفيات السينمائية'}
                    {activeDockTab === 'text' && 'تنسيق النص والخطوط'}
                    {activeDockTab === 'ornaments' && 'الزخارف والإطارات'}
                    {activeDockTab === 'ambient' && 'الصوت المحيطي و 8D'}
                    {activeDockTab === 'templates' && 'القوالب السينمائية'}
                    {activeDockTab === 'branding' && 'العلامة المائية والكابشن'}
                  </span>
                </div>
              </div>

              {/* Panel Content Scrollable Body */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs custom-scrollbar">
                {activeDockTab === 'reciter' && (
                  <ReciterPanel
                    currentProject={currentProject}
                    reciterId={reciterId}
                    setReciterId={setReciterId}
                    surahNumber={surahNumber}
                    setSurahNumber={setSurahNumber}
                    fromAyah={fromAyah}
                    setFromAyah={setFromAyah}
                    toAyah={toAyah}
                    setToAyah={setToAyah}
                    ayahs={ayahs}
                    setAyahs={setAyahs}
                    audioSettings={audioSettings}
                    setAudioSettings={setAudioSettings}
                    filterEditorAvailableOnly={filterEditorAvailableOnly}
                    setFilterEditorAvailableOnly={setFilterEditorAvailableOnly}
                    showTranslation={showTranslation}
                    setShowTranslation={setShowTranslation}
                    showTafsir={showTafsir}
                    setShowTafsir={setShowTafsir}
                    onOpenReciterModal={() => setIsReciterModalOpen(true)}
                    onOpenVoiceRecorder={() => setIsVoiceRecorderOpen(true)}
                    stopAudio={stopAudio}
                    updateProject={updateProject}
                    addToast={addToast}
                  />
                )}

                {activeDockTab === 'bg' && (
                  <BackgroundPanel
                    ayahs={ayahs}
                    currentAyahIndex={currentAyahIndex}
                    setCurrentAyahIndex={setCurrentAyahIndex}
                    backgroundFile={backgroundFile}
                    setBackgroundFile={setBackgroundFile}
                    backgroundOpacity={backgroundOpacity}
                    setBackgroundOpacity={setBackgroundOpacity}
                    textSettings={textSettings}
                    setTextSettings={setTextSettings}
                    aspectRatio={aspectRatio}
                    addToast={addToast}
                  />
                )}

                {activeDockTab === 'text' && (
                  <TextStylePanel
                    textSettings={textSettings}
                    setTextSettings={setTextSettings}
                    showTranslation={showTranslation}
                    setShowTranslation={setShowTranslation}
                    currentAyahText={
                      ayahs[currentAyahIndex]?.text || ayahs[0]?.text || currentProject?.customText
                    }
                    addToast={addToast}
                  />
                )}

                {activeDockTab === 'ornaments' && (
                  <OrnamentsPanel textSettings={textSettings} setTextSettings={setTextSettings} />
                )}

                {activeDockTab === 'ambient' && (
                  <AmbientAudioPanel
                    audioSettings={audioSettings}
                    setAudioSettings={setAudioSettings}
                    textSettings={textSettings}
                    setTextSettings={setTextSettings}
                    isTestingAmbient={isTestingAmbient}
                    setIsTestingAmbient={setIsTestingAmbient}
                    onOpenVoiceRecorder={() => setIsVoiceRecorderOpen(true)}
                  />
                )}

                {activeDockTab === 'templates' && (
                  <TemplatesPanel
                    activeTemplateId={activeTemplateId || null}
                    onApplyTemplate={applyTemplate}
                    onOpenPresetModal={() => setIsPresetModalOpen(true)}
                    onOpenClipLibrary={() => setIsClipLibraryOpen(true)}
                  />
                )}

                {activeDockTab === 'branding' && (
                  <BrandingPanel
                    currentProject={currentProject}
                    textSettings={textSettings}
                    setTextSettings={setTextSettings}
                    watermark={watermark}
                    setWatermark={setWatermark}
                    selectedSurahName={selectedSurah?.name}
                    fromAyah={fromAyah}
                    toAyah={toAyah}
                    currentAyahIndex={currentAyahIndex}
                    ayahs={ayahs}
                    translations={translations}
                  />
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Vertical Dock Nav on Far Right */}
        <EditorDockNav
          activeTab={activeDockTab}
          onTabChange={setActiveDockTab}
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
          isProMode={isProMode}
          onToggleProMode={() => setIsProMode(!isProMode)}
        />
      </div>

      {/* 3. Global Fullscreen 4K Modal */}
      <AnimatePresence>
        {isFullscreenPreview && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4">
            <button
              type="button"
              onClick={() => setIsFullscreenPreview(false)}
              className="absolute top-6 start-6 p-3 rounded-full bg-surface-800/80 hover:bg-surface-700 text-white transition-all shadow-2xl z-50 cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="max-h-[88vh] max-w-[90vw] flex items-center justify-center">
              <PreviewFrame
                aspectRatio={aspectRatio}
                ayahText={
                  ayahs[currentAyahIndex]?.text ||
                  currentProject?.customText ||
                  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
                }
                translationText={translations[currentAyahIndex]?.text}
                textSettings={textSettings}
                showTranslation={showTranslation}
                showTafsir={showTafsir}
                backgroundUrl={backgroundFile}
                backgroundOpacity={backgroundOpacity}
                watermark={watermark}
                surahName={selectedSurah?.name || currentProject?.customTitle || 'سورة الفاتحة'}
                ayahRange={`${fromAyah} - ${toAyah}`}
                currentAyahIndex={currentAyahIndex}
                currentTime={audioCurrentTime}
                ayahs={ayahs}
                translations={translations}
                isPlaying={isPlaying}
                transition={transition}
                videoEffect={videoEffect}
                size="fullscreen"
                onWatermarkDragEnd={(x, y) =>
                  setTextSettings((s) => ({
                    ...s,
                    watermarkX: (s.watermarkX || 0) + x,
                    watermarkY: (s.watermarkY || 0) + y,
                  }))
                }
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        projectName={currentProject?.name || 'ريلز إسلامي'}
        backgroundPath={backgroundFile}
        audioUrls={
          currentProject?.customAudioUrl || audioSettings.customRecordedAudioUrl
            ? [currentProject?.customAudioUrl || audioSettings.customRecordedAudioUrl!]
            : (ayahs.map((a) => a.audioUrl).filter(Boolean) as string[])
        }
        ayahs={ayahs
          .filter((a) => a && a.text && a.text.trim().length > 0)
          .map((a, i) => ({
            ...a,
            translationText: translations[i]?.text,
          }))}
        aspectRatio={aspectRatio}
        watermark={watermark}
        textColor={textSettings.textColor}
        bgOpacity={backgroundOpacity}
        fontFamily={textSettings.fontFamily}
        totalDuration={audioDuration || 30}
        transition={transition}
        videoEffect={videoEffect}
        textSettings={textSettings}
        audioSettings={audioSettings}
        showTranslation={showTranslation}
        showTafsir={showTafsir}
        surahName={selectedSurah?.name || currentProject?.customTitle}
        reciterName={
          audioSettings.customReciterName ||
          currentProject?.customReciterName ||
          currentProject?.reciter ||
          undefined
        }
      />

      <AutoReelModal isOpen={showAutoReelModal} onClose={() => setShowAutoReelModal(false)} />

      <ReciterBrowserModal
        isOpen={isReciterModalOpen}
        onClose={() => setIsReciterModalOpen(false)}
        selectedReciterId={reciterId}
        onSelectReciter={(reciter) => {
          setReciterId(reciter.id);
          stopAudio();
        }}
        onSelectSurah={(sNum) => {
          setSurahNumber(sNum);
          stopAudio();
        }}
      />

      <PresetTemplatesModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onApplyTemplate={applyTemplate}
        activeTemplateId={activeTemplateId}
      />

      {currentProject && (
        <ViralCaptionModal
          isOpen={isViralCaptionOpen}
          onClose={() => setIsViralCaptionOpen(false)}
          project={currentProject}
          ayahs={ayahs}
          translationText={translations[0]?.text}
        />
      )}

      {currentProject && (
        <ThumbnailModal
          isOpen={isThumbnailModalOpen}
          onClose={() => setIsThumbnailModalOpen(false)}
          project={{
            ...currentProject,
            surah: selectedSurah?.name || currentProject.surah,
            reciter:
              reciterId === 'custom_voice' || audioSettings.customRecordedAudioUrl
                ? audioSettings.customReciterName ||
                  currentProject.customReciterName ||
                  currentProject.reciter ||
                  'تلاوتي الخاصة 🎙️'
                : reciters.find((r) => r.id === reciterId)?.name || currentProject.reciter,
            customReciterName: audioSettings.customReciterName || currentProject.customReciterName,
            backgroundUrl: backgroundFile,
            aspectRatio: aspectRatio,
            textSettings: textSettings,
            fromAyah: fromAyah,
            toAyah: toAyah,
          }}
          ayahs={ayahs}
          currentAyahIndex={currentAyahIndex}
        />
      )}

      <VoiceRecorderModal
        isOpen={isVoiceRecorderOpen}
        onClose={() => setIsVoiceRecorderOpen(false)}
        onApplyAudio={(audioData) => {
          setReciterId('custom_voice');
          setAudioSettings((prev) => ({
            ...prev,
            ...audioData.audioSettings,
            customRecordedAudioUrl: audioData.audioUrl,
            customAudioDuration: audioData.duration,
          }));
          if (currentProject) {
            updateProject(currentProject.id, {
              reciter: 'تسجيلي الخاص (أنا) 🎙️',
              reciterId: 'custom_voice',
              customAudioUrl: audioData.audioUrl,
              audioSettings: {
                ...currentProject.audioSettings,
                ...audioData.audioSettings,
                customRecordedAudioUrl: audioData.audioUrl,
                customAudioDuration: audioData.duration,
              },
            });
          }
          if (ayahs.length > 0) {
            setAyahs((prev) =>
              prev.map((a, idx) =>
                idx === 0 || prev.length === 1
                  ? { ...a, audioUrl: audioData.audioUrl, duration: audioData.duration }
                  : a
              )
            );
          }
          addToast({
            message: 'تم ربط تلاوتك المسجلة مع مشروع الريلز بنجاح! 🎙️✨',
            type: 'success',
          });
        }}
      />

      <IslamicEventsModal
        isOpen={isIslamicEventsModalOpen}
        onClose={() => setIsIslamicEventsModalOpen(false)}
        onSelectEvent={(event: IslamicEventItem) => {
          setSurahNumber(event.surahNumber);
          setFromAyah(event.fromAyah);
          setToAyah(event.toAyah);
          setReciterId(event.reciterId);
          if (event.backgroundUrl) setBackgroundFile(event.backgroundUrl);
          setTextSettings((s) => ({
            ...s,
            sceneBackgrounds: {},
            enableMultiScene: false,
            colorGrading: event.colorGrading || s.colorGrading,
          }));
          if (event.ambientSoundId) {
            setAudioSettings((s) => ({ ...s, ambientSoundId: event.ambientSoundId }));
          }
          setCurrentAyahIndex(0);
          addToast({ message: `تم تطبيق قالب «${event.title}» بنجاح 🌙✨`, type: 'success' });
        }}
      />

      <QuranPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onSelectPlaylist={(item: QuranPlaylistItem) => {
          setSurahNumber(item.surahNumber);
          setFromAyah(item.fromAyah);
          setToAyah(item.toAyah);
          setReciterId(item.reciterId);
          if (item.backgroundUrl) setBackgroundFile(item.backgroundUrl);
          setTextSettings((s) => ({
            ...s,
            sceneBackgrounds: {},
            enableMultiScene: false,
            colorGrading: item.colorGrading || s.colorGrading,
            wordHighlightColor: item.wordHighlightColor || s.wordHighlightColor,
          }));
          if (item.ambientSoundId) {
            setAudioSettings((s) => ({ ...s, ambientSoundId: item.ambientSoundId }));
          }
          setCurrentAyahIndex(0);
          addToast({ message: `تم تطبيق مقطع «${item.title}» بنجاح ✨`, type: 'success' });
        }}
      />

      <ClipLibraryModal isOpen={isClipLibraryOpen} onClose={() => setIsClipLibraryOpen(false)} />

      <KeyboardShortcutsModal
        isOpen={isKeyboardModalOpen}
        onClose={() => setIsKeyboardModalOpen(false)}
      />

      {isWaveformTimingModalOpen && ayahs.length > 0 && (
        <DraggableWaveformTimingEditor
          isOpen={isWaveformTimingModalOpen}
          onClose={() => setIsWaveformTimingModalOpen(false)}
          ayahs={ayahs}
          currentAyahIndex={currentAyahIndex}
          audioUrl={
            audioSettings.customRecordedAudioUrl ||
            currentProject?.customAudioUrl ||
            ayahs[0]?.audioUrl
          }
          totalAudioDuration={
            audioDuration ||
            audioSettings.customAudioDuration ||
            ayahs.reduce((sum, a) => sum + (a.duration || 0), 0)
          }
          onSaveAllAyahs={(updatedAyahs) => {
            setAyahs(updatedAyahs);
            addToast({
              message: 'تم حفظ وتحديث توقيت جميع الآيات على التايم لاين بنجاح! ✨',
              type: 'success',
            });
          }}
          onSaveWords={handleSaveWords}
        />
      )}

      <InteractiveTourGuide />
    </div>
  );
};
