import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AyahData, splitAyahIntoWaqfChunks } from '../../services/quranApi';
import { QuranWord, AyahChunk } from '../../types';
import { useHotkeys } from '../../hooks/useHotkeys';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Wand2,
  Scissors,
  Trash2,
  Layers,
  FileText,
  Magnet,
  Lock,
  Unlock,
  Undo2,
  Redo2,
  Zap,
} from 'lucide-react';

export interface UnifiedWordItem extends QuranWord {
  ayahIdx: number;
  ayahNumberInSurah: number;
  surahName?: string;
  globalStartTime: number;
  globalEndTime: number;
}

export interface DraggableWaveformTimingEditorProps {
  isOpen: boolean;
  onClose: () => void;
  ayahs?: AyahData[];
  currentAyahIndex?: number;
  audioUrl?: string;
  totalAudioDuration?: number;
  onSaveAllAyahs?: (updatedAyahs: AyahData[]) => void;
  onSaveWords?: (
    ayahIndex: number,
    updatedWords: QuranWord[],
    updatedChunks: AyahChunk[],
    updatedText?: string
  ) => void;
  // Backwards compatibility props:
  ayah?: AyahData;
  ayahIndex?: number;
  totalAyahsCount?: number;
  onNavigateAyah?: (newIndex: number) => void;
}

// Color palettes per Ayah index
const AYAH_COLOR_THEMES = [
  {
    badge: 'bg-gold-500/20 text-gold-300 border-gold-500/40',
    chipActive:
      'bg-gold-400 text-surface-950 font-black shadow-gold-500/40 border-gold-300 ring-2 ring-gold-400/50',
    chipSelected: 'bg-gold-500/30 text-gold-200 border-gold-400/60 shadow-md',
    chipNormal: 'bg-gold-500/10 text-gold-100/90 hover:bg-gold-500/20 border-gold-500/20',
    blockBorder: 'border-gold-400/60 bg-gold-500/30',
    handleStart: 'bg-amber-400/90 hover:bg-amber-300 text-surface-950',
    handleEnd: 'bg-gold-400/90 hover:bg-gold-300 text-surface-950',
    name: 'الآية الأولى (ذهبي)',
  },
  {
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    chipActive:
      'bg-emerald-400 text-surface-950 font-black shadow-emerald-500/40 border-emerald-300 ring-2 ring-emerald-400/50',
    chipSelected: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/60 shadow-md',
    chipNormal:
      'bg-emerald-500/10 text-emerald-100/90 hover:bg-emerald-500/20 border-emerald-500/20',
    blockBorder: 'border-emerald-400/60 bg-emerald-500/30',
    handleStart: 'bg-teal-400/90 hover:bg-teal-300 text-surface-950',
    handleEnd: 'bg-emerald-400/90 hover:bg-emerald-300 text-surface-950',
    name: 'الآية الثانية (زمردي)',
  },
  {
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    chipActive:
      'bg-cyan-400 text-surface-950 font-black shadow-cyan-500/40 border-cyan-300 ring-2 ring-cyan-400/50',
    chipSelected: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 shadow-md',
    chipNormal: 'bg-cyan-500/10 text-cyan-100/90 hover:bg-cyan-500/20 border-cyan-500/20',
    blockBorder: 'border-cyan-400/60 bg-cyan-500/30',
    handleStart: 'bg-sky-400/90 hover:bg-sky-300 text-surface-950',
    handleEnd: 'bg-cyan-400/90 hover:bg-cyan-300 text-surface-950',
    name: 'الآية الثالثة (سماوي)',
  },
  {
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    chipActive:
      'bg-purple-400 text-surface-950 font-black shadow-purple-500/40 border-purple-300 ring-2 ring-purple-400/50',
    chipSelected: 'bg-purple-500/30 text-purple-200 border-purple-400/60 shadow-md',
    chipNormal: 'bg-purple-500/10 text-purple-100/90 hover:bg-purple-500/20 border-purple-500/20',
    blockBorder: 'border-purple-400/60 bg-purple-500/30',
    handleStart: 'bg-fuchsia-400/90 hover:bg-fuchsia-300 text-surface-950',
    handleEnd: 'bg-purple-400/90 hover:bg-purple-300 text-surface-950',
    name: 'الآية الرابعة (بنفسجي)',
  },
];

export const DraggableWaveformTimingEditor: React.FC<DraggableWaveformTimingEditorProps> = ({
  isOpen,
  onClose,
  ayahs: rawAyahs,
  currentAyahIndex = 0,
  audioUrl: explicitAudioUrl,
  totalAudioDuration: explicitDuration,
  onSaveAllAyahs,
  onSaveWords,
  ayah: legacyAyah,
  ayahIndex: legacyAyahIndex = 0,
  totalAyahsCount: _legacyTotalAyahsCount = 1,
  onNavigateAyah: _onNavigateAyah,
}) => {
  // Normalize ayahs list
  const effectiveAyahs: AyahData[] =
    rawAyahs && rawAyahs.length > 0 ? rawAyahs : legacyAyah ? [legacyAyah] : [];

  // View Mode: 'all' (Unified Full Timeline) or 'single' (Focus on 1 Ayah)
  const [viewMode, setViewMode] = useState<'all' | 'single'>(
    effectiveAyahs.length > 1 ? 'all' : 'single'
  );
  const [activeAyahFocusIdx, setActiveAyahFocusIdx] = useState<number>(
    currentAyahIndex || legacyAyahIndex || 0
  );

  // Magnetic Ripple Push Mode: pushing neighboring words automatically when expanding/dragging
  const [isMagneticPushEnabled, setIsMagneticPushEnabled] = useState<boolean>(true);

  // Locked Words: anchored words that cannot be shifted or shrunk by neighboring edits
  const [lockedWordIds, setLockedWordIds] = useState<Set<number>>(new Set());

  // Unified Words Track (all words of all verses flattened)
  const [unifiedWords, setUnifiedWords] = useState<UnifiedWordItem[]>([]);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number>(0);
  const [isLoopingWord, setIsLoopingWord] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.5); // 1x to 4x
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<UnifiedWordItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Backup of original words for full restore
  const originalUnifiedBackupRef = useRef<UnifiedWordItem[]>([]);

  // Audio & Waveform State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [wavePeaks, setWavePeaks] = useState<number[]>([]);
  const [_isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(explicitDuration || 10);

  // Flash message state for auto-snap or actions
  const [flashNotification, setFlashNotification] = useState<string | null>(null);

  // Dragging state
  const [dragState, setDragState] = useState<{
    wordIndex: number;
    mode: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  // Refs
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const lastStateUpdateRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Determine active audio URL
  const resolvedAudioUrl = explicitAudioUrl || effectiveAyahs[0]?.audioUrl || legacyAyah?.audioUrl;

  // Show quick notification
  const triggerNotification = (msg: string) => {
    setFlashNotification(msg);
    setTimeout(() => setFlashNotification(null), 3200);
  };

  // Push new state into History Stack
  const pushHistoryState = useCallback(
    (newWords: UnifiedWordItem[]) => {
      setHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        const updated = [...upToCurrent, newWords.map((w) => ({ ...w }))];
        if (updated.length > 50) updated.shift();
        return updated;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex]
  );

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      const targetWords = history[targetIdx];
      if (targetWords) {
        setUnifiedWords(targetWords.map((w) => ({ ...w })));
        setHistoryIndex(targetIdx);
        triggerNotification('↩️ تم التراجع عن آخر تعديل');
      }
    }
  }, [historyIndex, history]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIdx = historyIndex + 1;
      const targetWords = history[targetIdx];
      if (targetWords) {
        setUnifiedWords(targetWords.map((w) => ({ ...w })));
        setHistoryIndex(targetIdx);
        triggerNotification('↪️ تمت إعادة التعديل');
      }
    }
  }, [historyIndex, history]);

  // Global Keyboard Shortcuts (Ctrl+Z / Ctrl+Y / Space)
  useHotkeys(['ctrl+z', 'meta+z'], handleUndo, { enabled: isOpen });
  useHotkeys(['ctrl+y', 'meta+y', 'ctrl+shift+z', 'meta+shift+z'], handleRedo, { enabled: isOpen });
  useHotkeys('Space', () => toggleGlobalPlay(), { enabled: isOpen });

  // Toggle Lock on a word
  const handleToggleLockWord = (wordId: number) => {
    setLockedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
        triggerNotification('🔓 تم إلغاء تثبيت الكلمة');
      } else {
        next.add(wordId);
        triggerNotification('🔒 تم تثبيت وقفل الكلمة بنجاح');
      }
      return next;
    });
  };

  // 1. Build Unified Words Structure from Ayahs
  useEffect(() => {
    if (!effectiveAyahs || effectiveAyahs.length === 0) return;

    const totalDur =
      explicitDuration && explicitDuration > 0
        ? explicitDuration
        : effectiveAyahs.reduce((sum, a) => sum + (a.duration || 5), 0);

    setAudioDuration(totalDur);

    const builtWords: UnifiedWordItem[] = [];
    let globalOffset = 0;

    effectiveAyahs.forEach((ay, aIdx) => {
      const aStart =
        ay.startTimeMs !== undefined && ay.startTimeMs >= 0 ? ay.startTimeMs / 1000 : globalOffset;
      const aDur = ay.duration && ay.duration > 0 ? ay.duration : totalDur / effectiveAyahs.length;
      globalOffset = aStart + aDur;

      if (ay.words && ay.words.length > 0) {
        ay.words.forEach((w) => {
          builtWords.push({
            ...w,
            id: builtWords.length + 1,
            position: builtWords.length + 1,
            ayahIdx: aIdx,
            ayahNumberInSurah: ay.numberInSurah || aIdx + 1,
            surahName: ay.surahName,
            globalStartTime: Math.round((aStart + w.startTime) * 1000) / 1000,
            globalEndTime: Math.round((aStart + w.endTime) * 1000) / 1000,
          });
        });
      } else {
        const tokens = (ay.text || '').trim().split(/\s+/).filter(Boolean);
        const wDuration = aDur / Math.max(tokens.length, 1);
        tokens.forEach((token, tIdx) => {
          builtWords.push({
            id: builtWords.length + 1,
            position: builtWords.length + 1,
            text: token,
            startTime: tIdx * wDuration,
            endTime: (tIdx + 1) * wDuration,
            charTypeName: 'word',
            ayahIdx: aIdx,
            ayahNumberInSurah: ay.numberInSurah || aIdx + 1,
            surahName: ay.surahName,
            globalStartTime: Math.round((aStart + tIdx * wDuration) * 1000) / 1000,
            globalEndTime: Math.round((aStart + (tIdx + 1) * wDuration) * 1000) / 1000,
          });
        });
      }
    });

    originalUnifiedBackupRef.current = builtWords.map((w) => ({ ...w }));
    setUnifiedWords(builtWords);
    setHistory([builtWords.map((w) => ({ ...w }))]);
    setHistoryIndex(0);
    setSelectedWordIndex(0);
  }, [effectiveAyahs.length, explicitDuration]);

  // Audio playback controls
  const stopAudioPlayback = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (err) {
        console.debug('[WaveformTimingEditor] AudioSource stop error:', err);
      }
      audioSourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // 2. Decode Full Audio Buffer & Calculate Acoustic Waveform Peaks
  useEffect(() => {
    if (!isOpen || !resolvedAudioUrl) return;

    let isMounted = true;
    setIsLoadingAudio(true);

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    fetch(resolvedAudioUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Audio fetch failed');
        return res.arrayBuffer();
      })
      .then((arrayBuf) => ctx.decodeAudioData(arrayBuf))
      .then((decodedBuf) => {
        if (!isMounted) return;
        setAudioBuffer(decodedBuf);
        setAudioDuration(decodedBuf.duration);

        // Generate normalized acoustic waveform peaks
        const channelData = decodedBuf.getChannelData(0);
        const samples = 450;
        const blockSize = Math.floor(channelData.length / samples);
        const peaks: number[] = [];

        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j] || 0);
          }
          peaks.push(Math.min(1, (sum / blockSize) * 2.8));
        }

        setWavePeaks(peaks);
        setIsLoadingAudio(false);
      })
      .catch((err) => {
        console.warn(
          '[TimingEditor] Could not decode full audio buffer, using synthesized waveform:',
          err
        );
        if (!isMounted) return;
        const synthPeaks = Array.from({ length: 350 }, (_, i) => {
          const freq = Math.sin(i * 0.15) * 0.4 + Math.cos(i * 0.08) * 0.3 + 0.3;
          return Math.max(0.1, Math.min(0.95, freq + (Math.random() * 0.15 - 0.07)));
        });
        setWavePeaks(synthPeaks);
        setIsLoadingAudio(false);
      });

    return () => {
      isMounted = false;
      stopAudioPlayback();
      if (ctx.state !== 'closed') {
        try {
          ctx.close();
        } catch (err) {
          console.debug('[WaveformTimingEditor] AudioContext close error:', err);
        }
      }
    };
  }, [isOpen, resolvedAudioUrl, stopAudioPlayback]);

  // Active displayed words depending on viewMode
  const displayedWords =
    viewMode === 'all'
      ? unifiedWords
      : unifiedWords.filter((w) => w.ayahIdx === activeAyahFocusIdx);

  const playFromTime = useCallback(
    async (startSec: number, endLimitSec?: number) => {
      stopAudioPlayback();
      const ctx = audioContextRef.current;
      if (!ctx || !audioBuffer) return;

      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (err) {
          console.debug('[WaveformTimingEditor] AudioContext resume error:', err);
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackSpeed;
      source.connect(ctx.destination);

      const boundedStart = Math.max(0, Math.min(startSec, audioDuration));
      source.start(0, boundedStart);

      audioSourceRef.current = source;
      startTimeRef.current = ctx.currentTime - boundedStart / playbackSpeed;
      setIsPlaying(true);

      const loop = () => {
        if (!audioSourceRef.current) return;
        const elapsed = (ctx.currentTime - startTimeRef.current) * playbackSpeed;
        currentTimeRef.current = elapsed;

        if (endLimitSec && elapsed >= endLimitSec) {
          if (isLoopingWord) {
            playFromTime(startSec, endLimitSec);
            return;
          } else {
            stopAudioPlayback();
            setCurrentTime(endLimitSec);
            return;
          }
        }

        if (elapsed >= audioDuration) {
          stopAudioPlayback();
          setCurrentTime(0);
          return;
        }

        // Throttle React state updates (~30fps) to eliminate 60fps component thrashing
        const now = performance.now();
        if (now - lastStateUpdateRef.current >= 33) {
          lastStateUpdateRef.current = now;
          setCurrentTime(elapsed);
        }
        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);

      source.onended = () => {
        if (!endLimitSec || currentTimeRef.current >= endLimitSec - 0.05) {
          stopAudioPlayback();
        }
      };
    },
    [audioBuffer, audioDuration, playbackSpeed, isLoopingWord, stopAudioPlayback]
  );

  const toggleGlobalPlay = () => {
    if (isPlaying) {
      pauseTimeRef.current = currentTime;
      stopAudioPlayback();
    } else {
      playFromTime(currentTime >= audioDuration - 0.1 ? 0 : currentTime);
    }
  };

  const playSoloWord = (idx: number) => {
    const word = displayedWords[idx];
    if (!word) return;
    setSelectedWordIndex(idx);
    playFromTime(word.globalStartTime, word.globalEndTime);
  };

  // Draw Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || wavePeaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Background ruler grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(0, 0, width, height);

    // Center baseline
    const midY = height / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // Draw acoustic peak bars
    const barWidth = Math.max(2, width / wavePeaks.length);
    const gap = 1;

    wavePeaks.forEach((peak, i) => {
      const x = i * barWidth;
      const barH = Math.max(4, peak * (height * 0.82));
      const top = midY - barH / 2;

      const peakTime = (i / wavePeaks.length) * audioDuration;
      const isPlayed = peakTime <= currentTime;

      const selectedWord = displayedWords[selectedWordIndex];
      const isInsideSelectedWord =
        selectedWord &&
        peakTime >= selectedWord.globalStartTime &&
        peakTime <= selectedWord.globalEndTime;

      if (isInsideSelectedWord) {
        ctx.fillStyle = isPlayed ? '#fbbf24' : '#f59e0b'; // Gold
      } else if (isPlayed) {
        ctx.fillStyle = '#38bdf8'; // Sky blue played
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      }

      ctx.beginPath();
      ctx.roundRect(x, top, Math.max(1, barWidth - gap), barH, 2);
      ctx.fill();
    });
  }, [wavePeaks, currentTime, audioDuration, displayedWords, selectedWordIndex]);

  // Handle Drag Start
  const handleDragStart = (
    e: React.MouseEvent,
    wordIdx: number,
    mode: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.stopPropagation();
    const word = displayedWords[wordIdx];
    if (!word) return;

    setSelectedWordIndex(wordIdx);
    setDragState({
      wordIndex: wordIdx,
      mode,
      startX: e.clientX,
      initialStart: word.globalStartTime,
      initialEnd: word.globalEndTime,
    });
  };

  // Global mouse move & up listeners for drag with Strict Clamping & Previous Word Anchor
  useEffect(() => {
    if (!dragState || !timelineRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const timelineEl = timelineRef.current;
      if (!timelineEl) return;

      const rect = timelineEl.getBoundingClientRect();
      const deltaPixels = e.clientX - dragState.startX;
      const pixelsPerSecond = rect.width / audioDuration;
      const deltaSeconds = deltaPixels / pixelsPerSecond;

      setUnifiedWords((prevWords) => {
        const next = [...prevWords];
        const targetWord = displayedWords[dragState.wordIndex];
        if (!targetWord) return prevWords;

        const realIndex = next.findIndex((w) => w.id === targetWord.id);
        if (realIndex === -1) return prevWords;

        if (lockedWordIds.has(targetWord.id)) return prevWords;

        const current = { ...next[realIndex] };
        const prevWord = next[realIndex - 1];

        const minDuration = 0.08; // 80ms minimum duration

        if (dragState.mode === 'resize-start') {
          // Dragging LEFT handle: Adjust Start Time
          const minAllowed = prevWord ? prevWord.globalStartTime + minDuration : 0;
          const maxAllowed = current.globalEndTime - minDuration;
          const newStart = Math.max(
            minAllowed,
            Math.min(maxAllowed, dragState.initialStart + deltaSeconds)
          );

          current.globalStartTime = Math.round(newStart * 1000) / 1000;

          // Rolling Edit on prevWord
          if (prevWord && !lockedWordIds.has(prevWord.id)) {
            const updatedPrev = { ...prevWord };
            updatedPrev.globalEndTime = Math.min(
              current.globalStartTime,
              Math.max(updatedPrev.globalStartTime + minDuration, current.globalStartTime)
            );
            next[realIndex - 1] = updatedPrev;
          }

          next[realIndex] = current;
        } else if (dragState.mode === 'resize-end') {
          // Dragging RIGHT handle: Adjust End Time
          const minAllowed = current.globalStartTime + minDuration;

          let trailingUnlockedCount = 0;
          for (let i = realIndex + 1; i < next.length; i++) {
            if (!lockedWordIds.has(next[i].id)) trailingUnlockedCount++;
          }
          const maxAllowedByAudio = audioDuration - trailingUnlockedCount * minDuration;
          const newEnd = Math.max(
            minAllowed,
            Math.min(maxAllowedByAudio, dragState.initialEnd + deltaSeconds)
          );

          current.globalEndTime = Math.round(newEnd * 1000) / 1000;
          next[realIndex] = current;

          if (isMagneticPushEnabled) {
            let prevEdge = current.globalEndTime;
            for (let i = realIndex + 1; i < next.length; i++) {
              const neighbor = { ...next[i] };
              if (lockedWordIds.has(neighbor.id)) break;
              const neighborDur = Math.max(
                minDuration,
                neighbor.globalEndTime - neighbor.globalStartTime
              );
              if (neighbor.globalStartTime < prevEdge + 0.01) {
                neighbor.globalStartTime = Math.round((prevEdge + 0.01) * 1000) / 1000;
                neighbor.globalEndTime = Math.min(
                  audioDuration,
                  Math.round((neighbor.globalStartTime + neighborDur) * 1000) / 1000
                );
                next[i] = neighbor;
                prevEdge = neighbor.globalEndTime;
              } else {
                break;
              }
            }
          }
        } else if (dragState.mode === 'move') {
          // Dragging WORD BODY: Move whole segment
          const duration = dragState.initialEnd - dragState.initialStart;

          const minAllowed = prevWord
            ? lockedWordIds.has(prevWord.id)
              ? prevWord.globalEndTime
              : 0
            : 0;

          let trailingUnlockedCount = 0;
          for (let i = realIndex + 1; i < next.length; i++) {
            if (!lockedWordIds.has(next[i].id)) trailingUnlockedCount++;
          }
          const maxAllowedEnd = audioDuration - trailingUnlockedCount * minDuration;

          let newStart = Math.max(minAllowed, dragState.initialStart + deltaSeconds);
          let newEnd = newStart + duration;

          if (newEnd > maxAllowedEnd) {
            newEnd = maxAllowedEnd;
            newStart = Math.max(minAllowed, newEnd - duration);
          }

          current.globalStartTime = Math.round(newStart * 1000) / 1000;
          current.globalEndTime = Math.round(newEnd * 1000) / 1000;
          next[realIndex] = current;

          if (isMagneticPushEnabled) {
            let prevEdge = current.globalEndTime;
            for (let i = realIndex + 1; i < next.length; i++) {
              const neighbor = { ...next[i] };
              if (lockedWordIds.has(neighbor.id)) break;
              const neighborDur = Math.max(
                minDuration,
                neighbor.globalEndTime - neighbor.globalStartTime
              );
              if (neighbor.globalStartTime < prevEdge + 0.01) {
                neighbor.globalStartTime = Math.round((prevEdge + 0.01) * 1000) / 1000;
                neighbor.globalEndTime = Math.min(
                  audioDuration,
                  Math.round((neighbor.globalStartTime + neighborDur) * 1000) / 1000
                );
                next[i] = neighbor;
                prevEdge = neighbor.globalEndTime;
              } else {
                break;
              }
            }
          }
        }

        return next;
      });
    };

    const handleMouseUp = () => {
      if (dragState) {
        pushHistoryState(unifiedWords);
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragState,
    audioDuration,
    displayedWords,
    isMagneticPushEnabled,
    lockedWordIds,
    pushHistoryState,
    unifiedWords,
  ]);

  // Click on ruler to seek
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const targetSec = (clickX / rect.width) * audioDuration;
    setCurrentTime(targetSec);
    if (isPlaying) {
      playFromTime(targetSec);
    }
  };

  // Micro-Nudge Selected Word (±0.05s)
  const handleMicroNudge = (deltaSec: number) => {
    const targetWord = displayedWords[selectedWordIndex];
    if (!targetWord || lockedWordIds.has(targetWord.id)) return;

    setUnifiedWords((prev) => {
      const next = [...prev];
      const realIdx = next.findIndex((w) => w.id === targetWord.id);
      if (realIdx === -1) return prev;

      const current = { ...next[realIdx] };
      const duration = current.globalEndTime - current.globalStartTime;
      const newStart = Math.max(
        0,
        Math.min(audioDuration - duration, current.globalStartTime + deltaSec)
      );
      const newEnd = newStart + duration;

      current.globalStartTime = Math.round(newStart * 1000) / 1000;
      current.globalEndTime = Math.round(newEnd * 1000) / 1000;
      next[realIdx] = current;
      pushHistoryState(next);
      return next;
    });
  };

  // Feature 2: Smart Acoustic Silence & Speech Peak Auto-Snap 🎙️⚡
  const handleAutoSnapAcoustic = useCallback(() => {
    if (unifiedWords.length === 0) return;

    let speechIntervals: Array<{ start: number; end: number }> = [];

    if (audioBuffer) {
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const frameDuration = 0.02; // 20ms frames
      const frameSize = Math.floor(sampleRate * frameDuration);
      const numFrames = Math.floor(channelData.length / frameSize);

      const energies: number[] = [];
      let totalEnergy = 0;

      for (let i = 0; i < numFrames; i++) {
        let sum = 0;
        const startSample = i * frameSize;
        for (let j = 0; j < frameSize; j++) {
          const val = channelData[startSample + j] || 0;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / frameSize);
        energies.push(rms);
        totalEnergy += rms;
      }

      const avgEnergy = totalEnergy / Math.max(1, numFrames);
      const speechThreshold = Math.max(0.012, avgEnergy * 0.4);

      let inSpeech = false;
      let curStart = 0;

      for (let i = 0; i < numFrames; i++) {
        const time = i * frameDuration;
        const isLoud = energies[i] >= speechThreshold;

        if (isLoud && !inSpeech) {
          inSpeech = true;
          curStart = Math.max(0, time - 0.03); // Slight attack lead
        } else if (!isLoud && inSpeech) {
          let silenceCount = 0;
          for (let k = 1; k <= 4 && i + k < numFrames; k++) {
            if (energies[i + k] < speechThreshold) silenceCount++;
          }
          if (silenceCount >= 3) {
            inSpeech = false;
            const curEnd = Math.min(audioDuration, time + 0.03);
            if (curEnd - curStart >= 0.08) {
              speechIntervals.push({ start: curStart, end: curEnd });
            }
          }
        }
      }

      if (inSpeech) {
        speechIntervals.push({ start: curStart, end: audioDuration });
      }
    }

    if (speechIntervals.length === 0) {
      speechIntervals = [{ start: 0.1, end: Math.max(0.5, audioDuration - 0.1) }];
    }

    // Merge pauses smaller than 140ms
    const mergedIntervals: Array<{ start: number; end: number }> = [];
    for (const interval of speechIntervals) {
      if (mergedIntervals.length === 0) {
        mergedIntervals.push({ ...interval });
      } else {
        const prev = mergedIntervals[mergedIntervals.length - 1];
        if (interval.start - prev.end < 0.14) {
          prev.end = interval.end;
        } else {
          mergedIntervals.push({ ...interval });
        }
      }
    }

    const totalSpeechDuration = mergedIntervals.reduce(
      (sum, inv) => sum + (inv.end - inv.start),
      0
    );
    const totalLetters = unifiedWords.reduce(
      (sum, w) => sum + Math.max(2, (w.text || '').replace(/[ً-ْ]/g, '').length),
      0
    );

    let currentIntervalIdx = 0;
    let intervalConsumed = 0;

    const snappedWords: UnifiedWordItem[] = unifiedWords.map((w) => {
      if (lockedWordIds.has(w.id)) return w;

      const wordLetters = Math.max(2, (w.text || '').replace(/[ً-ْ]/g, '').length);
      const targetDuration = Math.max(0.1, (wordLetters / totalLetters) * totalSpeechDuration);

      let curInv =
        mergedIntervals[currentIntervalIdx] || mergedIntervals[mergedIntervals.length - 1];
      let wStart = curInv.start + intervalConsumed;
      let wEnd = wStart + targetDuration;

      if (wEnd > curInv.end && currentIntervalIdx < mergedIntervals.length - 1) {
        currentIntervalIdx++;
        curInv = mergedIntervals[currentIntervalIdx];
        intervalConsumed = 0;
        wStart = curInv.start;
        wEnd = wStart + targetDuration;
      }

      intervalConsumed += targetDuration;

      return {
        ...w,
        globalStartTime: Math.max(0, Math.round(wStart * 1000) / 1000),
        globalEndTime: Math.min(audioDuration, Math.round(wEnd * 1000) / 1000),
      };
    });

    pushHistoryState(snappedWords);
    setUnifiedWords(snappedWords);
    triggerNotification(`⚡ تمت المحاذاة الذكية لـ ${snappedWords.length} كلمة بنبضات الصوت!`);
  }, [audioBuffer, audioDuration, unifiedWords, lockedWordIds, pushHistoryState]);

  // Smart Alignment: Distribute All Words Evenly Across Entire Timeline
  const handleDistributeEvenly = () => {
    if (unifiedWords.length === 0) return;
    const wordDur = audioDuration / unifiedWords.length;
    const evenly = unifiedWords.map((w, idx) => {
      if (lockedWordIds.has(w.id)) return w;
      return {
        ...w,
        globalStartTime: Math.round(idx * wordDur * 1000) / 1000,
        globalEndTime: Math.round((idx + 1) * wordDur * 1000) / 1000,
      };
    });
    pushHistoryState(evenly);
    setUnifiedWords(evenly);
    triggerNotification('🪄 تم التوزيع الزمني المتساوي');
  };

  // Smart Alignment: Shift All (Nudge)
  const handleShiftAll = (deltaSec: number) => {
    setUnifiedWords((prev) => {
      const shifted = prev.map((w) => {
        if (lockedWordIds.has(w.id)) return w;
        const s = Math.max(0, Math.min(audioDuration - 0.1, w.globalStartTime + deltaSec));
        const e = Math.max(s + 0.1, Math.min(audioDuration, w.globalEndTime + deltaSec));
        return {
          ...w,
          globalStartTime: Math.round(s * 1000) / 1000,
          globalEndTime: Math.round(e * 1000) / 1000,
        };
      });
      pushHistoryState(shifted);
      return shifted;
    });
  };

  // Smart Trimming Tools: 1. Trim Start (Cut everything before selected word)
  const handleTrimStart = (wordIdx: number) => {
    const targetWord = displayedWords[wordIdx];
    if (!targetWord) return;

    const realIdx = unifiedWords.findIndex((w) => w.id === targetWord.id);
    if (realIdx <= 0) return;

    const sliced = unifiedWords.slice(realIdx);
    const startShift = sliced[0].globalStartTime;

    const remapped: UnifiedWordItem[] = sliced.map((w, idx) => ({
      ...w,
      id: idx + 1,
      position: idx + 1,
      globalStartTime: Math.max(0, Math.round((w.globalStartTime - startShift) * 1000) / 1000),
      globalEndTime: Math.max(0.1, Math.round((w.globalEndTime - startShift) * 1000) / 1000),
    }));

    const lastEnd = remapped[remapped.length - 1]?.globalEndTime || 1;
    if (lastEnd > audioDuration || lastEnd < audioDuration * 0.7) {
      const scale = audioDuration / lastEnd;
      remapped.forEach((w) => {
        w.globalStartTime = Math.round(w.globalStartTime * scale * 1000) / 1000;
        w.globalEndTime = Math.round(w.globalEndTime * scale * 1000) / 1000;
      });
    }

    pushHistoryState(remapped);
    setUnifiedWords(remapped);
    setSelectedWordIndex(0);
    triggerNotification('✂️ تم قص وبدء الآية من الكلمة المحددة');
  };

  // Smart Trimming Tools: 2. Trim End (Cut everything after selected word)
  const handleTrimEnd = (wordIdx: number) => {
    const targetWord = displayedWords[wordIdx];
    if (!targetWord) return;

    const realIdx = unifiedWords.findIndex((w) => w.id === targetWord.id);
    if (realIdx < 0 || realIdx >= unifiedWords.length - 1) return;

    const sliced = unifiedWords.slice(0, realIdx + 1);
    const lastEnd = sliced[sliced.length - 1]?.globalEndTime || 1;

    if (lastEnd < audioDuration * 0.9) {
      const scale = audioDuration / lastEnd;
      sliced.forEach((w, idx) => {
        w.id = idx + 1;
        w.position = idx + 1;
        w.globalStartTime = Math.round(w.globalStartTime * scale * 1000) / 1000;
        w.globalEndTime = Math.round(w.globalEndTime * scale * 1000) / 1000;
      });
    } else {
      sliced.forEach((w, idx) => {
        w.id = idx + 1;
        w.position = idx + 1;
      });
    }

    pushHistoryState(sliced);
    setUnifiedWords(sliced);
    setSelectedWordIndex(Math.min(selectedWordIndex, sliced.length - 1));
    triggerNotification('✂️ تم قص وإنهاء الآية عند الكلمة المحددة');
  };

  // Smart Trimming Tools: 3. Delete single word
  const handleDeleteWord = (wordIdx: number) => {
    const targetWord = displayedWords[wordIdx];
    if (!targetWord || unifiedWords.length <= 1) return;

    const nextWords = unifiedWords
      .filter((w) => w.id !== targetWord.id)
      .map((w, idx) => ({
        ...w,
        id: idx + 1,
        position: idx + 1,
      }));

    pushHistoryState(nextWords);
    setUnifiedWords(nextWords);
    setSelectedWordIndex(Math.max(0, Math.min(wordIdx, nextWords.length - 1)));
    triggerNotification('🗑️ تم حذف الكلمة');
  };

  // Smart Trimming Tools: 4. Restore Full Original Verses
  const handleRestoreOriginal = () => {
    if (originalUnifiedBackupRef.current.length > 0) {
      const restored = originalUnifiedBackupRef.current.map((w) => ({ ...w }));
      pushHistoryState(restored);
      setUnifiedWords(restored);
      setSelectedWordIndex(0);
      setLockedWordIds(new Set());
      triggerNotification('🔄 تم استرجاع الآيات الأصلية كاملة');
    }
  };

  // Save changes to full project ayahs
  const handleSaveAndApply = () => {
    const updatedAyahsList: AyahData[] = effectiveAyahs.reduce<AyahData[]>(
      (acc, origAyah, aIdx) => {
        const wordsForThisAyah = unifiedWords.filter((w) => w.ayahIdx === aIdx);

        if (wordsForThisAyah.length === 0) {
          // Verse was completely trimmed or deleted by user -> omit from project!
          return acc;
        }

        const ayahStartSec = Math.min(...wordsForThisAyah.map((w) => w.globalStartTime));
        const ayahEndSec = Math.max(...wordsForThisAyah.map((w) => w.globalEndTime));
        const ayahDurationSec = Math.max(
          0.5,
          Math.round((ayahEndSec - ayahStartSec) * 1000) / 1000
        );

        // Localize word timings relative to Ayah start
        const localizedWords: QuranWord[] = wordsForThisAyah.map((w, idx) => ({
          id: idx + 1,
          position: idx + 1,
          text: w.text,
          charTypeName: w.charTypeName || 'word',
          startTime: Math.max(0, Math.round((w.globalStartTime - ayahStartSec) * 1000) / 1000),
          endTime: Math.max(0.1, Math.round((w.globalEndTime - ayahStartSec) * 1000) / 1000),
        }));

        const reconstructedText = localizedWords.map((w) => w.text).join(' ');
        const updatedChunks = splitAyahIntoWaqfChunks(
          localizedWords,
          reconstructedText,
          ayahDurationSec
        );

        acc.push({
          ...origAyah,
          text: reconstructedText,
          words: localizedWords,
          chunks: updatedChunks,
          duration: ayahDurationSec,
          startTimeMs: Math.round(ayahStartSec * 1000),
          endTimeMs: Math.round(ayahEndSec * 1000),
          isFullSurahFile: effectiveAyahs.length > 1,
        });

        return acc;
      },
      []
    );

    if (onSaveAllAyahs) {
      onSaveAllAyahs(updatedAyahsList);
    }

    if (onSaveWords && updatedAyahsList[activeAyahFocusIdx]) {
      const cur = updatedAyahsList[activeAyahFocusIdx];
      onSaveWords(activeAyahFocusIdx, cur.words || [], cur.chunks || [], cur.text);
    }

    stopAudioPlayback();
    onClose();
  };

  if (!isOpen) return null;

  const selectedWord = displayedWords[selectedWordIndex];
  const isSelectedWordLocked = selectedWord ? lockedWordIds.has(selectedWord.id) : false;
  const playheadPercent = Math.min(100, Math.max(0, (currentTime / (audioDuration || 1)) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-label="محرر التوقيت والموجة الصوتية للكلمات"
    >
      <div className="relative w-full max-w-5xl bg-surface-900 border border-gold-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-start flex flex-col max-h-[92vh] overflow-hidden">
        {/* Floating Action Flash Notification */}
        <AnimatePresence>
          {flashNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-surface-950/95 border border-gold-400 text-gold-300 text-xs font-bold shadow-2xl backdrop-blur flex items-center gap-1.5"
            >
              <span>{flashNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header with Undo/Redo, Timeline Mode Switcher, Ayah info & Save */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopAudioPlayback();
                onClose();
              }}
              className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white/70 hover:text-white transition-all cursor-pointer"
              title="إغلاق المحرر"
            >
              <X size={18} />
            </button>

            {/* Undo / Redo Buttons */}
            <div className="flex items-center bg-surface-950 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                disabled={historyIndex <= 0}
                onClick={handleUndo}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-surface-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
                title="تراجع عن التعديل (Ctrl+Z)"
              >
                <Undo2 size={15} />
              </button>
              <button
                type="button"
                disabled={historyIndex >= history.length - 1}
                onClick={handleRedo}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-surface-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
                title="إعادة التعديل (Ctrl+Y)"
              >
                <Redo2 size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-surface-950 font-extrabold flex items-center gap-1.5 shadow-lg shadow-gold-500/20 transition-all active:scale-95 cursor-pointer text-xs sm:text-sm"
            >
              <Check size={16} className="stroke-[3]" />
              <span>حفظ وتطبيق على الفيديو ✨</span>
            </button>
          </div>

          {/* Mode Switcher & Title */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle: All vs Single */}
            {effectiveAyahs.length > 1 && (
              <div className="flex items-center bg-surface-950 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'all'
                      ? 'bg-gold-400 text-surface-950 shadow-sm font-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Layers size={13} />
                  <span>المسار الموحد (كل الآيات) 📜</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'single'
                      ? 'bg-gold-400 text-surface-950 shadow-sm font-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <FileText size={13} />
                  <span>آية محددة 🔍</span>
                </button>
              </div>
            )}

            {/* Single Mode Ayah Stepper */}
            {viewMode === 'single' && (
              <div className="flex items-center gap-1 bg-surface-950 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  disabled={activeAyahFocusIdx <= 0}
                  onClick={() => setActiveAyahFocusIdx((i) => Math.max(0, i - 1))}
                  className="p-1 rounded-lg text-white/60 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="الآية السابقة"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="text-xs font-bold text-gold-300 font-mono px-2">
                  الآية{' '}
                  {effectiveAyahs[activeAyahFocusIdx]?.numberInSurah || activeAyahFocusIdx + 1} (
                  {activeAyahFocusIdx + 1} من {effectiveAyahs.length})
                </span>
                <button
                  type="button"
                  disabled={activeAyahFocusIdx >= effectiveAyahs.length - 1}
                  onClick={() =>
                    setActiveAyahFocusIdx((i) => Math.min(effectiveAyahs.length - 1, i + 1))
                  }
                  className="p-1 rounded-lg text-white/60 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="الآية التالية"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            )}

            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <span>محرر التوقيت والموجة الصوتية المتصل</span>
                <span className="text-gold-400">🎙️⏱️</span>
              </h3>
              <p className="text-[11px] text-white/40 font-arabic truncate max-w-sm">
                {effectiveAyahs.length > 1
                  ? `مشروع متعدد الآيات (${effectiveAyahs.length} آيات) • مسار زمني موحد متصل`
                  : `سورة ${effectiveAyahs[0]?.surahName || 'المختارة'} • اسحب الكلمات لتطابق الصوت`}
              </p>
            </div>
          </div>
        </div>

        {/* Current Words Display with Verse Color Badges */}
        <div className="p-3 rounded-2xl bg-surface-950/80 border border-white/[0.08] text-center font-arabic text-sm sm:text-base leading-loose flex flex-wrap items-center justify-center gap-2 overflow-y-auto max-h-28 custom-scrollbar shrink-0 shadow-inner">
          {displayedWords.map((w, idx) => {
            const isSelected = selectedWordIndex === idx;
            const isCurrentlyVoiced =
              currentTime >= w.globalStartTime && currentTime <= w.globalEndTime;
            const theme = AYAH_COLOR_THEMES[w.ayahIdx % AYAH_COLOR_THEMES.length];
            const isLocked = lockedWordIds.has(w.id);

            const isFirstWordOfAyah = idx === 0 || displayedWords[idx - 1]?.ayahIdx !== w.ayahIdx;

            return (
              <React.Fragment key={w.id || idx}>
                {isFirstWordOfAyah && viewMode === 'all' && effectiveAyahs.length > 1 && (
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border font-mono ${theme.badge} mx-1`}
                  >
                    ۝ الآية {w.ayahNumberInSurah}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedWordIndex(idx);
                    playSoloWord(idx);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                    isCurrentlyVoiced
                      ? theme.chipActive
                      : isSelected
                        ? theme.chipSelected
                        : theme.chipNormal
                  }`}
                  title={`انقر لاختيار وسماع: «${w.text}» (${w.globalStartTime.toFixed(2)}s - ${w.globalEndTime.toFixed(2)}s)`}
                >
                  <span>{w.text}</span>
                  {isLocked && <Lock size={10} className="text-amber-400" />}
                  {isSelected && !isLocked && <Sparkles size={11} className="text-gold-400" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Smart Word Trimmer & Acoustic Auto-Snap Action Bar */}
        <div className="flex items-center justify-between gap-2 p-2.5 px-3.5 rounded-xl bg-surface-950/90 border border-gold-500/20 text-xs flex-wrap shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/50 text-[11px] font-bold flex items-center gap-1">
              <Scissors size={13} className="text-gold-400" />
              <span>قص المقطع:</span>
            </span>

            {selectedWord && (
              <>
                <button
                  type="button"
                  disabled={selectedWordIndex <= 0}
                  onClick={() => handleTrimStart(selectedWordIndex)}
                  className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-gold-500/20 border border-white/10 hover:border-gold-400/50 text-white hover:text-gold-300 font-bold transition-all disabled:opacity-30 disabled:hover:bg-surface-800 cursor-pointer flex items-center gap-1.5"
                  title="حذف كل الكلمات السابقة والبدء من هذه الكلمة"
                >
                  <Scissors size={12} className="text-gold-400 rotate-180" />
                  <span>البدء من «{selectedWord.text}» (قص ما قبلها)</span>
                </button>

                <button
                  type="button"
                  disabled={selectedWordIndex >= displayedWords.length - 1}
                  onClick={() => handleTrimEnd(selectedWordIndex)}
                  className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-gold-500/20 border border-white/10 hover:border-gold-400/50 text-white hover:text-gold-300 font-bold transition-all disabled:opacity-30 disabled:hover:bg-surface-800 cursor-pointer flex items-center gap-1.5"
                  title="حذف كل الكلمات اللاحقة والانتهاء عند هذه الكلمة"
                >
                  <Scissors size={12} className="text-gold-400" />
                  <span>الانتهاء عند «{selectedWord.text}» (قص ما بعدها)</span>
                </button>

                {/* Micro-Nudge ±0.05s Buttons */}
                <div className="flex items-center gap-0.5 bg-surface-900 p-0.5 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleMicroNudge(-0.05)}
                    className="px-1.5 py-0.5 text-[10px] font-mono text-white/60 hover:text-white rounded hover:bg-surface-800 cursor-pointer"
                    title="تقديم بداية الكلمة -0.05s"
                  >
                    -0.05s
                  </button>
                  <span className="text-[9px] text-white/30 px-0.5 font-bold">دقة</span>
                  <button
                    type="button"
                    onClick={() => handleMicroNudge(0.05)}
                    className="px-1.5 py-0.5 text-[10px] font-mono text-white/60 hover:text-white rounded hover:bg-surface-800 cursor-pointer"
                    title="تأخير الكلمة +0.05s"
                  >
                    +0.05s
                  </button>
                </div>

                {/* Lock Word Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleLockWord(selectedWord.id)}
                  className={`px-2 py-1 rounded-lg border font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isSelectedWordLocked
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-surface-800 border-white/10 text-white/70 hover:text-white'
                  }`}
                  title={
                    isSelectedWordLocked
                      ? 'إلغاء تثبيت الكلمة'
                      : 'تثبيت وقفل توقيت هذه الكلمة لحمايتها من أي حركة أثناء تعديل الكلمات الأخرى'
                  }
                >
                  {isSelectedWordLocked ? (
                    <Lock size={12} className="text-amber-400" />
                  ) : (
                    <Unlock size={12} />
                  )}
                  <span>{isSelectedWordLocked ? 'مثبتة 🔒' : 'تثبيت 🔓'}</span>
                </button>

                <button
                  type="button"
                  disabled={displayedWords.length <= 1}
                  onClick={() => handleDeleteWord(selectedWordIndex)}
                  className="px-2 py-1 rounded-lg bg-surface-800 hover:bg-red-500/20 border border-white/10 hover:border-red-400/40 text-white/80 hover:text-red-300 font-bold transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1"
                  title="حذف هذه الكلمة المنفردة من الآية"
                >
                  <Trash2 size={12} className="text-red-400" />
                  <span>حذف</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Feature 2: Smart Acoustic Silence & Peak Auto-Snap Button */}
            <button
              type="button"
              onClick={handleAutoSnapAcoustic}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-gold-500/30 hover:from-amber-500/30 hover:to-gold-500/40 border border-gold-400/50 text-gold-300 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-gold-500/10 cursor-pointer active:scale-95"
              title="تحليل الملف الصوتي ومحاذاة بدايات ونهايات الكلمات تلقائياً على نبرات الصوت والسكتات"
            >
              <Zap size={13} className="text-gold-400 animate-pulse" />
              <span>محاذاة ذكية لنبرات الصوت ⚡</span>
            </button>

            {/* Magnetic Push Toggle Switch */}
            <button
              type="button"
              onClick={() => setIsMagneticPushEnabled(!isMagneticPushEnabled)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isMagneticPushEnabled
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-sm'
                  : 'bg-surface-800 border-white/10 text-white/50 hover:text-white'
              }`}
              title={
                isMagneticPushEnabled
                  ? 'الدفع التلقائي مفعل: عند تكبير كلمة ستدفع الكلمات اللاحقة تلقائياً دون الحاجة لتعديل كل كلمة'
                  : 'الدفع التلقائي معطل'
              }
            >
              <Magnet
                size={13}
                className={isMagneticPushEnabled ? 'text-amber-400 animate-pulse' : 'text-white/40'}
              />
              <span>دفع الكلمات</span>
              <span
                className={`w-2 h-2 rounded-full ${isMagneticPushEnabled ? 'bg-amber-400' : 'bg-white/20'}`}
              />
            </button>

            <button
              type="button"
              onClick={handleRestoreOriginal}
              className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 border border-white/10 text-white/60 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="استرجاع جميع كلمات ونصوص الآيات الأصلية كاملة"
            >
              <RotateCcw size={11} />
              <span>استعادة</span>
            </button>
          </div>
        </div>

        {/* Interactive Waveform & Draggable Word Track Viewport */}
        <div className="flex-1 flex flex-col bg-surface-950 rounded-2xl border border-white/10 p-3 overflow-hidden space-y-2 shadow-inner">
          {/* Top Bar: Timeline Scale Ruler & Quick Actions */}
          <div className="flex items-center justify-between text-xs text-white/50 px-1 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-gold-400 font-bold">
                ⏱️ {currentTime.toFixed(2)}s / {audioDuration.toFixed(2)}s
              </span>
              {selectedWord && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-gold-400/10 text-gold-300 border border-gold-400/20 text-[11px] font-bold">
                  «{selectedWord.text}»: {selectedWord.globalStartTime.toFixed(2)}s ←{' '}
                  {(selectedWord.globalEndTime - selectedWord.globalStartTime).toFixed(2)}s →{' '}
                  {selectedWord.globalEndTime.toFixed(2)}s
                </span>
              )}
            </div>

            {/* Visual Guide: Start / End orientation */}
            <div className="flex items-center gap-3 text-[10px] text-white/40">
              <span className="flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>المقبض الأيسر = بداية الكلمة ◀</span>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-gold-400 inline-block" />
                <span>المقبض الأيمن = نهاية الكلمة ▶</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-surface-900 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                  className="p-1 text-white/50 hover:text-white cursor-pointer"
                  title="تصغير التايم لاين"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-[11px] font-mono text-gold-400 px-1">{zoomLevel}x</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3.5, z + 0.5))}
                  className="p-1 text-white/50 hover:text-white cursor-pointer"
                  title="تكبير التايم لاين"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Scrollable Track Area (Explicit dir="ltr" ensures standard coordinates) */}
          <div
            ref={timelineRef}
            dir="ltr"
            onClick={handleRulerClick}
            className="relative flex-1 bg-surface-900/90 rounded-xl border border-white/10 overflow-x-auto overflow-y-hidden custom-scrollbar cursor-crosshair"
          >
            <div
              style={{ width: `${Math.max(100, zoomLevel * 100)}%` }}
              className="relative h-full min-h-[160px]"
            >
              {/* 1. Acoustic Waveform Canvas Layer */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* 2. Draggable Word Blocks Track Layer */}
              <div className="absolute inset-0 pt-2 pb-8 px-1 flex items-center">
                {displayedWords.map((w, idx) => {
                  const theme = AYAH_COLOR_THEMES[w.ayahIdx % AYAH_COLOR_THEMES.length];
                  const isSelected = selectedWordIndex === idx;
                  const isLocked = lockedWordIds.has(w.id);
                  const leftPercent = (w.globalStartTime / (audioDuration || 1)) * 100;
                  const widthPercent = Math.max(
                    0.8,
                    ((w.globalEndTime - w.globalStartTime) / (audioDuration || 1)) * 100
                  );

                  const isDraggingThis = dragState && dragState.wordIndex === idx;

                  return (
                    <div
                      key={w.id || idx}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      className={`absolute top-2 bottom-6 rounded-xl border flex items-center justify-between transition-shadow group ${
                        theme.blockBorder
                      } ${
                        isSelected
                          ? 'ring-2 ring-gold-400 shadow-xl shadow-gold-500/30 z-30'
                          : 'hover:brightness-125 z-20'
                      } ${isLocked ? 'ring-1 ring-amber-400/60' : ''}`}
                      title={`«${w.text}» (الآية ${w.ayahNumberInSurah}) (${w.globalStartTime.toFixed(2)}s - ${w.globalEndTime.toFixed(2)}s)${isLocked ? ' [مثبتة 🔒]' : ''}`}
                    >
                      {/* Floating Live Drag Badge Tooltip */}
                      {isDraggingThis && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-surface-950/95 border border-gold-400 text-gold-300 text-[10px] font-mono font-bold shadow-xl z-50 whitespace-nowrap pointer-events-none">
                          {dragState.mode === 'resize-start' &&
                            `⏱️ بداية «${w.text}»: ${w.globalStartTime.toFixed(2)}s`}
                          {dragState.mode === 'resize-end' &&
                            `⏱️ نهاية «${w.text}»: ${w.globalEndTime.toFixed(2)}s`}
                          {dragState.mode === 'move' &&
                            `↔️ «${w.text}»: ${w.globalStartTime.toFixed(2)}s - ${w.globalEndTime.toFixed(2)}s`}
                        </div>
                      )}

                      {/* Left Resize Handle (Start Time: Left Grip ◄) */}
                      <div
                        onMouseDown={(e) => !isLocked && handleDragStart(e, idx, 'resize-start')}
                        className={`w-3.5 h-full rounded-s-lg flex items-center justify-center transition-all z-40 group-hover:opacity-100 opacity-75 ${
                          isLocked ? 'cursor-not-allowed opacity-30' : 'cursor-ew-resize'
                        } ${theme.handleStart}`}
                        title={isLocked ? 'هذه الكلمة مثبتة 🔒' : 'اسحب لتعديل بداية الكلمة ◀'}
                      >
                        <span className="text-[9px] font-mono font-bold select-none leading-none">
                          ◄
                        </span>
                      </div>

                      {/* Middle Draggable Word Body */}
                      <div
                        onMouseDown={(e) => !isLocked && handleDragStart(e, idx, 'move')}
                        className={`flex-1 flex flex-col items-center justify-center px-1 overflow-hidden pointer-events-auto h-full ${
                          isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                        }`}
                      >
                        <span className="font-arabic font-bold text-xs sm:text-sm text-white truncate group-hover:text-gold-200 flex items-center gap-1">
                          <span>{w.text}</span>
                          {isLocked && <Lock size={10} className="text-amber-400" />}
                        </span>
                        <span className="text-[9px] font-mono text-white/50 group-hover:text-gold-300">
                          {(w.globalEndTime - w.globalStartTime).toFixed(2)}s
                        </span>
                      </div>

                      {/* Right Resize Handle (End Time: Right Grip ►) */}
                      <div
                        onMouseDown={(e) => !isLocked && handleDragStart(e, idx, 'resize-end')}
                        className={`w-3.5 h-full rounded-e-lg flex items-center justify-center transition-all z-40 group-hover:opacity-100 opacity-75 ${
                          isLocked ? 'cursor-not-allowed opacity-30' : 'cursor-ew-resize'
                        } ${theme.handleEnd}`}
                        title={isLocked ? 'هذه الكلمة مثبتة 🔒' : 'اسحب لتعديل نهاية الكلمة ▶'}
                      >
                        <span className="text-[9px] font-mono font-bold select-none leading-none">
                          ►
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* End of Audio Boundary Line Guard 🛑 */}
              <div
                style={{ left: '100%' }}
                className="absolute top-0 bottom-0 w-1 bg-red-500/80 z-40 pointer-events-none shadow-[0_0_10px_#ef4444]"
                title="نهاية الملف الصوتي 🛑"
              />

              {/* Playhead Marker */}
              <div
                style={{ left: `${playheadPercent}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-50 shadow-[0_0_10px_#f43f5e] pointer-events-none transition-all duration-75"
              >
                <div className="w-3 h-3 bg-rose-500 rounded-full -translate-x-[5px] -translate-y-1 shadow-md border border-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Toolbar: Audio Playback, Speed, Solo Preview & Smart Alignment Tools */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-surface-950 border border-white/10 shrink-0">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleGlobalPlay}
              className="p-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-surface-950 font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل التلاوة كاملة (المسافة)'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button
              type="button"
              onClick={() => {
                stopAudioPlayback();
                setCurrentTime(0);
              }}
              className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white/70 hover:text-white cursor-pointer"
              title="إعادة من البداية"
            >
              <RotateCcw size={15} />
            </button>

            {/* Solo Word Playback */}
            {selectedWord && (
              <button
                type="button"
                onClick={() => playSoloWord(selectedWordIndex)}
                className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-gold-400/30 text-gold-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="استماع للكلمة المحددة فقط للتأكد من مخرج الحرف"
              >
                <Volume2 size={14} className="text-gold-400" />
                <span>سماع «{selectedWord.text}» 🔊</span>
              </button>
            )}

            {/* Loop Word Toggle */}
            <button
              type="button"
              onClick={() => setIsLoopingWord(!isLoopingWord)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isLoopingWord
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-1 ring-purple-500/50'
                  : 'bg-surface-800 border-white/5 text-white/50 hover:text-white'
              }`}
              title={
                isLoopingWord
                  ? 'إلغاء تكرار الكلمة'
                  : 'تكرار سماع الكلمة باستمرار لتعديل مخرجها بدقة'
              }
            >
              <Repeat size={14} />
            </button>
          </div>

          {/* Speed Presets */}
          <div className="flex items-center gap-1.5 bg-surface-900 p-1 rounded-xl border border-white/10 text-xs">
            <span className="text-[11px] text-white/40 px-1 font-bold">السرعة:</span>
            {[0.5, 0.75, 1.0, 1.25].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-gold-400 text-surface-950 font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Smart Alignment Batch Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDistributeEvenly}
              className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/10 text-white/80 hover:text-gold-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="إعادة توزيع جميع الكلمات غير المثبتة بالتساوي التام على طول المسار الصوتي"
            >
              <Wand2 size={13} className="text-gold-400" />
              <span>توزيع متساوي 🪄</span>
            </button>

            {/* Nudge Left / Right */}
            <div className="flex items-center gap-1 bg-surface-900 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => handleShiftAll(0.1)}
                className="p-1 rounded-lg text-white/70 hover:text-white cursor-pointer text-xs font-mono font-bold"
                title="إزاحة جميع الكلمات غير المثبتة للأمام +0.1s"
              >
                +0.1s ⏩
              </button>
              <button
                type="button"
                onClick={() => handleShiftAll(-0.1)}
                className="p-1 rounded-lg text-white/70 hover:text-white cursor-pointer text-xs font-mono font-bold"
                title="إزاحة جميع الكلمات غير المثبتة للخلف -0.1s"
              >
                ⏪ -0.1s
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
