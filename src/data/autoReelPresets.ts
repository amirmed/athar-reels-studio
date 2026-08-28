import { WordHighlightStyle, OrnamentStyle } from '../types';

export interface AutoReelTheme {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  color: string;
  contentType: 'quran' | 'hadith' | 'azkar';
  // Quran specific
  surahNumber?: number;
  surahName?: string;
  fromAyah?: number;
  toAyah?: number;
  reciterId?: string;
  reciterName?: string;
  // Custom text specific
  customText?: string;
  customTitle?: string;
  customReference?: string;
  customAudioUrl?: string;
  // Visual & Audio Styling
  backgroundUrl: string;
  backgroundOpacity: number;
  wordHighlightStyle: WordHighlightStyle;
  wordHighlightColor: string;
  progressBarColor: string;
  ornamentStyle: OrnamentStyle;
  ornamentColor: string;
  ambientSoundId: string;
  ambientSoundVolume: number;
  watermark: string;
}

export const autoReelThemes: AutoReelTheme[] = [
  // 1. آيات البحر والسكينة
  {
    id: 'theme_ocean',
    title: 'سكينة البحر والأمواج',
    subtitle: 'آيات السكينة مع أمواج المحيط وخرير الماء الهادئ',
    icon: '🌊',
    badge: 'الأكثر طلباً 🔥',
    color: '#38bdf8',
    contentType: 'quran',
    surahNumber: 24, // سورة النور (آية 40) أو سورة يونس
    surahName: 'سورة النور',
    fromAyah: 35,
    toAyah: 35,
    reciterId: 'alafasy_128',
    reciterName: 'مشاري العفاسي',
    backgroundUrl:
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.65,
    wordHighlightStyle: 'radiantWhite',
    wordHighlightColor: '#38bdf8',
    progressBarColor: '#38bdf8',
    ornamentStyle: 'floralCorners',
    ornamentColor: '#38bdf8',
    ambientSoundId: 'ocean_waves',
    ambientSoundVolume: 24,
    watermark: 'atar-studio.com',
  },

  // 2. آيات المطر والرحمة
  {
    id: 'theme_rain',
    title: 'الرحمة وقطرات المطر',
    subtitle: 'آيات الغيث والرحمة مع صوت المطر الواقعي الناعم',
    icon: '🌧️',
    badge: 'راحة نفسية 🌿',
    color: '#60a5fa',
    contentType: 'quran',
    surahNumber: 42, // سورة الشورى - آية الغيث
    surahName: 'سورة الشورى',
    fromAyah: 28,
    toAyah: 28,
    reciterId: 'alafasy_128',
    reciterName: 'مشاري العفاسي',
    backgroundUrl:
      'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.6,
    wordHighlightStyle: 'goldGlow',
    wordHighlightColor: '#fbbf24',
    progressBarColor: '#60a5fa',
    ornamentStyle: 'royalFrame',
    ornamentColor: '#60a5fa',
    ambientSoundId: 'gentle_rain',
    ambientSoundVolume: 26,
    watermark: 'atar-studio.com',
  },

  // 3. أذكار الصباح والنور
  {
    id: 'theme_morning',
    title: 'أذكار الصباح وشروق الأمل',
    subtitle: 'سيد الاستغفار وأذكار الصباح مع شروق ذهبي بين الجبال',
    icon: '🌅',
    badge: 'طاقة إيجابية ☀️',
    color: '#fbbf24',
    contentType: 'azkar',
    customTitle: 'سَيِّدُ الاسْتِغْفَارِ',
    customText:
      'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلَّا أَنْتَ ، خَلَقْتَنِي وَأَنَا عَبْدُكَ ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ .',
    customReference: 'صحيح البخاري (6306)',
    reciterId: 'hamed_neural',
    reciterName: 'الشيخ حامد (صوت وقور)',
    backgroundUrl:
      'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.65,
    wordHighlightStyle: 'goldGlow',
    wordHighlightColor: '#fbbf24',
    progressBarColor: '#fbbf24',
    ornamentStyle: 'royalFrame',
    ornamentColor: '#fbbf24',
    ambientSoundId: 'birds_forest',
    ambientSoundVolume: 22,
    watermark: 'atar-studio.com',
  },

  // 4. قيام الليل والنجوم والهلال
  {
    id: 'theme_night',
    title: 'قيام الليل والخشوع',
    subtitle: 'آية الكرسي وسماء الليل الصافية مع نجوم متلألئة',
    icon: '🌌',
    badge: 'خشوع عظيم 🌙',
    color: '#818cf8',
    contentType: 'quran',
    surahNumber: 2, // البقرة - آية الكرسي
    surahName: 'سورة البقرة',
    fromAyah: 255,
    toAyah: 255,
    reciterId: 'alafasy_128',
    reciterName: 'مشاري العفاسي',
    backgroundUrl:
      'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.6,
    wordHighlightStyle: 'goldGlow',
    wordHighlightColor: '#fbbf24',
    progressBarColor: '#818cf8',
    ornamentStyle: 'domeCrescent',
    ornamentColor: '#a5b4fc',
    ambientSoundId: 'night_crickets',
    ambientSoundVolume: 20,
    watermark: 'atar-studio.com',
  },

  // 5. الحرم المكي والدعاء المستجاب
  {
    id: 'theme_mecca',
    title: 'الكعبة المشرفة ودعاء الفرج',
    subtitle: 'دعاء ذي النون في بطن الحوت مع مشاهد الكعبة المشرفة',
    icon: '🕋',
    badge: 'دعاء مستجاب ✨',
    color: '#10b981',
    contentType: 'quran',
    surahNumber: 21, // الأنبياء (87)
    surahName: 'سورة الأنبياء',
    fromAyah: 87,
    toAyah: 87,
    reciterId: 'alafasy_128',
    reciterName: 'مشاري العفاسي',
    backgroundUrl:
      'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.65,
    wordHighlightStyle: 'emeraldGlow',
    wordHighlightColor: '#34d399',
    progressBarColor: '#10b981',
    ornamentStyle: 'geometricArabesque',
    ornamentColor: '#34d399',
    ambientSoundId: 'gentle_rain',
    ambientSoundVolume: 18,
    watermark: 'atar-studio.com',
  },

  // 6. الأحاديث النبوية الجامعة
  {
    id: 'theme_hadith',
    title: 'الأحاديث النبوية وحكمة المصطفى',
    subtitle: 'حديث إنما الأعمال بالنيات بصوت وقور وإطار ملكي ذهبي',
    icon: '👑',
    badge: 'حديث شريف 📜',
    color: '#f59e0b',
    contentType: 'hadith',
    customTitle: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
    customText:
      'قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ : « إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى ، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ » .',
    customReference: 'متفق عليه (البخاري ومسلم)',
    reciterId: 'hamed_neural',
    reciterName: 'الشيخ حامد (صوت وقور)',
    backgroundUrl:
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.65,
    wordHighlightStyle: 'goldGlow',
    wordHighlightColor: '#fbbf24',
    progressBarColor: '#fbbf24',
    ornamentStyle: 'royalFrame',
    ornamentColor: '#fbbf24',
    ambientSoundId: 'ocean_waves',
    ambientSoundVolume: 18,
    watermark: 'atar-studio.com',
  },

  // 7. طبيعة الأنهار والجبال
  {
    id: 'theme_nature',
    title: 'جنة الطبيعة والشلالات',
    subtitle: 'آيات خلق السماوات والأرض مع شلالات وأنهار عذبة',
    icon: '🌿',
    badge: 'طبيعة سينمائية 🏔️',
    color: '#059669',
    contentType: 'quran',
    surahNumber: 3, // آل عمران (190-191)
    surahName: 'سورة آل عمران',
    fromAyah: 190,
    toAyah: 190,
    reciterId: 'alafasy_128',
    reciterName: 'مشاري العفاسي',
    backgroundUrl:
      'https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.6,
    wordHighlightStyle: 'emeraldGlow',
    wordHighlightColor: '#10b981',
    progressBarColor: '#10b981',
    ornamentStyle: 'floralCorners',
    ornamentColor: '#34d399',
    ambientSoundId: 'ocean_waves',
    ambientSoundVolume: 25,
    watermark: 'atar-studio.com',
  },
];
