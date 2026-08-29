import { describe, it, expect } from 'vitest';
import { applyCustomVoiceToAyahs } from '../utils/customVoiceDistribution';
import type { AyahData } from '../services/quranApi';

describe('applyCustomVoiceToAyahs', () => {
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
