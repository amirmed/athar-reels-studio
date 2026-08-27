import { ColorGradingFilter } from '../types';
import { loadImage } from '../utils/imageUtils';

export interface ThumbnailConfig {
  surahName: string;
  ayahRange: string;
  ayahText: string;
  reciterName: string;
  backgroundUrl?: string;
  colorGrading?: ColorGradingFilter;
  aspectRatio: '9:16' | '16:9' | '1:1';
  watermark?: string;
}

/**
 * Generate a 4K Viral Thumbnail Cover Image on HTML5 Canvas
 */
export async function generateViralThumbnailBlob(
  config: ThumbnailConfig
): Promise<{ blob: Blob; dataUrl: string }> {
  const dimensions = {
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
    '1:1': { width: 1080, height: 1080 },
  }[config.aspectRatio];

  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  const { width, height } = dimensions;

  // 1. Draw Base Dark Background
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, width, height);

  // 2. Load & Draw Background Image if available
  if (config.backgroundUrl) {
    try {
      const img = await loadImage(config.backgroundUrl);
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;

      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > canvasAspect) {
        drawW = height * imgAspect;
        drawX = -(drawW - width) / 2;
      } else {
        drawH = width / imgAspect;
        drawY = -(drawH - height) / 2;
      }

      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch (e) {
      console.warn('[ThumbnailGenerator] Failed to load background image:', e);
    }
  }

  // 3. Cinematic Vignette & Radial Shadow
  const radialGradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.2,
    width / 2,
    height / 2,
    width * 0.8
  );
  radialGradient.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
  radialGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.65)');
  radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.92)');

  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, width, height);

  // 4. Color Grading Overlay
  if (config.colorGrading && config.colorGrading !== 'none') {
    ctx.save();
    if (config.colorGrading === 'royalGold') {
      const goldGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        50,
        width / 2,
        height * 0.45,
        width * 0.65
      );
      goldGrad.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
      goldGrad.addColorStop(0.7, 'rgba(180, 83, 9, 0.35)');
      goldGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = goldGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (config.colorGrading === 'andalusianTwilight') {
      const blueGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        50,
        width / 2,
        height * 0.45,
        width * 0.65
      );
      blueGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      blueGrad.addColorStop(0.7, 'rgba(30, 27, 75, 0.5)');
      blueGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = blueGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (config.colorGrading === 'emeraldNoor') {
      const greenGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        50,
        width / 2,
        height * 0.45,
        width * 0.65
      );
      greenGrad.addColorStop(0, 'rgba(52, 211, 153, 0.2)');
      greenGrad.addColorStop(0.7, 'rgba(6, 78, 59, 0.4)');
      greenGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = greenGrad;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  // 5. Ornate Royal Outer Border
  const pad = width * 0.04;
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 12;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  // Inner border
  const innerPad = pad + 12;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  ctx.strokeRect(innerPad, innerPad, width - innerPad * 2, height - innerPad * 2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 6. Top Hook Pill Badge: « ✨ تلاوة خاشعة تلامس القلوب 🌿 »
  const topBadgeY = height * 0.13;
  const badgeWidth = width * 0.82;
  const badgeHeight = 72;
  const badgeX = (width - badgeWidth) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.roundRect(badgeX, topBadgeY - badgeHeight / 2, badgeWidth, badgeHeight, 36);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 30px "Amiri", "Cairo", sans-serif';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 14;
  ctx.fillText('✨ تلاوة خاشعة تلامس القلوب 🌿', width / 2, topBadgeY);
  ctx.restore();

  // 7. Surah Title & Range Card (Majestic Bold Calligraphy)
  const surahCardY = height * 0.28;
  ctx.save();
  ctx.font = 'bold 84px "Amiri", "Cairo", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 30;
  ctx.fillText(`﴿ سورة ${config.surahName} ﴾`, width / 2, surahCardY);

  // Ayah Range Pill Badge
  const rangePillY = surahCardY + 68;
  const rangePillW = width * 0.45;
  const rangePillH = 46;
  const rangePillX = (width - rangePillW) / 2;

  ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(rangePillX, rangePillY - rangePillH / 2, rangePillW, rangePillH, 23);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 24px "Cairo", sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 10;
  ctx.fillText(`الآيات (${config.ayahRange})`, width / 2, rangePillY);
  ctx.restore();

  // 8. Main Featured Quranic Verse Card (High Contrast Glassmorphism with Full Verses)
  const rawText = (config.ayahText || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ').trim();
  const words = rawText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Dynamic adaptive typography to fit all verses gracefully without truncation
  let fontSize = 52;
  let lineHeight = 80;

  if (wordCount > 90) {
    fontSize = 24;
    lineHeight = 42;
  } else if (wordCount > 55) {
    fontSize = 28;
    lineHeight = 48;
  } else if (wordCount > 35) {
    fontSize = 34;
    lineHeight = 56;
  } else if (wordCount > 20) {
    fontSize = 42;
    lineHeight = 66;
  } else {
    fontSize = 50;
    lineHeight = 78;
  }

  ctx.save();
  ctx.font = `bold ${fontSize}px "Amiri", "Cairo", sans-serif`;

  // Wrap all ayah text completely
  const maxLineWidth = width * 0.8;
  const lines: string[] = [];
  let curLine = '';

  for (const w of words) {
    const testLine = curLine ? `${curLine} ${w}` : w;
    if (ctx.measureText(testLine).width > maxLineWidth && curLine !== '') {
      lines.push(curLine.trim());
      curLine = w;
    } else {
      curLine = testLine;
    }
  }
  if (curLine.trim()) {
    lines.push(curLine.trim());
  }

  // Calculate card layout
  const cardPaddingY = Math.max(28, Math.round(fontSize * 0.8));
  const cardH = lines.length * lineHeight + cardPaddingY * 2;
  const cardW = width * 0.88;
  const cardX = (width - cardW) / 2;
  const textCenterY = height * 0.55;
  const cardY = textCenterY - cardH / 2;

  // Frosted Glass Card Behind Verse
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 32);
  ctx.fill();
  ctx.stroke();

  // Draw Full Verse Lines
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 20;

  const startLineY = textCenterY - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => {
    ctx.fillText(l, width / 2, startLineY + i * lineHeight);
  });
  ctx.restore();

  // 9. Bottom Reciter Badge: 🎙️ بصوت القارئ (Prominent & Clear)
  const bottomBadgeY = height * 0.82;
  const recBadgeW = width * 0.78;
  const recBadgeH = 68;
  const recBadgeX = (width - recBadgeW) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.roundRect(recBadgeX, bottomBadgeY - recBadgeH / 2, recBadgeW, recBadgeH, 34);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Cairo", sans-serif';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 10;
  ctx.fillText(`🎙️ بصوت: ${config.reciterName}`, width / 2, bottomBadgeY);
  ctx.restore();

  // 10. Watermark & Branding
  const watermarkY = height * 0.94;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '600 22px "Cairo", sans-serif';
  ctx.shadowBlur = 0;
  ctx.fillText(config.watermark || 'atar-studio.com', width / 2, watermarkY);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas blob export failed'));
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ blob, dataUrl });
      },
      'image/png',
      0.95
    );
  });
}

/**
 * Fast lightweight project thumbnail generator for Project Cards (CapCut-like preview)
 */
export async function generateProjectThumbnailDataUrl(params: {
  surahName: string;
  fromAyah: number;
  toAyah: number;
  ayahText?: string;
  backgroundUrl?: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  textColor?: string;
}): Promise<string> {
  const isLandscape = params.aspectRatio === '16:9';
  const isSquare = params.aspectRatio === '1:1';
  const width = isLandscape ? 360 : isSquare ? 260 : 200;
  const height = isLandscape ? 202 : isSquare ? 260 : 355;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Dark surface background
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, width, height);

  // 2. Background image if available
  if (params.backgroundUrl && params.backgroundUrl !== 'none') {
    try {
      const img = await loadImage(params.backgroundUrl);
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;
      if (imgAspect > canvasAspect) {
        drawW = height * imgAspect;
        drawX = -(drawW - width) / 2;
      } else {
        drawH = width / imgAspect;
        drawY = -(drawH - height) / 2;
      }
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch {
      // Fallback gracefully
    }
  }

  // 3. Subtle dark overlay for readability
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, width, height);

  // 4. Quran text preview snippet
  ctx.save();
  ctx.fillStyle = params.textColor || '#ffffff';
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.font = 'bold 13px Amiri, "Traditional Arabic", sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 6;

  const title = `سورة ${params.surahName}`;
  ctx.fillText(title, width / 2, height / 2 - 10);

  ctx.font = 'bold 11px Amiri, sans-serif';
  ctx.fillStyle = '#fbbf24';
  const range = `﴿ الآيات ${params.fromAyah}-${params.toAyah} ﴾`;
  ctx.fillText(range, width / 2, height / 2 + 12);
  ctx.restore();

  try {
    return canvas.toDataURL('image/jpeg', 0.75);
  } catch {
    return '';
  }
}
