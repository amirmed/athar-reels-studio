export interface Project {
  id: string;
  name: string;
  reciter: string;
  reciterId: string;
  surah: string;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  backgroundType: 'image' | 'video' | 'none';
  backgroundUrl?: string;
  backgroundOpacity: number;
  watermark?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'editing' | 'exported' | 'archived';
  thumbnail?: string;
  exportCount: number;
  contentType?: 'quran' | 'hadith' | 'azkar' | 'custom';
  customText?: string;
  customTitle?: string;
  customReference?: string;
  customAudioUrl?: string;
  customAudioKey?: string;
  customReciterName?: string;
  textSettings: TextSettings;
  audioSettings: AudioSettings;
  translationEnabled: boolean;
  tafsirEnabled: boolean;
  enableMultiScene?: boolean;
  sceneBackgrounds?: Record<number, string>;
  caption?: string;
  hashtags?: string[];
}

export type WordHighlightStyle =
  'goldGlow' | 'radiantWhite' | 'amberEmber' | 'emeraldGlow' | 'pillBadge' | 'underlineWave';

export type ProgressBarStyle = 'neonGlow' | 'minimalLine' | 'gradientWave' | 'dots';

export type OrnamentStyle =
  'none' | 'royalFrame' | 'geometricArabesque' | 'domeCrescent' | 'floralCorners';

export type WaveformStyle = 'bars' | 'wave' | 'dots' | 'pulse';
export type TranslationLanguage = 'en' | 'fr' | 'ur' | 'tr' | 'es' | 'id';

export type ColorGradingFilter =
  'none' | 'royalGold' | 'andalusianTwilight' | 'dawnMist' | 'matteSilver' | 'emeraldNoor';

export type CameraMotionEffect = 'none' | 'slowZoom' | 'panRight' | 'panLeft' | 'subtle3D';

export interface QuranWord {
  id: number;
  position: number;
  text: string; // text_uthmani
  translation?: string;
  transliteration?: string;
  startTime: number; // in seconds relative to the ayah audio
  endTime: number; // in seconds relative to the ayah audio
  charTypeName: 'word' | 'end';
}

export interface AyahChunk {
  index: number;
  text: string;
  words: QuranWord[];
  startTime: number;
  endTime: number;
  hasWaqfSign?: boolean;
  waqfSign?: string;
}

export interface TextSettings {
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'light';
  textAlign: 'center' | 'right' | 'left';
  textColor: string;
  bgColor: string;
  bgOpacity: number;
  position: 'top' | 'center' | 'bottom';
  positionX?: number; // custom drag offset X (-100 to 100)
  positionY?: number; // custom drag offset Y (-100 to 100)
  translationFontSize: number;
  translationColor: string;
  translationLanguage?: TranslationLanguage;
  fontFamily?: string;
  // Advanced Typography Spacing
  lineHeight?: number; // 1.0 to 2.8 (default 1.8)
  wordSpacing?: number; // -4 to 30 px (default 0)
  letterSpacing?: number; // -2 to 12 px (default 0)
  // Text Effects Studio (Shadow, Glow, Stroke, Gradient)
  enableShadow?: boolean;
  shadowBlur?: number; // 0 to 40 px
  shadowColor?: string;
  shadowOffsetX?: number; // -20 to 20 px
  shadowOffsetY?: number; // -20 to 20 px
  enableGlow?: boolean;
  glowColor?: string;
  glowIntensity?: number; // 0 to 50 px
  enableStroke?: boolean;
  strokeColor?: string;
  strokeWidth?: number; // 0.5 to 5 px
  textGradient?: 'none' | 'gold' | 'silver' | 'emerald' | 'amber' | 'celestial';
  // Text Animation & Motion
  textAnimation?:
    'none' | 'wordByWord' | 'lineByLine' | 'fadeIn' | 'typewriter' | 'scaleBounce' | 'glowPulse';
  // Display Mode (Single Ayah Slide vs Smart Chunking vs Continuous)
  displayMode?: 'single_ayah' | 'chunked' | 'continuous';
  // Word-by-word Karaoke settings
  wordHighlightEnabled?: boolean;
  wordHighlightStyle?: WordHighlightStyle;
  wordHighlightColor?: string;
  inactiveWordOpacity?: number;
  highlightScale?: boolean;
  // Progress bar settings
  showProgressBar?: boolean;
  progressBarStyle?: ProgressBarStyle;
  progressBarColor?: string;
  progressBarHeight?: number;
  // Islamic Ornaments
  showIslamicOrnaments?: boolean;
  ornamentStyle?: OrnamentStyle;
  ornamentColor?: string;
  ornamentOpacity?: number;
  // Audio Waveform Visualizer
  showWaveform?: boolean;
  waveformStyle?: WaveformStyle;
  waveformColor?: string;
  waveformPosition?: 'bottom' | 'middle' | 'belowText';
  waveformHeight?: number;
  waveformOpacity?: number;
  // Dynamic Multi-Scene Storytelling
  enableMultiScene?: boolean;
  sceneBackgrounds?: Record<number, string>;
  // Cinematic Color Grading
  colorGrading?: ColorGradingFilter;
  // 3D Slow Camera Motion & Ken Burns
  cameraMotion?: CameraMotionEffect;
  // Watermark Customization
  watermarkPosition?: WatermarkPosition;
  watermarkOpacity?: number; // 0.1 to 1.0
  watermarkFontSize?: number;
  watermarkColor?: string;
  showWatermark?: boolean;
  watermarkX?: number; // Freeform drag X offset (-200 to 200)
  watermarkY?: number; // Freeform drag Y offset (-300 to 300)
  showTitleBadge?: boolean; // Toggle top Surah / Topic title banner
  showReciterBadge?: boolean; // Toggle bottom reciter / speaker banner
  show8DBadge?: boolean; // Toggle 8D Binaural headphone badge on video
}

export type WatermarkPosition =
  'bottom' | 'bottomRight' | 'bottomLeft' | 'top' | 'topRight' | 'topLeft' | 'center';

export type MosqueReverbPreset =
  'none' | 'smallRoom' | 'grandMosque' | 'makkahHaram' | 'celestialEcho';
export type Spatial8DStyle = 'orbit360' | 'pendulum' | 'makkahDome' | 'floatingClouds';

export interface AudioSettings {
  recitationVolume: number;
  fadeIn: boolean;
  fadeOut: boolean;
  fadeDuration: number;
  backgroundTrack?: string;
  backgroundVolume: number;
  ambientSoundId?: string;
  ambientSoundVolume?: number;
  // Mosque Spatial Reverb & Studio Mastering
  reverbPreset?: MosqueReverbPreset;
  reverbLevel?: number; // 0 - 100
  enableStudioClarity?: boolean; // Treble / Tajweed booster
  enableVoiceWarmth?: boolean; // Low-mid bass warmth
  enableNoiseGate?: boolean; // High-pass & noise gate
  enablePitchPolish?: boolean; // Auto-Pitch Smoothing & Sweetener
  pitchPolishLevel?: number; // 0 - 100
  // 8D Binaural Spatial Audio
  enable8DAudio?: boolean;
  eightDSpeed?: number; // 0.05 to 0.35 Hz (default 0.12)
  eightDDepth?: number; // 0.2 to 1.0 (default 0.85)
  eightDStyle?: Spatial8DStyle;
  show8DBadge?: boolean;
  customRecordedAudioUrl?: string; // If user recorded or uploaded own voice
  customAudioDuration?: number;
  customAudioKey?: string; // Persistent IndexedDB storage key
  customReciterName?: string; // Custom display name for recorded voice
}

export interface StudioTemplate {
  id: string;
  name: string;
  englishName: string;
  description: string;
  tag: string;
  icon: string;
  backgroundUrl: string;
  backgroundOpacity: number;
  videoEffect: string;
  transition: string;
  textSettings: Partial<TextSettings>;
  audioSettings: Partial<AudioSettings>;
}

export interface Reciter {
  id: string;
  name: string;
  style: string;
  image?: string;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  ayahCount: number;
  revelationType: 'مكية' | 'مدنية';
}

export interface ExportJob {
  id: string;
  projectId: string;
  projectName: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  quality: 'standard' | 'high' | 'premium';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputPath?: string;
  downloadUrl?: string;
  createdAt: string;
  estimatedSize?: string;
  estimatedDuration?: string;
}

export interface AppSettings {
  language: 'ar' | 'en' | 'fr';
  theme: 'dark' | 'light';
  projectsPath: string;
  defaultExportQuality: 'standard' | 'high' | 'premium';
  defaultAspectRatio: '9:16' | '16:9' | '1:1';
  performanceMode: 'balanced' | 'quality' | 'performance';
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface AzkarItem {
  id: string;
  category: 'morning' | 'evening' | 'sleep' | 'prophets' | 'hisn_muslim' | 'hadith' | 'relief';
  categoryNameAr: string;
  title: string;
  arabicText: string;
  reference: string;
  repeatCount: number;
  benefit?: string;
  audioUrl?: string;
}

export type QuoteAspectRatio = '1:1' | '9:16' | '4:5' | '16:9';

export interface QuoteCardSettings {
  title: string;
  text: string;
  reference: string;
  aspectRatio: QuoteAspectRatio;
  backgroundType: 'image' | 'gradient' | 'color';
  backgroundUrl: string;
  backgroundColor: string;
  backgroundBlur: number;
  backgroundOpacity: number;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  textGradient: boolean;
  textGradientColors: [string, string];
  lineHeight: number;
  textAlign: 'center' | 'right' | 'left';
  showOrnament: boolean;
  ornamentStyle: OrnamentStyle;
  ornamentColor: string;
  ornamentOpacity: number;
  showReferenceBadge: boolean;
  watermark: string;
  watermarkPosition?: WatermarkPosition;
  watermarkOpacity?: number;
  watermarkFontSize?: number;
  watermarkColor?: string;
  showWatermark?: boolean;
  watermarkX?: number; // Freeform drag X offset (-200 to 200)
  watermarkY?: number; // Freeform drag Y offset (-300 to 300)
  enableGlassCard?: boolean;
  glassOpacity?: number;
  showQuoteMarks?: boolean;
}

export interface QuotePresetTemplate {
  id: string;
  name: string;
  nameEn: string;
  previewColor: string;
  settings: Partial<QuoteCardSettings>;
}

export type Page =
  | 'welcome'
  | 'dashboard'
  | 'projects'
  | 'create'
  | 'editor'
  | 'export'
  | 'azkar'
  | 'quotes'
  | 'voice-studio'
  | 'settings';

export type AspectRatio = '9:16' | '16:9' | '1:1';
export type TransitionType = 'fadeScale' | 'slideUp' | 'slideRight' | 'zoomIn' | 'flip' | 'none';
export type VideoEffectType = 'none' | 'vignette' | 'glow' | 'vintage' | 'cinematic';
