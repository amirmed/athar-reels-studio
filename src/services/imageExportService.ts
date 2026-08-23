// Ultra-High Resolution Islamic Image & Quote Card Renderer Engine

import { QuoteCardSettings, QuoteAspectRatio } from '../types';

export const ASPECT_DIMENSIONS: Record<
  QuoteAspectRatio,
  { width: number; height: number; label: string; sublabel: string }
> = {
  '1:1': { width: 2048, height: 2048, label: '1:1 مربع', sublabel: 'Instagram & Facebook Post' },
  '9:16': { width: 1215, height: 2160, label: '9:16 طولي', sublabel: 'WhatsApp Status & Story' },
  '4:5': { width: 1728, height: 2160, label: '4:5 بورتريه', sublabel: 'Instagram Portrait' },
  '16:9': { width: 2160, height: 1215, label: '16:9 أفقي', sublabel: 'YouTube & Desktop' },
};

import { loadImage } from '../utils/imageUtils';

/**
 * Wraps text into lines that fit within maxWidth on Canvas context
 */
function wrapArabicText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Draws luxury Islamic vector ornaments and borders on Canvas
 */
function drawIslamicFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: string,
  color: string,
  opacity: number
) {
  if (style === 'none') return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(3, Math.round(width * 0.003));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const margin = Math.round(width * 0.06);
  const innerMargin = margin + Math.round(width * 0.015);
  const cornerSize = Math.round(width * 0.08);

  if (style === 'royalFrame') {
    // Outer border
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    // Inner delicate border
    ctx.lineWidth = Math.max(1.5, Math.round(width * 0.0015));
    ctx.strokeRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2);

    // 4 Royal corner brackets with diamond gems
    const corners = [
      { x: margin, y: margin, dx: 1, dy: 1 },
      { x: width - margin, y: margin, dx: -1, dy: 1 },
      { x: margin, y: height - margin, dx: 1, dy: -1 },
      { x: width - margin, y: height - margin, dx: -1, dy: -1 },
    ];

    corners.forEach((c) => {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.dy * cornerSize);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x + c.dx * cornerSize, c.y);
      ctx.stroke();

      // Mini corner diamond
      const gemX = c.x + c.dx * (cornerSize * 0.35);
      const gemY = c.y + c.dy * (cornerSize * 0.35);
      const s = Math.round(width * 0.008);
      ctx.beginPath();
      ctx.moveTo(gemX, gemY - s);
      ctx.lineTo(gemX + s, gemY);
      ctx.lineTo(gemX, gemY + s);
      ctx.lineTo(gemX - s, gemY);
      ctx.closePath();
      ctx.fill();
    });

    // Top & bottom center arch diamonds
    const cx = width / 2;
    const topY = margin;
    const botY = height - margin;
    const archSize = Math.round(width * 0.012);
    [topY, botY].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(cx, y - archSize);
      ctx.lineTo(cx + archSize, y);
      ctx.lineTo(cx, y + archSize);
      ctx.lineTo(cx - archSize, y);
      ctx.closePath();
      ctx.fill();
    });
  } else if (style === 'floralCorners') {
    // 4 Floral flourishes
    const cs = Math.round(width * 0.1);
    const floralCorners = [
      { x: margin, y: margin, flipX: 1, flipY: 1 },
      { x: width - margin, y: margin, flipX: -1, flipY: 1 },
      { x: margin, y: height - margin, flipX: 1, flipY: -1 },
      { x: width - margin, y: height - margin, flipX: -1, flipY: -1 },
    ];

    floralCorners.forEach((fc) => {
      ctx.save();
      ctx.translate(fc.x, fc.y);
      ctx.scale(fc.flipX, fc.flipY);
      ctx.beginPath();
      ctx.moveTo(0, cs);
      ctx.quadraticCurveTo(cs * 0.2, cs * 0.2, cs, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cs * 0.35, cs * 0.35, cs * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.strokeRect(margin + 10, margin + 10, width - (margin + 10) * 2, height - (margin + 10) * 2);
  } else if (style === 'domeCrescent') {
    // Dome crest at top and crescent
    const cx = width / 2;
    const topY = margin + Math.round(width * 0.05);

    ctx.beginPath();
    ctx.arc(cx, topY, Math.round(width * 0.035), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeRect(
      margin,
      margin + Math.round(width * 0.08),
      width - margin * 2,
      height - margin * 2 - Math.round(width * 0.08)
    );
  } else if (style === 'geometricArabesque') {
    // Full arabesque interlocking border
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    ctx.strokeRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2);
  }

  ctx.restore();
}

/**
 * Renders high-resolution Islamic Quote Card into an HTML5 Canvas element
 */
export async function renderQuoteToCanvas(
  settings: QuoteCardSettings,
  isPreview = false
): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const dims = ASPECT_DIMENSIONS[settings.aspectRatio] || ASPECT_DIMENSIONS['1:1'];
  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain Canvas 2D context');

  const { width, height } = dims;

  // 1. Draw base background
  ctx.fillStyle = settings.backgroundColor || '#0a0d14';
  ctx.fillRect(0, 0, width, height);

  // 2. Draw background image or gradient overlay
  if (settings.backgroundType === 'image' && settings.backgroundUrl) {
    try {
      const img = await loadImage(settings.backgroundUrl);
      ctx.save();
      ctx.globalAlpha = settings.backgroundOpacity;

      // Cover scaling
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > canvasRatio) {
        drawH = height;
        drawW = height * imgRatio;
        drawX = (width - drawW) / 2;
      } else {
        drawW = width;
        drawH = width / imgRatio;
        drawY = (height - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch {
      // Background image failed to load, continue with solid / gradient
    }
  }

  // 3. Dark cinematic vignette & lighting overlay
  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.1,
    width / 2,
    height / 2,
    width * 0.8
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 3.5 Draw Frosted Glassmorphism Card behind content if enabled
  if (settings.enableGlassCard) {
    ctx.save();
    const cardMarginX = Math.round(width * 0.08);
    const cardMarginY = Math.round(height * 0.12);
    const cardW = width - cardMarginX * 2;
    const cardH = height - cardMarginY * 2;
    const cardRadius = Math.round(width * 0.035);

    // Glass Background Fill
    ctx.fillStyle = `rgba(10, 15, 25, ${settings.glassOpacity ?? 0.45})`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 45;
    ctx.shadowOffsetY = 18;

    // Draw rounded rect
    ctx.beginPath();
    ctx.roundRect(cardMarginX, cardMarginY, cardW, cardH, cardRadius);
    ctx.fill();

    // Glass Subtle Border & Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = Math.max(1.5, Math.round(width * 0.0015));
    ctx.stroke();

    ctx.restore();
  }

  // 4. Draw Islamic ornamental borders
  if (settings.showOrnament) {
    drawIslamicFrame(
      ctx,
      width,
      height,
      settings.ornamentStyle || 'royalFrame',
      settings.ornamentColor || '#fbbf24',
      settings.ornamentOpacity ?? 0.85
    );
  }

  // 5. Draw Title Header (e.g. "حديث شريف" / "سيد الاستغفار")
  const contentWidth = width - Math.round(width * 0.22);
  let currentY = Math.round(height * 0.2);

  if (settings.title) {
    ctx.save();
    ctx.font = `bold ${Math.round(width * 0.038)}px ${settings.fontFamily || 'Amiri'}, serif`;
    ctx.fillStyle = settings.ornamentColor || '#fbbf24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 15;

    // Small diamond crest above title
    const cx = width / 2;
    ctx.fillText(`❖  ${settings.title}  ❖`, cx, currentY);
    ctx.restore();
    currentY += Math.round(width * 0.08);
  }

  // 6. Draw Main Arabic Text
  const textFontSize = Math.round((width * (settings.fontSize || 38)) / 600);
  const textLineHeight = textFontSize * (settings.lineHeight || 1.9);

  ctx.save();
  ctx.font = `600 ${textFontSize}px ${settings.fontFamily || 'Amiri'}, 'Amiri Quran', serif`;
  ctx.textAlign = settings.textAlign || 'center';
  ctx.direction = 'rtl';
  ctx.textBaseline = 'top';

  // Text Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // Text Gradient or solid color
  if (settings.textGradient) {
    const textGrad = ctx.createLinearGradient(0, currentY, 0, currentY + 300);
    textGrad.addColorStop(0, settings.textGradientColors?.[0] || '#ffffff');
    textGrad.addColorStop(1, settings.textGradientColors?.[1] || '#fef08a');
    ctx.fillStyle = textGrad;
  } else {
    ctx.fillStyle = settings.textColor || '#ffffff';
  }

  let displayText = settings.text;
  if (settings.showQuoteMarks && !displayText.includes('«') && !displayText.includes('“')) {
    displayText = `« ${displayText} »`;
  }

  const lines = wrapArabicText(ctx, displayText, contentWidth);
  const totalTextHeight = lines.length * textLineHeight;

  // Center vertical alignment calculation
  const targetCenterY = height * 0.52;
  let textStartY = targetCenterY - totalTextHeight / 2;
  if (textStartY < currentY) {
    textStartY = currentY;
  }

  const textX =
    settings.textAlign === 'center'
      ? width / 2
      : settings.textAlign === 'right'
        ? width - Math.round(width * 0.12)
        : Math.round(width * 0.12);

  lines.forEach((line, idx) => {
    ctx.fillText(line, textX, textStartY + idx * textLineHeight);
  });

  ctx.restore();

  // 7. Draw Reference Badge (المصدر: صحيح البخاري)
  if (settings.showReferenceBadge && settings.reference) {
    const badgeY = height - Math.round(height * 0.18);
    const badgeText = settings.reference;
    ctx.save();
    ctx.font = `500 ${Math.round(width * 0.026)}px ${settings.fontFamily || 'Amiri'}, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(badgeText).width;
    const paddingX = Math.round(width * 0.035);
    const badgeHeight = Math.round(width * 0.055);
    const badgeWidth = textWidth + paddingX * 2;
    const badgeX = (width - badgeWidth) / 2;

    // Pill background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.strokeStyle = settings.ornamentColor || '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY - badgeHeight / 2, badgeWidth, badgeHeight, badgeHeight / 2);
    ctx.fill();
    ctx.stroke();

    // Pill text
    ctx.fillStyle = settings.ornamentColor || '#fef08a';
    ctx.fillText(badgeText, width / 2, badgeY);
    ctx.restore();
  }

  // 8. Draw Watermark Handle with Dynamic Position & Opacity (For export)
  if (!isPreview && settings.watermark && settings.showWatermark !== false) {
    ctx.save();
    const fontSize = settings.watermarkFontSize
      ? Math.round(width * (settings.watermarkFontSize / 550))
      : Math.round(width * 0.024);

    ctx.font = `600 ${fontSize}px sans-serif`;

    const opacity = settings.watermarkOpacity ?? 0.6;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = settings.watermarkColor || settings.textColor || '#ffffff';

    const marginX = Math.round(width * 0.06);
    const marginY = Math.round(height * 0.05);

    let wx = width / 2;
    let wy = height - marginY;
    let align: CanvasTextAlign = 'center';
    let baseline: CanvasTextBaseline = 'bottom';

    switch (settings.watermarkPosition) {
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

    if (settings.watermarkX) {
      wx += Math.round(width * (settings.watermarkX / 360));
    }
    if (settings.watermarkY) {
      wy += Math.round(height * (settings.watermarkY / 540));
    }

    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText(settings.watermark, wx, wy);
    ctx.restore();
  }

  return canvas;
}

/**
 * Downloads rendered quote card as HD PNG image
 */
export async function downloadQuoteImage(
  settings: QuoteCardSettings,
  filename?: string
): Promise<void> {
  const canvas = await renderQuoteToCanvas(settings);
  const link = document.createElement('a');
  link.download = filename || `${settings.title || 'islamic_quote'}_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/**
 * Copies rendered quote image directly to user's system clipboard
 */
export async function copyQuoteImageToClipboard(settings: QuoteCardSettings): Promise<boolean> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    return false;
  }
  const canvas = await renderQuoteToCanvas(settings);
  return new Promise((resolve) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          resolve(true);
        } catch {
          resolve(false);
        }
      },
      'image/png',
      1.0
    );
  });
}
