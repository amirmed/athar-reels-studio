import { describe, it, expect } from 'vitest';
import { buildAudioFilters, ExportAudioSettings } from '../services/audioDspFilters';

describe('Audio Export DSP and Filter Pipeline', () => {
  it('returns empty filter list when audioSettings is undefined', () => {
    const filters = buildAudioFilters(undefined, 10);
    expect(filters).toEqual([]);
  });

  it('generates correct FFmpeg filters for Mosque Reverb presets', () => {
    const presets: Array<ExportAudioSettings['reverbPreset']> = [
      'smallRoom',
      'grandMosque',
      'makkahHaram',
      'celestialEcho',
    ];

    for (const preset of presets) {
      const settings: ExportAudioSettings = {
        reverbPreset: preset,
        reverbLevel: 50,
      };
      const filters = buildAudioFilters(settings, 15);
      expect(filters.length).toBeGreaterThan(0);
      expect(filters.some((f: string) => f.startsWith('aecho='))).toBe(true);
    }
  });

  it('generates 8D Spatial Audio apulsator modulation filter when enabled', () => {
    const settings: ExportAudioSettings = {
      enable8DAudio: true,
      eightDSpeed: 0.15,
      eightDDepth: 90,
    };
    const filters = buildAudioFilters(settings, 20);
    expect(filters.some((f: string) => f.includes('apulsator=hz=0.15:amount=0.90'))).toBe(true);
  });

  it('generates studio clarity, voice warmth, and noise gate filters', () => {
    const settings: ExportAudioSettings = {
      enableStudioClarity: true,
      enableVoiceWarmth: true,
      enableNoiseGate: true,
    };
    const filters = buildAudioFilters(settings, 10);
    expect(filters).toContain('highpass=f=80');
    expect(filters).toContain('treble=g=4:f=3500');
    expect(filters).toContain('bass=g=3.5:f=250');
  });

  it('generates fade-in and fade-out filters correctly with total duration calculation', () => {
    const settings: ExportAudioSettings = {
      fadeIn: true,
      fadeOut: true,
      fadeDuration: 1.0,
      recitationVolume: 80,
    };
    const filters = buildAudioFilters(settings, 30);
    expect(filters).toContain('volume=0.80');
    expect(filters).toContain('afade=t=in:ss=0:d=1');
    expect(filters).toContain('afade=t=out:st=29.00:d=1');
  });
});
