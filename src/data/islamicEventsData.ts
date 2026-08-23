import { ColorGradingFilter } from '../types';

export interface IslamicEventItem {
  id: string;
  seasonId: 'friday' | 'ramadan' | 'arafah' | 'daily_times' | 'sacred_months';
  seasonName: string;
  seasonIcon: string;
  seasonBadge: string;
  title: string;
  subtitle: string;
  surahName: string;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  reciterName: string;
  reciterId: string;
  backgroundUrl: string;
  ambientSoundId?: string;
  colorGrading: ColorGradingFilter;
  hookText: string;
  customDua?: string;
  description: string;
}

export interface IslamicSeasonCategory {
  id: 'friday' | 'ramadan' | 'arafah' | 'daily_times' | 'sacred_months';
  name: string;
  icon: string;
  badge: string;
  description: string;
  gradient: string;
  borderColor: string;
  items: IslamicEventItem[];
}

export const ISLAMIC_SEASONS_DATA: IslamicSeasonCategory[] = [
  // ==================== 1. FRIDAY BLESSINGS (يوم الجمعة المباركة) ====================
  {
    id: 'friday',
    name: 'يوم الجمعة المباركة 🕌',
    icon: '🕌',
    badge: 'سيد الأيام',
    description: 'قوالب سورة الكهف، الصلاة على النبي ﷺ، وساعة الاستجابة',
    gradient: 'from-amber-950/40 via-surface-900 to-amber-950/20',
    borderColor: 'border-amber-500/40',
    items: [
      {
        id: 'fri_kahf_light',
        seasonId: 'friday',
        seasonName: 'يوم الجمعة المباركة',
        seasonIcon: '🕌',
        seasonBadge: 'نور بين الجمعتين ✨',
        title: 'سورة الكهف • أوائل السورة للحفظ من الفتن',
        subtitle: '«الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ»',
        surahName: 'الكهف',
        surahNumber: 18,
        fromAyah: 1,
        toAyah: 4,
        reciterName: 'مشاري راشد العفاسي',
        reciterId: 'mishary_alafasy',
        backgroundUrl:
          'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'gentle_rain',
        colorGrading: 'royalGold',
        hookText: '✨ نور بين الجمعتين.. لا تنس قراءة سورة الكهف 🌿',
        description: 'تلاوة خاشعة لأوائل سورة الكهف التي تعصم من فتنة الدجال.',
      },
      {
        id: 'fri_kahf_endings',
        seasonId: 'friday',
        seasonName: 'يوم الجمعة المباركة',
        seasonIcon: '🕌',
        seasonBadge: 'خواتيم الكهف 🕊️',
        title: 'سورة الكهف • خواتيم السورة المباركة',
        subtitle:
          '«إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ كَانَتْ لَهُمْ جَنَّاتُ الْفِرْدَوْسِ نُزُلًا»',
        surahName: 'الكهف',
        surahNumber: 18,
        fromAyah: 107,
        toAyah: 110,
        reciterName: 'عبد الباسط عبد الصمد',
        reciterId: 'abdulbaset_mujawwad',
        backgroundUrl:
          'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'pure_nature_wind',
        colorGrading: 'royalGold',
        hookText: '🕊️ خواتيم سورة الكهف.. جنات الفردوس نزلاً 🌿',
        description: 'تلاوة مهيبة ومؤثرة لخواتيم سورة الكهف تعطر يوم الجمعة.',
      },
      {
        id: 'fri_salawat_prophet',
        seasonId: 'friday',
        seasonName: 'يوم الجمعة المباركة',
        seasonIcon: '🕌',
        seasonBadge: 'الصلاة على النبي ﷺ',
        title: 'آية الصلاة على النبي ﷺ • سورة الأحزاب',
        subtitle: '«إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ»',
        surahName: 'الأحزاب',
        surahNumber: 33,
        fromAyah: 56,
        toAyah: 56,
        reciterName: 'سعد الغامدي',
        reciterId: 'saad_alghamdi',
        backgroundUrl:
          'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'gentle_rain',
        colorGrading: 'royalGold',
        hookText: '🌸 عطر فمك ويومك بالصلاة والسلام على رسول الله ﷺ 🤍',
        description: 'أعظم تذكير بالصلاة على الحبيب المصطفى ﷺ في يوم الجمعة.',
      },
    ],
  },

  // ==================== 2. RAMADAN & LAYLAT AL-QADR (شهر رمضان المبارك) ====================
  {
    id: 'ramadan',
    name: 'شهر رمضان والعشر الأواخر 🌙',
    icon: '🌙',
    badge: 'موسم القرآن',
    description: 'قوالب آيات الصيام، ليلة القدر، التراويح، وأدعية السحر والإفطار',
    gradient: 'from-purple-950/40 via-surface-900 to-indigo-950/20',
    borderColor: 'border-purple-500/40',
    items: [
      {
        id: 'ram_laylat_qadr',
        seasonId: 'ramadan',
        seasonName: 'شهر رمضان والعشر الأواخر',
        seasonIcon: '🌙',
        seasonBadge: 'ليلة القدر خير من ألف شهر ✨',
        title: 'سورة القدر كاملة • ليلة المغفرة والبركات',
        subtitle: '«إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ»',
        surahName: 'القدر',
        surahNumber: 97,
        fromAyah: 1,
        toAyah: 5,
        reciterName: 'مشاري راشد العفاسي',
        reciterId: 'mishary_alafasy',
        backgroundUrl:
          'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'night_crickets',
        colorGrading: 'andalusianTwilight',
        hookText: '🌌 ليلة القدر خير من ألف شهر.. تلاوة تأسر القلوب 🌙',
        description: 'سورة القدر كاملة بأجواء ليلية رمضانية خاشعة ومؤثرة.',
      },
      {
        id: 'ram_baqarah_fasting',
        seasonId: 'ramadan',
        seasonName: 'شهر رمضان والعشر الأواخر',
        seasonIcon: '🌙',
        seasonBadge: 'شهر القرآن 📖',
        title: 'آيات الصيام والقرآن • سورة البقرة',
        subtitle: '«شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ»',
        surahName: 'البقرة',
        surahNumber: 2,
        fromAyah: 185,
        toAyah: 186,
        reciterName: 'ماهر المعيقلي',
        reciterId: 'maher_almuaiqly',
        backgroundUrl:
          'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'gentle_rain',
        colorGrading: 'royalGold',
        hookText: '🌙 وإذا سألك عبادي عني فإني قريب.. دقيقة سكينة رمضانية 🤲',
        description: 'آيات الصيام وإجابة الدعاء في شهر رمضان المبارك.',
      },
      {
        id: 'ram_fajr_dua',
        seasonId: 'ramadan',
        seasonName: 'شهر رمضان والعشر الأواخر',
        seasonIcon: '🌙',
        seasonBadge: 'سحر واستغفار 🕊️',
        title: 'سورة آل عمران • وبالأسحار هم يستغفرون',
        subtitle:
          '«الصَّابِرِينَ وَالصَّادِقِينَ وَالْقَانِتِينَ وَالْمُنفِقِينَ وَالْمُسْتَغْفِرِينَ بِالْأَسْحَارِ»',
        surahName: 'آل عمران',
        surahNumber: 3,
        fromAyah: 16,
        toAyah: 17,
        reciterName: 'ياسر الدوسري',
        reciterId: 'yasser_aldosari',
        backgroundUrl:
          'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'birds_chirping',
        colorGrading: 'dawnMist',
        hookText: '🕊️ وقت السحر.. طوبى للمستغفرين بالأسحار في ليالي رمضان 🤍',
        description: 'تلاوة تناسب أوقات السحور والفجر في رمضان المبارك.',
      },
    ],
  },

  // ==================== 3. DHUL-HIJJAH & ARAFAH (عشر ذي الحجة ويوم عرفة) ====================
  {
    id: 'arafah',
    name: 'عشر ذي الحجة ويوم عرفة 🕋',
    icon: '🕋',
    badge: 'أعظم أيام الدنيا',
    description: 'قوالب سورة الفجر، دعاء يوم عرفة، التكبير، والتلبية',
    gradient: 'from-amber-950/40 via-surface-900 to-emerald-950/20',
    borderColor: 'border-emerald-500/40',
    items: [
      {
        id: 'ara_fajr_ten_nights',
        seasonId: 'arafah',
        seasonName: 'عشر ذي الحجة ويوم عرفة',
        seasonIcon: '🕋',
        seasonBadge: 'وليال عشر 👑',
        title: 'سورة الفجر • قَسَم الله بالعشر الأوائل',
        subtitle: '«وَالْفَجْرِ ۝ وَلَيَالٍ عَشْرٍ»',
        surahName: 'الفجر',
        surahNumber: 89,
        fromAyah: 1,
        toAyah: 6,
        reciterName: 'مشاري راشد العفاسي',
        reciterId: 'mishary_alafasy',
        backgroundUrl:
          'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'pure_nature_wind',
        colorGrading: 'royalGold',
        hookText: '🕋 والفجر وليال عشر.. أقبلت أعظم أيام الدنيا 🌿',
        description: 'سورة الفجر بأجواء مهيبة تناسب استقبال عشر ذي الحجة المباركة.',
      },
      {
        id: 'ara_hajj_call',
        seasonId: 'arafah',
        seasonName: 'عشر ذي الحجة ويوم عرفة',
        seasonIcon: '🕋',
        seasonBadge: 'نداء الحج 🕊️',
        title: 'سورة الحج • وأذن في الناس بالحج',
        subtitle: '«وَأَذِّن فِي النَّاسِ بِالْحَجِّ يَأْتُوكَ رِجَالًا»',
        surahName: 'الحج',
        surahNumber: 22,
        fromAyah: 27,
        toAyah: 28,
        reciterName: 'عبد الباسط عبد الصمد',
        reciterId: 'abdulbaset_mujawwad',
        backgroundUrl:
          'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'pure_nature_wind',
        colorGrading: 'royalGold',
        hookText: '🕋 لبيك اللهم لبيك.. نداء الحج الخالد يتردد في الآفاق 🕊️',
        description: 'تلاوة مجودة خاشعة لآيات الحج ومناسك البيت الحرام.',
      },
    ],
  },

  // ==================== 4. DAILY TIME-ADAPTIVE (المواقيت اليومية: صباح، مساء، ليل) ====================
  {
    id: 'daily_times',
    name: 'المواقيت اليومية (صباح • مساء • ليل) ☀️🌙',
    icon: '☀️',
    badge: 'يتكيف مع وقتك',
    description: 'قوالب تتغير تلقائياً بحسب ساعة اليوم الحالية',
    gradient: 'from-sky-950/40 via-surface-900 to-indigo-950/20',
    borderColor: 'border-sky-500/40',
    items: [
      {
        id: 'dt_morning_duha',
        seasonId: 'daily_times',
        seasonName: 'المواقيت اليومية',
        seasonIcon: '☀️',
        seasonBadge: 'صباح الأمل والتفاؤل ☀️',
        title: 'سورة الضحى والشرح • بداية يوم مفعمة بالانشراح',
        subtitle: '«وَالضُّحَىٰ ۝ وَاللَّيْلِ إِذَا سَجَىٰ»',
        surahName: 'الضحى',
        surahNumber: 93,
        fromAyah: 1,
        toAyah: 8,
        reciterName: 'مشاري راشد العفاسي',
        reciterId: 'mishary_alafasy',
        backgroundUrl:
          'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'birds_chirping',
        colorGrading: 'dawnMist',
        hookText: '☀️ ما ودعك ربك وما قلى.. صباح الخير واليقين بالله 🌸',
        description: 'تلاوة صباحية تشرح الصدر وتملأ الروح تفاؤلاً وسكينة.',
      },
      {
        id: 'dt_evening_peace',
        seasonId: 'daily_times',
        seasonName: 'المواقيت اليومية',
        seasonIcon: '🌇',
        seasonBadge: 'سكينة المساء 🌇',
        title: 'سورة الروم • فسبحان الله حين تمسون وحين تصبحون',
        subtitle: '«فَسُبْحَانَ اللَّهِ حِينَ تُمْسُونَ وَحِينَ تُصْبِحُونَ»',
        surahName: 'الروم',
        surahNumber: 30,
        fromAyah: 17,
        toAyah: 19,
        reciterName: 'سعد الغامدي',
        reciterId: 'saad_alghamdi',
        backgroundUrl:
          'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'ocean_waves',
        colorGrading: 'royalGold',
        hookText: '🌇 أمسينا وأمسى الملك لله.. دقيقة راحة لبالك بعد يوم طويل 🌿',
        description: 'تلاوة مسائية هادئة تطمئن القلب بعد عناء اليوم.',
      },
      {
        id: 'dt_night_mulk',
        seasonId: 'daily_times',
        seasonName: 'المواقيت اليومية',
        seasonIcon: '🌙',
        seasonBadge: 'سورة الملك قبل النوم 🛡️',
        title: 'سورة الملك • المنجية من عذاب القبر',
        subtitle: '«تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ»',
        surahName: 'الملك',
        surahNumber: 67,
        fromAyah: 1,
        toAyah: 5,
        reciterName: 'مشاري راشد العفاسي',
        reciterId: 'mishary_alafasy',
        backgroundUrl:
          'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
        ambientSoundId: 'night_crickets',
        colorGrading: 'andalusianTwilight',
        hookText: '🌙 حصّن نفسك بسورة الملك قبل النوم.. المنجية والشفيعة 🤍',
        description: 'سورة الملك قبل النوم لحفظ النفس وسكينة الليل.',
      },
    ],
  },
];

/**
 * Detect Current Live Occasion based on today's date & time
 */
export function getCurrentLiveOccasion(): {
  season: IslamicSeasonCategory;
  recommendedItem: IslamicEventItem;
  badgeLabel: string;
  reason: string;
} {
  const now = new Date();
  const day = now.getDay(); // 0: Sunday, 5: Friday
  const hour = now.getHours();

  // 1. Friday Check (Friday from Thursday evening to Friday night)
  if (day === 5 || (day === 4 && hour >= 18)) {
    const fridaySeason = ISLAMIC_SEASONS_DATA.find((s) => s.id === 'friday')!;
    return {
      season: fridaySeason,
      recommendedItem: fridaySeason.items[0], // Surah Al-Kahf
      badgeLabel: 'الموسم الحالي: يوم الجمعة المباركة 🕌',
      reason: 'سورة الكهف ونور ما بين الجمعتين',
    };
  }

  // 2. Time of Day (Morning, Evening, Night)
  const dailySeason = ISLAMIC_SEASONS_DATA.find((s) => s.id === 'daily_times')!;
  if (hour >= 5 && hour < 12) {
    return {
      season: dailySeason,
      recommendedItem: dailySeason.items[0], // Morning Ad-Duha
      badgeLabel: 'توقيت الصباح المبارك ☀️',
      reason: 'سورة الضحى وتفاؤل بداية اليوم',
    };
  }

  if (hour >= 12 && hour < 19) {
    return {
      season: dailySeason,
      recommendedItem: dailySeason.items[1], // Evening Ar-Rum
      badgeLabel: 'توقيت المساء والسكينة 🌇',
      reason: 'أذكار المساء وراحة البال',
    };
  }

  // Night / Sleep Time
  return {
    season: dailySeason,
    recommendedItem: dailySeason.items[2], // Surah Al-Mulk
    badgeLabel: 'سكون الليل وقبل النوم 🌙',
    reason: 'سورة الملك المنجية من عذاب القبر',
  };
}
