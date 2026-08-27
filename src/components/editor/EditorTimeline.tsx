import React, { useRef, useState } from 'react';
import { AyahData } from '../../services/quranApi';
import { AudioSettings } from '../../types';
import { ambientSounds } from '../../data/ambientSounds';
import {
  Clock,
  ZoomIn,
  ZoomOut,
  Volume2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface EditorTimelineProps {
  ayahs: AyahData[];
  currentAyahIndex: number;
  audioCurrentTime: number;
  audioDuration: number;
  isPlaying: boolean;
  audioSettings: AudioSettings;
  onSeekToAyah: (index: number) => void;
  formatAudioTime: (sec: number) => string;
  onOpenWaveformEditor?: () => void;
}

export const EditorTimeline: React.FC<EditorTimelineProps> = React.memo(
  ({
    ayahs,
    currentAyahIndex,
    audioCurrentTime,
    audioDuration,
    isPlaying: _isPlaying,
    audioSettings,
    onSeekToAyah,
    formatAudioTime,
    onOpenWaveformEditor,
  }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Total estimated project duration
    const totalDuration =
      audioDuration || ayahs.reduce((acc, a) => acc + (a.duration || 6), 0) || 10;

    // Calculate cumulative start time for each ayah segment
    const segments = ayahs.map((a, idx) => {
      let start = 0;
      for (let i = 0; i < idx; i++) {
        start += ayahs[i].duration || totalDuration / ayahs.length;
      }
      const dur = a.duration || totalDuration / ayahs.length;
      return {
        index: idx,
        ayahNumber: a.numberInSurah,
        text: a.text || (a.words ? a.words.map((w) => w.text).join(' ') : ''),
        startTime: start,
        duration: dur,
        endTime: start + dur,
        wordsCount: a.words?.length || a.text.split(' ').length,
      };
    });

    // Calculate global playback position percentage
    let currentGlobalTime = 0;
    for (let i = 0; i < currentAyahIndex; i++) {
      currentGlobalTime += ayahs[i].duration || totalDuration / (ayahs.length || 1);
    }
    currentGlobalTime += audioCurrentTime;
    const playheadPercent = Math.min(
      100,
      Math.max(0, (currentGlobalTime / (totalDuration || 1)) * 100)
    );

    const ambientName =
      ambientSounds.find((s) => s.id === audioSettings.ambientSoundId)?.name || 'بدون صوت طبيعة';

    return (
      <div className="w-full bg-surface-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl shadow-2xl transition-all duration-300 z-20">
        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-surface-950/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-gold-400 transition-colors cursor-pointer"
            >
              <Clock size={13} className="text-gold-400" />
              <span>الشريط الزمني للآيات والصوت (Timeline)</span>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 font-mono">
              {ayahs.length} {ayahs.length === 1 ? 'آية' : 'آيات'} •{' '}
              {formatAudioTime(currentGlobalTime)} / {formatAudioTime(totalDuration)}
            </span>
          </div>

          {isExpanded && (
            <div className="flex items-center gap-2">
              {/* Draggable Waveform Timing Editor Trigger Button */}
              {onOpenWaveformEditor && (
                <button
                  type="button"
                  onClick={onOpenWaveformEditor}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-gold-400/20 to-amber-500/20 hover:from-gold-400/30 hover:to-amber-500/30 border border-gold-400/30 text-gold-300 text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="تعديل توقيت الكلمات بالسحب على الموجة الصوتية بدقة"
                >
                  <Sliders size={12} className="text-gold-400" />
                  <span>ضبط توقيت الكلمات والموجة 🎙️⏱️</span>
                </button>
              )}

              {/* Ambient indicator */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <Volume2 size={11} />
                <span className="truncate max-w-[100px]">{ambientName}</span>
              </div>

              {/* Zoom timeline scale */}
              <div className="flex items-center gap-1 bg-surface-900 p-0.5 rounded-lg border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                  className="p-1 text-white/50 hover:text-white cursor-pointer"
                  title="تصغير التايم لاين"
                >
                  <ZoomOut size={12} />
                </button>
                <span className="text-[11px] font-mono text-gold-400 px-1">{zoomLevel}x</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="p-1 text-white/50 hover:text-white cursor-pointer"
                  title="تكبير التايم لاين"
                >
                  <ZoomIn size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div
            ref={containerRef}
            className="p-3 overflow-x-auto custom-scrollbar relative space-y-2 select-none"
          >
            {/* Timeline Tracks Container */}
            <div
              style={{ width: `${Math.max(100, zoomLevel * 100)}%`, minWidth: '100%' }}
              className="relative space-y-1.5"
            >
              {/* Playhead Vertical Line */}
              <div
                style={{ left: `${playheadPercent}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-gold-400 z-30 shadow-[0_0_8px_#fbbf24] transition-all duration-75 pointer-events-none"
              >
                <div className="w-2.5 h-2.5 bg-gold-400 rounded-full -translate-x-[4px] -translate-y-1 shadow-md" />
              </div>

              {/* Track 1: Ayah Segment Blocks */}
              <div className="flex items-center gap-1.5 h-11 w-full relative">
                {segments.map((seg) => {
                  const isActive = currentAyahIndex === seg.index;
                  const widthPercent = (seg.duration / totalDuration) * 100;

                  return (
                    <div
                      key={seg.index}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSeekToAyah(seg.index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSeekToAyah(seg.index);
                        }
                      }}
                      aria-label={`انقر للانتقال للآية ${seg.ayahNumber}`}
                      style={{ width: `${Math.max(8, widthPercent)}%` }}
                      className={`h-full rounded-xl border p-1.5 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                        isActive
                          ? 'bg-gradient-to-r from-gold-500/30 to-amber-500/25 border-gold-400 shadow-md shadow-gold-500/20 ring-1 ring-gold-400/40'
                          : 'bg-surface-800/80 hover:bg-surface-700/80 border-white/10 hover:border-white/20'
                      }`}
                      title={`انقر للانتقال للآية ${seg.ayahNumber}`}
                    >
                      {/* Top Row: Ayah Badge & Duration */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-bold flex items-center gap-1 ${isActive ? 'text-gold-300' : 'text-white/70'}`}
                        >
                          <span>﴿{seg.ayahNumber}﴾</span>
                          {isActive && (
                            <Sparkles size={10} className="text-gold-400 animate-pulse" />
                          )}
                        </span>
                        <span className="font-mono text-[10px] text-white/40">
                          {Math.round(seg.duration)}ث
                        </span>
                      </div>

                      {/* Bottom Row: Ayah Text snippet */}
                      <div className="text-[11px] text-white/60 truncate font-arabic group-hover:text-white transition-colors">
                        {seg.text}
                      </div>

                      {/* Word segments mini progress bar inside active block */}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold-400/20">
                          <div
                            style={{ width: `${(audioCurrentTime / (seg.duration || 1)) * 100}%` }}
                            className="h-full bg-gold-400 rounded-full transition-all duration-75"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Track 2: Ambient Background Layer */}
              {audioSettings.ambientSoundId && audioSettings.ambientSoundId !== 'none' && (
                <div className="h-6 w-full rounded-lg bg-purple-950/40 border border-purple-500/20 flex items-center px-2.5 justify-between text-[11px] text-purple-300">
                  <div className="flex items-center gap-1.5">
                    <Volume2 size={11} className="text-purple-400" />
                    <span className="font-bold">طبقة الطبيعة: {ambientName}</span>
                  </div>
                  <span className="font-mono text-[10px] text-purple-400/70">
                    {audioSettings.ambientSoundVolume ?? 22}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
