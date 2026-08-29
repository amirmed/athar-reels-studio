import { ExportAudioSettings } from '../src/services/audioDspFilters';
type ExportWord = {
    id?: number;
    position?: number;
    text: string;
    startTime: number;
    endTime: number;
    translation?: string;
};
type ExportChunk = {
    id?: string;
    words: ExportWord[];
    startTime?: number;
    endTime?: number;
};
type ExportAyah = {
    text: string;
    startTime: number;
    endTime: number;
    numberInSurah?: number;
    translationText?: string;
    tafsirText?: string;
    words?: ExportWord[];
    chunks?: ExportChunk[];
};
type ExportTextSettings = {
    fontSize?: number;
    fontWeight?: string;
    textAlign?: string;
    textColor?: string;
    bgColor?: string;
    bgOpacity?: number;
    position?: string;
    fontFamily?: string;
    translationFontSize?: number;
    translationColor?: string;
    wordHighlightEnabled?: boolean;
    wordHighlightColor?: string;
    displayMode?: 'full' | 'chunked';
    wordsPerChunk?: number;
    sceneBackgrounds?: Record<number, string>;
    enableMultiScene?: boolean;
};
export interface ExportOptions {
    outputPath: string;
    backgroundPath?: string;
    audioUrls?: string[];
    ayahs: ExportAyah[];
    aspectRatio: '9:16' | '16:9' | '1:1';
    quality: 'standard' | 'high' | 'premium';
    watermark?: string;
    textColor?: string;
    bgOpacity?: number;
    fontFamily?: string;
    totalDuration?: number;
    transition?: string;
    videoEffect?: string;
    textSettings?: ExportTextSettings;
    audioSettings?: ExportAudioSettings;
    showTranslation?: boolean;
    showTafsir?: boolean;
    surahName?: string;
}
export declare function setupExportHandlers(tempDir: string): void;
export {};
