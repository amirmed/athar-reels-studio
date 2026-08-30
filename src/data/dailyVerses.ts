/**
 * Inspiring Quranic Daily Verses for Athar Studio Dashboard
 * One curated verse for each day of the week
 */

export interface DailyVerse {
  day: number;
  surahName: string;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  text: string;
  theme: string;
  reciter: string;
  reciterId: string;
}

export const DAILY_VERSES: DailyVerse[] = [
  {
    day: 0, // Sunday
    surahName: 'الشرح',
    surahNumber: 94,
    fromAyah: 5,
    toAyah: 6,
    text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    theme: 'الفرج والسكينة وتفريج الهموم',
    reciter: 'ياسر الدوسري',
    reciterId: 'yasser_128',
  },
  {
    day: 1, // Monday
    surahName: 'الضحى',
    surahNumber: 93,
    fromAyah: 5,
    toAyah: 5,
    text: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ',
    theme: 'العطاء والبشرى وجبر الخواطر',
    reciter: 'مشاري العفاسي',
    reciterId: 'alafasy_128',
  },
  {
    day: 2, // Tuesday
    surahName: 'الطلاق',
    surahNumber: 65,
    fromAyah: 2,
    toAyah: 3,
    text: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
    theme: 'التقوى وسعة الرزق والتوكل',
    reciter: 'عبد الرحمن العوسي',
    reciterId: 'abdulrahman_aloosi_128',
  },
  {
    day: 3, // Wednesday
    surahName: 'إبراهيم',
    surahNumber: 14,
    fromAyah: 7,
    toAyah: 7,
    text: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    theme: 'بركة الشكر وزيادة النعم',
    reciter: 'ماهر المعيقلي',
    reciterId: 'maher_128',
  },
  {
    day: 4, // Thursday
    surahName: 'البقرة',
    surahNumber: 2,
    fromAyah: 186,
    toAyah: 186,
    text: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
    theme: 'قرب الله واستجابة الدعاء',
    reciter: 'عبد الباسط عبد الصمد',
    reciterId: 'abdulbasit_murat_192',
  },
  {
    day: 5, // Friday
    surahName: 'الكهف',
    surahNumber: 18,
    fromAyah: 10,
    toAyah: 10,
    text: 'رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا',
    theme: 'نور الجمعة وطلب الرشد والرحمة',
    reciter: 'سعود الشريم',
    reciterId: 'shuraim_128',
  },
  {
    day: 6, // Saturday
    surahName: 'الزمر',
    surahNumber: 39,
    fromAyah: 53,
    toAyah: 53,
    text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    theme: 'سعة مغفرة الله والرجاء',
    reciter: 'ياسر الدوسري',
    reciterId: 'yasser_128',
  },
];

export function getTodayDailyVerse(date: Date = new Date()): DailyVerse {
  const dayIndex = date.getDay() % 7;
  return DAILY_VERSES[dayIndex] || DAILY_VERSES[0];
}
