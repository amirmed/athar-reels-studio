import { AudioSettings } from '../types';

export interface ExportAudioSettings {
  recitationVolume?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  fadeDuration?: number;
  backgroundTrack?: string;
  backgroundVolume?: number;
  ambientSoundId?: string;
  ambientSoundVolume?: number;
  reverbPreset?: 'none' | 'smallRoom' | 'grandMosque' | 'makkahHaram' | 'celestialEcho';
  reverbLevel?: number;
  enableStudioClarity?: boolean;
  enableVoiceWarmth?: boolean;
  enableNoiseGate?: boolean;
  enable8DAudio?: boolean;
  eightDSpeed?: number;
  eightDDepth?: number;
  eightDStyle?: string;
}

/**
 * Builds FFmpeg audio filter chains (-af) for Mosque Reverb, 8D Spatial Audio, Studio EQ, and Volume/Fades
 */
export function buildAudioFilters(
  audioSettings: ExportAudioSettings | AudioSettings | undefined,
  totalDur: number
): string[] {
  const af: string[] = [];
  if (!audioSettings) return af;

  // 1. Noise Gate / High-pass
  if (audioSettings.enableNoiseGate) {
    af.push('highpass=f=80');
  }

  // 2. Studio Clarity (Treble boost)
  if (audioSettings.enableStudioClarity) {
    af.push('treble=g=4:f=3500');
  }

  // 3. Voice Warmth (Bass boost)
  if (audioSettings.enableVoiceWarmth) {
    af.push('bass=g=3.5:f=250');
  }

  // 4. Mosque Reverb DSP
  if (audioSettings.reverbPreset && audioSettings.reverbPreset !== 'none') {
    const level = (audioSettings.reverbLevel ?? 35) / 100;
    switch (audioSettings.reverbPreset) {
      case 'smallRoom':
        af.push(`aecho=0.8:${Math.min(0.9, 0.6 + level * 0.3).toFixed(2)}:40|80:0.3|0.2`);
        break;
      case 'grandMosque':
        af.push(`aecho=0.8:${Math.min(0.92, 0.65 + level * 0.3).toFixed(2)}:60|120|240:0.4|0.3|0.2`);
        break;
      case 'makkahHaram':
        af.push(
          `aecho=0.85:${Math.min(0.94, 0.7 + level * 0.25).toFixed(2)}:80|180|360|600:0.45|0.35|0.25|0.15`
        );
        break;
      case 'celestialEcho':
        af.push(
          `aecho=0.85:${Math.min(0.96, 0.75 + level * 0.22).toFixed(2)}:100|250|500|850:0.5|0.4|0.3|0.2`
        );
        break;
    }
  }

  // 5. 8D Binaural Spatial Audio (sine panning modulation)
  if (audioSettings.enable8DAudio) {
    const speed = audioSettings.eightDSpeed || 0.12;
    const amount = Math.min(1.0, (audioSettings.eightDDepth || 85) / 100);
    af.push(`apulsator=hz=${speed}:amount=${amount.toFixed(2)}:mode=sine:width=0.5`);
  }

  // 6. Volume scaling
  if (audioSettings.recitationVolume !== undefined && audioSettings.recitationVolume !== 100) {
    const vol = Math.max(0, audioSettings.recitationVolume / 100);
    af.push(`volume=${vol.toFixed(2)}`);
  }

  // 7. Fade In / Out
  if (audioSettings.fadeIn) {
    const d = audioSettings.fadeDuration || 0.5;
    af.push(`afade=t=in:ss=0:d=${d}`);
  }
  if (audioSettings.fadeOut && totalDur > 1) {
    const d = audioSettings.fadeDuration || 0.5;
    const st = Math.max(0, totalDur - d);
    af.push(`afade=t=out:st=${st.toFixed(2)}:d=${d}`);
  }

  return af;
}
