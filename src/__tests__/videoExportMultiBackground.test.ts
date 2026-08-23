import { describe, it, expect, vi } from 'vitest';
import { renderVideoExportFrame, FrameRenderOptions } from '../services/videoFrameRenderer';
import { AyahData } from '../services/quranApi';

describe('Video Frame Renderer - Multi-Scene Backgrounds', () => {
  const dummyAyah1: AyahData = {
    number: 1,
    text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    surahNumber: 1,
    surahName: 'الفاتحة',
    numberInSurah: 1,
    juz: 1,
    page: 1,
    audioUrl: 'https://example.com/audio1.mp3',
    words: [
      { id: 1, position: 1, text: 'بِسْمِ', startTime: 0, endTime: 1, charTypeName: 'word' },
      { id: 2, position: 2, text: 'اللَّهِ', startTime: 1, endTime: 2, charTypeName: 'word' },
    ],
  };

  const dummyAyah2: AyahData = {
    number: 2,
    text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    surahNumber: 1,
    surahName: 'الفاتحة',
    numberInSurah: 2,
    juz: 1,
    page: 1,
    audioUrl: 'https://example.com/audio2.mp3',
    words: [
      { id: 3, position: 1, text: 'الْحَمْدُ', startTime: 0, endTime: 1.5, charTypeName: 'word' },
      { id: 4, position: 2, text: 'لِلَّهِ', startTime: 1.5, endTime: 3, charTypeName: 'word' },
    ],
  };

  function createMockCanvasContext() {
    const drawnImages: any[] = [];
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn((img) => {
        drawnImages.push(img);
      }),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      measureText: vi.fn((text: string) => ({
        width: text.length * 10,
        actualBoundingBoxAscent: 10,
        actualBoundingBoxDescent: 2,
      })),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    return { ctx, drawnImages };
  }

  it('uses specific scene background when sceneBgImages dictionary is provided', () => {
    const { ctx, drawnImages } = createMockCanvasContext();

    const mockMainBg = { width: 1080, height: 1920, id: 'main_bg' } as unknown as HTMLImageElement;
    const mockScene0Bg = { width: 1080, height: 1920, id: 'scene_0_bg' } as unknown as HTMLImageElement;
    const mockScene1Bg = { width: 1080, height: 1920, id: 'scene_1_bg' } as unknown as HTMLImageElement;

    const renderOpts: FrameRenderOptions = {
      ctx,
      width: 1080,
      height: 1920,
      frame: 0,
      totalFrames: 30,
      currentTimeSec: 0,
      bgImage: mockMainBg,
      sceneBgImages: {
        0: mockScene0Bg,
        1: mockScene1Bg,
      },
      currentAyahIndex: 1,
      bgOpacity: 0.8,
      currentAyah: dummyAyah2,
      projectName: 'Test Project',
      surahName: 'الفاتحة',
    };

    renderVideoExportFrame(renderOpts);

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(drawnImages.length).toBeGreaterThan(0);
    // Should have drawn scene_1_bg for currentAyahIndex: 1
    expect((drawnImages[0] as any).id).toBe('scene_1_bg');
  });

  it('falls back to default bgImage if scene index is not in sceneBgImages', () => {
    const { ctx, drawnImages } = createMockCanvasContext();

    const mockMainBg = { width: 1080, height: 1920, id: 'main_bg' } as unknown as HTMLImageElement;
    const mockScene0Bg = { width: 1080, height: 1920, id: 'scene_0_bg' } as unknown as HTMLImageElement;

    const renderOpts: FrameRenderOptions = {
      ctx,
      width: 1080,
      height: 1920,
      frame: 0,
      totalFrames: 30,
      currentTimeSec: 0,
      bgImage: mockMainBg,
      sceneBgImages: {
        0: mockScene0Bg,
      },
      currentAyahIndex: 5, // Not in dictionary
      bgOpacity: 0.8,
      currentAyah: dummyAyah1,
      projectName: 'Test Project',
      surahName: 'الفاتحة',
    };

    renderVideoExportFrame(renderOpts);

    expect(drawnImages.length).toBeGreaterThan(0);
    // Should fallback to main_bg
    expect((drawnImages[0] as any).id).toBe('main_bg');
  });
});
