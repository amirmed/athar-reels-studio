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
export declare function buildAudioFilters(audioSettings: ExportAudioSettings | AudioSettings | undefined, totalDur: number): string[];
