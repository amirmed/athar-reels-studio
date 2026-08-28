import { describe, it, expect, vi } from 'vitest';
import {
  extractAudioPeaksFromBuffer,
  getSampledWaveformHeights,
  cacheAudioPeaks,
  getAudioPeaksCached,
} from '../services/audioPeakExtractor';
import { renderVideoExportFrame, FrameRenderOptions } from '../services/videoFrameRenderer';

describe('Audio Peak Extractor & Real Waveform Visualizer', () => {
  describe('extractAudioPeaksFromBuffer', () => {
    it('returns fallback array for empty buffer', () => {
      const mockEmptyBuffer = { length: 0, getChannelData: () => new Float32Array(0) } as any;
      const peaks = extractAudioPeaksFromBuffer(mockEmptyBuffer, 50);
      expect(peaks).toHaveLength(50);
      expect(peaks[0]).toBeCloseTo(0.2);
    });

    it('extracts normalized amplitude envelope from audio channel data', () => {
      // 100 samples with varying energy
      const rawData = new Float32Array(100);
      for (let i = 0; i < 100; i++) {
        rawData[i] = Math.sin((i / 100) * Math.PI) * 0.8; // Peak in the middle
      }

      const mockBuffer = {
        length: 100,
        getChannelData: () => rawData,
      } as any;

      const peaks = extractAudioPeaksFromBuffer(mockBuffer, 10);
      expect(peaks).toHaveLength(10);

      // Verify peaks are bounded between 0 and 1
      for (const p of peaks) {
        expect(p).toBeGreaterThanOrEqual(0.06);
        expect(p).toBeLessThanOrEqual(1.0);
      }

      // Middle peak should be higher than beginning/end
      const middleIdx = Math.floor(peaks.length / 2);
      expect(peaks[middleIdx]).toBeGreaterThan(peaks[0]);
      expect(peaks[middleIdx]).toBeGreaterThan(peaks[peaks.length - 1]);
    });
  });

  describe('getSampledWaveformHeights', () => {
    it('samples heights matching current playback time progress', () => {
      const testPeaks = [0.1, 0.2, 0.3, 0.9, 0.95, 0.9, 0.3, 0.2, 0.1];
      const heightsAtStart = getSampledWaveformHeights(testPeaks, 0, 10, 8);
      const heightsAtPeak = getSampledWaveformHeights(testPeaks, 5, 10, 8);

      expect(heightsAtStart).toHaveLength(8);
      expect(heightsAtPeak).toHaveLength(8);

      const maxStart = Math.max(...heightsAtStart);
      const maxPeak = Math.max(...heightsAtPeak);
      expect(maxPeak).toBeGreaterThan(maxStart);
    });

    it('generates harmonic fallback heights when peaks are not available', () => {
      const fallback = getSampledWaveformHeights(undefined, 2, 10, 16, 0);
      expect(fallback).toHaveLength(16);
      for (const h of fallback) {
        expect(h).toBeGreaterThan(0);
        expect(h).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Peak Memory Cache', () => {
    it('stores and retrieves cached peaks correctly', () => {
      const testUrl = 'https://example.com/surah1.mp3';
      const samplePeaks = [0.1, 0.5, 0.9, 0.4];
      cacheAudioPeaks(testUrl, samplePeaks);

      expect(getAudioPeaksCached(testUrl)).toEqual(samplePeaks);
    });
  });

  describe('Video Frame Waveform Rendering with Real Peaks Parity', () => {
    it('renders all waveform styles (bars, wave, dots, pulse) with real peaks without error', () => {
      const mockCtx = {
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
        clip: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        createLinearGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
        createRadialGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
      } as unknown as CanvasRenderingContext2D;

      const testPeaks = Array.from({ length: 50 }, (_, i) => Math.sin(i * 0.2) * 0.4 + 0.5);

      const styles: Array<'bars' | 'wave' | 'dots' | 'pulse'> = ['bars', 'wave', 'dots', 'pulse'];

      for (const style of styles) {
        const renderOpts: FrameRenderOptions = {
          ctx: mockCtx,
          width: 1080,
          height: 1920,
          frame: 30,
          totalFrames: 300,
          currentTimeSec: 1.0,
          bgOpacity: 0.6,
          currentAyah: {
            number: 1,
            numberInSurah: 1,
            surahNumber: 1,
            surahName: 'الفاتحة',
            juz: 1,
            page: 1,
            text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
            duration: 6,
            audioUrl: 'https://example.com/audio.mp3',
          },
          textSettings: {
            showWaveform: true,
            waveformStyle: style,
            waveformColor: '#fbbf24',
            waveformHeight: 30,
            waveformOpacity: 0.9,
          } as any,
          projectName: 'Waveform Test',
          audioPeaks: testPeaks,
          totalDurationSec: 6.0,
        };

        expect(() => renderVideoExportFrame(renderOpts)).not.toThrow();
      }
    });
  });
});
