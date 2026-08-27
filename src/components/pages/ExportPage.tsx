import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppLayout } from '../layout/AppLayout';
import { ExportProgress } from '../ui/ExportProgress';
import { EmptyState } from '../ui/EmptyState';
import { ExportJob, QuranWord } from '../../types';
import {
  fetchAyahsWithAudio,
  fetchTranslation,
  AyahData,
  TranslationData,
} from '../../services/quranApi';
import {
  Download,
  Smartphone,
  Monitor,
  Square,
  Check,
  Zap,
  Star,
  Crown,
  Play,
  Info,
  Loader2,
  X,
  Save,
  Sparkles,
} from 'lucide-react';
import { ViralCaptionGenerator } from '../ui/ViralCaptionGenerator';
import { PublishKitModal } from '../ui/PublishKitModal';
import {
  isWebCodecsExportSupported,
  exportVideoWithWebCodecs,
} from '../../services/webCodecsExportService';

// ==================== Canvas Video Export Engine ====================
interface ExportConfig {
  width: number;
  height: number;
  quality: 'standard' | 'high' | 'premium';
  ayahs: AyahData[];
  translations: TranslationData[];
  showTranslation: boolean;
  textSettings: any;
  backgroundUrl?: string;
  backgroundOpacity: number;
  watermark?: string;
  surahName: string;
}

const ASPECT_SIZES = {
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
};

const QUALITY_BITRATES = {
  standard: 2_500_000,
  high: 5_000_000,
  premium: 10_000_000,
};

/**
 * Render one frame of the video onto a canvas.
 */
function renderFrame(
  ctx: CanvasRenderingContext2D,
  config: ExportConfig,
  currentAyah: AyahData | null,
  currentTranslation: TranslationData | null,
  bgImage: HTMLImageElement | null,
  progress: number // 0-1 for animation
) {
  const { width, height, textSettings, surahName, showTranslation } = config;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1a1a2e');
  bgGrad.addColorStop(0.5, '#16213e');
  bgGrad.addColorStop(1, '#0f0f1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Background image
  if (bgImage) {
    ctx.globalAlpha = config.backgroundOpacity ?? 0.6;
    const imgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    let sx = 0,
      sy = 0,
      sw = bgImage.width,
      sh = bgImage.height;
    if (imgRatio > canvasRatio) {
      sw = bgImage.height * canvasRatio;
      sx = (bgImage.width - sw) / 2;
    } else {
      sh = bgImage.width / canvasRatio;
      sy = (bgImage.height - sh) / 2;
    }
    ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, width, height);
    ctx.globalAlpha = 1.0;
  }

  // Subtle dot pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let x = 0; x < width; x += 30) {
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (!currentAyah) return;

  // Surah name badge
  const badgeY = height * 0.12;
  ctx.font = `${Math.round(width * 0.025)}px "Cairo", sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const badgeText = `سورة ${surahName}`;
  const badgeWidth = ctx.measureText(badgeText).width + 40;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.beginPath();
  ctx.roundRect(width / 2 - badgeWidth / 2, badgeY - 15, badgeWidth, 30, 15);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText(badgeText, width / 2, badgeY);

  // Resolve text positioning
  const position = textSettings?.position || 'center';
  let textCenterY = height / 2;
  if (position === 'top') textCenterY = height * 0.28;
  if (position === 'bottom') textCenterY = height * 0.72;

  // Text background box
  const fontSize = Math.round((textSettings?.fontSize || 28) * (width / 360));
  const padding = width * 0.05;
  const maxWidth = width - padding * 2;

  // Ayah text
  const bgOpacity = textSettings?.bgOpacity ?? 0.5;
  const bgColor = textSettings?.bgColor || '#000000';
  const textColor = textSettings?.textColor || '#ffffff';

  ctx.font = `${textSettings?.fontWeight === 'bold' ? 'bold' : textSettings?.fontWeight === 'light' ? '300' : 'normal'} ${fontSize}px "Amiri", "Cairo", serif`;
  ctx.textAlign = (textSettings?.textAlign as CanvasTextAlign) || 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';

  // Word-by-word karaoke timing calculation
  const isKaraoke =
    textSettings?.wordHighlightEnabled !== false &&
    currentAyah.words &&
    currentAyah.words.length > 0;
  const ayahDuration = currentAyah.duration || 5;
  const currentAyahTime = progress * ayahDuration;
  const wordsList = currentAyah.words || [];

  let activeWordIdx = -1;
  if (isKaraoke && wordsList.length > 0) {
    activeWordIdx = wordsList.findIndex(
      (w: any) => currentAyahTime >= w.startTime && currentAyahTime < w.endTime
    );
    if (activeWordIdx === -1 && currentAyahTime > 0) {
      for (let i = wordsList.length - 1; i >= 0; i--) {
        if (currentAyahTime >= wordsList[i].startTime) {
          activeWordIdx = i;
          break;
        }
      }
    }
  }

  const highlightStyle = textSettings?.wordHighlightStyle || 'goldGlow';
  const highlightColor =
    textSettings?.wordHighlightColor ||
    (highlightStyle === 'emeraldGlow'
      ? '#34d399'
      : highlightStyle === 'amberEmber'
        ? '#f97316'
        : highlightStyle === 'radiantWhite'
          ? '#ffffff'
          : '#fbbf24');
  const inactiveOpacity = textSettings?.inactiveWordOpacity ?? 0.6;

  // Word-wrap the ayah text
  const lines = wrapText(ctx, currentAyah.text, maxWidth);
  const lineHeight = fontSize * 2.0;
  const totalTextHeight = lines.length * lineHeight;

  // Draw text bg box
  const boxPadding = width * 0.04;
  const boxTop = textCenterY - totalTextHeight / 2 - boxPadding;
  const boxHeight = totalTextHeight + boxPadding * 2;

  // Fade-in animation
  const alpha = Math.min(progress * 3, 1);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = hexToRgba(bgColor, bgOpacity);
  ctx.beginPath();
  ctx.roundRect(padding - 10, boxTop, maxWidth + 20, boxHeight, 16);
  ctx.fill();

  // Draw text lines (with word-by-word glow if karaoke is active)
  if (isKaraoke && wordsList.length > 0) {
    let globalWordCounter = 0;
    lines.forEach((line, lineIdx) => {
      const lineY = textCenterY - totalTextHeight / 2 + lineIdx * lineHeight + lineHeight / 2;
      const lineWords = line.split(' ').filter(Boolean);
      const spaceWidth = ctx.measureText(' ').width;

      // Calculate total line width to center/align
      const wordMetrics = lineWords.map((w) => ({ word: w, width: ctx.measureText(w).width }));
      const totalLineWidth =
        wordMetrics.reduce((sum, m) => sum + m.width, 0) + (lineWords.length - 1) * spaceWidth;

      // Starting X position for RTL (right to left)
      let currentX = width / 2 + totalLineWidth / 2;
      if (textSettings?.textAlign === 'right') currentX = width - padding;
      if (textSettings?.textAlign === 'left') currentX = padding + totalLineWidth;

      ctx.textAlign = 'right';

      lineWords.forEach((wordStr) => {
        const currentGlobalWordIdx = globalWordCounter;
        globalWordCounter++;
        const isCurrentActive = activeWordIdx === currentGlobalWordIdx;
        const wordWidth = ctx.measureText(wordStr).width;

        ctx.save();
        if (isCurrentActive) {
          // Active word highlight & glow
          ctx.fillStyle = highlightColor;
          ctx.shadowColor = highlightColor;
          ctx.shadowBlur = 24;

          if (highlightStyle === 'pillBadge') {
            ctx.fillStyle = hexToRgba(highlightColor, 0.25);
            ctx.beginPath();
            ctx.roundRect(
              currentX - wordWidth - 6,
              lineY - fontSize * 0.7,
              wordWidth + 12,
              fontSize * 1.3,
              8
            );
            ctx.fill();
            ctx.strokeStyle = hexToRgba(highlightColor, 0.6);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
          } else if (highlightStyle === 'underlineWave') {
            ctx.strokeStyle = highlightColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(currentX, lineY + fontSize * 0.4);
            ctx.lineTo(currentX - wordWidth, lineY + fontSize * 0.4);
            ctx.stroke();
          }
          ctx.fillText(wordStr, currentX, lineY);
        } else {
          // Inactive words
          ctx.fillStyle = hexToRgba(textColor, activeWordIdx !== -1 ? inactiveOpacity : 1.0);
          ctx.shadowBlur = 0;
          ctx.fillText(wordStr, currentX, lineY);
        }
        ctx.restore();

        currentX -= wordWidth + spaceWidth;
      });
    });
  } else {
    // Normal lines rendering
    ctx.fillStyle = textColor;
    const textX =
      textSettings?.textAlign === 'right'
        ? width - padding
        : textSettings?.textAlign === 'left'
          ? padding
          : width / 2;
    lines.forEach((line, i) => {
      const lineY = textCenterY - totalTextHeight / 2 + i * lineHeight + lineHeight / 2;
      ctx.fillText(line, textX, lineY);
    });
  }

  // Ayah number
  const numText = `﴿ ${currentAyah.numberInSurah} ﴾`;
  ctx.font = `${Math.round(fontSize * 0.5)}px "Cairo", sans-serif`;
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.fillText(numText, width / 2, boxTop + boxHeight + width * 0.03);

  // Translation
  if (showTranslation && currentTranslation) {
    const transFontSize = Math.round(fontSize * 0.4);
    ctx.font = `500 ${transFontSize}px "Cairo", sans-serif`;
    ctx.fillStyle = textSettings?.translationColor || 'rgba(255, 255, 255, 0.92)';
    ctx.textAlign = 'center';
    ctx.direction = 'ltr';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    const transLines = wrapText(ctx, currentTranslation.text, maxWidth);
    const transY = boxTop + boxHeight + width * 0.06;
    transLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, transY + i * transFontSize * 1.5);
    });
    ctx.direction = 'rtl';
  }

  // Islamic Ornaments
  if (
    textSettings?.showIslamicOrnaments !== false &&
    textSettings?.ornamentStyle &&
    textSettings.ornamentStyle !== 'none'
  ) {
    const ornStyle = textSettings.ornamentStyle;
    const ornColor = textSettings.ornamentColor || '#fbbf24';
    const ornOpacity = textSettings.ornamentOpacity ?? 0.75;

    ctx.save();
    ctx.globalAlpha = ornOpacity;
    ctx.strokeStyle = ornColor;
    ctx.fillStyle = ornColor;

    if (ornStyle === 'royalFrame') {
      const frameMargin = width * 0.035;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(frameMargin, frameMargin, width - frameMargin * 2, height - frameMargin * 2);
      ctx.setLineDash([]);

      // Star emblem in header
      ctx.beginPath();
      ctx.arc(width / 2, frameMargin + 10, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (ornStyle === 'geometricArabesque') {
      const ornY = textCenterY - totalTextHeight / 2 - boxPadding - 25;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 40, ornY);
      ctx.lineTo(width / 2 + 40, ornY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(width / 2, ornY, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (ornStyle === 'floralCorners') {
      const cSize = width * 0.06;
      const cMargin = width * 0.025;
      ctx.lineWidth = 2.5;

      // Draw 4 ornate corner brackets
      ctx.strokeRect(cMargin, cMargin, cSize, cSize);
      ctx.strokeRect(width - cMargin - cSize, cMargin, cSize, cSize);
      ctx.strokeRect(cMargin, height - cMargin - cSize, cSize, cSize);
      ctx.strokeRect(width - cMargin - cSize, height - cMargin - cSize, cSize, cSize);
    }
    ctx.restore();
  }

  // Decorative corners
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.2)';
  ctx.lineWidth = 3;
  const corner = width * 0.04;
  const margin = width * 0.03;

  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - margin, margin + corner);
  ctx.lineTo(width - margin, margin);
  ctx.lineTo(width - margin - corner, margin);
  ctx.stroke();

  // Top-left
  ctx.beginPath();
  ctx.moveTo(margin, margin + corner);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + corner, margin);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - margin, height - margin - corner);
  ctx.lineTo(width - margin, height - margin);
  ctx.lineTo(width - margin - corner, height - margin);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(margin, height - margin - corner);
  ctx.lineTo(margin, height - margin);
  ctx.lineTo(margin + corner, height - margin);
  ctx.stroke();

  // Bottom gradient
  const bottomGrad = ctx.createLinearGradient(0, height - 100, 0, height);
  bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, height - 100, width, 100);

  // Cinematic Progress Bar on Canvas
  if (textSettings?.showProgressBar !== false) {
    const barHeight = Math.max(4, Math.round(width * 0.005));
    const barColor = textSettings?.progressBarColor || '#fbbf24';
    const barWidth = Math.min(width, Math.max(0, width * progress));

    ctx.save();
    // Background track
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, height - barHeight, width, barHeight);

    // Active progress fill
    ctx.fillStyle = barColor;
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 12;
    ctx.fillRect(0, height - barHeight, barWidth, barHeight);
    ctx.restore();
  }

  // Watermark with Dynamic Position, Opacity, and Scale
  if (config.watermark && textSettings?.showWatermark !== false) {
    ctx.save();
    const fSize = textSettings?.watermarkFontSize
      ? Math.round(width * (textSettings.watermarkFontSize / 550))
      : Math.round(width * 0.024);
    ctx.font = `600 ${fSize}px sans-serif`;
    ctx.fillStyle = textSettings?.watermarkColor || textSettings?.textColor || '#ffffff';
    ctx.globalAlpha = textSettings?.watermarkOpacity ?? 0.55;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;

    const marginX = Math.round(width * 0.06);
    const marginY = Math.round(height * 0.04);
    let wx = width / 2;
    let wy = height - marginY;
    let align: CanvasTextAlign = 'center';
    let baseline: CanvasTextBaseline = 'bottom';

    switch (textSettings?.watermarkPosition) {
      case 'topLeft':
        wx = marginX;
        wy = marginY;
        align = 'left';
        baseline = 'top';
        break;
      case 'top':
        wx = width / 2;
        wy = marginY;
        align = 'center';
        baseline = 'top';
        break;
      case 'topRight':
        wx = width - marginX;
        wy = marginY;
        align = 'right';
        baseline = 'top';
        break;
      case 'bottomLeft':
        wx = marginX;
        wy = height - marginY;
        align = 'left';
        baseline = 'bottom';
        break;
      case 'bottomRight':
        wx = width - marginX;
        wy = height - marginY;
        align = 'right';
        baseline = 'bottom';
        break;
      case 'center':
        wx = width / 2;
        wy = height / 2;
        align = 'center';
        baseline = 'middle';
        break;
      case 'bottom':
      default:
        wx = width / 2;
        wy = height - marginY;
        align = 'center';
        baseline = 'bottom';
        break;
    }

    if (textSettings?.watermarkX) {
      wx += Math.round(width * (textSettings.watermarkX / 270));
    }
    if (textSettings?.watermarkY) {
      wy += Math.round(height * (textSettings.watermarkY / 480));
    }

    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(config.watermark, wx, wy);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ==================== Export Page Component ====================
export const ExportPage: React.FC = () => {
  const exportJobs = useAppStore((s) => s.exportJobs);
  const currentProject = useAppStore((s) => s.currentProject);
  const addExportJob = useAppStore((s) => s.addExportJob);
  const updateExportJob = useAppStore((s) => s.updateExportJob);
  const addToast = useAppStore((s) => s.addToast);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const settings = useAppStore((s) => s.settings);

  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>(
    currentProject?.aspectRatio || '9:16'
  );
  const [quality, setQuality] = useState<'standard' | 'high' | 'premium'>('high');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activePublishJob, setActivePublishJob] = useState<ExportJob | null>(null);
  const exportCancelledRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real export: renders video frame-by-frame with audio
  const performRealExport = useCallback(
    async (jobId: string) => {
      if (!currentProject) return;

      exportCancelledRef.current = false;
      const dims = ASPECT_SIZES[aspectRatio];

      try {
        // Load ayahs with audio (or Hadith / custom text)
        updateExportJob(jobId, { status: 'processing', progress: 5 });

        let ayahs: AyahData[] = [];
        if (
          currentProject.customText ||
          currentProject.contentType === 'hadith' ||
          currentProject.contentType === 'azkar'
        ) {
          const text = currentProject.customText || currentProject.name;
          const audioUrl =
            currentProject.customAudioUrl || `/api/tts?text=${encodeURIComponent(text)}`;
          const rawWords = text.split(/\s+/).filter(Boolean);
          const totalWords = Math.max(rawWords.length, 1);
          const estimatedTotalSec = 10;
          const secPerWord = estimatedTotalSec / totalWords;

          const words: QuranWord[] = rawWords.map((w, idx) => ({
            id: idx + 1,
            position: idx + 1,
            text: w,
            startTime: idx * secPerWord,
            endTime: (idx + 1) * secPerWord,
            charTypeName: 'word',
          }));

          ayahs = [
            {
              number: 1,
              numberInSurah: 1,
              surahNumber: 0,
              surahName: currentProject.customTitle || currentProject.name,
              text: text,
              audioUrl: audioUrl,
              juz: 1,
              page: 1,
              words,
            },
          ];
        } else {
          const activeReciter =
            currentProject.reciterId === 'custom_voice' ||
            currentProject.audioSettings?.customRecordedAudioUrl
              ? 'alafasy_128'
              : currentProject.reciterId;
          ayahs = await fetchAyahsWithAudio(
            currentProject.surahNumber,
            currentProject.fromAyah,
            currentProject.toAyah,
            activeReciter
          );
          const customVoice =
            currentProject.audioSettings?.customRecordedAudioUrl || currentProject.customAudioUrl;
          if (
            customVoice &&
            (currentProject.reciterId === 'custom_voice' ||
              currentProject.audioSettings?.customRecordedAudioUrl ||
              currentProject.customAudioUrl)
          ) {
            ayahs.forEach((a, idx) => {
              if (idx === 0 || ayahs.length === 1) {
                a.audioUrl = customVoice;
              }
            });
          }
        }

        if (exportCancelledRef.current) return;

        let translations: TranslationData[] = [];
        if (currentProject.translationEnabled && currentProject.surahNumber > 0) {
          translations = await fetchTranslation(
            currentProject.surahNumber,
            currentProject.fromAyah,
            currentProject.toAyah
          );
        }

        // Check if Electron Native FFmpeg Background Pipeline is available
        if (window.electronAPI?.videoExport?.start) {
          const unbindProgress = window.electronAPI.videoExport.onProgress((data) => {
            if (!exportCancelledRef.current) {
              const pct = Math.min(99, Math.max(5, Math.round(data.percent)));
              updateExportJob(jobId, { progress: pct });
              setExportProgress(pct);
            }
          });

          try {
            const resolvedAudioUrls = await Promise.all(
              ayahs.map(async (a) => {
                const u = a.audioUrl;
                if (u && typeof u === 'string' && u.startsWith('blob:')) {
                  try {
                    const res = await fetch(u);
                    const blob = await res.blob();
                    return new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.onerror = () => resolve(u);
                      reader.readAsDataURL(blob);
                    });
                  } catch {
                    return u;
                  }
                }
                return u;
              })
            );

            const exportResult = await window.electronAPI.videoExport.start({
              projectName: currentProject.name,
              aspectRatio,
              quality,
              ayahs: ayahs.map((a, idx) => ({
                text: a.text,
                startTime: 0,
                endTime: 0,
                numberInSurah: a.numberInSurah,
                translationText: translations[idx]?.text,
                words: a.words,
                chunks: a.chunks,
              })),
              audioUrls: resolvedAudioUrls.filter(Boolean) as string[],
              backgroundPath: currentProject.backgroundUrl,
              bgOpacity: currentProject.backgroundOpacity ?? 0.65,
              watermark: currentProject.watermark,
              transition: 'fade',
              videoEffect: 'none',
              textSettings: currentProject.textSettings,
              audioSettings: currentProject.audioSettings,
              surahName: currentProject.surah,
            });

            unbindProgress();

            if (exportResult?.success && exportResult.outputPath) {
              updateExportJob(jobId, {
                status: 'completed',
                progress: 100,
                outputPath: exportResult.outputPath,
              });
              setIsExporting(false);
              setExportProgress(100);
              addToast({
                message: 'تم تصدير الفيديو بنجاح عبر محرك FFmpeg فائق السرعة! 🎬✨',
                type: 'success',
              });
              return;
            }
          } catch (nativeErr) {
            unbindProgress();
            console.warn(
              '[ExportPage] Native FFmpeg export failed, falling back to canvas/web export:',
              nativeErr
            );
          }
        }

        updateExportJob(jobId, { progress: 15 });

        // Setup canvas
        const canvas = document.createElement('canvas');
        canvas.width = dims.width;
        canvas.height = dims.height;
        canvasRef.current = canvas;
        const ctx = canvas.getContext('2d')!;

        // Load background image if any
        let bgImage: HTMLImageElement | null = null;
        if (currentProject.backgroundUrl) {
          try {
            bgImage = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new window.Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = currentProject.backgroundUrl!;
            });
          } catch {
            console.warn('Could not load background image for export');
          }
        }

        // Pre-load scene backgrounds if any
        const sceneBgImages: Record<number, HTMLImageElement> = {};
        if (
          currentProject.textSettings?.sceneBackgrounds &&
          Object.keys(currentProject.textSettings.sceneBackgrounds).length > 0
        ) {
          const entries = Object.entries(currentProject.textSettings.sceneBackgrounds);
          await Promise.all(
            entries.map(async ([idxStr, sceneUrl]) => {
              if (!sceneUrl) return;
              try {
                const img = new window.Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve) => {
                  img.onload = () => resolve(null);
                  img.onerror = () => resolve(null);
                  img.src = sceneUrl;
                });
                sceneBgImages[Number(idxStr)] = img;
              } catch (e) {
                console.warn('Could not load scene background:', sceneUrl, e);
              }
            })
          );
        }

        updateExportJob(jobId, { progress: 20 });

        if (exportCancelledRef.current) return;

        // Determine audio durations by loading each audio to get duration
        const ayahDurations: number[] = [];
        for (let i = 0; i < ayahs.length; i++) {
          if (exportCancelledRef.current) return;

          try {
            const duration = await getAudioDuration(ayahs[i].audioUrl);
            ayahDurations.push(duration);
          } catch {
            ayahDurations.push(3); // fallback 3 seconds
          }

          updateExportJob(jobId, {
            progress: 20 + Math.round((i / ayahs.length) * 20),
          });
        }

        const totalDuration = ayahDurations.reduce((a, b) => a + b, 0);

        updateExportJob(jobId, { progress: 40 });

        if (exportCancelledRef.current) return;

        // ── WebCodecs Ultra-Fast MP4 Export Engine (5x-10x Faster than Realtime) ──
        const canUseWebCodecs = await isWebCodecsExportSupported();
        if (canUseWebCodecs) {
          const ayahTimeline = ayahs.map((a, i) => {
            let start = 0;
            for (let j = 0; j < i; j++) {
              start += ayahDurations[j];
            }
            return {
              start,
              end: start + ayahDurations[i],
              duration: ayahDurations[i],
              ayah: a,
            };
          });

          const mp4Blob = await exportVideoWithWebCodecs({
            width: dims.width,
            height: dims.height,
            fps: 30,
            bitrate: QUALITY_BITRATES[quality],
            ayahs,
            timeline: ayahTimeline,
            totalDurationSec: totalDuration,
            audioUrls: ayahs.map((a) => a.audioUrl).filter(Boolean),
            bgImage,
            sceneBgImages,
            bgOpacity: currentProject.backgroundOpacity ?? 0.6,
            textSettings: currentProject.textSettings,
            audioSettings: currentProject.audioSettings,
            watermark: currentProject.watermark,
            projectName: currentProject.name,
            surahName: currentProject.surah || '',
            showTranslation: currentProject.translationEnabled,
            onProgress: ({ percent }) => {
              updateExportJob(jobId, { progress: Math.min(95, 40 + Math.round(percent * 0.55)) });
            },
          });

          updateExportJob(jobId, { progress: 98 });
          const downloadUrl = URL.createObjectURL(mp4Blob);

          let savePathPref = undefined;
          if (settings?.projectsPath) {
            savePathPref = `${settings.projectsPath}/${currentProject.name}.mp4`;
          }
          const savedPath = await saveVideoBlob(
            mp4Blob,
            `${currentProject.name}.mp4`,
            savePathPref
          );

          const completedJob = {
            id: jobId,
            projectId: currentProject.id,
            projectName: currentProject.name,
            aspectRatio,
            quality,
            status: 'completed' as const,
            progress: 100,
            outputPath: savedPath || undefined,
            downloadUrl,
            createdAt: new Date().toISOString(),
          };

          updateExportJob(jobId, completedJob);
          setIsExporting(false);
          setExportProgress(100);

          addToast({
            message:
              'تم التصدير فائق السرعة بنجاح بصيغة MP4 القياسية! 🚀 اضغط لفتح عدة النشر والكابشن والهاشتاجات',
            type: 'success',
            duration: 8000,
            action: {
              label: 'عدة النشر 🚀',
              onClick: () => {
                setActivePublishJob(completedJob as any);
              },
            },
          });
          return;
        }

        // ── Fallback: Setup MediaRecorder (Legacy Browser Mode) ──
        const stream = canvas.captureStream(30); // 30fps

        // Create audio context to merge all audio
        const audioCtx = new AudioContext();
        const dest = audioCtx.createMediaStreamDestination();

        // Add audio track to the stream
        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) {
          stream.addTrack(audioTrack);
        }

        const bitrate = QUALITY_BITRATES[quality];
        const chunks: Blob[] = [];

        // Try different codecs
        const mimeTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
        ];

        let selectedMime = 'video/webm';
        for (const mime of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mime)) {
            selectedMime = mime;
            break;
          }
        }

        const recorder = new MediaRecorder(stream, {
          mimeType: selectedMime,
          videoBitsPerSecond: bitrate,
        });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        const exportPromise = new Promise<Blob>((resolve, reject) => {
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: selectedMime });
            resolve(blob);
          };
          recorder.onerror = (e) => reject(e);
        });

        recorder.start(100);

        // Render frames for each ayah
        let currentTime = 0;
        const fps = 30;

        for (let ayahIdx = 0; ayahIdx < ayahs.length; ayahIdx++) {
          if (exportCancelledRef.current) {
            recorder.stop();
            audioCtx.close();
            return;
          }

          const duration = ayahDurations[ayahIdx];
          const totalFrames = Math.ceil(duration * fps);

          // Play the audio for this ayah through AudioContext
          try {
            const audioBuffer = await fetchAudioBuffer(audioCtx, ayahs[ayahIdx].audioUrl);
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(dest);
            source.start(audioCtx.currentTime);
          } catch {
            // Audio failed, still render the frame silently
          }

          const config: ExportConfig = {
            width: dims.width,
            height: dims.height,
            quality,
            ayahs,
            translations,
            showTranslation: currentProject.translationEnabled,
            textSettings: currentProject.textSettings,
            backgroundUrl: currentProject.backgroundUrl,
            backgroundOpacity: currentProject.backgroundOpacity ?? 0.6,
            watermark: currentProject.watermark,
            surahName: currentProject.surah || '',
          };

          // Render frames for this ayah's duration
          for (let frame = 0; frame < totalFrames; frame++) {
            if (exportCancelledRef.current) {
              recorder.stop();
              audioCtx.close();
              return;
            }

            const progress = frame / totalFrames;
            renderFrame(
              ctx,
              config,
              ayahs[ayahIdx],
              translations[ayahIdx] || null,
              bgImage,
              progress
            );

            // Wait for next frame
            await new Promise((r) => setTimeout(r, 1000 / fps));
          }

          currentTime += duration;
          const exportPct = 40 + Math.round((currentTime / totalDuration) * 50);
          updateExportJob(jobId, { progress: Math.min(exportPct, 90) });
        }

        // Stop recording
        recorder.stop();
        await audioCtx.close();

        const videoBlob = await exportPromise;

        updateExportJob(jobId, { progress: 95 });

        // Create a download URL from the blob (works in browser and Electron)
        const downloadUrl = URL.createObjectURL(videoBlob);

        // Try to also save to file system
        let savePathPref = undefined;
        if (settings?.projectsPath) {
          savePathPref = `${settings.projectsPath}/${currentProject.name}.webm`;
        }
        const savedPath = await saveVideoBlob(videoBlob, currentProject.name, savePathPref);

        const completedJob = {
          id: jobId,
          projectId: currentProject.id,
          projectName: currentProject.name,
          aspectRatio,
          quality,
          status: 'completed' as const,
          progress: 100,
          outputPath: savedPath || undefined,
          downloadUrl,
          createdAt: new Date().toISOString(),
        };

        updateExportJob(jobId, completedJob);

        addToast({
          message: 'تم التصدير بنجاح! 🚀 اضغط لفتح عدة النشر والكابشن والهاشتاجات',
          type: 'success',
          duration: 8000,
          action: {
            label: 'عدة النشر 🚀',
            onClick: () => {
              setActivePublishJob(completedJob as any);
            },
          },
        });
      } catch (error: any) {
        console.error('Export failed:', error);
        updateExportJob(jobId, { status: 'failed', progress: 0 });
        addToast({ message: `فشل التصدير: ${error.message || 'خطأ غير معروف'}`, type: 'error' });
      } finally {
        setIsExporting(false);
        canvasRef.current = null;
      }
    },
    [currentProject, aspectRatio, quality, updateExportJob, addToast]
  );

  const handleExport = async () => {
    if (!currentProject) {
      addToast({ message: 'يرجى اختيار مشروع أولاً', type: 'warning' });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    const newJob: ExportJob = {
      id: `exp-${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      aspectRatio,
      quality,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
      estimatedSize: quality === 'premium' ? '~45 MB' : quality === 'high' ? '~25 MB' : '~12 MB',
      estimatedDuration: `~${currentProject.toAyah - currentProject.fromAyah + 1} دقيقة`,
    };

    addExportJob(newJob);
    addToast({ message: 'تم بدء عملية التصدير', type: 'info' });

    await performRealExport(newJob.id);
  };

  const handleCancel = () => {
    exportCancelledRef.current = true;
    setIsExporting(false);
    addToast({ message: 'تم إلغاء التصدير', type: 'warning' });
  };

  const handleRetry = (jobId: string) => {
    const job = exportJobs.find((j) => j.id === jobId);
    if (job) {
      updateExportJob(jobId, { status: 'processing', progress: 0 });
      setIsExporting(true);
      performRealExport(jobId);
    }
  };

  const aspectOptions = [
    {
      value: '9:16' as const,
      label: 'ريلز',
      sublabel: '1080×1920',
      icon: <Smartphone size={20} />,
    },
    { value: '16:9' as const, label: 'يوتيوب', sublabel: '1920×1080', icon: <Monitor size={20} /> },
    { value: '1:1' as const, label: 'مربع', sublabel: '1080×1080', icon: <Square size={20} /> },
  ];

  const qualityOptions = [
    {
      value: 'standard' as const,
      label: 'عادي',
      sublabel: '720p',
      icon: <Zap size={18} />,
      desc: 'حجم صغير، مناسب للمشاركة السريعة',
    },
    {
      value: 'high' as const,
      label: 'عالي',
      sublabel: '1080p',
      icon: <Star size={18} />,
      desc: 'جودة ممتازة للنشر على المنصات',
    },
    {
      value: 'premium' as const,
      label: 'ممتاز',
      sublabel: '1080p Pro',
      icon: <Crown size={18} />,
      desc: 'أعلى معدل بت سينمائي فائق النقاء (16 Mbps)',
    },
  ];

  const statusCounts = {
    pending: exportJobs.filter((j) => j.status === 'pending').length,
    processing: exportJobs.filter((j) => j.status === 'processing').length,
    completed: exportJobs.filter((j) => j.status === 'completed').length,
    failed: exportJobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <AppLayout title="التصدير" subtitle="تصدير وإدارة المخرجات">
      <div className="p-6 animate-in max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Export settings */}
          <div className="col-span-1 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center">
                  <Download size={20} className="text-accent-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white/90">تصدير جديد</h3>
                  <p className="text-xs text-white/50">
                    {currentProject ? currentProject.name : 'لم يتم اختيار مشروع'}
                  </p>
                </div>
              </div>

              <div className="divider"></div>

              {/* Aspect ratio */}
              <div>
                <label className="label">المقاس</label>
                <div className="grid grid-cols-3 gap-3">
                  {aspectOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAspectRatio(opt.value)}
                      disabled={isExporting}
                      className={`
                        relative p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer
                        ${
                          aspectRatio === opt.value
                            ? 'bg-accent-500/10 border-accent-500/30'
                            : 'bg-surface-800/40 border-white/[0.06] hover:bg-surface-800/60 hover:border-white/[0.1]'
                        }
                        disabled:opacity-50
                      `}
                    >
                      {aspectRatio === opt.value && (
                        <div className="absolute top-2 left-2 w-4 h-4 bg-accent-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                      <div
                        className={`mb-1.5 mx-auto w-fit ${aspectRatio === opt.value ? 'text-accent-400' : 'text-white/30'}`}
                      >
                        {opt.icon}
                      </div>
                      <span
                        className={`text-xs font-bold block ${aspectRatio === opt.value ? 'text-accent-400' : 'text-white/70'}`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-xs text-white/40 block mt-0.5">{opt.sublabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="label">الجودة</label>
                <div className="space-y-2">
                  {qualityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setQuality(opt.value)}
                      disabled={isExporting}
                      className={`
                        w-full flex items-center gap-3 p-3.5 rounded-xl border text-right transition-all duration-200 cursor-pointer
                        ${
                          quality === opt.value
                            ? 'bg-accent-500/10 border-accent-500/30'
                            : 'bg-surface-800/40 border-white/[0.06] hover:bg-surface-800/60 hover:border-white/[0.1]'
                        }
                        disabled:opacity-50
                      `}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          quality === opt.value
                            ? 'bg-accent-500/15 text-accent-400'
                            : 'bg-surface-700/50 text-white/30'
                        }`}
                      >
                        {opt.icon}
                      </div>
                      <div className="flex-1">
                        <span
                          className={`text-sm font-bold block ${quality === opt.value ? 'text-accent-400' : 'text-white/80'}`}
                        >
                          {opt.label}
                          <span className="text-xs text-white/40 mr-2">{opt.sublabel}</span>
                        </span>
                        <span className="text-xs text-white/50 block mt-0.5">{opt.desc}</span>
                      </div>
                      {quality === opt.value && (
                        <div className="w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center shrink-0">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-accent-500/5 border border-accent-500/10">
                <Info size={16} className="text-accent-400 mt-0.5 shrink-0" />
                <p className="text-xs text-accent-300/80 leading-relaxed font-arabic">
                  {currentProject
                    ? `سيتم تصدير "${currentProject.name}" — سورة ${currentProject.surah} (آية ${currentProject.fromAyah} إلى ${currentProject.toAyah}) بالفيديو مع صوت القارئ بدقة فائقة.`
                    : 'يرجى اختيار مشروع من صفحة المشاريع لبدء التصدير.'}
                </p>
              </div>

              {/* Export / Cancel buttons */}
              {isExporting ? (
                <button
                  onClick={handleCancel}
                  className="btn-danger w-full flex items-center justify-center gap-2 py-3.5"
                >
                  <X size={18} />
                  إلغاء التصدير
                </button>
              ) : (
                <button
                  onClick={handleExport}
                  disabled={!currentProject}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={18} />
                  بدء التصدير
                </button>
              )}

              {/* No project? Link to create */}
              {!currentProject && (
                <button
                  onClick={() => setCurrentPage('create')}
                  className="w-full text-center text-xs font-bold text-accent-400 hover:text-accent-300 transition-colors"
                >
                  إنشاء مشروع جديد →
                </button>
              )}
            </motion.div>

            {/* Viral Caption & Hashtags Generator Card */}
            {currentProject && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6"
              >
                <ViralCaptionGenerator
                  surahName={currentProject.surah}
                  ayahRange={`${currentProject.fromAyah} - ${currentProject.toAyah}`}
                  ayahText={`سورة ${currentProject.surah} [الآيات ${currentProject.fromAyah} إلى ${currentProject.toAyah}]`}
                  customTitle={currentProject.name}
                />
              </motion.div>
            )}
          </div>

          {/* Right: Export history */}
          <div className="col-span-1 lg:col-span-7">
            {/* Status summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                {
                  label: 'قيد الانتظار',
                  count: statusCounts.pending,
                  color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/10',
                },
                {
                  label: 'جاري المعالجة',
                  count: statusCounts.processing,
                  color: 'text-blue-400 bg-blue-500/10 border-blue-500/10',
                },
                {
                  label: 'مكتمل',
                  count: statusCounts.completed,
                  color: 'text-green-400 bg-green-500/10 border-green-500/10',
                },
                {
                  label: 'فشل',
                  count: statusCounts.failed,
                  color: 'text-red-400 bg-red-500/10 border-red-500/10',
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3.5 rounded-2xl border text-center ${s.color}`}
                >
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs font-semibold opacity-80 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Export jobs list */}
            <h3 className="section-title flex items-center gap-2">
              <Download size={16} className="text-accent-400" />
              سجل التصدير
            </h3>

            {exportJobs.length === 0 ? (
              <EmptyState
                icon={Download}
                title="لا توجد عمليات تصدير"
                description="ابدأ بتصدير مشروعك الأول"
              />
            ) : (
              <div className="space-y-3 stagger-children">
                {exportJobs.map((job, i) => (
                  <ExportProgress
                    key={job.id}
                    job={job}
                    index={i}
                    onRetry={handleRetry}
                    onOpenPublishKit={(j) => setActivePublishJob(j)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Kit Modal (Direct Platform Launchers & Channel Log) */}
      {activePublishJob && (
        <PublishKitModal
          isOpen={Boolean(activePublishJob)}
          onClose={() => setActivePublishJob(null)}
          project={currentProject}
          videoPath={activePublishJob.outputPath}
          surahName={activePublishJob.projectName}
        />
      )}
    </AppLayout>
  );
};

// ==================== Helper Functions ====================
async function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
      audio.src = '';
    });
    audio.addEventListener('error', () => reject(new Error('Audio load failed')));
    audio.src = url;
  });
}

async function fetchAudioBuffer(audioCtx: AudioContext, url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

async function saveVideoBlob(
  blob: Blob,
  projectName: string,
  defaultPath?: string
): Promise<string | null> {
  try {
    // Try Electron file save dialog
    if (window.electronAPI?.dialog?.saveFile) {
      const savePath = await window.electronAPI.dialog.saveFile({
        defaultPath: defaultPath || `${projectName}.webm`,
        filters: [{ name: 'فيديو', extensions: ['webm'] }],
      });
      if (savePath) {
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        await window.electronAPI.fs.writeBinaryFile(savePath, bytes as any);

        // Open the folder containing the file
        window.electronAPI.shell.showItemInFolder(savePath);
        return savePath;
      }
    }
  } catch (e) {
    console.warn('Electron save failed, falling back to download:', e);
  }

  // Fallback: browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return null;
}
