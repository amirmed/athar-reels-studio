/**
 * Arabic Neural AI Voice Engine (Edge TTS & Neural Voice Synthesizer)
 * Inspired by MoneyPrinterTurbo's Multi-Engine Voice Pipeline.
 * Provides high-fidelity Arabic speech synthesis with authentic Tashkeel support.
 */

export interface ArabicVoice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  region: string;
  regionCode: string;
  description: string;
  icon: string;
  sampleText: string;
}

export const ARABIC_AI_VOICES: ArabicVoice[] = [
  {
    id: 'ar-SA-HamedNeural',
    name: 'الشيخ حامد (وقور وفخم)',
    gender: 'male',
    region: 'السعودية',
    regionCode: 'ar-SA',
    description: 'نبرة خاشعة وفخمة، مثالي للأحاديث النبوية والخطب الجليلة',
    icon: '🎙️',
    sampleText: 'قَالَ رَسُولُ اللَّهِ ﷺ: خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ.',
  },
  {
    id: 'ar-SA-ZariyahNeural',
    name: 'القارئة زارية (هادئة وروحانية)',
    gender: 'female',
    region: 'السعودية',
    regionCode: 'ar-SA',
    description: 'صوت هادئ ومريح، مثالي لأذكار الصباح والمساء والأدعية',
    icon: '🌸',
    sampleText: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ.',
  },
  {
    id: 'ar-EG-ShakirNeural',
    name: 'الشيخ شاكر (إذاعي فصيح)',
    gender: 'male',
    region: 'مصر',
    regionCode: 'ar-EG',
    description: 'نبرة واضحة ومخارج حروف متقنة، ممتاز للمواعظ والقصص',
    icon: '📻',
    sampleText: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا.',
  },
  {
    id: 'ar-EG-SalmaNeural',
    name: 'الأستاذة سلمى (واضحة ومؤثرة)',
    gender: 'female',
    region: 'مصر',
    regionCode: 'ar-EG',
    description: 'صوت نقي ومؤثر، رائع للأذكار والتأملات الإيمانية',
    icon: '✨',
    sampleText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ.',
  },
  {
    id: 'ar-MA-MounaNeural',
    name: 'الأستاذة منى (مغاربية هادئة)',
    gender: 'female',
    region: 'المغرب',
    regionCode: 'ar-MA',
    description: 'نبرة مغاربية رقيقة وعذبة للأذكار والأدعية',
    icon: '🕊️',
    sampleText: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ.',
  },
  {
    id: 'ar-AE-HamdanNeural',
    name: 'الشيخ حمدان (خليجي هادئ)',
    gender: 'male',
    region: 'الإمارات',
    regionCode: 'ar-AE',
    description: 'نبرة خليجية هادئة وجزلة، رائعة للأدعية النبوية',
    icon: '🕋',
    sampleText:
      'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.',
  },
];

// In-memory audio blob cache
const ttsAudioCache = new Map<string, { blob: Blob; audioUrl: string; duration: number }>();

/**
 * Clean decorative brackets while strictly preserving Tashkeel
 */
export function cleanTextForTts(text: string): string {
  return text
    .replace(/[«»*﴿﴾]/g, '')
    .replace(/[\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Synthesize Arabic speech via Edge TTS Server Proxy & Neural Voice Pipelines
 */
export async function synthesizeArabicSpeech(
  text: string,
  voiceId: string = 'ar-SA-HamedNeural',
  rate: string = '+0%',
  pitch: string = '+0Hz'
): Promise<{ blob: Blob; audioUrl: string; duration: number }> {
  const clean = cleanTextForTts(text);
  const cacheKey = `${voiceId}_${rate}_${pitch}_${clean}`;

  if (ttsAudioCache.has(cacheKey)) {
    return ttsAudioCache.get(cacheKey)!;
  }

  // 1. Try Electron IPC if running as desktop app
  const electronAPI = (
    window as unknown as {
      electronAPI?: {
        audio?: {
          getTTSStream?: (
            text: string,
            voice?: string
          ) => Promise<{ success: boolean; base64?: string; mime?: string; error?: string }>;
        };
      };
    }
  ).electronAPI;
  if (electronAPI?.audio?.getTTSStream) {
    try {
      const res = await electronAPI.audio.getTTSStream(clean, voiceId);
      if (res?.success && res?.base64) {
        const binary = atob(res.base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        const blob = new Blob([array], { type: res.mime || 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        const duration = await getAudioDuration(audioUrl);
        const result = { blob, audioUrl, duration };
        ttsAudioCache.set(cacheKey, result);
        return result;
      }
    } catch (ipcErr) {
      console.warn('[ArabicTTS] Electron IPC failed, trying HTTP proxy:', ipcErr);
    }
  }

  // 2. Try Vite / API Server Proxy (/api/tts with Edge-TTS)
  try {
    const ttsUrl = `/api/tts?text=${encodeURIComponent(clean)}&voice=${encodeURIComponent(voiceId)}&rate=${encodeURIComponent(rate)}&pitch=${encodeURIComponent(pitch)}`;
    const response = await fetch(ttsUrl);
    if (response.ok) {
      const blob = await response.blob();
      if (blob && blob.size > 200) {
        const audioUrl = URL.createObjectURL(blob);
        const duration = await getAudioDuration(audioUrl);
        const result = { blob, audioUrl, duration };
        ttsAudioCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (proxyErr) {
    console.warn('[ArabicTTS] /api/tts proxy fetch failed:', proxyErr);
  }

  // 3. Try Direct Google Arabic Speech stream
  try {
    const googleResult = await synthesizeGoogleTts(clean);
    ttsAudioCache.set(cacheKey, googleResult);
    return googleResult;
  } catch (gErr) {
    console.warn('[ArabicTTS] Google TTS stream failed:', gErr);
  }

  // 4. Fail explicitly with clear user error message instead of generating fake silent audio
  throw new Error(
    'تعذر توليد القراءة الصوتية للأذكار. يرجى التأكد من اتصال الإنترنت أو استخدام تسجيلك الصوتي المباشر.'
  );
}

/**
 * Play speech immediately using the best available playback engine
 */
export function playArabicSpeechDirect(
  text: string,
  voiceId: string = 'ar-SA-HamedNeural',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): () => void {
  let isCancelled = false;
  let activeAudio: HTMLAudioElement | null = null;

  synthesizeArabicSpeech(text, voiceId)
    .then((res) => {
      if (isCancelled) return;
      try {
        const audio = new Audio(res.audioUrl);
        audio.volume = 0.95;
        activeAudio = audio;
        audio.onplay = () => onStart?.();
        audio.onended = () => {
          activeAudio = null;
          onEnd?.();
        };
        audio.onerror = () => {
          activeAudio = null;
          // Fallback to browser speech synthesis
          speakWithBrowserUtterance(text, onStart, onEnd, onError);
        };
        audio.play().catch(() => {
          speakWithBrowserUtterance(text, onStart, onEnd, onError);
        });
      } catch {
        speakWithBrowserUtterance(text, onStart, onEnd, onError);
      }
    })
    .catch(() => {
      if (isCancelled) return;
      speakWithBrowserUtterance(text, onStart, onEnd, onError);
    });

  return () => {
    isCancelled = true;
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.removeAttribute('src');
      } catch {}
      activeAudio = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  };
}

/**
 * Native Browser SpeechSynthesis Utterance with Arabic Neural Voice Picker
 */
function speakWithBrowserUtterance(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
) {
  if (!('speechSynthesis' in window)) {
    onError?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const clean = cleanTextForTts(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.88;
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(
      (v) =>
        v.lang.startsWith('ar') ||
        v.name.includes('Arabic') ||
        v.name.includes('Hamed') ||
        v.name.includes('Salma') ||
        v.name.includes('Shakir')
    );
    if (arVoice) utterance.voice = arVoice;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onError?.();
    window.speechSynthesis.speak(utterance);
  } catch {
    onError?.();
  }
}

/**
 * Measure real duration of an Audio URL
 */
function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      resolve(audio.duration && !isNaN(audio.duration) ? audio.duration : 5);
    };
    audio.onerror = () => {
      resolve(5);
    };
  });
}

/**
 * Google Translate Arabic TTS Stream Fallback
 */
async function synthesizeGoogleTts(
  text: string
): Promise<{ blob: Blob; audioUrl: string; duration: number }> {
  const chunks = splitTextIntoChunks(text, 140);
  const audioBlobs: Blob[] = [];

  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google TTS HTTP ${response.status}`);
    const blob = await response.blob();
    audioBlobs.push(blob);
  }

  const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(combinedBlob);
  const duration = await getAudioDuration(audioUrl);

  return {
    blob: combinedBlob,
    audioUrl,
    duration,
  };
}

/**
 * Web Speech AudioBuffer Generator Fallback
 */
async function synthesizeWebSpeechFallback(
  text: string
): Promise<{ blob: Blob; audioUrl: string; duration: number }> {
  const estDuration = Math.max(3, Math.round(text.length * 0.08));
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const buffer = audioCtx.createBuffer(
    1,
    Math.max(1, audioCtx.sampleRate * estDuration),
    audioCtx.sampleRate
  );
  const wavBlob = audioBufferToWavBlob(buffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  return {
    blob: wavBlob,
    audioUrl,
    duration: estDuration,
  };
}

function splitTextIntoChunks(text: string, maxLength: number): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + ' ' + word).trim().length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk = (currentChunk + ' ' + word).trim();
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks.length > 0 ? chunks : [text];
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // 16-bit precision

  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
