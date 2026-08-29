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
    transition?: string;
    videoEffect?: string;
    activeTemplateId?: string;
}
export type WordHighlightStyle = 'goldGlow' | 'radiantWhite' | 'amberEmber' | 'emeraldGlow' | 'pillBadge' | 'underlineWave';
export type ProgressBarStyle = 'neonGlow' | 'minimalLine' | 'gradientWave' | 'dots';
export type OrnamentStyle = 'none' | 'royalFrame' | 'geometricArabesque' | 'domeCrescent' | 'floralCorners';
export type WaveformStyle = 'bars' | 'wave' | 'dots' | 'pulse';
export type TranslationLanguage = 'en' | 'fr' | 'ur' | 'tr' | 'es' | 'id';
export type ColorGradingFilter = 'none' | 'royalGold' | 'andalusianTwilight' | 'dawnMist' | 'matteSilver' | 'emeraldNoor' | 'meccaGold' | 'fajrBlue' | 'sunsetWarmth' | 'celestialGlow' | 'rawdahGreen' | 'emeraldGreen' | 'madinaAmber' | 'vintageWarm' | 'royalNight';
export type CameraMotionEffect = 'none' | 'slowZoom' | 'panRight' | 'panLeft' | 'subtle3D';
export interface QuranWord {
    id: number;
    position: number;
    text: string;
    translation?: string;
    transliteration?: string;
    startTime: number;
    endTime: number;
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
    positionX?: number;
    positionY?: number;
    translationFontSize: number;
    translationColor: string;
    translationLanguage?: TranslationLanguage;
    fontFamily?: string;
    lineHeight?: number;
    wordSpacing?: number;
    letterSpacing?: number;
    enableShadow?: boolean;
    shadowBlur?: number;
    shadowColor?: string;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    enableGlow?: boolean;
    glowColor?: string;
    glowIntensity?: number;
    enableStroke?: boolean;
    strokeColor?: string;
    strokeWidth?: number;
    textGradient?: 'none' | 'gold' | 'silver' | 'emerald' | 'amber' | 'celestial' | 'sunset' | 'royal';
    textAnimation?: 'none' | 'wordByWord' | 'lineByLine' | 'fadeIn' | 'typewriter' | 'scaleBounce' | 'glowPulse';
    displayMode?: 'single_ayah' | 'chunked' | 'continuous';
    wordHighlightEnabled?: boolean;
    wordHighlightStyle?: WordHighlightStyle;
    wordHighlightColor?: string;
    inactiveWordOpacity?: number;
    highlightScale?: boolean;
    showProgressBar?: boolean;
    progressBarStyle?: ProgressBarStyle;
    progressBarColor?: string;
    progressBarHeight?: number;
    showIslamicOrnaments?: boolean;
    ornamentStyle?: OrnamentStyle;
    ornamentColor?: string;
    ornamentOpacity?: number;
    showWaveform?: boolean;
    waveformStyle?: WaveformStyle;
    waveformColor?: string;
    waveformPosition?: 'bottom' | 'middle' | 'belowText';
    waveformHeight?: number;
    waveformOpacity?: number;
    enableMultiScene?: boolean;
    sceneBackgrounds?: Record<number, string>;
    colorGrading?: ColorGradingFilter;
    cameraMotion?: CameraMotionEffect;
    watermarkPosition?: WatermarkPosition;
    watermarkOpacity?: number;
    watermarkFontSize?: number;
    watermarkColor?: string;
    showWatermark?: boolean;
    watermarkX?: number;
    watermarkY?: number;
    showTitleBadge?: boolean;
    showReciterBadge?: boolean;
    show8DBadge?: boolean;
}
export type WatermarkPosition = 'bottom' | 'bottomRight' | 'bottomLeft' | 'top' | 'topRight' | 'topLeft' | 'center';
export type MosqueReverbPreset = 'none' | 'smallRoom' | 'grandMosque' | 'makkahHaram' | 'celestialEcho';
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
    reverbPreset?: MosqueReverbPreset;
    reverbLevel?: number;
    enableStudioClarity?: boolean;
    enableVoiceWarmth?: boolean;
    enableNoiseGate?: boolean;
    enablePitchPolish?: boolean;
    pitchPolishLevel?: number;
    enable8DAudio?: boolean;
    eightDSpeed?: number;
    eightDDepth?: number;
    eightDStyle?: Spatial8DStyle;
    show8DBadge?: boolean;
    customRecordedAudioUrl?: string;
    customAudioDuration?: number;
    customAudioKey?: string;
    customReciterName?: string;
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
    watermarkX?: number;
    watermarkY?: number;
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
export type Page = 'welcome' | 'dashboard' | 'projects' | 'create' | 'editor' | 'export' | 'azkar' | 'quotes' | 'voice-studio' | 'settings';
export type AspectRatio = '9:16' | '16:9' | '1:1';
export type TransitionType = 'fadeScale' | 'slideUp' | 'slideRight' | 'zoomIn' | 'flip' | 'none';
export type VideoEffectType = 'none' | 'vignette' | 'glow' | 'vintage' | 'cinematic';
