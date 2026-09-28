import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PLATFORM_PRESETS,
  ASPECT_RATIO_DIMENSIONS,
  QUALITY_BITRATES,
  concatenateAudioBuffers,
  sliceAudioBuffer,
  exportProject,
  resolveTargetOutputPath,
  isProjectExporting,
  resetExportMutex,
  registerExportBlobUrl,
  revokeExportBlobUrl,
  fetchAndDecodeAudio,
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

  describe('Audio Buffer Concatenation and Slicing', () => {
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

    it('slices an AudioBuffer into a precise sub-range', () => {
      const sourceChannelData = new Float32Array([0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
      const sourceBuffer = {
        length: 10,
        numberOfChannels: 1,
        sampleRate: 1, // 1 sample per second for easy calculation
        getChannelData: vi.fn(() => sourceChannelData),
      } as unknown as AudioBuffer;

      const mockOutChannelData = new Float32Array(4);
      const mockOutBuffer = {
        length: 4,
        numberOfChannels: 1,
        sampleRate: 1,
        getChannelData: vi.fn(() => mockOutChannelData),
      } as unknown as AudioBuffer;

      const mockCtx = {
        createBuffer: vi.fn((_channels, _length, _rate) => mockOutBuffer),
      } as unknown as AudioContext;

      // Slice from 3s to 7s -> samples 3, 4, 5, 6 (length 4)
      const sliced = sliceAudioBuffer(mockCtx, sourceBuffer, 3, 7);
      expect(mockCtx.createBuffer).toHaveBeenCalledWith(1, 4, 1);
      expect(sliced).toBe(mockOutBuffer);
      expect(mockOutChannelData[0]).toBeCloseTo(0.3);
      expect(mockOutChannelData[1]).toBeCloseTo(0.4);
      expect(mockOutChannelData[2]).toBeCloseTo(0.5);
      expect(mockOutChannelData[3]).toBeCloseTo(0.6);
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
        savePathPref: 'D:/CustomVideos/MyReel.mp4',
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
      expect(mockStart).toHaveBeenCalledWith(
        expect.objectContaining({
          projectName: 'Test Project',
          outputPath: 'D:/CustomVideos/MyReel.mp4',
        })
      );
      expect(progressCalls.some((p) => p.percent === 50)).toBe(true);
    });

    it('resolves target output paths correctly from project name and savePathPref', () => {
      // Default fallback (no savePathPref -> returns empty string)
      expect(resolveTargetOutputPath('My Cool Video', 'mp4')).toBe('');
      
      // With custom directory path (forward slash)
      expect(
        resolveTargetOutputPath('Ayah Reel', 'mp4', 'C:/Users/User/Videos')
      ).toBe('C:/Users/User/Videos/Ayah Reel.mp4');
      
      // With custom directory path (backslash)
      expect(
        resolveTargetOutputPath('Surah Maryam', 'mp4', 'D:\\IslamicProjects\\Exports\\')
      ).toBe('D:\\IslamicProjects\\Exports\\Surah Maryam.mp4');
      
      // With exact target file path
      expect(
        resolveTargetOutputPath('Surah Yasin', 'mp4', 'E:/Custom/Output_Surah.mp4')
      ).toBe('E:/Custom/Output_Surah.mp4');
      
      // Sanitize special characters in project name with savePathPref
      expect(
        resolveTargetOutputPath('Surah/Al-Baqarah:Ayah*1?', 'mp4', 'C:/Exports')
      ).toBe('C:/Exports/Surah-Al-Baqarah-Ayah-1-.mp4');

      // Empty string and whitespace preferences return empty string
      expect(resolveTargetOutputPath('Test', 'mp4', '')).toBe('');
      expect(resolveTargetOutputPath('Test', 'mp4', '   ')).toBe('');
      expect(resolveTargetOutputPath('Test', 'mp4', undefined)).toBe('');
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

    it('prevents concurrent exports using mutex lock', async () => {
      resetExportMutex();
      expect(isProjectExporting()).toBe(false);

      let resolveSlowExport: (value: any) => void = () => {};
      const slowPromise = new Promise((resolve) => {
        resolveSlowExport = resolve;
      });

      const mockStart = vi.fn().mockImplementation(() => slowPromise);
      const api = {
        videoExport: {
          start: mockStart,
          onProgress: vi.fn(() => () => {}),
          cancel: vi.fn(),
        },
      };

      (globalThis as any).electronAPI = api;
      if (typeof window !== 'undefined') {
        (window as any).electronAPI = api;
      }

      // First export starts
      const firstExportPromise = exportProject({
        projectName: 'First Project',
        aspectRatio: '9:16',
        ayahs: [{ number: 1, numberInSurah: 1, surahNumber: 1, surahName: 'الفاتحة', juz: 1, page: 1, audioUrl: '', text: 'الحمد لله', duration: 3 }],
      });

      expect(isProjectExporting()).toBe(true);

      // Second export attempts to run concurrently
      const secondExportResult = await exportProject({
        projectName: 'Second Project',
        aspectRatio: '9:16',
        ayahs: [{ number: 1, numberInSurah: 1, surahNumber: 1, surahName: 'الفاتحة', juz: 1, page: 1, audioUrl: '', text: 'الرحمن الرحيم', duration: 3 }],
      });

      expect(secondExportResult.success).toBe(false);
      expect(secondExportResult.error).toContain('عملية تصدير أخرى قيد المعالجة');

      // Resolve first export
      resolveSlowExport({ success: true, outputPath: 'C:/exports/first.mp4' });
      const firstExportResult = await firstExportPromise;
      expect(firstExportResult.success).toBe(true);
      expect(isProjectExporting()).toBe(false);
    });

    it('falls back gracefully to MediaRecorder when electronAPI is absent and webcodecs fails', async () => {
      resetExportMutex();
      // Temporarily remove electronAPI to simulate browser environment
      const prevElectronAPI = (globalThis as any).electronAPI;
      delete (globalThis as any).electronAPI;
      if (typeof window !== 'undefined') {
        delete (window as any).electronAPI;
      }

      // Mock MediaRecorder in jsdom/node
      const mockChunks: Blob[] = [new Blob([new Uint8Array(2048)], { type: 'video/webm' })];
      class MockMediaRecorder {
        state = 'inactive';
        ondataavailable: ((e: any) => void) | null = null;
        onstop: (() => void) | null = null;
        onerror: ((e: any) => void) | null = null;

        static isTypeSupported() {
          return true;
        }

        start() {
          this.state = 'recording';
          setTimeout(() => {
            if (this.ondataavailable) {
              this.ondataavailable({ data: mockChunks[0] });
            }
          }, 10);
        }

        requestData() {
          if (this.ondataavailable) {
            this.ondataavailable({ data: mockChunks[0] });
          }
        }

        stop() {
          this.state = 'inactive';
          if (this.onstop) {
            this.onstop();
          }
        }
      }

      const originalMR = (globalThis as any).MediaRecorder;
      (globalThis as any).MediaRecorder = MockMediaRecorder;
      if (typeof window !== 'undefined') {
        (window as any).MediaRecorder = MockMediaRecorder;
      }

      // Mock canvas, AudioContext, MediaStream, requestAnimationFrame for node test runner
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getVideoTracks: () => [mockTrack],
        getAudioTracks: () => [],
        getTracks: () => [mockTrack],
      };

      const mockCtx2d = {
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        measureText: vi.fn(() => ({ width: 50 })),
        fillText: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        strokeRect: vi.fn(),
        roundRect: vi.fn(),
        arc: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      };

      const mockCanvas = {
        width: 1080,
        height: 1920,
        getContext: vi.fn(() => mockCtx2d),
        captureStream: vi.fn(() => mockStream),
      };

      const mockAudioDest = {
        stream: mockStream,
      };

      class MockAudioContext {
        state = 'running';
        currentTime = 0;
        resume = vi.fn().mockResolvedValue(undefined);
        close = vi.fn().mockResolvedValue(undefined);
        createMediaStreamDestination = vi.fn(() => mockAudioDest);
        createBufferSource = vi.fn(() => ({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          disconnect: vi.fn(),
        }));
        createGain = vi.fn(() => ({
          gain: { value: 1.0 },
          connect: vi.fn(),
        }));
        createOscillator = vi.fn(() => ({
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }));
      }

      class MockMediaStream {
        constructor() {
          return mockStream as any;
        }
      }

      const prevDoc = (globalThis as any).document;
      const prevAudioCtx = (globalThis as any).AudioContext;
      const prevMediaStream = (globalThis as any).MediaStream;
      const prevRAF = (globalThis as any).requestAnimationFrame;
      const prevCAF = (globalThis as any).cancelAnimationFrame;

      (globalThis as any).document = {
        createElement: (tag: string) => {
          if (tag === 'canvas') return mockCanvas;
          return {};
        },
      };
      (globalThis as any).AudioContext = MockAudioContext;
      (globalThis as any).MediaStream = MockMediaStream;
      (globalThis as any).requestAnimationFrame = (cb: Function) => setTimeout(cb, 5);
      (globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);

      if (typeof window !== 'undefined') {
        (window as any).document = (globalThis as any).document;
        (window as any).AudioContext = MockAudioContext;
        (window as any).MediaStream = MockMediaStream;
        (window as any).requestAnimationFrame = (globalThis as any).requestAnimationFrame;
        (window as any).cancelAnimationFrame = (globalThis as any).cancelAnimationFrame;
      }

      try {
        const res = await exportProject({
          projectName: 'Browser Fallback Reel',
          aspectRatio: '9:16',
          totalDuration: 0.1,
          ayahs: [
            {
              number: 1,
              numberInSurah: 1,
              surahNumber: 1,
              surahName: 'الفاتحة',
              juz: 1,
              page: 1,
              audioUrl: '',
              text: 'بسم الله الرحمن الرحيم',
              duration: 0.1,
            },
          ],
        });

        expect(res.success).toBe(true);
        expect(res.engine).toBe('mediarecorder');
        expect(res.blob).toBeDefined();
        expect(res.blobUrl).toBeDefined();
      } finally {
        // Restore
        vi.restoreAllMocks();
        if (prevElectronAPI) {
          (globalThis as any).electronAPI = prevElectronAPI;
          if (typeof window !== 'undefined') {
            (window as any).electronAPI = prevElectronAPI;
          }
        }
        if (originalMR) {
          (globalThis as any).MediaRecorder = originalMR;
          if (typeof window !== 'undefined') {
            (window as any).MediaRecorder = originalMR;
          }
        } else {
          delete (globalThis as any).MediaRecorder;
          if (typeof window !== 'undefined') {
            delete (window as any).MediaRecorder;
          }
        }

        if (prevDoc !== undefined) {
          (globalThis as any).document = prevDoc;
          if (typeof window !== 'undefined') (window as any).document = prevDoc;
        } else {
          delete (globalThis as any).document;
          if (typeof window !== 'undefined') delete (window as any).document;
        }

        if (prevAudioCtx !== undefined) {
          (globalThis as any).AudioContext = prevAudioCtx;
          if (typeof window !== 'undefined') (window as any).AudioContext = prevAudioCtx;
        } else {
          delete (globalThis as any).AudioContext;
          if (typeof window !== 'undefined') delete (window as any).AudioContext;
        }

        if (prevMediaStream !== undefined) {
          (globalThis as any).MediaStream = prevMediaStream;
          if (typeof window !== 'undefined') (window as any).MediaStream = prevMediaStream;
        } else {
          delete (globalThis as any).MediaStream;
          if (typeof window !== 'undefined') delete (window as any).MediaStream;
        }

        if (prevRAF !== undefined) {
          (globalThis as any).requestAnimationFrame = prevRAF;
          if (typeof window !== 'undefined') (window as any).requestAnimationFrame = prevRAF;
        } else {
          delete (globalThis as any).requestAnimationFrame;
          if (typeof window !== 'undefined') delete (window as any).requestAnimationFrame;
        }

        if (prevCAF !== undefined) {
          (globalThis as any).cancelAnimationFrame = prevCAF;
          if (typeof window !== 'undefined') (window as any).cancelAnimationFrame = prevCAF;
        } else {
          delete (globalThis as any).cancelAnimationFrame;
          if (typeof window !== 'undefined') delete (window as any).cancelAnimationFrame;
        }
      }
    });
  });

  describe('Blob URL Memory Management', () => {
    it('registers a blob url and automatically revokes it after timeout', () => {
      vi.useFakeTimers();
      const originalRevoke = URL.revokeObjectURL;
      const mockRevoke = vi.fn();
      URL.revokeObjectURL = mockRevoke;

      try {
        const testUrl = 'blob:http://localhost:5173/test-video-uuid-1';
        registerExportBlobUrl(testUrl, 1000);

        // Before timeout, should not be revoked yet
        expect(mockRevoke).not.toHaveBeenCalled();

        // Advance timers past timeout
        vi.advanceTimersByTime(1001);
        expect(mockRevoke).toHaveBeenCalledWith(testUrl);
      } finally {
        URL.revokeObjectURL = originalRevoke;
        vi.useRealTimers();
      }
    });

    it('explicitly revokes blob url and cancels pending auto-revoke timer', () => {
      vi.useFakeTimers();
      const originalRevoke = URL.revokeObjectURL;
      const mockRevoke = vi.fn();
      URL.revokeObjectURL = mockRevoke;

      try {
        const testUrl = 'blob:http://localhost:5173/test-video-uuid-2';
        registerExportBlobUrl(testUrl, 5000);

        // Explicit revocation
        revokeExportBlobUrl(testUrl);
        expect(mockRevoke).toHaveBeenCalledTimes(1);
        expect(mockRevoke).toHaveBeenCalledWith(testUrl);

        // Advance timers past the original 5000ms: should NOT trigger a second revoke
        vi.advanceTimersByTime(6000);
        expect(mockRevoke).toHaveBeenCalledTimes(1);
      } finally {
        URL.revokeObjectURL = originalRevoke;
        vi.useRealTimers();
      }
    });

    it('gracefully handles undefined, invalid or non-blob URLs without crashing', () => {
      expect(() => revokeExportBlobUrl(undefined)).not.toThrow();
      expect(() => revokeExportBlobUrl('')).not.toThrow();
      expect(() => revokeExportBlobUrl('https://example.com/video.mp4')).not.toThrow();
    });
  });

  describe('Smart Audio Fetch Guard', () => {
    it('returns null if fetchAndDecodeAudio fails all attempts', async () => {
      const mockCtx = {} as AudioContext;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        const res = await fetchAndDecodeAudio(mockCtx, 'https://example.com/audio.mp3', 1);
        expect(res).toBeNull();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('returns error result when audioUrls are requested but all fail to download', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

      const prevAudioCtx = (globalThis as any).AudioContext;
      class MockAudioContext {
        state = 'running';
        resume = vi.fn().mockResolvedValue(undefined);
        close = vi.fn().mockResolvedValue(undefined);
        createBuffer = vi.fn();
      }

      (globalThis as any).AudioContext = MockAudioContext;
      if (typeof window !== 'undefined') (window as any).AudioContext = MockAudioContext;

      try {
        const res = await exportProject({
          projectName: 'Failed Audio Test',
          aspectRatio: '9:16',
          totalDuration: 5,
          audioUrls: ['https://example.com/failed_recitation.mp3'],
          ayahs: [
            {
              number: 1,
              numberInSurah: 1,
              surahNumber: 1,
              surahName: 'الفاتحة',
              juz: 1,
              page: 1,
              audioUrl: 'https://example.com/failed_recitation.mp3',
              text: 'بسم الله الرحمن الرحيم',
              duration: 5,
            },
          ],
        });

        expect(res.success).toBe(false);
        expect(res.error).toContain('تعذر تحميل تلاوة القارئ الصوتية');
      } finally {
        globalThis.fetch = originalFetch;
        if (prevAudioCtx !== undefined) {
          (globalThis as any).AudioContext = prevAudioCtx;
          if (typeof window !== 'undefined') (window as any).AudioContext = prevAudioCtx;
        } else {
          delete (globalThis as any).AudioContext;
          if (typeof window !== 'undefined') delete (window as any).AudioContext;
        }
      }
    });
  });
});
