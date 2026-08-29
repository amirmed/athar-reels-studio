import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderVideoExportFrame,
  clearLayoutCache,
  FrameRenderOptions,
} from '../services/videoFrameRenderer';
import { AyahData } from '../services/quranApi';

describe('VideoFrameRenderer Layout Cache Isolation', () => {
  beforeEach(() => {
    clearLayoutCache();
  });

  function createMockCtx() {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      shadowColor: '',
      shadowBlur: 0,
      font: '',
      textAlign: 'center',
      textBaseline: 'middle',
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setLineDash: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      drawImage: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      measureText: vi.fn((txt: string) => ({
        width: txt.length * 15,
      })),
    } as unknown as CanvasRenderingContext2D;
  }

  it('renders distinct layouts for two different projects that share the same ayah index', () => {
    const ctx1 = createMockCtx();
    const ayahProjectA: AyahData = {
      number: 1,
      surahNumber: 1,
      surahName: 'الفاتحة',
      numberInSurah: 1,
      juz: 1,
      page: 1,
      audioUrl: '',
      text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      words: [
        { id: 1, position: 1, text: 'بِسْمِ', startTime: 0, endTime: 1, charTypeName: 'word' },
        { id: 2, position: 2, text: 'اللَّهِ', startTime: 1, endTime: 2, charTypeName: 'word' },
      ],
    };

    const opts1: FrameRenderOptions = {
      ctx: ctx1,
      width: 1080,
      height: 1920,
      frame: 0,
      totalFrames: 60,
      currentTimeSec: 0.5,
      currentAyah: ayahProjectA,
      projectName: 'Project A',
      bgOpacity: 1,
    };

    renderVideoExportFrame(opts1);
    expect(ctx1.fillText).toHaveBeenCalled();
    const projectATextCalls = (ctx1.fillText as any).mock.calls.map((c: any[]) => c[0]);
    expect(projectATextCalls.some((t: string) => t.includes('بِسْمِ'))).toBe(true);

    // Project B: Different Surah/Text with identical ayah index numberInSurah = 1
    const ctx2 = createMockCtx();
    const ayahProjectB: AyahData = {
      number: 1,
      surahNumber: 2,
      surahName: 'البقرة',
      numberInSurah: 1,
      juz: 1,
      page: 1,
      audioUrl: '',
      text: 'الم',
      words: [{ id: 1, position: 1, text: 'الم', startTime: 0, endTime: 1, charTypeName: 'word' }],
    };

    const opts2: FrameRenderOptions = {
      ctx: ctx2,
      width: 1080,
      height: 1920,
      frame: 0,
      totalFrames: 60,
      currentTimeSec: 0.5,
      currentAyah: ayahProjectB,
      projectName: 'Project B',
      bgOpacity: 1,
    };

    renderVideoExportFrame(opts2);
    const projectBTextCalls = (ctx2.fillText as any).mock.calls.map((c: any[]) => c[0]);
    expect(projectBTextCalls.some((t: string) => t.includes('الم'))).toBe(true);
    expect(projectBTextCalls.some((t: string) => t.includes('بِسْمِ'))).toBe(false);
  });

  it('renders custom text quotes correctly without colliding with default ayah index cache', () => {
    const ctx = createMockCtx();
    const customOpts: FrameRenderOptions = {
      ctx,
      width: 1080,
      height: 1920,
      frame: 0,
      totalFrames: 60,
      currentTimeSec: 1,
      projectName: 'حديث الصباح',
      isCustomContent: true,
      bgOpacity: 1,
      currentAyah: {
        number: 0,
        surahNumber: 0,
        surahName: 'حديث نبوي',
        numberInSurah: 0,
        text: 'إنما الأعمال بالنيات وإنما لكل امرئ ما نوى',
        juz: 0,
        page: 0,
        audioUrl: '',
      },
    };

    renderVideoExportFrame(customOpts);
    expect(ctx.fillText).toHaveBeenCalled();
    const calls = (ctx.fillText as any).mock.calls.map((c: any[]) => c[0]);
    expect(calls.some((t: string) => t.includes('الأعمال') || t.includes('بالنيات'))).toBe(true);
  });
});
