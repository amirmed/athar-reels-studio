import type { AyahData } from '../services/quranApi';

/**
 * Distributes custom recorded audio across single or multiple Quranic ayahs proportionally,
 * resetting timestamps (startTimeMs / endTimeMs / duration) to match the custom recording file from 0s.
 */
export function applyCustomVoiceToAyahs(
  ayahs: AyahData[],
  customVoiceUrl: string,
  recordedDuration: number
): void {
  if (!customVoiceUrl || ayahs.length === 0) return;

  if (ayahs.length === 1) {
    const a = ayahs[0];
    a.audioUrl = customVoiceUrl;
    a.fallbackUrls = [];
    if (recordedDuration > 0) {
      a.duration = recordedDuration;
      a.startTimeMs = 0;
      a.endTimeMs = Math.round(recordedDuration * 1000);
      a.isFullSurahFile = false;
      if (a.words?.length) {
        const last = a.words[a.words.length - 1]?.endTime || recordedDuration || 1;
        const scale = recordedDuration / last;
        a.words.forEach((w) => {
          w.startTime = Math.round(w.startTime * scale * 1000) / 1000;
          w.endTime = Math.round(w.endTime * scale * 1000) / 1000;
        });
      }
    }
    return;
  }

  const total = recordedDuration > 0
    ? recordedDuration
    : ayahs.reduce((s, a) => s + (a.duration || 5), 0);
  const weights = ayahs.map((a) => (a.duration && a.duration > 0 ? a.duration
    : Math.max(1, a.words?.length || (a.text ? a.text.split(/\s+/).length : 1))));
  const totalW = weights.reduce((s, w) => s + w, 0) || 1;
  let acc = 0;
  ayahs.forEach((a, idx) => {
    const start = acc;
    const end = idx === ayahs.length - 1
      ? total
      : Math.round((acc + (total * weights[idx]) / totalW) * 1000) / 1000;
    acc = end;
    a.audioUrl = customVoiceUrl;
    a.fallbackUrls = [];
    a.duration = Math.max(0.5, Math.round((end - start) * 1000) / 1000);
    a.startTimeMs = Math.round(start * 1000);
    a.endTimeMs = Math.round(end * 1000);
    a.isFullSurahFile = true;
    if (a.words?.length) {
      const last = a.words[a.words.length - 1]?.endTime || weights[idx] || 1;
      const scale = a.duration / last;
      a.words.forEach((w) => {
        w.startTime = Math.round(w.startTime * scale * 1000) / 1000;
        w.endTime = Math.round(w.endTime * scale * 1000) / 1000;
      });
    }
  });
}
