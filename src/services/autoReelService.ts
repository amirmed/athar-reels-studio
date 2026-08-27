import { Project } from '../types';
import { autoReelThemes, AutoReelTheme } from '../data/autoReelPresets';
import { createDefaultProject } from '../utils/projectDefaults';

/**
 * Builds a ready-to-render Project instance from a selected AutoReelTheme
 */
export function buildProjectFromTheme(theme: AutoReelTheme): Project {
  const isHadithOrAzkar = theme.contentType === 'hadith' || theme.contentType === 'azkar';

  return createDefaultProject({
    name: `${theme.title} — ريل تلقائي AI`,
    contentType: theme.contentType,
    // Quran fields
    surah: theme.surahName || 'سورة النور',
    surahNumber: theme.surahNumber || 24,
    fromAyah: theme.fromAyah || 35,
    toAyah: theme.toAyah || 35,
    reciter: isHadithOrAzkar ? 'الشيخ حامد (صوت وقور)' : theme.reciterName || 'مشاري العفاسي',
    reciterId: isHadithOrAzkar ? 'hamed_neural' : theme.reciterId || 'alafasy_128',
    // Custom text fields (if hadith or azkar)
    customText: theme.customText,
    customTitle: theme.customTitle,
    customReference: theme.customReference,
    customAudioUrl: theme.customAudioUrl,
    // Visual settings
    aspectRatio: '9:16',
    backgroundType: 'image',
    backgroundUrl: theme.backgroundUrl,
    backgroundOpacity: theme.backgroundOpacity,
    watermark: theme.watermark,
    textSettings: {
      fontSize: isHadithOrAzkar ? 27 : 32,
      fontWeight: 'bold',
      textAlign: 'center',
      textColor: '#ffffff',
      bgColor: '#000000',
      bgOpacity: 0.55,
      position: 'center',
      fontFamily: 'Amiri',
      wordHighlightEnabled: true,
      wordHighlightStyle: theme.wordHighlightStyle,
      wordHighlightColor: theme.wordHighlightColor,
      inactiveWordOpacity: 0.55,
      highlightScale: true,
      showProgressBar: true,
      progressBarStyle: 'neonGlow',
      progressBarColor: theme.progressBarColor,
      progressBarHeight: 4,
      showIslamicOrnaments: true,
      ornamentStyle: theme.ornamentStyle,
      ornamentColor: theme.ornamentColor,
      ornamentOpacity: 0.85,
      translationFontSize: 14,
      translationColor: '#e2e8f0',
    },
    audioSettings: {
      recitationVolume: 85,
      fadeIn: true,
      fadeOut: true,
      fadeDuration: 2,
      backgroundVolume: 22,
      ambientSoundId: theme.ambientSoundId,
      ambientSoundVolume: theme.ambientSoundVolume,
    },
  });
}

/**
 * Returns a randomly generated viral AI Reel project
 */
export function generateRandomViralAutoReel(): Project {
  const randomIndex = Math.floor(Math.random() * autoReelThemes.length);
  const selectedTheme = autoReelThemes[randomIndex];
  return buildProjectFromTheme(selectedTheme);
}
