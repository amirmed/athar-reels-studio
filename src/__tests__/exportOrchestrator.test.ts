import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PLATFORM_PRESETS,
  ASPECT_RATIO_DIMENSIONS,
  QUALITY_BITRATES,
  concatenateAudioBuffers,
  exportProject,
} from '../services/exportOrchestrator';

describe('ExportOrchestrator Service', () => {
  beforeEach(() => {
    if (typeof (globalThis as any).window === 'undefined') {
      (globalThis as any).window = globalThis;
    }
  });

  describe('Constants and Presets Configuration', () => {
    it('provides all standard platform presets with valid configurations', () => {
      const presetIds = PLATFORM_PRESETS.map((p) => p.id);
      expect(presetIds).toContain('tiktok');
      expect(presetIds).toContain('reels');
      expect(presetIds).toContain('shorts');
      expect(presetIds).toContain('whatsapp');
      expect(presetIds).toContain('square');
      expect(presetIds).toContain('youtube');

      for (const preset of PLATFORM_PRESETS) {
        expect(preset.width).toBeGreaterThan(0);
        expect(preset.height).toBeGreaterThan(0);
        expect(preset.fps).toBeGreaterThanOrEqual(24);
        expect(preset.bitrate).toBeGreaterThan(0);
        expect(preset.name).toBeTruthy();
        expect(preset.aspect).toBeTruthy();
      }
    });

    it('defines aspect ratio dimensions matching platform targets', () => {
      expect(ASPECT_RATIO_DIMENSIONS['9:16']).toEqual({ width: 1080, height: 1920 });
      expect(ASPECT_RATIO_DIMENSIONS['16:9']).toEqual({ width: 1920, height: 1080 });
      expect(ASPECT_RATIO_DIMENSIONS['1:1']).toEqual({ width: 1080, height: 1080 });
      expect(ASPECT_RATIO_DIMENSIONS['4:5']).toEqual({ width: 1080, height: 1350 });
    });

    it('configures quality bitrates in ascending order', () => {
      expect(QUALITY_BITRATES.standard).toBeLessThan(QUALITY_BITRATES.high);
      expect(QUALITY_BITRATES.high).toBeLessThan(QUALITY_BITRATES.premium);
    });
  });

  describe('Audio Buffer Concatenation', () => {
    it('returns null for empty buffer array', () => {
      const mockCtx = {} as AudioContext;
      const result = concatenateAudioBuffers(mockCtx, []);
      expect(result).toBeNull();
    });

    it('returns the same buffer when only one buffer is provided', () => {
      const mockCtx = {} as AudioContext;
      const mockBuffer = { length: 100 } as AudioBuffer;
      const result = concatenateAudioBuffers(mockCtx, [mockBuffer]);
      expect(result).toBe(mockBuffer);
    });

    it('stitches multiple buffers into a unified audio buffer', () => {
      const channelData1 = new Float32Array([0.1, 0.2]);
      const channelData2 = new Float32Array([0.3, 0.4, 0.5]);

      const buf1 = {
        length: 2,
        numberOfChannels: 1,
        sampleRate: 44100,
        getChannelData: vi.fn(() => channelData1),
      } as unknown as AudioBuffer;

      const buf2 = {
        length: 3,
        numberOfChannels: 1,
        sampleRate: 44100,
        getChannelData: vi.fn(() => channelData2),
      } as unknown as AudioBuffer;

      const mockOutChannelData = new Float32Array(5);
      const mockOutBuffer = {
        length: 5,
        numberOfChannels: 1,
        sampleRate: 44100,
        getChannelData: vi.fn(() => mockOutChannelData),
      } as unknown as AudioBuffer;

      const mockCtx = {
        createBuffer: vi.fn((_channels, _length, _rate) => mockOutBuffer),
      } as unknown as AudioContext;

      const result = concatenateAudioBuffers(mockCtx, [buf1, buf2]);
      expect(mockCtx.createBuffer).toHaveBeenCalledWith(1, 5, 44100);
      expect(result).toBe(mockOutBuffer);
      expect(mockOutChannelData[0]).toBeCloseTo(0.1);
      expect(mockOutChannelData[1]).toBeCloseTo(0.2);
      expect(mockOutChannelData[2]).toBeCloseTo(0.3);
      expect(mockOutChannelData[3]).toBeCloseTo(0.4);
      expect(mockOutChannelData[4]).toBeCloseTo(0.5);
    });
  });

  describe('Unified exportProject Pipeline Execution', () => {
    const originalElectronAPI = (globalThis as any).electronAPI;

    afterEach(() => {
      (globalThis as any).electronAPI = originalElectronAPI;
      if (typeof window !== 'undefined') {
        (window as any).electronAPI = originalElectronAPI;
      }
      vi.restoreAllMocks();
    });

    it('delegates to Electron Native FFmpeg when electronAPI is present and succeeds', async () => {
      const mockStart = vi.fn().mockResolvedValue({
        success: true,
        outputPath: 'C:/exports/test_video.mp4',
      });
      const mockOnProgress = vi.fn((cb) => {
        cb({ percent: 50, phase: 'Encoding...' });
        return () => {};
      });

      const api = {
        videoExport: {
          start: mockStart,
          onProgress: mockOnProgress,
          cancel: vi.fn(),
        },
      };

      (globalThis as any).electronAPI = api;
      if (typeof window !== 'undefined') {
        (window as any).electronAPI = api;
      }

      const progressCalls: any[] = [];
      const result = await exportProject({
        projectName: 'Test Project',
        aspectRatio: '9:16',
        ayahs: [
          {
            number: 1,
            numberInSurah: 1,
            surahNumber: 1,
            surahName: 'الفاتحة',
            juz: 1,
            page: 1,
            text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
            duration: 5,
            audioUrl: 'https://example.com/audio1.mp3',
          },
        ],
        onProgress: (evt) => progressCalls.push(evt),
      });

      expect(result.success).toBe(true);
      expect(result.engine).toBe('ffmpeg');
      expect(result.outputPath).toBe('C:/exports/test_video.mp4');
      expect(mockStart).toHaveBeenCalled();
      expect(progressCalls.some((p) => p.percent === 50)).toBe(true);
    });

    it('handles cancellation via AbortSignal gracefully', async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await exportProject({
        projectName: 'Aborted Project',
        aspectRatio: '9:16',
        ayahs: [
          {
            number: 1,
            numberInSurah: 1,
            surahNumber: 1,
            surahName: 'الفاتحة',
            juz: 1,
            page: 1,
            audioUrl: '',
            text: 'الحمد لله رب العالمين',
            duration: 4,
          },
        ],
        signal: controller.signal,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('إلغاء');
    });
  });
});
