export interface CuratedQuoteItem {
  id: string;
  category: 'quran_peace' | 'hadith' | 'dua' | 'dhikr';
  categoryNameAr: string;
  title: string;
  text: string;
  reference: string;
  icon: string;
  badge: string;
  suggestedFont?: string;
  suggestedBgUrl?: string;
}

export const CURATED_QUOTES: CuratedQuoteItem[] = [
  // ==================== 1. QURANIC RELIEF & PEACE (آيات السكينة والفرج) ====================
  {
    id: 'q_sharh',
    category: 'quran_peace',
    categoryNameAr: 'آيات السكينة والفرج',
    title: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ فَإِذَا فَرَغْتَ فَانصَبْ ۝ وَإِلَىٰ رَبِّكَ فَارْغَب',
    reference: 'سورة الشرح • الآيات (5 - 8)',
    icon: '☀️',
    badge: 'فرج وتيسير',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'q_talaq',
    category: 'quran_peace',
    categoryNameAr: 'آيات السكينة والفرج',
    title: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    text: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ۝ وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    reference: 'سورة الطلاق • الآيات (2 - 3)',
    icon: '🌿',
    badge: 'رزق وتوكل',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'q_rad',
    category: 'quran_peace',
    categoryNameAr: 'آيات السكينة والفرج',
    title: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    text: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    reference: 'سورة الرعد • الآية 28',
    icon: '🤍',
    badge: 'طمأنينة القلب',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'q_duha',
    category: 'quran_peace',
    categoryNameAr: 'آيات السكينة والفرج',
    title: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ',
    text: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ ۝ وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ ۝ وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ',
    reference: 'سورة الضحى • الآيات (3 - 5)',
    icon: '🕊️',
    badge: 'عطاء ورضى',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'q_baqarah_kursi',
    category: 'quran_peace',
    categoryNameAr: 'آيات السكينة والفرج',
    title: 'آيَةُ الْكُرْسِيِّ الْعَظِيمَةُ',
    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ',
    reference: 'سورة البقرة • الآية 255',
    icon: '👑',
    badge: 'أعظم آية',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },

  // ==================== 2. AUTHENTIC HADITHS (أحاديث نبوية شريفة) ====================
  {
    id: 'h_niyyah',
    category: 'hadith',
    categoryNameAr: 'أحاديث نبوية صحيحة',
    title: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
    text: 'قَالَ رَسُولُ اللَّهِ ﷺ : « إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى ، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ » .',
    reference: 'صحيح البخاري ومسلم',
    icon: '📜',
    badge: 'إخلاص النية',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'h_ajaban',
    category: 'hadith',
    categoryNameAr: 'أحاديث نبوية صحيحة',
    title: 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ',
    text: 'قَالَ رَسُولُ اللَّهِ ﷺ : « عَجَبًا لِأَمْرِ الْمُؤْمِنِ ، إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ ، وَلَيْسَ ذَاكَ لِأَحَدٍ إِلَّا لِلْمُؤْمِنِ ، إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ ، وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ » .',
    reference: 'صحيح مسلم',
    icon: '✨',
    badge: 'شكر وصبر',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'h_taqwa',
    category: 'hadith',
    categoryNameAr: 'أحاديث نبوية صحيحة',
    title: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ',
    text: 'قَالَ رَسُولُ اللَّهِ ﷺ : « اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا ، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ » .',
    reference: 'سنن الترمذي • حديث حسن صحيح',
    icon: '🤝',
    badge: 'حسن الخلق',
    suggestedFont: 'Cairo',
    suggestedBgUrl:
      'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'h_ihfaz',
    category: 'hadith',
    categoryNameAr: 'أحاديث نبوية صحيحة',
    title: 'احْفَظِ اللَّهَ يَحْفَظْكَ',
    text: 'قَالَ رَسُولُ اللَّهِ ﷺ : « يَا غُلَامُ إِنِّي أُعَلِّمُكَ كَلِمَاتٍ : احْفَظِ اللَّهَ يَحْفَظْكَ ، احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ ، إِذَا سَأَلْتَ فَاسْأَلِ اللَّهَ ، وَإِذَا اسْتَعَنْتَ فَاسْتَعِنْ بِاللَّهِ » .',
    reference: 'سنن الترمذي • صحيح',
    icon: '🛡️',
    badge: 'حفظ وتوكل',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },

  // ==================== 3. DUA (أدعية جامعة مأثورة) ====================
  {
    id: 'd_huda',
    category: 'dua',
    categoryNameAr: 'أدعية مأثورة جامعة',
    title: 'دُعَاءُ الْهُدَى وَالتُّقَى وَالْعَفَافِ',
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى ، وَالتُّقَى ، وَالْعَفَافَ ، وَالْغِنَى',
    reference: 'صحيح مسلم • دعاء نبوي جامع',
    icon: '🤲',
    badge: 'جوامع الكلم',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'd_hayy',
    category: 'dua',
    categoryNameAr: 'أدعية مأثورة جامعة',
    title: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    text: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ ، أَصْلِحْ لِي شَأْنِي كُلَّهُ ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
    reference: 'سنن النسائي • حديث حسن',
    icon: '🌿',
    badge: 'استغاثة وتفويض',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'd_qulub',
    category: 'dua',
    categoryNameAr: 'أدعية مأثورة جامعة',
    title: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي',
    text: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ ، اللَّهُمَّ مُصَرِّفَ الْقُلُوبِ صَرِّفْ قُلُوبَنَا عَلَى طَاعَتِكَ',
    reference: 'سنن الترمذي وصحيح مسلم',
    icon: '🤍',
    badge: 'ثبات القلب',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },

  // ==================== 4. DHIKR (أذكار الصباح والمساء والتحصين) ====================
  {
    id: 'k_hasbi',
    category: 'dhikr',
    categoryNameAr: 'أذكار وتحصين',
    title: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ',
    text: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ ۖ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    reference: 'سورة التوبة • كفاه الله ما أهمه (سبع مرات)',
    icon: '🛡️',
    badge: 'كفاية وتحصين',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
  {
    id: 'k_sayyid',
    category: 'dhikr',
    categoryNameAr: 'أذكار وتحصين',
    title: 'سَيِّدُ الاِسْتِغْفَارِ',
    text: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ ، خَلَقْتَنِي وَأَنَا عَبْدُكَ ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    reference: 'صحيح البخاري • سيد الاستغفار',
    icon: '👑',
    badge: 'مغفرة الذنوب',
    suggestedFont: 'Amiri',
    suggestedBgUrl:
      'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
  },
];
