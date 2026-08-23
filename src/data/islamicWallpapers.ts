export interface IslamicWallpaper {
  id: string;
  title: string;
  category: 'mosque' | 'mecca' | 'night' | 'desert' | 'nature' | 'lanterns';
  categoryNameAr: string;
  url: string;
  photographer: string;
  tags: string[];
}

export const ISLAMIC_SEARCH_TAGS = [
  { tag: 'mosque', label: '🕌 مساجد (mosque)' },
  { tag: 'moon', label: '🌙 هلال (moon)' },
  { tag: 'islam', label: '✨ إسلامي (islam)' },
  { tag: 'kaaba', label: '🕋 كعبة (kaaba)' },
  { tag: 'medina', label: '🌴 المدينة (medina)' },
  { tag: 'rain', label: '🌧️ مطر (rain)' },
  { tag: 'desert', label: '🏜️ صحراء (desert)' },
  { tag: 'nature', label: '🌿 طبيعة (nature)' },
  { tag: 'stars', label: '🌌 نجوم (stars)' },
];

export const CURATED_ISLAMIC_WALLPAPERS: IslamicWallpaper[] = [
  // 1. المساجد والقباب
  {
    id: 'mosque_1',
    title: 'محراب وقباب الروضة النبوية',
    category: 'mosque',
    categoryNameAr: 'المساجد والقباب',
    url: 'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Pexels Collection',
    tags: ['مسجد', 'المدينة', 'قباب', 'محراب', 'نور', 'mosque', 'medina', 'islam', 'islamic'],
  },
  {
    id: 'mosque_2',
    title: 'أروقة جامع الشيخ زايد الفاخرة',
    category: 'mosque',
    categoryNameAr: 'المساجد والقباب',
    url: 'https://images.pexels.com/photos/2440024/pexels-photo-2440024.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Pexels Architecture',
    tags: ['مسجد', 'أعمدة', 'رخام', 'عمارة إسلامية', 'mosque', 'architecture', 'islam'],
  },
  {
    id: 'mosque_3',
    title: 'مآذن وقباب المسجد مع شروق الشمس',
    category: 'mosque',
    categoryNameAr: 'المساجد والقباب',
    url: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Pexels Heritage',
    tags: ['مآذن', 'شروق', 'قبة', 'مسجد', 'minarets', 'sunrise', 'mosque', 'islam'],
  },
  {
    id: 'mosque_4',
    title: 'أقواس أندلسية وزخارف مغربية عريقة',
    category: 'mosque',
    categoryNameAr: 'المساجد والقباب',
    url: 'https://images.pexels.com/photos/3374210/pexels-photo-3374210.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Pexels Travel',
    tags: ['أقواس', 'زخرفة', 'مغربي', 'أندلسي', 'arabesque', 'arch', 'islam', 'mosque'],
  },
  {
    id: 'mosque_5',
    title: 'ساحة المسجد في الغسق الدافئ',
    category: 'mosque',
    categoryNameAr: 'المساجد والقباب',
    url: 'https://images.pexels.com/photos/2440024/pexels-photo-2440024.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Pexels Moments',
    tags: ['مسجد', 'غروب', 'ساحة', 'mosque', 'courtyard', 'islam'],
  },

  // 2. مكة المكرمة والكعبة
  {
    id: 'mecca_1',
    title: 'الكعبة المشرفة وروحانية الحرم المكي',
    category: 'mecca',
    categoryNameAr: 'مكة والمشاعر المقدسة',
    url: 'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Islamic Archives',
    tags: ['مكة', 'كعبة', 'حرم', 'طواف', 'حج', 'عمرة', 'mecca', 'kaaba', 'islam', 'islamic'],
  },
  {
    id: 'mecca_2',
    title: 'أبراج وسماء مكة المكرمة فجراً',
    category: 'mecca',
    categoryNameAr: 'مكة والمشاعر المقدسة',
    url: 'https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Pexels Skyline',
    tags: ['مكة', 'فجر', 'سماء', 'mecca', 'dawn', 'kaaba', 'islam'],
  },

  // 3. السماء الليلية والنجوم والهلال
  {
    id: 'night_1',
    title: 'سماء ليلية صافية وملايين النجوم',
    category: 'night',
    categoryNameAr: 'الليل والنجوم والهلال',
    url: 'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Astronomy Pexels',
    tags: ['ليل', 'نجوم', 'مجرة', 'سماء', 'stars', 'night', 'galaxy', 'moon'],
  },
  {
    id: 'night_2',
    title: 'هلال مشع وسحب ليلية زرقاء داكنة',
    category: 'night',
    categoryNameAr: 'الليل والنجوم والهلال',
    url: 'https://images.pexels.com/photos/956981/pexels-photo-956981.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Night Sky Studio',
    tags: ['هلال', 'قمر', 'سماء', 'crescent', 'moon', 'night', 'islam'],
  },
  {
    id: 'night_3',
    title: 'أضواء الشفق والسكينة الليلية',
    category: 'night',
    categoryNameAr: 'الليل والنجوم والهلال',
    url: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Aurora Dreams',
    tags: ['شفق', 'نور', 'ليل', 'aurora', 'deep blue', 'stars', 'night'],
  },

  // 4. الصحراء والكثبان الذهبية
  {
    id: 'desert_1',
    title: 'كثبان رملية ذهبية عند الغروب',
    category: 'desert',
    categoryNameAr: 'الصحراء والغروب',
    url: 'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Desert Essence',
    tags: ['صحراء', 'رمل', 'غروب', 'شمس', 'desert', 'dunes', 'sunset', 'nature'],
  },
  {
    id: 'desert_2',
    title: 'أشجار النخيل وأفق السماء الذهبي',
    category: 'desert',
    categoryNameAr: 'الصحراء والغروب',
    url: 'https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Oasis Vision',
    tags: ['نخيل', 'واحة', 'غروب', 'palms', 'oasis', 'desert', 'nature'],
  },
  {
    id: 'desert_3',
    title: 'تموجات رمال الصحراء الصامتة',
    category: 'desert',
    categoryNameAr: 'الصحراء والغروب',
    url: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Desert Minimal',
    tags: ['رمال', 'تموج', 'هدوء', 'sand', 'ripples', 'desert'],
  },

  // 5. سكينة الطبيعة والأمطار
  {
    id: 'nature_1',
    title: 'أمطار هادئة تتساقط على نافذة زجاجية',
    category: 'nature',
    categoryNameAr: 'سكينة الطبيعة والأمطار',
    url: 'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Rain Drops',
    tags: ['مطر', 'قطرات', 'نافذة', 'هدوء', 'rain', 'droplets', 'nature'],
  },
  {
    id: 'nature_2',
    title: 'شلالات مياه عذبة بين الجبال الخضراء',
    category: 'nature',
    categoryNameAr: 'سكينة الطبيعة والأمطار',
    url: 'https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Water Cascade',
    tags: ['شلال', 'نهر', 'جبال', 'طبيعة', 'waterfall', 'stream', 'nature'],
  },
  {
    id: 'nature_3',
    title: 'ضباب الصباح بين أشجار الغابة ونور الشمس',
    category: 'nature',
    categoryNameAr: 'سكينة الطبيعة والأمطار',
    url: 'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Forest Light',
    tags: ['ضباب', 'أشجار', 'شروق', 'نور', 'mist', 'forest', 'nature'],
  },
  {
    id: 'nature_4',
    title: 'أمواج بحر هادئة عند المغيب الأرجواني',
    category: 'nature',
    categoryNameAr: 'سكينة الطبيعة والأمطار',
    url: 'https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Ocean Serenity',
    tags: ['بحر', 'أمواج', 'غروب', 'ocean', 'waves', 'nature'],
  },

  // 6. الفوانيس والزخارف الإسلامية
  {
    id: 'lanterns_1',
    title: 'فانوس إسلامي نحاسي متوهج بالدفء',
    category: 'lanterns',
    categoryNameAr: 'الفوانيس والزخارف',
    url: 'https://images.pexels.com/photos/3374210/pexels-photo-3374210.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Islamic Decor',
    tags: ['فانوس', 'نور', 'رمضان', 'زخرفة', 'lantern', 'light', 'islam'],
  },
  {
    id: 'lanterns_2',
    title: 'مصحف شريف مع مسبحة على خشب عتيق',
    category: 'lanterns',
    categoryNameAr: 'الفوانيس والزخارف',
    url: 'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
    photographer: 'Quran & Beads',
    tags: ['مصحف', 'قرآن', 'مسبحة', 'ذكر', 'quran', 'tasbih', 'islam'],
  },
];
