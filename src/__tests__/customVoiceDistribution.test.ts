import { describe, it, expect } from 'vitest';
import {
  applyCustomVoiceToAyahs,
  applyAyahBoundaries,
  computeRmsFrames,
  detectSilenceIntervals,
  detectAyahSplitBoundaries,
  applyCustomVoiceWithSilenceDetection,
} from '../utils/customVoiceDistribution';
import type { AyahData } from '../services/quranApi';

describe('customVoiceDistribution & silence detection', () => {
  describe('applyCustomVoiceToAyahs (proportional baseline)', () => {
    it('does nothing if customVoiceUrl is empty or ayahs array is empty', () => {
      const ayahs: AyahData[] = [];
      applyCustomVoiceToAyahs(ayahs, '', 10);
      expect(ayahs).toEqual([]);
    });

    it('correctly handles single ayah custom voice with duration', () => {
      const ayahs: AyahData[] = [
        {
          number: 1,
          numberInSurah: 1,
          surahNumber: 1,
          surahName: 'الفاتحة',
          text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
          duration: 5,
          startTimeMs: 300000,
          endTimeMs: 305000,
          isFullSurahFile: true,
          juz: 1,
          page: 1,
          words: [
            { id: 1, position: 1, text: 'بِسْمِ', startTime: 0, endTime: 1.2, charTypeName: 'word' },
            { id: 2, position: 2, text: 'اللَّهِ', startTime: 1.2, endTime: 2.5, charTypeName: 'word' },
          ],
        },
      ];

      applyCustomVoiceToAyahs(ayahs, 'blob:http://localhost/custom-voice-uuid', 10);

      expect(ayahs[0].audioUrl).toBe('blob:http://localhost/custom-voice-uuid');
      expect(ayahs[0].duration).toBe(10);
      expect(ayahs[0].startTimeMs).toBe(0);
      expect(ayahs[0].endTimeMs).toBe(10000);
      expect(ayahs[0].isFullSurahFile).toBe(false);
      expect(ayahs[0].fallbackUrls).toEqual([]);

      // Words should be scaled by 10 / 2.5 = 4
      expect(ayahs[0].words?.[0].startTime).toBe(0);
      expect(ayahs[0].words?.[0].endTime).toBe(4.8);
      expect(ayahs[0].words?.[1].startTime).toBe(4.8);
      expect(ayahs[0].words?.[1].endTime).toBe(10);
    });

    it('correctly distributes custom voice across multiple ayahs proportionally from 0s', () => {
      const ayahs: AyahData[] = [
        {
          number: 100,
          numberInSurah: 1,
          surahNumber: 18,
          surahName: 'الكهف',
          text: 'آية أولى',
          audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/018100.mp3',
          duration: 4,
          startTimeMs: 200000,
          endTimeMs: 204000,
          juz: 15,
          page: 293,
        },
        {
          number: 101,
          numberInSurah: 2,
          surahNumber: 18,
          surahName: 'الكهف',
          text: 'آية ثانية أطول بكثير',
          audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/018101.mp3',
          duration: 6,
          startTimeMs: 204000,
          endTimeMs: 210000,
          juz: 15,
          page: 293,
        },
      ];

      // Total recording is 20s. Weights are 4 and 6 (40% and 60%)
      applyCustomVoiceToAyahs(ayahs, 'blob:http://localhost/custom-voice-uuid', 20);

      expect(ayahs[0].audioUrl).toBe('blob:http://localhost/custom-voice-uuid');
      expect(ayahs[0].startTimeMs).toBe(0);
      expect(ayahs[0].endTimeMs).toBe(8000);
      expect(ayahs[0].duration).toBe(8);
      expect(ayahs[0].isFullSurahFile).toBe(true);

      expect(ayahs[1].audioUrl).toBe('blob:http://localhost/custom-voice-uuid');
      expect(ayahs[1].startTimeMs).toBe(8000);
      expect(ayahs[1].endTimeMs).toBe(20000);
      expect(ayahs[1].duration).toBe(12);
      expect(ayahs[1].isFullSurahFile).toBe(true);
    });
  });

  describe('RMS energy analysis and silence detection', () => {
    it('computes RMS frames across audio buffer accurately', () => {
      const sampleRate = 1000; // 1000 Hz for easy calculation
      const samples = new Float32Array(sampleRate * 2); // 2 seconds

      // Fill first second with amplitude 0.5, second second with 0 (silence)
      for (let i = 0; i < sampleRate; i++) {
        samples[i] = 0.5;
      }
      for (let i = sampleRate; i < samples.length; i++) {
        samples[i] = 0;
      }

      const { times, rms } = computeRmsFrames(samples, sampleRate, 100, 50);
      expect(rms.length).toBeGreaterThan(0);
      expect(times.length).toBe(rms.length);

      // Early frames should have RMS near 0.5
      expect(rms[0]).toBeCloseTo(0.5, 1);
      // Late frames should have RMS 0
      expect(rms[rms.length - 1]).toBe(0);
    });

    it('detects silence pauses longer than minimum threshold', () => {
      const sampleRate = 1000;
      // 5 seconds audio:
      // 0.0s - 2.0s: Speech (RMS ~ 0.4)
      // 2.0s - 3.0s: Silence (1.0s pause >= 600ms)
      // 3.0s - 5.0s: Speech (RMS ~ 0.4)
      const samples = new Float32Array(sampleRate * 5);
      for (let i = 0; i < sampleRate * 2; i++) samples[i] = 0.4;
      for (let i = Math.floor(sampleRate * 3.0); i < sampleRate * 5; i++) samples[i] = 0.4;

      const silences = detectSilenceIntervals(samples, sampleRate, {
        windowSizeMs: 100,
        hopSizeMs: 25,
        minSilenceDurationMs: 600,
        silenceThresholdRms: 0.02,
      });

      expect(silences.length).toBe(1);
      expect(silences[0].midpointSec).toBeGreaterThanOrEqual(2.3);
      expect(silences[0].midpointSec).toBeLessThanOrEqual(2.7);
      expect(silences[0].durationSec).toBeGreaterThanOrEqual(0.6);
    });

    it('detects exact Ayah split boundary timestamps matching natural pauses', () => {
      const sampleRate = 1000;
      // 10 seconds recording with 3 Ayahs:
      // Ayah 1: 0.0s - 3.0s (speech)
      // Pause 1: 3.0s - 3.8s (0.8s silence) -> split point ~ 3.4s
      // Ayah 2: 3.8s - 6.5s (speech)
      // Pause 2: 6.5s - 7.3s (0.8s silence) -> split point ~ 6.9s
      // Ayah 3: 7.3s - 10.0s (speech)
      const totalDuration = 10;
      const samples = new Float32Array(sampleRate * totalDuration);

      for (let i = 0; i < sampleRate * 3.0; i++) samples[i] = 0.45;
      for (let i = Math.floor(sampleRate * 3.8); i < Math.floor(sampleRate * 6.5); i++)
        samples[i] = 0.45;
      for (let i = Math.floor(sampleRate * 7.3); i < sampleRate * 10; i++) samples[i] = 0.45;

      const weights = [3, 3, 3]; // Equal weight expectation
      const splits = detectAyahSplitBoundaries(
        samples,
        sampleRate,
        3,
        weights,
        totalDuration,
        {
          windowSizeMs: 100,
          hopSizeMs: 25,
          minSilenceDurationMs: 600,
          silenceThresholdRms: 0.02,
        }
      );

      expect(splits.length).toBe(2);
      expect(splits[0]).toBeGreaterThanOrEqual(3.2);
      expect(splits[0]).toBeLessThanOrEqual(3.6);
      expect(splits[1]).toBeGreaterThanOrEqual(6.7);
      expect(splits[1]).toBeLessThanOrEqual(7.1);
    });

    it('correctly applies detected boundaries to AyahData objects', () => {
      const ayahs: AyahData[] = [
        {
          number: 1,
          numberInSurah: 1,
          surahNumber: 1,
          surahName: 'الفاتحة',
          text: 'الآية الأولى',
          audioUrl: '',
          duration: 0,
          juz: 1,
          page: 1,
          words: [
            { id: 1, position: 1, text: 'الآية', startTime: 0, endTime: 1, charTypeName: 'word' },
            { id: 2, position: 2, text: 'الأولى', startTime: 1, endTime: 2, charTypeName: 'word' },
          ],
        },
        {
          number: 2,
          numberInSurah: 2,
          surahNumber: 1,
          surahName: 'الفاتحة',
          text: 'الآية الثانية',
          audioUrl: '',
          duration: 0,
          juz: 1,
          page: 1,
          words: [
            { id: 3, position: 1, text: 'الآية', startTime: 0, endTime: 1, charTypeName: 'word' },
            { id: 4, position: 2, text: 'الثانية', startTime: 1, endTime: 2, charTypeName: 'word' },
          ],
        },
      ];

      // Detected split at 3.5s in 10s recording
      applyAyahBoundaries(ayahs, 'blob:http://localhost/test-audio', [3.5], 10);

      expect(ayahs[0].duration).toBe(3.5);
      expect(ayahs[0].startTimeMs).toBe(0);
      expect(ayahs[0].endTimeMs).toBe(3500);
      expect(ayahs[0].words?.[0].startTime).toBe(0);
      expect(ayahs[0].words?.[1].endTime).toBe(3.5);

      expect(ayahs[1].duration).toBe(6.5);
      expect(ayahs[1].startTimeMs).toBe(3500);
      expect(ayahs[1].endTimeMs).toBe(10000);
      expect(ayahs[1].words?.[0].startTime).toBe(0);
      expect(ayahs[1].words?.[1].endTime).toBe(6.5);
    });
  });

  describe('applyCustomVoiceWithSilenceDetection & splitCache', () => {
    it('returns true on single ayah immediately without audio decoding', async () => {
      const ayahs: AyahData[] = [
        {
          number: 1,
          numberInSurah: 1,
          surahNumber: 1,
          surahName: 'الفاتحة',
          text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          audioUrl: '',
          duration: 0,
          juz: 1,
          page: 1,
        },
      ];

      const res = await applyCustomVoiceWithSilenceDetection(ayahs, 'blob:http://localhost/single-ayah', 7.5);
      expect(res).toBe(true);
      expect(ayahs[0].duration).toBe(7.5);
      expect(ayahs[0].startTimeMs).toBe(0);
      expect(ayahs[0].endTimeMs).toBe(7500);
    });

    it('caches calculated split boundaries and avoids re-decoding for identical inputs', async () => {
      const origFetch = globalThis.fetch;
      globalThis.fetch = () =>
        Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        } as Response);

      const mockChannelData = new Float32Array(48000 * 10);
      // Create speech from 0 to 4s, silence 4 to 5s, speech 5 to 10s
      for (let i = 0; i < 48000 * 4; i++) mockChannelData[i] = 0.5 * Math.sin(i * 0.05);
      for (let i = 48000 * 4; i < 48000 * 5; i++) mockChannelData[i] = 0.001;
      for (let i = 48000 * 5; i < 48000 * 10; i++) mockChannelData[i] = 0.5 * Math.sin(i * 0.05);

      const mockBuffer = {
        duration: 10,
        sampleRate: 48000,
        getChannelData: () => mockChannelData,
      };

      const mockAudioCtx = {
        decodeAudioData: async () => mockBuffer,
        state: 'running',
        close: async () => {},
      } as unknown as AudioContext;

      const ayahs1: AyahData[] = [
        { number: 1, numberInSurah: 1, surahNumber: 1, surahName: 'الفاتحة', text: 'الآية الأولى', audioUrl: '', duration: 4, juz: 1, page: 1 },
        { number: 2, numberInSurah: 2, surahNumber: 1, surahName: 'الفاتحة', text: 'الآية الثانية', audioUrl: '', duration: 6, juz: 1, page: 1 },
      ];

      // 1st call: decodes and calculates
      const res1 = await applyCustomVoiceWithSilenceDetection(ayahs1, 'blob:http://localhost/custom-rec-123', 10, mockAudioCtx);
      expect(res1).toBe(true);
      expect(ayahs1[0].duration).toBeCloseTo(4.5, 1);
      expect(ayahs1[1].duration).toBeCloseTo(5.5, 1);

      // 2nd call (e.g. on ExportPage): should hit splitCache and apply identical boundaries without mockAudioCtx
      const ayahs2: AyahData[] = [
        { number: 1, numberInSurah: 1, surahNumber: 1, surahName: 'الفاتحة', text: 'الآية الأولى', audioUrl: '', duration: 4, juz: 1, page: 1 },
        { number: 2, numberInSurah: 2, surahNumber: 1, surahName: 'الفاتحة', text: 'الآية الثانية', audioUrl: '', duration: 6, juz: 1, page: 1 },
      ];

      const res2 = await applyCustomVoiceWithSilenceDetection(ayahs2, 'blob:http://localhost/custom-rec-123', 10, undefined);
      expect(res2).toBe(true);
      expect(ayahs2[0].duration).toBe(ayahs1[0].duration);
      expect(ayahs2[1].duration).toBe(ayahs1[1].duration);
      expect(ayahs2[0].startTimeMs).toBe(ayahs1[0].startTimeMs);
      expect(ayahs2[1].endTimeMs).toBe(ayahs1[1].endTimeMs);

      globalThis.fetch = origFetch;
    });
  });
});

