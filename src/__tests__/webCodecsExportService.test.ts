import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isWebCodecsExportSupported, exportVideoWithWebCodecs } from '../services/webCodecsExportService';

describe('WebCodecsExportService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isWebCodecsExportSupported', () => {
    it('returns false when VideoEncoder is not available in environment', async () => {
      const originalVideoEncoder = (globalThis as any).VideoEncoder;
      delete (globalThis as any).VideoEncoder;

      const supported = await isWebCodecsExportSupported();
      expect(supported).toBe(false);

      if (originalVideoEncoder) {
        (globalThis as any).VideoEncoder = originalVideoEncoder;
      }
    });

    it('returns true when VideoEncoder.isConfigSupported resolves with supported: true', async () => {
      (globalThis as any).window = globalThis;
      (globalThis as any).VideoFrame = class MockVideoFrame {};
      (globalThis as any).VideoEncoder = class MockVideoEncoder {
        static async isConfigSupported() {
          return { supported: true };
        }
      };

      const supported = await isWebCodecsExportSupported();
      expect(supported).toBe(true);

      delete (globalThis as any).VideoEncoder;
      delete (globalThis as any).VideoFrame;
    });
  });

  describe('exportVideoWithWebCodecs Audio Chunk Resilience', () => {
    it('handles audio chunk with null duration gracefully using fallback duration in addAudioChunkRaw', async () => {
      (globalThis as any).window = globalThis;

      // Mock VideoEncoder
      let videoOutputCb: any = null;
      (globalThis as any).VideoEncoder = class MockVideoEncoder {
        state = 'configured';
        constructor(init: any) {
          videoOutputCb = init.output;
        }
        static async isConfigSupported() {
          return { supported: true };
        }
        configure() {}
        encode() {
          if (videoOutputCb) {
            videoOutputCb(
              {
                byteLength: 64,
                type: 'key',
                timestamp: 0,
                duration: 33333,
                copyTo: (dest: Uint8Array) => dest.fill(1),
              },
              {
                decoderConfig: {
                  codec: 'avc1.4d002a',
                  colorSpace: {
                    fullRange: false,
                    matrix: 'smpte170m',
                    primaries: 'bt709',
                    transfer: 'bt709',
                  },
                  description: new Uint8Array([1, 100, 0, 42, 255, 225, 0, 0]),
                },
              }
            );
          }
        }
        async flush() {}
        close() {
          this.state = 'closed';
        }
      };

      // Mock AudioEncoder simulating Chrome AAC behavior (duration: null)
      let audioOutputCb: any = null;
      let audioFlushed = false;
      (globalThis as any).AudioEncoder = class MockAudioEncoder {
        state = 'configured';
        constructor(init: any) {
          audioOutputCb = init.output;
        }
        static async isConfigSupported() {
          return { supported: true };
        }
        configure() {}
        encode() {
          if (audioOutputCb) {
            // Emulate Chromium AAC output with duration: null
            audioOutputCb(
              {
                byteLength: 128,
                type: 'key',
                timestamp: 0,
                duration: null, // Critical: Chrome outputs null duration for AAC!
                copyTo: (dest: Uint8Array) => dest.fill(2),
              },
              {
                decoderConfig: {
                  codec: 'mp4a.40.2',
                  numberOfChannels: 2,
                  sampleRate: 48000,
                  description: new Uint8Array([18, 16]),
                },
              }
            );
          }
        }
        async flush() {
          audioFlushed = true;
        }
        close() {
          this.state = 'closed';
        }
      };

      (globalThis as any).VideoFrame = class MockVideoFrame {
        constructor() {}
        close() {}
      };

      (globalThis as any).AudioData = class MockAudioData {
        constructor() {}
        close() {}
      };

      // Mock canvas
      const mockCanvas = {
        width: 1080,
        height: 1920,
        getContext: () => ({
          drawImage: vi.fn(),
          fillRect: vi.fn(),
          fillText: vi.fn(),
          measureText: () => ({ width: 100 }),
          createRadialGradient: () => ({ addColorStop: vi.fn() }),
          createLinearGradient: () => ({ addColorStop: vi.fn() }),
          beginPath: vi.fn(),
          closePath: vi.fn(),
          stroke: vi.fn(),
          fill: vi.fn(),
          arc: vi.fn(),
          rect: vi.fn(),
          roundRect: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          setTransform: vi.fn(),
          resetTransform: vi.fn(),
          scale: vi.fn(),
          translate: vi.fn(),
          clearRect: vi.fn(),
          strokeRect: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
        }),
      };
      (globalThis as any).document = {
        createElement: (tag: string) => {
          if (tag === 'canvas') return mockCanvas;
          return {};
        },
      };

      // Create synthetic master audio buffer (1 second, 48000Hz, stereo)
      const fakeMasterBuffer = {
        length: 2048,
        numberOfChannels: 2,
        sampleRate: 48000,
        duration: 2048 / 48000,
        getChannelData: () => new Float32Array(2048),
      } as unknown as AudioBuffer;

      const blob = await exportVideoWithWebCodecs({
        width: 1080,
        height: 1920,
        fps: 30,
        ayahs: [],
        timeline: [],
        totalDurationSec: 0.1,
        masterAudioBuffer: fakeMasterBuffer,
      });

      expect(blob).toBeDefined();
      expect(blob.type).toBe('video/mp4');
      expect(audioFlushed).toBe(true);

      // Clean up globals
      delete (globalThis as any).VideoEncoder;
      delete (globalThis as any).AudioEncoder;
      delete (globalThis as any).VideoFrame;
      delete (globalThis as any).AudioData;
      delete (globalThis as any).document;
    });

    it('proceeds gracefully when AudioEncoder is not supported', async () => {
      (globalThis as any).window = globalThis;
      (globalThis as any).VideoFrame = class MockVideoFrame {
        close() {}
      };
      let videoOutputCb: any = null;
      (globalThis as any).VideoEncoder = class MockVideoEncoder {
        state = 'configured';
        constructor(init: any) {
          videoOutputCb = init.output;
        }
        static async isConfigSupported() {
          return { supported: true };
        }
        configure() {}
        encode() {
          if (videoOutputCb) {
            videoOutputCb(
              {
                byteLength: 64,
                type: 'key',
                timestamp: 0,
                duration: 33333,
                copyTo: (dest: Uint8Array) => dest.fill(1),
              },
              {
                decoderConfig: {
                  codec: 'avc1.4d002a',
                  colorSpace: { fullRange: false, matrix: 'smpte170m', primaries: 'bt709', transfer: 'bt709' },
                  description: new Uint8Array([1, 100, 0, 42, 255, 225, 0, 0]),
                },
              }
            );
          }
        }
        async flush() {}
        close() {
          this.state = 'closed';
        }
      };
      (globalThis as any).AudioEncoder = class MockAudioEncoder {
        static async isConfigSupported() {
          return { supported: false }; // Unsupported AAC!
        }
      };

      const mockCanvas = {
        width: 1080,
        height: 1920,
        getContext: () => ({
          drawImage: vi.fn(),
          fillRect: vi.fn(),
          fillText: vi.fn(),
          measureText: () => ({ width: 100 }),
          createRadialGradient: () => ({ addColorStop: vi.fn() }),
          createLinearGradient: () => ({ addColorStop: vi.fn() }),
          beginPath: vi.fn(),
          closePath: vi.fn(),
          stroke: vi.fn(),
          fill: vi.fn(),
          arc: vi.fn(),
          rect: vi.fn(),
          roundRect: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          setTransform: vi.fn(),
          resetTransform: vi.fn(),
          scale: vi.fn(),
          translate: vi.fn(),
          clearRect: vi.fn(),
          strokeRect: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
        }),
      };
      (globalThis as any).document = {
        createElement: (tag: string) => (tag === 'canvas' ? mockCanvas : {}),
      };

      const fakeMasterBuffer = {
        length: 2048,
        numberOfChannels: 2,
        sampleRate: 48000,
        duration: 0.1,
        getChannelData: () => new Float32Array(2048),
      } as unknown as AudioBuffer;

      const blob = await exportVideoWithWebCodecs({
        width: 1080,
        height: 1920,
        fps: 30,
        ayahs: [],
        timeline: [],
        totalDurationSec: 0.1,
        masterAudioBuffer: fakeMasterBuffer,
      });

      expect(blob).toBeDefined();
      expect(blob.type).toBe('video/mp4');

      delete (globalThis as any).VideoEncoder;
      delete (globalThis as any).AudioEncoder;
      delete (globalThis as any).VideoFrame;
      delete (globalThis as any).document;
    });
  });
});
