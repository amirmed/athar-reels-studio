import { Project, TextSettings, AudioSettings } from '../types';

export const DEFAULT_TEXT_SETTINGS: TextSettings = {
  fontSize: 26,
  fontWeight: 'bold',
  textAlign: 'center',
  textColor: '#ffffff',
  bgColor: '#000000',
  bgOpacity: 0.5,
  position: 'center',
  positionX: 0,
  positionY: 0,
  translationFontSize: 14,
  translationColor: '#cbd5e1',
  translationLanguage: 'en',
  fontFamily: 'Amiri',
  lineHeight: 2.2,
  wordSpacing: 0,
  letterSpacing: 0,
  enableShadow: true,
  shadowBlur: 16,
  shadowColor: 'rgba(0,0,0,0.95)',
  shadowOffsetX: 0,
  shadowOffsetY: 3,
  enableGlow: true,
  glowColor: '#fbbf24',
  glowIntensity: 18,
  enableStroke: false,
  strokeColor: '#000000',
  strokeWidth: 1.5,
  textGradient: 'none',
  textAnimation: 'fadeIn',
  displayMode: 'chunked',
  wordHighlightEnabled: true,
  wordHighlightStyle: 'goldGlow',
  wordHighlightColor: '#fbbf24',
  inactiveWordOpacity: 0.6,
  highlightScale: true,
  showProgressBar: true,
  progressBarStyle: 'neonGlow',
  progressBarColor: '#14b8a6',
  progressBarHeight: 3,
  showIslamicOrnaments: false,
  ornamentStyle: 'none',
  ornamentColor: '#fbbf24',
  ornamentOpacity: 0.7,
  showWaveform: false,
  waveformStyle: 'bars',
  waveformColor: '#14b8a6',
  waveformPosition: 'bottom',
  waveformHeight: 24,
  waveformOpacity: 0.8,
  colorGrading: 'none',
  cameraMotion: 'none',
  watermarkPosition: 'bottom',
  watermarkOpacity: 0.7,
  watermarkFontSize: 12,
  watermarkColor: '#ffffff',
  showWatermark: true,
  showTitleBadge: true,
  showReciterBadge: true,
  show8DBadge: false,
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  recitationVolume: 100,
  backgroundTrack: undefined,
  backgroundVolume: 25,
  ambientSoundId: undefined,
  ambientSoundVolume: 20,
  reverbPreset: 'none',
  reverbLevel: 35,
  enableStudioClarity: false,
  enableVoiceWarmth: false,
  enableNoiseGate: false,
  enable8DAudio: false,
  eightDSpeed: 0.12,
  eightDDepth: 85,
  eightDStyle: 'orbit360',
  fadeIn: true,
  fadeOut: true,
  fadeDuration: 0.5,
};

export function createDefaultTextSettings(overrides?: Partial<TextSettings>): TextSettings {
  return {
    ...DEFAULT_TEXT_SETTINGS,
    ...overrides,
  };
}

export function createDefaultAudioSettings(overrides?: Partial<AudioSettings>): AudioSettings {
  return {
    ...DEFAULT_AUDIO_SETTINGS,
    ...overrides,
  };
}

export function createDefaultProject(overrides?: Partial<Project>): Project {
  const now = new Date().toISOString();
  const {
    textSettings: overrideTextSettings,
    audioSettings: overrideAudioSettings,
    ...restOverrides
  } = overrides || {};

  return {
    id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: 'ريل قرآني جديد',
    reciter: 'مشاري راشد العفاسي',
    reciterId: 'alafasy_128',
    surah: 'الفاتحة',
    surahNumber: 1,
    fromAyah: 1,
    toAyah: 7,
    aspectRatio: '9:16',
    backgroundType: 'image',
    backgroundUrl:
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.65,
    watermark: 'أَثَـر ستوديو',
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    exportCount: 0,
    contentType: 'quran',
    translationEnabled: false,
    tafsirEnabled: false,
    transition: 'fadeScale',
    videoEffect: 'none',
    ...restOverrides,
    textSettings: createDefaultTextSettings(overrideTextSettings),
    audioSettings: createDefaultAudioSettings(overrideAudioSettings),
  };
}
