import { ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import type { IncomingHttpHeaders } from 'http';
import { createWriteStream } from 'fs';
import { spawn } from 'child_process';
import { buildAudioFilters, ExportAudioSettings } from '../src/services/audioDspFilters';
import { isSafeUserPath, isSafeRemoteDownloadUrl } from './pathSecurity.js';

let ffmpeg: any;
let ffmpegBinaryPath = '';

type DownloadResult = {
  filePath: string;
  contentType?: string;
  bytes: number;
};

type BackgroundKind = 'image' | 'video';

type ExportWord = {
  id?: number;
  position?: number;
  text: string;
  startTime: number;
  endTime: number;
  translation?: string;
};

type ExportChunk = {
  id?: string;
  words: ExportWord[];
  startTime?: number;
  endTime?: number;
};

type ExportAyah = {
  text: string;
  startTime: number;
  endTime: number;
  numberInSurah?: number;
  translationText?: string;
  tafsirText?: string;
  words?: ExportWord[];
  chunks?: ExportChunk[];
};

type ExportTextSettings = {
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  textColor?: string;
  bgColor?: string;
  bgOpacity?: number;
  position?: string;
  fontFamily?: string;
  translationFontSize?: number;
  translationColor?: string;
  wordHighlightEnabled?: boolean;
  wordHighlightColor?: string;
  displayMode?: 'full' | 'chunked';
  wordsPerChunk?: number;
  sceneBackgrounds?: Record<number, string>;
  enableMultiScene?: boolean;
};

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);
const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.gif']);

async function initFFmpeg() {
  if (ffmpeg) return;
  try {
    const { default: fluentFfmpeg } = await import('fluent-ffmpeg');
    let staticPath = '';
    try {
      const mod = await import('ffmpeg-static');
      staticPath = (mod as any).default || mod;
    } catch {
      staticPath = process.env.FFMPEG_BIN || process.env.FFMPEG_PATH || '';
    }

    if (!staticPath && process.env.FFMPEG_BIN) {
      staticPath = process.env.FFMPEG_BIN;
    }

    ffmpeg = fluentFfmpeg;
    if (staticPath && typeof staticPath === 'string') {
      staticPath = staticPath.replace('app.asar', 'app.asar.unpacked');
      ffmpegBinaryPath = staticPath;
      ffmpeg.setFfmpegPath(staticPath);
    } else {
      throw new Error('لم يتم العثور على مسار محرك FFmpeg. يرجى التأكد من تثبيت ffmpeg-static أو ضبط متغير البيئة FFMPEG_BIN');
    }
  } catch (err: any) {
    console.error('[FFmpeg] Init error:', err);
    throw new Error(`فشل تحميل محرك FFmpeg: ${err.message}`, { cause: err });
  }
}

function getContentType(headers: IncomingHttpHeaders): string | undefined {
  const value = headers['content-type'];
  return Array.isArray(value) ? value[0] : value;
}

function getMediaExtension(source: string): string {
  try {
    return path.extname(new URL(source).pathname).toLowerCase();
  } catch {
    return path.extname(source.split('?')[0]).toLowerCase();
  }
}

function mediaKindFromExtension(ext: string): BackgroundKind | undefined {
  if (imageExtensions.has(ext)) return 'image';
  if (videoExtensions.has(ext)) return 'video';
  return undefined;
}

function mediaKindFromContentType(contentType?: string): BackgroundKind | undefined {
  const normalized = contentType?.split(';')[0]?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'image/gif') return 'video';
  if (normalized.startsWith('image/')) return 'image';
  if (normalized.startsWith('video/')) return 'video';
  return undefined;
}

function inferBackgroundKind(source?: string, contentType?: string): BackgroundKind | undefined {
  if (!source && !contentType) return undefined;
  return mediaKindFromContentType(contentType) || (source ? mediaKindFromExtension(getMediaExtension(source)) : undefined);
}

function mediaKindFromFile(filePath: string): BackgroundKind | undefined {
  let fd: number | undefined;
  try {
    fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);

    if (bytes >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') return 'video';
    if (bytes >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return 'video';
    if (bytes >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image';
    if (bytes >= 8 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') return 'image';
    if (bytes >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image';
    if (bytes >= 2 && buffer.toString('ascii', 0, 2) === 'BM') return 'image';
    if (bytes >= 6 && buffer.toString('ascii', 0, 3) === 'GIF') return 'video';
  } catch {
    return undefined;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (e) { console.debug('[MediaKind] close error:', e); }
    }
  }
  return undefined;
}

function extensionForBackground(source: string, kind?: BackgroundKind): string {
  const ext = getMediaExtension(source);
  if (mediaKindFromExtension(ext)) return ext;
  return kind === 'video' ? '.mp4' : '.jpg';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseDurationSeconds(stderr: string): number | null {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const total = hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(total) && total > 0 ? total : null;
}

function getMediaDurationSeconds(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const binary = ffmpegBinaryPath || process.env.FFMPEG_BIN || 'ffmpeg';
    const child = spawn(binary, ['-hide_banner', '-i', filePath], { windowsHide: true });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', () => {
      const duration = parseDurationSeconds(stderr);
      if (duration) {
        resolve(duration);
      } else {
        reject(new Error(`تعذر قراءة مدة الملف: ${filePath}`));
      }
    });
  });
}

function downloadFile(url: string, destPath: string, redirects = 0): Promise<DownloadResult> {
  return new Promise((resolve, reject) => {
    if (redirects > 5) {
      reject(new Error(`عدد التحويلات كبير أثناء تحميل: ${url}`));
      return;
    }

    if (!isSafeRemoteDownloadUrl(url)) {
      reject(new Error(`الرابط غير آمن أو محظور أمنياً: ${url}`));
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      reject(new Error(`رابط غير صالح: ${url}`));
      return;
    }

    const req = https.get(parsedUrl, {
      headers: {
        'User-Agent': 'IslamicReelsStudio/1.0',
        Accept: '*/*',
      },
    }, (res) => {
      const status = res.statusCode || 0;
      const location = res.headers.location;

      if (status >= 300 && status < 400 && location) {
        res.resume();
        let nextUrl: string;
        try {
          nextUrl = new URL(location, url).toString();
        } catch {
          reject(new Error(`رابط التحويل غير صالح: ${location}`));
          return;
        }

        if (!isSafeRemoteDownloadUrl(nextUrl)) {
          reject(new Error(`رابط التحويل غير آمن ومحظور: ${nextUrl}`));
          return;
        }

        downloadFile(nextUrl, destPath, redirects + 1).then(resolve, reject);
        return;
      }

      if (status < 200 || status >= 300) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} أثناء تحميل: ${url}`));
        return;
      }

      const file = createWriteStream(destPath);
      let bytes = 0;
      res.on('data', (chunk) => {
        bytes += Buffer.byteLength(chunk);
      });
      res.pipe(file);
      res.on('error', (err) => {
        file.destroy();
        fs.unlink(destPath, () => {});
        reject(new Error(`فشل قراءة التحميل: ${err.message}`));
      });
      file.on('finish', () => {
        file.close((err) => {
          if (err) {
            fs.unlink(destPath, () => {});
            reject(new Error(`فشل إغلاق الملف المحمّل: ${err.message}`));
            return;
          }
          if (bytes === 0) {
            fs.unlink(destPath, () => {});
            reject(new Error(`الملف المحمّل فارغ: ${url}`));
            return;
          }
          resolve({ filePath: destPath, contentType: getContentType(res.headers), bytes });
        });
      });
      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(new Error(`فشل حفظ الملف: ${err.message}`));
      });
    });
    req.setTimeout(30000, () => {
      req.destroy(new Error('انتهت مهلة التحميل'));
    });
    req.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(new Error(`فشل تحميل الملف: ${err.message}`));
    });
  });
}

export interface ExportOptions {
  outputPath: string;
  backgroundPath?: string;
  audioUrls?: string[];
  ayahs: ExportAyah[];
  aspectRatio: '9:16' | '16:9' | '1:1';
  quality: 'standard' | 'high' | 'premium';
  watermark?: string;
  textColor?: string;
  bgOpacity?: number;
  fontFamily?: string;
  totalDuration?: number;
  transition?: string;
  videoEffect?: string;
  textSettings?: ExportTextSettings;
  audioSettings?: ExportAudioSettings;
  showTranslation?: boolean;
  showTafsir?: boolean;
  surahName?: string;
}

const crfMap = { standard: 28, high: 20, premium: 16 };
const presetMap = { standard: 'fast', high: 'slow', premium: 'veryslow' };
const bitrateMap = { standard: '128k', high: '192k', premium: '320k' };
const resolutions: Record<string, { w: number; h: number }> = {
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
  '1:1':  { w: 1080, h: 1080 },
};

const previewWidths: Record<string, number> = {
  '9:16': 270,
  '16:9': 480,
  '1:1': 340,
};

// Concatenate multiple audio files into one using FFmpeg concat filter
function concatAudio(inputs: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();
    inputs.forEach(f => cmd.input(f));
    const filterInputs = inputs.map((_, i) => `[${i}:a]`).join('');
    cmd
      .complexFilter([`${filterInputs}concat=n=${inputs.length}:v=0:a=1[aout]`], 'aout')
      .output(outputPath)
      .outputOptions(['-c:a aac', '-b:a 192k'])
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
}

function getBundledFontsDir(): string {
  const possiblePaths = [
    path.join(process.resourcesPath || '', 'fonts'),
    path.join(process.cwd(), 'resources', 'fonts'),
    path.join(__dirname, '..', 'resources', 'fonts'),
    path.join(__dirname, '..', '..', 'resources', 'fonts'),
    path.join(process.cwd(), 'public', 'fonts'),
  ];
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return '';
}

function findSystemFont(): string {
  const bundledDir = getBundledFontsDir();
  if (bundledDir) {
    const amiri = path.join(bundledDir, 'Amiri-Regular.ttf');
    if (fs.existsSync(amiri)) return amiri.replace(/\\/g, '/');
    const cairo = path.join(bundledDir, 'Cairo-Regular.ttf');
    if (fs.existsSync(cairo)) return cairo.replace(/\\/g, '/');
  }

  const candidates = [
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/Arial.ttf',
    'C:/Windows/Fonts/tahoma.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    'C:/Windows/Fonts/times.ttf',
  ];
  return candidates.find(p => fs.existsSync(p)) || '';
}

function findArabicFont(fontFamily?: string, weight?: string): string {
  const family = (fontFamily || '').toLowerCase();
  const bold = weight === 'bold' || weight === '700' || weight === 'semibold' || weight === '600';
  const bundledDir = getBundledFontsDir();
  const candidates: string[] = [];

  if (bundledDir) {
    if (family.includes('cairo')) {
      candidates.push(
        bold ? path.join(bundledDir, 'Cairo-Bold.ttf') : path.join(bundledDir, 'Cairo-Regular.ttf'),
        path.join(bundledDir, 'Cairo-Regular.ttf')
      );
    } else if (family.includes('tajawal')) {
      candidates.push(
        bold ? path.join(bundledDir, 'Tajawal-Bold.ttf') : path.join(bundledDir, 'Tajawal-Regular.ttf'),
        path.join(bundledDir, 'Tajawal-Regular.ttf')
      );
    } else if (family.includes('scheherazade')) {
      candidates.push(
        bold ? path.join(bundledDir, 'ScheherazadeNew-Bold.ttf') : path.join(bundledDir, 'ScheherazadeNew-Regular.ttf'),
        path.join(bundledDir, 'ScheherazadeNew-Regular.ttf')
      );
    } else if (family.includes('naskh') || family.includes('noto')) {
      candidates.push(
        bold ? path.join(bundledDir, 'NotoNaskhArabic-Bold.ttf') : path.join(bundledDir, 'NotoNaskhArabic-Regular.ttf'),
        path.join(bundledDir, 'NotoNaskhArabic-Regular.ttf')
      );
    } else {
      // Default to Amiri (Authentic Naskh Quranic font)
      candidates.push(
        bold ? path.join(bundledDir, 'Amiri-Bold.ttf') : path.join(bundledDir, 'Amiri-Regular.ttf'),
        path.join(bundledDir, 'Amiri-Regular.ttf'),
        path.join(bundledDir, 'ScheherazadeNew-Regular.ttf'),
        path.join(bundledDir, 'Cairo-Regular.ttf')
      );
    }
  }

  // Fallback to Windows system fonts if not found in bundled resources
  if (family.includes('amiri') || family.includes('scheherazade') || family.includes('naskh') || family.includes('lateef')) {
    candidates.push(
      bold ? 'C:/Windows/Fonts/tradbdo.ttf' : 'C:/Windows/Fonts/trado.ttf',
      'C:/Windows/Fonts/arabtype.ttf'
    );
  } else if (family.includes('kufi')) {
    candidates.push('C:/Windows/Fonts/arabtype.ttf');
  } else if (family.includes('cairo') || family.includes('tajawal') || family.includes('harmattan')) {
    candidates.push(
      bold ? 'C:/Windows/Fonts/tahomabd.ttf' : 'C:/Windows/Fonts/tahoma.ttf',
      bold ? 'C:/Windows/Fonts/arialbd.ttf' : 'C:/Windows/Fonts/arial.ttf'
    );
  }

  candidates.push(
    bold ? 'C:/Windows/Fonts/arialbd.ttf' : 'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/tahoma.ttf',
    'C:/Windows/Fonts/trado.ttf',
    'C:/Windows/Fonts/arabtype.ttf'
  );

  const found = candidates.find(p => p && fs.existsSync(p));
  return (found || findSystemFont()).replace(/\\/g, '/');
}

function formatAssTime(seconds: number): string {
  const safe = Math.max(0, seconds || 0);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const cs = Math.floor((safe % 1) * 100);
  return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function hexToAssColor(hex: string | undefined, fallback: string, alphaHex = '00'): string {
  const clean = (hex || fallback).replace('#', '').trim();
  let r = 'FF', g = 'FF', b = 'FF';
  if (clean.length === 6) {
    r = clean.substring(0, 2);
    g = clean.substring(2, 4);
    b = clean.substring(4, 6);
  }
  return `&H${alphaHex}${b}${g}${r}&`;
}

function generateAssSubtitleFile(
  ayahs: ExportAyah[],
  options: ExportOptions,
  w: number,
  h: number,
  assFilePath: string
): boolean {
  const settings = options.textSettings || {};
  const previewWidth = previewWidths[options.aspectRatio] || 270;
  
  // Font sizes scaled to output resolution
  const quranFontSize = Math.round(Math.max(38, (settings.fontSize || 28) * (w / previewWidth) * 0.62));
  const translationFontSize = Math.round(Math.max(24, (settings.translationFontSize || 16) * (w / previewWidth) * 0.48));
  const surahFontSize = Math.round(w * 0.034);
  const watermarkFontSize = Math.round(w * 0.032);

  // Font family names (matching TTF names loaded by libass)
  const quranFontFamily = (settings.fontFamily || 'Amiri').includes('Cairo')
    ? 'Cairo'
    : (settings.fontFamily || '').includes('Tajawal')
    ? 'Tajawal'
    : (settings.fontFamily || '').includes('Scheherazade')
    ? 'Scheherazade New'
    : (settings.fontFamily || '').includes('Naskh')
    ? 'Noto Naskh Arabic'
    : 'Amiri';

  const uiFontFamily = 'Cairo';

  const defaultTextColor = hexToAssColor(settings.textColor || options.textColor, '#ffffff', '00');
  const activeWordColor = hexToAssColor(settings.wordHighlightColor || '#fbbf24', '#fbbf24', '00');
  const pastWordColor = hexToAssColor(settings.textColor || options.textColor, '#ffffff', '00');
  const futureWordColor = hexToAssColor(settings.textColor || options.textColor, '#ffffff', '50'); // translucent future words
  const translationColor = hexToAssColor(settings.translationColor, '#e2e8f0', '20');
  const outlineColor = '&H80000000&';
  const shadowColor = '&H90000000&';

  // Vertical placement
  const position = settings.position || 'center';
  let quranAlignment = 5; // Middle Center
  let quranMarginV = 0;
  let surahMarginV = Math.round(h * 0.08);
  let transMarginV = Math.round(h * 0.28);

  if (position === 'top') {
    quranAlignment = 8; // Top Center
    quranMarginV = Math.round(h * 0.18);
    surahMarginV = Math.round(h * 0.06);
    transMarginV = Math.round(h * 0.42);
  } else if (position === 'bottom') {
    quranAlignment = 2; // Bottom Center
    quranMarginV = Math.round(h * 0.20);
    surahMarginV = Math.round(h * 0.08);
    transMarginV = Math.round(h * 0.08);
  }

  const lines: string[] = [
    '[Script Info]',
    'Title: Athar Reels Studio Subtitles',
    'ScriptType: v4.00+',
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    `PlayResX: ${w}`,
    `PlayResY: ${h}`,
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: QuranDefault,${quranFontFamily},${quranFontSize},${defaultTextColor},${activeWordColor},${outlineColor},${shadowColor},-1,0,0,0,100,100,0,0,1,3,2,${quranAlignment},60,60,${quranMarginV},1`,
    `Style: SurahBadge,${uiFontFamily},${surahFontSize},&H00FFFFFF&,&H00FFFFFF&,${outlineColor},${shadowColor},0,0,0,0,100,100,0,0,1,2,1,8,40,40,${surahMarginV},1`,
    `Style: Translation,${uiFontFamily},${translationFontSize},${translationColor},${translationColor},${outlineColor},${shadowColor},0,0,0,0,100,100,0,0,1,2,1,2,60,60,${transMarginV},1`,
    `Style: Watermark,${uiFontFamily},${watermarkFontSize},&H60FFFFFF&,&H60FFFFFF&,${outlineColor},${shadowColor},0,0,0,0,100,100,0,0,1,1,0,2,40,40,${Math.round(h * 0.03)},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  const enableHighlight = settings.wordHighlightEnabled !== false;

  ayahs.forEach((ayah) => {
    const ayahStart = Math.max(0, ayah.startTime);
    const ayahEnd = Math.max(ayahStart + 0.5, ayah.endTime);
    const ayahDuration = ayahEnd - ayahStart;

    // 1. Surah Badge at top
    if (options.surahName) {
      const surahTitle = `سورة ${options.surahName}`;
      lines.push(
        `Dialogue: 1,${formatAssTime(ayahStart)},${formatAssTime(ayahEnd)},SurahBadge,,0,0,0,,${surahTitle}`
      );
    }

    // 2. Watermark at bottom
    if (options.watermark) {
      lines.push(
        `Dialogue: 1,${formatAssTime(ayahStart)},${formatAssTime(ayahEnd)},Watermark,,0,0,0,,${options.watermark}`
      );
    }

    // 3. Translation at bottom if enabled
    if (options.showTranslation && ayah.translationText) {
      lines.push(
        `Dialogue: 1,${formatAssTime(ayahStart)},${formatAssTime(ayahEnd)},Translation,,0,0,0,,${ayah.translationText.replace(/\r?\n/g, ' ')}`
      );
    }

    // 4. Quran Verse with Word-by-Word Karaoke
    const rawWords = (ayah.words && ayah.words.length > 0) ? ayah.words : [];

    if (enableHighlight && rawWords.length > 0) {
      // Normalize word timestamps relative to ayahStart if they are local [0..duration]
      const lastWordEnd = rawWords[rawWords.length - 1]?.endTime || ayahDuration;
      const needsOffset = rawWords[0]?.startTime < ayahStart && (ayahStart > 0);
      const timeScale = (lastWordEnd > 0 && ayahDuration > 0) ? (ayahDuration / lastWordEnd) : 1;

      const normalizedWords = rawWords.map((w) => {
        const rawS = w.startTime * (needsOffset ? timeScale : 1);
        const rawE = w.endTime * (needsOffset ? timeScale : 1);
        const s = needsOffset ? (ayahStart + rawS) : rawS;
        const e = needsOffset ? (ayahStart + rawE) : rawE;
        return {
          ...w,
          startTime: Math.max(ayahStart, Math.min(ayahEnd, s)),
          endTime: Math.max(ayahStart, Math.min(ayahEnd, e)),
        };
      });

      // Split into chunks if displayMode is chunked or verse is long (> 6 words)
      const isChunked = settings.displayMode === 'chunked' || normalizedWords.length > 7;
      const chunkSize = Math.max(2, Math.min(5, settings.wordsPerChunk || 4));

      const wordChunks: typeof normalizedWords[] = [];
      if (isChunked) {
        for (let i = 0; i < normalizedWords.length; i += chunkSize) {
          wordChunks.push(normalizedWords.slice(i, i + chunkSize));
        }
      } else {
        wordChunks.push(normalizedWords);
      }

      // Generate Dialogue events for each word highlight in each chunk
      wordChunks.forEach((chunk) => {
        if (chunk.length === 0) return;
        const _chunkStart = chunk[0].startTime;
        const chunkEnd = chunk[chunk.length - 1].endTime;

        for (let wIdx = 0; wIdx < chunk.length; wIdx++) {
          const activeWord = chunk[wIdx];
          const wStart = activeWord.startTime;
          const nextStart = (wIdx < chunk.length - 1) ? chunk[wIdx + 1].startTime : chunkEnd;
          const wEnd = Math.max(wStart + 0.12, Math.min(chunkEnd, Math.max(activeWord.endTime, nextStart)));

          const formattedChunkText = chunk.map((w, idx) => {
            if (idx === wIdx) {
              return `{\\c${activeWordColor}\\fscx108\\fscy108\\t(0,120,\\fscx100\\fscy100)}${w.text}{\\r}`;
            } else if (idx < wIdx) {
              return `{\\c${pastWordColor}}${w.text}{\\r}`;
            } else {
              return `{\\c${futureWordColor}}${w.text}{\\r}`;
            }
          }).join(' ');

          const isLastChunk = cIdx === wordChunks.length - 1;
          const isLastWordInChunk = wIdx === chunk.length - 1;
          const ayahNumSuffix = (ayah.numberInSurah && isLastChunk && isLastWordInChunk)
            ? ` {\\c&H0024BFFB&\\fscx90\\fscy90}﴿ ${ayah.numberInSurah} ﴾{\\r}`
            : '';

          lines.push(
            `Dialogue: 2,${formatAssTime(wStart)},${formatAssTime(wEnd)},QuranDefault,,0,0,0,,${formattedChunkText}${ayahNumSuffix}`
          );
        }
      });
    } else {
      // Fallback: Full static verse display
      const ayahNumSuffix = ayah.numberInSurah ? ` {\\c&H0024BFFB&\\fscx90\\fscy90}﴿ ${ayah.numberInSurah} ﴾{\\r}` : '';
      const textToDisplay = ayah.text.replace(/\r?\n/g, '\\N') + ayahNumSuffix;
      lines.push(
        `Dialogue: 2,${formatAssTime(ayahStart)},${formatAssTime(ayahEnd)},QuranDefault,,0,0,0,,${textToDisplay}`
      );
    }
  });

  try {
    fs.writeFileSync(assFilePath, lines.join('\n'), 'utf8');
    return true;
  } catch (err) {
    console.error('[ExportService] Failed to write ASS subtitle file:', err);
    return false;
  }
}

function escapeDrawText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function ffColor(hex: string | undefined, fallback: string): string {
  return (hex || fallback).replace('#', '0x');
}

function stripArabicMarks(value: string): string {
  return value.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

function visualLength(value: string): number {
  return stripArabicMarks(value).length;
}

function wrapTextByChars(text: string, maxChars: number, maxLines = 4): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && visualLength(candidate) > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  clipped[maxLines - 1] = `${clipped[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`;
  return clipped;
}

function escapeFilterText(value: string): string {
  return escapeDrawText(value.replace(/\r?\n/g, ' ').trim());
}

function drawTextFilter(
  text: string,
  x: string | number,
  y: string | number,
  fontSize: number,
  fontColor: string,
  fontPath: string,
  enable?: string,
  extra = ''
): string {
  const escapedFont = fontPath.replace(/\\/g, '/').replace(/:/g, '\\:');
  let filter = `drawtext=text='${escapeFilterText(text)}':fontfile='${escapedFont}':text_shaping=1:fontsize=${fontSize}:fontcolor=${fontColor}:x=${x}:y=${y}`;
  if (extra) filter += extra;
  if (enable) filter += `:enable='${enable}'`;
  return filter;
}

function getContentCenterY(settings: ExportTextSettings | undefined, h: number) {
  const position = settings?.position || 'center';
  if (position === 'top') return Math.round(h * 0.30);
  if (position === 'bottom') return Math.round(h * 0.70);
  return Math.round(h * 0.50);
}

function getTextXExpression(settings: ExportTextSettings | undefined, w: number) {
  const align = settings?.textAlign || 'center';
  if (align === 'right') return `w-text_w-${Math.round(w * 0.12)}`;
  if (align === 'left') return `${Math.round(w * 0.12)}`;
  return '(w-text_w)/2';
}

function buildTextAlpha(start: number, end: number, transition?: string): string | undefined {
  if (!transition || transition === 'none') return undefined;
  const fadeIn = Math.min(0.45, Math.max(0.18, (end - start) * 0.18));
  const fadeOut = Math.min(0.28, Math.max(0.12, (end - start) * 0.12));
  return `if(lt(t,${(start + fadeIn).toFixed(3)}),(t-${start.toFixed(3)})/${fadeIn.toFixed(3)},if(gt(t,${(end - fadeOut).toFixed(3)}),(${end.toFixed(3)}-t)/${fadeOut.toFixed(3)},1))`;
}

function addVideoEffectFilters(filters: string[], effect: string | undefined, w: number, h: number) {
  if (!effect || effect === 'none') return;

  if (effect === 'vignette') {
    filters.push('vignette=PI/4');
  } else if (effect === 'cinematic') {
    filters.push(`drawbox=x=0:y=0:w=iw:h=${Math.round(h * 0.08)}:color=black@1:t=fill`);
    filters.push(`drawbox=x=0:y=ih-${Math.round(h * 0.08)}:w=iw:h=${Math.round(h * 0.08)}:color=black@1:t=fill`);
  } else if (effect === 'glow') {
    filters.push('eq=saturation=1.15:contrast=1.08');
  } else if (effect === 'particles') {
    filters.push('noise=alls=5:allf=t+u');
  }
}

function addPreviewOverlayFilters(
  filters: string[],
  ayahs: ExportAyah[],
  options: ExportOptions,
  w: number,
  h: number
) {
  const settings = options.textSettings || {};
  const previewWidth = previewWidths[options.aspectRatio] || 270;
  const quranFont = findArabicFont(settings.fontFamily, settings.fontWeight);
  const uiFont = findArabicFont('Cairo', 'normal');
  const quranFontSize = Math.round(Math.max(34, (settings.fontSize || 28) * (w / previewWidth) * 0.6));
  const ayahNumberFontSize = Math.round(quranFontSize * 0.48);
  const translationFontSize = Math.round(Math.max(28, (settings.translationFontSize || settings.fontSize || 16) * (w / previewWidth) * 0.55));
  const surahFontSize = Math.round(w * 0.03);
  const watermarkFontSize = Math.round(w * 0.034);
  const quranLineHeight = Math.round(quranFontSize * 1.55);
  const _boxPaddingX = Math.round(w * 0.08);
  const boxPaddingY = Math.round(w * 0.045);
  const maxTextWidth = Math.round(w * 0.78);
  const maxChars = Math.max(14, Math.floor(maxTextWidth / (quranFontSize * 0.48)));
  const textX = getTextXExpression(settings, w);
  const textColor = ffColor(settings.textColor || options.textColor, '#ffffff');
  const translationColor = `${ffColor(settings.translationColor, '#e2e8f0')}@0.68`;
  const boxColor = `${ffColor(settings.bgColor, '#000000')}@${Math.max(0, Math.min(1, settings.bgOpacity ?? 0.5)).toFixed(2)}`;
  const contentCenterY = getContentCenterY(settings, h);

  const cornerMargin = Math.round(w * 0.03);
  const cornerLength = Math.round(w * 0.06);
  const cornerThickness = Math.max(3, Math.round(w * 0.006));
  const cornerColor = '0x14b8a6@0.25';
  filters.push(`drawbox=x=${cornerMargin}:y=${cornerMargin}:w=${cornerLength}:h=${cornerThickness}:color=${cornerColor}:t=fill`);
  filters.push(`drawbox=x=${cornerMargin}:y=${cornerMargin}:w=${cornerThickness}:h=${cornerLength}:color=${cornerColor}:t=fill`);
  filters.push(`drawbox=x=w-${cornerMargin + cornerLength}:y=${cornerMargin}:w=${cornerLength}:h=${cornerThickness}:color=${cornerColor}:t=fill`);
  filters.push(`drawbox=x=w-${cornerMargin + cornerThickness}:y=${cornerMargin}:w=${cornerThickness}:h=${cornerLength}:color=${cornerColor}:t=fill`);
  filters.push(`drawbox=x=${cornerMargin}:y=h-${cornerMargin + cornerThickness}:w=${cornerLength}:h=${cornerThickness}:color=${cornerColor}:t=fill`);
  filters.push(`drawbox=x=${cornerMargin}:y=h-${cornerMargin + cornerLength}:w=${cornerThickness}:h=${cornerLength}:color=${cornerColor}:t=fill`);
  filters.push(`drawbox=x=w-${cornerMargin + cornerLength}:y=h-${cornerMargin + cornerThickness}:w=${cornerLength}:h=${cornerThickness}:color=${cornerColor}:t=fill`);
  filters.push(`drawbox=x=w-${cornerMargin + cornerThickness}:y=h-${cornerMargin + cornerLength}:w=${cornerThickness}:h=${cornerLength}:color=${cornerColor}:t=fill`);

  ayahs.forEach((ayah) => {
    const enable = `between(t,${ayah.startTime.toFixed(3)},${ayah.endTime.toFixed(3)})`;
    const alpha = buildTextAlpha(ayah.startTime, ayah.endTime, options.transition);
    const alphaOption = alpha ? `:alpha='${alpha}'` : '';
    const lines = wrapTextByChars(ayah.text, maxChars, 4);
    const ayahNumber = ayah.numberInSurah ? `﴿ ${ayah.numberInSurah} ﴾` : '';
    const textHeight = lines.length * quranLineHeight;
    const numberHeight = ayahNumber ? Math.round(ayahNumberFontSize * 1.45) : 0;
    const boxHeight = textHeight + numberHeight + boxPaddingY * 2;
    const boxWidth = Math.round(w * 0.84);
    const boxX = Math.round((w - boxWidth) / 2);
    const boxY = Math.round(contentCenterY - boxHeight / 2);
    const firstLineY = boxY + boxPaddingY;

    const surahText = options.surahName ? `سورة ${options.surahName}` : '';
    if (surahText) {
      const badgeHeight = Math.round(surahFontSize * 1.95);
      const badgeWidth = Math.min(Math.round(w * 0.48), Math.max(Math.round(w * 0.24), visualLength(surahText) * Math.round(surahFontSize * 0.8)));
      const badgeX = Math.round((w - badgeWidth) / 2);
      const badgeY = Math.max(cornerMargin + cornerLength + 8, boxY - badgeHeight - Math.round(w * 0.045));
      filters.push(`drawbox=x=${badgeX}:y=${badgeY}:w=${badgeWidth}:h=${badgeHeight}:color=0xffffff@0.05:t=fill:enable='${enable}'`);
      filters.push(drawTextFilter(surahText, '(w-text_w)/2', badgeY + Math.round(surahFontSize * 0.42), surahFontSize, '0xffffff@0.35', uiFont, enable, alphaOption));
    }

    filters.push(`drawbox=x=${boxX}:y=${boxY}:w=${boxWidth}:h=${boxHeight}:color=${boxColor}:t=fill:enable='${enable}'`);
    lines.forEach((line, index) => {
      filters.push(drawTextFilter(line, textX, firstLineY + index * quranLineHeight, quranFontSize, textColor, quranFont, enable, alphaOption));
    });

    if (ayahNumber) {
      filters.push(drawTextFilter(ayahNumber, '(w-text_w)/2', firstLineY + textHeight + Math.round(ayahNumberFontSize * 0.15), ayahNumberFontSize, '0xffffff@0.45', uiFont, enable, alphaOption));
    }

    if (options.showTranslation && ayah.translationText) {
      const translationLines = wrapTextByChars(ayah.translationText, Math.max(30, Math.floor(w * 0.82 / (translationFontSize * 0.46))), 3);
      const transStartY = boxY + boxHeight + Math.round(w * 0.055);
      translationLines.forEach((line, index) => {
        filters.push(drawTextFilter(line, '(w-text_w)/2', transStartY + index * Math.round(translationFontSize * 1.45), translationFontSize, translationColor, uiFont, enable, alphaOption));
      });
    }

    if (options.showTafsir && ayah.tafsirText) {
      const tafsirLines = wrapTextByChars(ayah.tafsirText, Math.max(30, Math.floor(w * 0.82 / (translationFontSize * 0.42))), 2);
      const tafsirStartY = boxY + boxHeight + Math.round(w * 0.14);
      tafsirLines.forEach((line, index) => {
        filters.push(drawTextFilter(line, '(w-text_w)/2', tafsirStartY + index * Math.round(translationFontSize * 1.35), Math.round(translationFontSize * 0.9), '0xffffff@0.35', uiFont, enable, alphaOption));
      });
    }
  });

  if (options.watermark) {
    filters.push(drawTextFilter(options.watermark, '(w-text_w)/2', `h-${Math.round(w * 0.075)}`, watermarkFontSize, `${ffColor(settings.textColor || options.textColor, '#ffffff')}@0.42`, uiFont));
  }
}

function safeSendProgress(sender: Electron.WebContents | null | undefined, data: { phase: string; percent: number; timemark?: string }) {
  try {
    if (sender && !sender.isDestroyed()) {
      sender.send('export:progress', data);
    }
  } catch {
    // Window was destroyed or closed
  }
}

export function setupExportHandlers(tempDir: string) {
  let activeFfmpegCmd: any = null;
  let isNativeExportActive = false;
  let activeJobTempDir: string | null = null;

  ipcMain.handle('export:choosePath', async (_event, projectName: string) => {
    const result = await dialog.showSaveDialog({
      title: 'حفظ الفيديو',
      defaultPath: `${projectName}.mp4`,
      filters: [{ name: 'فيديو', extensions: ['mp4', 'mkv'] }],
    });
    if (result.filePath && isSafeUserPath(result.filePath)) {
      return result.filePath;
    }
    return null;
  });

  ipcMain.handle('export:cancel', async () => {
    if (activeFfmpegCmd) {
      try {
        activeFfmpegCmd.kill('SIGKILL');
      } catch (err) {
        console.warn('[Export] Cancel kill error:', err);
      }
      activeFfmpegCmd = null;
    }
    isNativeExportActive = false;
    if (activeJobTempDir) {
      try {
        if (fs.existsSync(activeJobTempDir)) {
          fs.rmSync(activeJobTempDir, { recursive: true, force: true });
        }
      } catch (e) {
        console.debug('[Export] Cleanup error on cancel:', e);
      }
      activeJobTempDir = null;
    }
    return { success: true };
  });

  ipcMain.handle('export:start', async (_event, options: ExportOptions) => {
    if (isNativeExportActive) {
      return {
        success: false,
        error: 'هناك عملية تصدير قيد التنفيذ حالياً. يرجى الانتظار حتى تكتمل أو إلغاؤها أولاً.',
      };
    }

    isNativeExportActive = true;

    try {
      await initFFmpeg();
    } catch (err: any) {
      isNativeExportActive = false;
      console.error('[Export] FFmpeg init failed:', err);
      return { success: false, error: `فشل تحميل FFmpeg: ${err.message}` };
    }

    // Validate and sanitize output path
    const cleanProjectName = (options.projectName || 'ayah_reel').replace(/[/\\?%*:|"<>]/g, '_').trim() || 'ayah_reel';
    const ts = Date.now();
    const jobId = `job_${ts}_${Math.random().toString(36).substring(2, 7)}`;
    const jobTempDir = path.join(tempDir, jobId);
    activeJobTempDir = jobTempDir;

    if (!fs.existsSync(jobTempDir)) {
      fs.mkdirSync(jobTempDir, { recursive: true });
    }

    const cleanup = () => {
      isNativeExportActive = false;
      activeFfmpegCmd = null;
      activeJobTempDir = null;
      try {
        if (fs.existsSync(jobTempDir)) {
          fs.rmSync(jobTempDir, { recursive: true, force: true });
        }
      } catch (e) {
        console.debug('[Export] Cleanup error:', e);
      }
    };

    if (!options.outputPath || typeof options.outputPath !== 'string') {
      options.outputPath = path.join(tempDir, `${cleanProjectName}_${ts}.mp4`);
    } else {
      let resolved = path.resolve(options.outputPath);
      try {
        if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
          resolved = path.join(resolved, `${cleanProjectName}.mp4`);
        }
      } catch (err) {
        console.debug('[Export] Output path stat check error:', err);
      }
      const ext = path.extname(resolved).toLowerCase();
      if (!['.mp4', '.mkv', '.webm', '.mov'].includes(ext)) {
        options.outputPath = `${resolved}.mp4`;
      } else {
        options.outputPath = resolved;
      }

      // Security validation against unauthorized paths
      if (!isSafeUserPath(options.outputPath)) {
        cleanup();
        return {
          success: false,
          error: `مسار حفظ الفيديو غير مصرح به أو خارج المجلدات المسموحة: ${options.outputPath}`,
        };
      }

      // Ensure target directory exists
      const targetDir = path.dirname(options.outputPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }

    const { w, h } = resolutions[options.aspectRatio] || resolutions['9:16'];
    const crf     = crfMap[options.quality]    || 20;
    const preset  = presetMap[options.quality] || 'slow';
    const abitrate= bitrateMap[options.quality]|| '192k';

    try {
      // ── 1. Download audio files ────────────────────────────────────────────
      let mergedAudio: string | null = null;
      let downloadedAudio: string[] = [];
      const audioDurations: number[] = [];
      const isDataUrl = (u: string) => typeof u === 'string' && u.startsWith('data:');
      const isHttp = (u: string) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'));
      const isLocalFile = (u: string) =>
        typeof u === 'string' &&
        !u.startsWith('blob:') &&
        !u.startsWith('http://') &&
        !u.startsWith('https://') &&
        !u.startsWith('data:') &&
        fs.existsSync(u) &&
        isSafeUserPath(u);

      const urls = (options.audioUrls || []).filter(u => u && typeof u === 'string' && (isHttp(u) || isDataUrl(u) || isLocalFile(u)));

      if (urls.length > 0) {
        safeSendProgress(_event.sender, { phase: 'تحميل الصوت...', percent: 5 });

        const downloaded: string[] = [];
        const failedAudio: string[] = [];
        for (let i = 0; i < urls.length; i++) {
          const dest = path.join(jobTempDir, `ayah_${ts}_${i}.mp3`);
          try {
            if (isDataUrl(urls[i])) {
              const base64Data = urls[i].replace(/^data:[^;]+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              fs.writeFileSync(dest, buffer);
              downloaded.push(dest);
            } else if (isLocalFile(urls[i])) {
              downloaded.push(urls[i]);
            } else {
              const download = await downloadFile(urls[i], dest);
              downloaded.push(download.filePath);
            }
          } catch (e) {
            console.warn('[Export] Failed to process audio:', urls[i], e);
            failedAudio.push(`آية ${i + 1}: ${errorMessage(e)}`);
          }
          const pct = 5 + Math.round((i / urls.length) * 20);
          safeSendProgress(_event.sender, { phase: `تحميل الصوت ${i + 1}/${urls.length}`, percent: pct });
        }

        if (downloaded.length !== urls.length) {
          throw new Error(`فشل تحميل ملفات الصوت (${downloaded.length}/${urls.length}). ${failedAudio.slice(0, 2).join(' | ')}`);
        }

        downloadedAudio = downloaded;
        safeSendProgress(_event.sender, { phase: 'حساب توقيت الآيات من الصوت...', percent: 26 });
        for (let i = 0; i < downloadedAudio.length; i++) {
          audioDurations.push(await getMediaDurationSeconds(downloadedAudio[i]));
        }

        if (downloaded.length === 1) {
          mergedAudio = downloaded[0];
        } else if (downloaded.length > 1) {
          safeSendProgress(_event.sender, { phase: 'دمج ملفات الصوت...', percent: 28 });
          mergedAudio = path.join(jobTempDir, `merged_${ts}.aac`);
          await concatAudio(downloaded, mergedAudio);
        }
      }

      // ── 1b. Download background media if it's a remote URL ────────────────
      let localBgPath: string | undefined;
      let backgroundKind: BackgroundKind | undefined;
      const bgPath = options.backgroundPath;

      if (bgPath) {
        const isRemoteUrl = /^https?:\/\//i.test(bgPath);
        backgroundKind = inferBackgroundKind(bgPath);
        if (isRemoteUrl) {
          safeSendProgress(_event.sender, { phase: 'تحميل الخلفية...', percent: 30 });
          const ext = extensionForBackground(bgPath, backgroundKind);
          const dest = path.join(jobTempDir, `bg_${ts}${ext}`);
          try {
            const download = await downloadFile(bgPath, dest);
            localBgPath = download.filePath;
            backgroundKind = inferBackgroundKind(bgPath, download.contentType) || mediaKindFromFile(localBgPath) || backgroundKind;
          } catch (e) {
            console.warn('[Export] Failed to download background:', e);
            throw new Error(`فشل تحميل الخلفية: ${errorMessage(e)}`, { cause: e });
          }
          safeSendProgress(_event.sender, { phase: 'تم تحميل الخلفية', percent: 32 });
        } else {
          if (fs.existsSync(bgPath) && isSafeUserPath(bgPath)) {
            localBgPath = bgPath;
            backgroundKind = backgroundKind || mediaKindFromFile(bgPath);
          } else {
            console.warn('[Export] Background file does not exist or unauthorized path:', bgPath);
            throw new Error(`ملف الخلفية غير موجود أو مساره غير مصرح به: ${bgPath}`);
          }
        }
      }

      // ── 2. Build Subtitles / Karaoke layer for each ayah ───────────────────
      safeSendProgress(_event.sender, { phase: 'تجهيز طبقة النص والترجمة...', percent: 32 });

      let timedAyahs = options.ayahs;
      let syncedTotalDuration =
        options.totalDuration ||
        Math.max(...options.ayahs.map(a => a.endTime), 60);

      if (audioDurations.length === options.ayahs.length && audioDurations.length > 0) {
        let cursor = 0;
        timedAyahs = options.ayahs.map((ayah, index) => {
          const startTime = cursor;
          cursor += audioDurations[index];
          return {
            ...ayah,
            startTime,
            endTime: cursor,
          };
        });
        syncedTotalDuration = cursor;
      }

      // Generate ASS Subtitle file for ultra-crisp word-by-word karaoke & font shaping
      const assDest = path.join(jobTempDir, `subtitles_${ts}.ass`);
      const assGenerated = generateAssSubtitleFile(timedAyahs, options, w, h, assDest);

      const textFilters: string[] = [];
      const bundledFonts = getBundledFontsDir();

      if (assGenerated) {
        // Draw background glass card if enabled
        const settings = options.textSettings || {};
        const boxColor = `${ffColor(settings.bgColor, '#000000')}@${Math.max(0, Math.min(1, settings.bgOpacity ?? 0.45)).toFixed(2)}`;
        const boxWidth = Math.round(w * 0.86);
        const boxHeight = Math.round(h * 0.36);
        const boxX = Math.round((w - boxWidth) / 2);
        const contentCenterY = getContentCenterY(settings, h);
        const boxY = Math.round(contentCenterY - boxHeight / 2);

        const cornerThickness = Math.max(3, Math.round(w * 0.006));
        const cornerColor = '0x14b8a6@0.25';
        textFilters.push(`drawbox=x=${cornerMargin}:y=${cornerMargin}:w=${cornerLength}:h=${cornerThickness}:color=${cornerColor}:t=fill`);
        textFilters.push(`drawbox=x=${cornerMargin}:y=${cornerMargin}:w=${cornerThickness}:h=${cornerLength}:color=${cornerColor}:t=fill`);
        textFilters.push(`drawbox=x=w-${cornerMargin + cornerLength}:y=${cornerMargin}:w=${cornerLength}:h=${cornerThickness}:color=${cornerColor}:t=fill`);
        textFilters.push(`drawbox=x=w-${cornerMargin + cornerThickness}:y=${cornerMargin}:w=${cornerThickness}:h=${cornerLength}:color=${cornerColor}:t=fill`);

        // Subtitles filter via libass with bundled fonts dir
        const escapedAss = assDest.replace(/\\/g, '/').replace(/:/g, '\\:');
        if (bundledFonts) {
          const escapedFontsDir = bundledFonts.replace(/\\/g, '/').replace(/:/g, '\\:');
          textFilters.push(`subtitles='${escapedAss}':fontsdir='${escapedFontsDir}'`);
        } else {
          textFilters.push(`subtitles='${escapedAss}'`);
        }
      } else {
        // Fallback: drawtext overlay
        addPreviewOverlayFilters(textFilters, timedAyahs, options, w, h);
      }

      // ── 3. Compose FFmpeg command ──────────────────────────────────────────
      safeSendProgress(_event.sender, { phase: 'إنشاء الفيديو...', percent: 35 });

      const effectiveBg = localBgPath;
      const effectiveBgKind = backgroundKind || (effectiveBg ? mediaKindFromFile(effectiveBg) || inferBackgroundKind(effectiveBg) : undefined);
      const isVideo = effectiveBg && effectiveBgKind === 'video';
      const isImage = effectiveBg && effectiveBgKind === 'image';
      if (effectiveBg && !effectiveBgKind) {
        throw new Error(`نوع الخلفية غير مدعوم أو غير معروف: ${effectiveBg}`);
      }
      const totalDur = syncedTotalDuration;

      return new Promise<{ success: boolean; outputPath?: string; error?: string }>((resolve) => {
        let cmd = ffmpeg();
        activeFfmpegCmd = cmd;

        if (isVideo && effectiveBg) {
          cmd = cmd.input(effectiveBg).inputOptions(['-stream_loop', '-1']);
        } else if (isImage && effectiveBg) {
          cmd = cmd.input(effectiveBg).inputOptions(['-loop', '1', '-framerate', '25']);
        } else {
          cmd = cmd.input(`color=black:size=${w}x${h}:rate=25`).inputFormat('lavfi');
        }

        if (mergedAudio) cmd = cmd.input(mergedAudio);

        // Video filter: scale + crop + drawtext
        const vfParts: string[] = [
          options.videoEffect === 'kenBurns'
            ? `scale=${Math.round(w * 1.1)}:${Math.round(h * 1.1)}:force_original_aspect_ratio=increase`
            : `scale=${w}:${h}:force_original_aspect_ratio=increase`,
          options.videoEffect === 'kenBurns'
            ? `crop=${w}:${h}:x=(in_w-out_w)/2+sin(t/4)*20:y=(in_h-out_h)/2`
            : `crop=${w}:${h}`,
        ];
        if (options.bgOpacity !== undefined && options.bgOpacity < 0.98) {
          const opacity = Math.max(0, Math.min(1, options.bgOpacity)).toFixed(3);
          vfParts.push(`lutrgb=r=val*${opacity}:g=val*${opacity}:b=val*${opacity}`);
        }
        addVideoEffectFilters(vfParts, options.videoEffect, w, h);
        if (textFilters.length > 0) vfParts.push(...textFilters);

        cmd.videoFilter(vfParts.join(','));

        const outputExt = path.extname(options.outputPath).toLowerCase();
        const videoOutputOptions = [
          '-c:v libx264',
          `-crf ${crf}`,
          `-preset ${preset}`,
          '-pix_fmt yuv420p',
          `-t ${totalDur}`,
        ];
        if (outputExt !== '.mkv') {
          videoOutputOptions.splice(4, 0, '-movflags +faststart');
        }

        cmd.outputOptions(videoOutputOptions);

        if (mergedAudio) {
          const audioFilters = buildAudioFilters(options.audioSettings, totalDur);
          const audioOutputOptions = [
            '-map 0:v',
            '-map 1:a',
            '-c:a aac',
            `-b:a ${abitrate}`,
            '-max_muxing_queue_size 1024',
          ];
          if (audioFilters.length > 0) {
            audioOutputOptions.push(`-af ${audioFilters.join(',')}`);
          }
          cmd.outputOptions(audioOutputOptions);
        } else {
          cmd.outputOptions(['-an']);
        }

        activeFfmpegCmd = cmd;

        cmd
          .output(options.outputPath)
          .on('start', () => {
            // Started export safely
          })
          .on('progress', (prog: any) => {
            const pct = Math.min(97, 35 + Math.round((prog.percent || 0) * 0.62));
            safeSendProgress(_event.sender, {
              phase: `جاري التصدير... ${Math.round(prog.percent || 0)}%`,
              percent: pct,
              timemark: prog.timemark,
            });
          })
          .on('end', () => {
            cleanup();
            safeSendProgress(_event.sender, { phase: 'اكتمل التصدير ✅', percent: 100 });
            resolve({ success: true, outputPath: options.outputPath });
          })
          .on('error', (err: any) => {
            cleanup();
            console.error('[FFmpeg Error]', err.message);
            resolve({ success: false, error: err.message });
          })
          .run();
      });

    } catch (err: any) {
      cleanup();
      return { success: false, error: err.message };
    }
  });
}
