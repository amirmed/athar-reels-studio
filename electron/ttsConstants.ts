/**
 * Shared TTS configuration and validation constraints
 * Single Source of Truth used by both Vite dev proxy server and Electron desktop main process.
 */
export const ALLOWED_TTS_VOICES = new Set([
  'ar-SA-HamedNeural',
  'ar-SA-ZariyahNeural',
  'ar-EG-ShakirNeural',
  'ar-EG-SalmaNeural',
  'ar-MA-MounaNeural',
  'ar-AE-HamdanNeural',
]);

export const MAX_TTS_TEXT_LENGTH = 1500;
