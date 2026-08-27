import { Project, ColorGradingFilter } from '../types';

export interface AtharInspirationItem {
  id: string;
  title: string;
  surahName: string;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  reciterName: string;
  reciterId: string;
  theme: string;
  spiritualMeaning: string;
  backgroundUrl: string;
  colorGrading: ColorGradingFilter;
  ambientSoundId: string;
}

export const ATHAR_INSPIRING_VERSES: AtharInspirationItem[] = [
  {
    id: 'athar-1',
    title: 'طمأنينة القلوب وسكون الروح',
    surahName: 'الرعد',
    surahNumber: 13,
    fromAyah: 28,
    toAyah: 28,
    reciterName: 'ياسر الدوسري 🎙️',
    reciterId: 'dossari_128',
    theme: 'السكينة والراحة',
    spiritualMeaning:
      '﴿الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾',
    backgroundUrl:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=85',
    colorGrading: 'meccaGold',
    ambientSoundId: 'gentle_rain',
  },
  {
    id: 'athar-2',
    title: 'قرب الله وإجابة الدعاء',
    surahName: 'البقرة',
    surahNumber: 2,
    fromAyah: 186,
    toAyah: 186,
    reciterName: 'إسلام صبحي 🎙️',
    reciterId: 'islam_sobhi',
    theme: 'الدعاء والرجاء',
    spiritualMeaning:
      '﴿وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ﴾',
    backgroundUrl:
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'fajrBlue',
    ambientSoundId: 'ocean_waves',
  },
  {
    id: 'athar-3',
    title: 'بشارة الفرج وتيسير العسر',
    surahName: 'الشرح',
    surahNumber: 94,
    fromAyah: 5,
    toAyah: 8,
    reciterName: 'شريف مصطفى 🎙️',
    reciterId: 'sherif_mossad',
    theme: 'الأمل والفرج',
    spiritualMeaning: '﴿فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾',
    backgroundUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=85',
    colorGrading: 'sunsetWarmth',
    ambientSoundId: 'gentle_rain',
  },
  {
    id: 'athar-4',
    title: 'سعة رحمة الله ومغفرة الذنوب',
    surahName: 'الزمر',
    surahNumber: 39,
    fromAyah: 53,
    toAyah: 54,
    reciterName: 'مشاري العفاسي 🎙️',
    reciterId: 'alafasy_128',
    theme: 'التوبة والرحمة',
    spiritualMeaning:
      '﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ﴾',
    backgroundUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1080&q=85',
    colorGrading: 'celestialGlow',
    ambientSoundId: 'night_silence',
  },
  {
    id: 'athar-5',
    title: 'حفظ الله ومعيته للمتقين',
    surahName: 'الطلاق',
    surahNumber: 65,
    fromAyah: 2,
    toAyah: 3,
    reciterName: 'عبد الرحمن السديس 🎙️',
    reciterId: 'sudais_128',
    theme: 'التوكل والرزق',
    spiritualMeaning:
      '﴿وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ﴾',
    backgroundUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=85',
    colorGrading: 'meccaGold',
    ambientSoundId: 'gentle_rain',
  },
  {
    id: 'athar-6',
    title: 'سورة الملك المنجية من عذاب القبر',
    surahName: 'الملك',
    surahNumber: 67,
    fromAyah: 1,
    toAyah: 4,
    reciterName: 'رعد الكردي 🎙️',
    reciterId: 'kurd_128',
    theme: 'تلاوة النوم والنجاة',
    spiritualMeaning: '﴿تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ﴾',
    backgroundUrl:
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1080&q=85',
    colorGrading: 'rawdahGreen',
    ambientSoundId: 'night_silence',
  },
  {
    id: 'athar-7',
    title: 'آية الكرسي سيدة آي القرآن',
    surahName: 'البقرة',
    surahNumber: 2,
    fromAyah: 255,
    toAyah: 255,
    reciterName: 'ماهر المعيقلي 🎙️',
    reciterId: 'muaiqly_128',
    theme: 'الحفظ والتحصين',
    spiritualMeaning:
      '﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ﴾',
    backgroundUrl:
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1080&q=85',
    colorGrading: 'meccaGold',
    ambientSoundId: 'gentle_rain',
  },
];

export const ATHAR_HADITHS = [
  {
    hadith: '«إِنَّا نَحْنُ نُحْيِي الْمَوْتَىٰ وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ»',
    source: 'سورة يس: 12',
    explanation: 'كل منشور قرآني تصنعه هو أثر مكتوب وحسنات جارية في صحيفتك إلى يوم القيامة.',
  },
  {
    hadith: '«الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ»',
    source: 'صحيح مسلم',
    explanation:
      'لك مثل أجر كل إنسان يستمع إلى هذه التلاوة أو يتأثر بها دون أن ينقص من أجورهم شيء.',
  },
  {
    hadith:
      '«إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ: صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ»',
    source: 'صحيح مسلم',
    explanation: 'اجعل من منشوراتك علماً نافعاً وصدقة جارية تؤنسك في قبرك.',
  },
  {
    hadith: '«بَلِّغُوا عَنِّي وَلَوْ آيَةً»',
    source: 'صحيح البخاري',
    explanation: 'آية واحدة تنشرها اليوم قد تغير حياة إنسان وتكون سبباً في هدايته.',
  },
  {
    hadith: '«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»',
    source: 'صحيح البخاري',
    explanation: 'أعظم شرف أن تكون ناشراً لكتاب الله وخادماً لآياته بين الناس.',
  },
];

/**
 * Builds an instant ready-to-export Project for the Athar Challenge
 */
export function buildAtharReelProject(item?: AtharInspirationItem): Project {
  const chosen =
    item || ATHAR_INSPIRING_VERSES[Math.floor(Math.random() * ATHAR_INSPIRING_VERSES.length)];

  return {
    id: `athar-reel-${Date.now()}`,
    name: `أثر جاري • ${chosen.title} ﴿${chosen.surahName}﴾`,
    reciter: chosen.reciterName,
    reciterId: chosen.reciterId,
    surah: chosen.surahName,
    surahNumber: chosen.surahNumber,
    fromAyah: chosen.fromAyah,
    toAyah: chosen.toAyah,
    aspectRatio: '9:16',
    backgroundType: 'image',
    backgroundUrl: chosen.backgroundUrl,
    backgroundOpacity: 0.85,
    watermark: 'atar-studio.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'editing',
    exportCount: 0,
    translationEnabled: false,
    tafsirEnabled: false,
    audioSettings: {
      recitationVolume: 88,
      fadeIn: true,
      fadeOut: true,
      fadeDuration: 1.5,
      backgroundVolume: 25,
      ambientSoundId: chosen.ambientSoundId,
      ambientSoundVolume: 26,
      reverbPreset: 'makkahHaram',
      reverbLevel: 35,
      enableStudioClarity: true,
      enableVoiceWarmth: true,
      enableNoiseGate: true,
      enablePitchPolish: true,
      pitchPolishLevel: 50,
    },
    textSettings: {
      fontSize: 26,
      fontWeight: 'bold',
      textAlign: 'center',
      textColor: '#ffffff',
      bgColor: '#000000',
      bgOpacity: 0.45,
      position: 'center',
      translationFontSize: 13,
      translationColor: '#e2e8f0',
      translationLanguage: 'en',
      fontFamily: 'Amiri',
      displayMode: 'chunked',
      wordHighlightEnabled: true,
      wordHighlightStyle: 'goldGlow',
      wordHighlightColor: '#fbbf24',
      showWaveform: true,
      waveformStyle: 'bars',
      waveformColor: '#fbbf24',
      showProgressBar: true,
      progressBarStyle: 'neonGlow',
      progressBarColor: '#fbbf24',
      showIslamicOrnaments: true,
      ornamentStyle: 'royalFrame',
      ornamentColor: '#fbbf24',
      ornamentOpacity: 0.85,
      colorGrading: chosen.colorGrading,
      cameraMotion: 'slowZoom',
      showWatermark: true,
      watermarkPosition: 'bottom',
      watermarkOpacity: 0.6,
      watermarkFontSize: 11,
    },
  };
}
