import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ARABIC_AI_VOICES,
  cleanTextForTts,
  synthesizeArabicSpeech,
  clearTtsAudioCache,
} from '../services/arabicTtsService';

describe('Arabic Neural TTS Engine', () => {
  beforeEach(() => {
    clearTtsAudioCache();
    if (typeof (globalThis as any).window === 'undefined') {
      (globalThis as any).window = globalThis;
    }

    // Mock Audio constructor
    (globalThis as any).Audio = class MockAudio {
      src = '';
      duration = 4.5;
      onloadedmetadata: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(src?: string) {
        if (src) this.src = src;
        setTimeout(() => this.onloadedmetadata && this.onloadedmetadata(), 0);
      }
      play() {
        return Promise.resolve();
      }
      pause() {}
      removeAttribute() {}
    };

    if (typeof (globalThis as any).URL.createObjectURL !== 'function') {
      (globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-audio');
    }
    if (typeof (globalThis as any).URL.revokeObjectURL !== 'function') {
      (globalThis as any).URL.revokeObjectURL = vi.fn();
    }
  });

  it('provides certified Arabic AI voices with full regional dialect diversity', () => {
    expect(ARABIC_AI_VOICES.length).toBeGreaterThanOrEqual(5);
    const voiceIds = ARABIC_AI_VOICES.map((v) => v.id);
    expect(voiceIds).toContain('ar-SA-HamedNeural');
    expect(voiceIds).toContain('ar-SA-ZariyahNeural');
    expect(voiceIds).toContain('ar-EG-ShakirNeural');
    expect(voiceIds).toContain('ar-EG-SalmaNeural');
    expect(voiceIds).toContain('ar-MA-MounaNeural');

    for (const voice of ARABIC_AI_VOICES) {
      expect(voice.name).toBeTruthy();
      expect(voice.regionCode).toBeTruthy();
      expect(voice.sampleText).toBeTruthy();
    }
  });

  it('cleans non-vocalized brackets and punctuation while strictly preserving Arabic Tashkeel', () => {
    const rawText = '﴿قَالَ رَبِّ اغْفِرْ لِي﴾ [رواه البخاري]';
    const cleaned = cleanTextForTts(rawText);
    expect(cleaned).toContain('قَالَ رَبِّ اغْفِرْ لِي');
    expect(cleaned).not.toContain('﴿');
    expect(cleaned).not.toContain('﴾');
    expect(cleaned).not.toContain('[');
    expect(cleaned).not.toContain(']');
  });

  it('delegates to Electron IPC when running in Electron desktop environment', async () => {
    const mockAudioBase64 = 'SUQzBAAAAAAA'; // dummy base64
    const mockGetTTSStream = vi.fn().mockResolvedValue({
      success: true,
      base64: mockAudioBase64,
      mime: 'audio/mpeg',
    });

    (globalThis as any).window.electronAPI = {
      audio: {
        getTTSStream: mockGetTTSStream,
      },
    };

    const res = await synthesizeArabicSpeech('سُبْحَانَ اللَّهِ', 'ar-SA-HamedNeural');
    expect(mockGetTTSStream).toHaveBeenCalled();
    expect(res.audioUrl).toBeTruthy();

    // Subsequent call should hit in-memory LRU cache
    await synthesizeArabicSpeech('سُبْحَانَ اللَّهِ', 'ar-SA-HamedNeural');
    expect(mockGetTTSStream).toHaveBeenCalledTimes(1);
  });
});
