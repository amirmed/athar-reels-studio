import { describe, it, expect } from 'vitest';
import { buildAudioFilters, ExportAudioSettings } from '../services/audioDspFilters';

describe('Audio DSP Filters Engine', () => {
  it('returns empty array when no audio settings provided', () => {
    const filters = buildAudioFilters(undefined, 10);
    expect(filters).toEqual([]);
  });

  it('generates EQ filters for noise gate, studio clarity, and voice warmth', () => {
    const settings: ExportAudioSettings = {
      enableNoiseGate: true,
      enableStudioClarity: true,
      enableVoiceWarmth: true,
    };
    const filters = buildAudioFilters(settings, 10);
    expect(filters).toContain('highpass=f=80');
    expect(filters).toContain('treble=g=4:f=3500');
    expect(filters).toContain('bass=g=3.5:f=250');
  });

  it('generates authentic mosque reverb DSP filters for Makkah Haram and Grand Mosque', () => {
    const makkahSettings: ExportAudioSettings = {
      reverbPreset: 'makkahHaram',
      reverbLevel: 50,
    };
    const makkahFilters = buildAudioFilters(makkahSettings, 10);
    expect(makkahFilters.some((f) => f.startsWith('aecho=0.85') && f.includes('80|180|360|600'))).toBe(true);

    const mosqueSettings: ExportAudioSettings = {
      reverbPreset: 'grandMosque',
      reverbLevel: 30,
    };
    const mosqueFilters = buildAudioFilters(mosqueSettings, 10);
    expect(mosqueFilters.some((f) => f.startsWith('aecho=0.8') && f.includes('60|120|240'))).toBe(true);
  });

  it('generates 8D Binaural Spatial Audio panning pulsator filter', () => {
    const settings: ExportAudioSettings = {
      enable8DAudio: true,
      eightDSpeed: 0.15,
      eightDDepth: 90,
    };
    const filters = buildAudioFilters(settings, 10);
    expect(filters.some((f) => f.includes('apulsator=hz=0.15:amount=0.90:mode=sine'))).toBe(true);
  });

  it('generates volume and fade in/out filters accurately', () => {
    const settings: ExportAudioSettings = {
      recitationVolume: 80,
      fadeIn: true,
      fadeOut: true,
      fadeDuration: 1.5,
    };
    const filters = buildAudioFilters(settings, 12);
    expect(filters).toContain('volume=0.80');
    expect(filters).toContain('afade=t=in:ss=0:d=1.5');
    expect(filters).toContain('afade=t=out:st=10.50:d=1.5');
  });
});
