export interface IslamicVideo {
  id: string;
  title: string;
  category: 'mecca' | 'mosque' | 'rain' | 'night' | 'ocean' | 'nature' | 'desert' | 'lanterns';
  categoryNameAr: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  quality: '4K' | '1080p' | '720p';
  orientation: 'portrait' | 'landscape';
  tags: string[];
}

export const ISLAMIC_VIDEO_CATEGORIES = [
  { id: 'all', name: '✨ جميع الفيديوهات الحية' },
  { id: 'mecca', name: '🕋 مكة والحرم الشريف' },
  { id: 'mosque', name: '🕌 المساجد والقباب' },
  { id: 'rain', name: '🌧️ الأمطار والشتاء' },
  { id: 'night', name: '🌌 الفضاء والنجوم' },
  { id: 'ocean', name: '🌊 أمواج البحار' },
  { id: 'nature', name: '🌿 الطبيعة والشلالات' },
  { id: 'desert', name: '🏜️ الصحراء والغروب' },
  { id: 'lanterns', name: '🕯️ الفوانيس والروحانيات' },
];

export const CURATED_ISLAMIC_VIDEOS: IslamicVideo[] = [
  // 1. 🕋 مكة والحرم والكعبة المشرفة
  {
    id: 'vid_mecca_1',
    title: 'طواف المعتمرين حول الكعبة المشرفة',
    category: 'mecca',
    categoryNameAr: 'مكة والحرم الشريف',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-people-walking-around-the-kaaba-in-mecca-44331-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 15,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['كعبة', 'مكة', 'طواف', 'حرم', 'mecca', 'kaaba', 'hajj', 'umrah'],
  },
  {
    id: 'vid_mecca_2',
    title: 'أجواء الحرم المكي الشريف والسكينة',
    category: 'mecca',
    categoryNameAr: 'مكة والحرم الشريف',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-over-the-grand-mosque-in-mecca-44332-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/4346403/pexels-photo-4346403.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 18,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['الحرم', 'مكة', 'غيوم', 'سحاب', 'mecca', 'mosque', 'haram'],
  },

  // 2. 🕌 المساجد والقباب والعمارة الإسلامية
  {
    id: 'vid_mosque_1',
    title: 'مآذن وقباب جامع عثماني مع حركة السحاب',
    category: 'mosque',
    categoryNameAr: 'المساجد والقباب',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-over-a-mosque-44334-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 14,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['مسجد', 'مآذن', 'سحاب', 'عمارة', 'mosque', 'minaret', 'sky'],
  },
  {
    id: 'vid_mosque_2',
    title: 'أروقة المسجد وأعمدة الرخام الفاخرة',
    category: 'mosque',
    categoryNameAr: 'المساجد والقباب',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-sunlight-streaming-through-the-arches-of-a-mosque-44337-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/2440024/pexels-photo-2440024.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 16,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['أقواس', 'رخام', 'مسجد', 'نور', 'arches', 'mosque', 'light'],
  },

  // 3. 🌧️ الأمطار والشتاء والغيوم
  {
    id: 'vid_rain_1',
    title: 'هطول قطرات المطر العذبة على نافذة زجاجية',
    category: 'rain',
    categoryNameAr: 'الأمطار والشتاء',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-of-a-lake-seen-up-1528-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 16,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['مطر', 'شتاء', 'قطرات', 'سكينة', 'rain', 'drops', 'water'],
  },
  {
    id: 'vid_rain_2',
    title: 'جريان قطرات المطر مع ضباب الجبال الهادئ',
    category: 'rain',
    categoryNameAr: 'الأمطار والشتاء',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-water-falling-from-a-cascade-in-a-forest-42409-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/1108701/pexels-photo-1108701.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 15,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['مطر', 'ضباب', 'شلال', 'rain', 'mist', 'nature'],
  },
  {
    id: 'vid_rain_3',
    title: 'غيوم ماطرة وسحب داكنة مهيبة في السماء',
    category: 'rain',
    categoryNameAr: 'الأمطار والشتاء',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-storm-clouds-moving-fast-in-the-sky-41487-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/209831/pexels-photo-209831.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 12,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['غيوم', 'سماء', 'رعد', 'clouds', 'storm', 'sky'],
  },

  // 4. 🌌 الفضاء الكوني والنجوم والمجرات
  {
    id: 'vid_night_1',
    title: 'مجرة درب التبانة وتلألؤ النجوم في ظلام الليل',
    category: 'night',
    categoryNameAr: 'الفضاء والنجوم',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-timelapse-42436-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 14,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['نجوم', 'مجرة', 'فضاء', 'ليل', 'stars', 'galaxy', 'milkyway', 'night'],
  },
  {
    id: 'vid_night_2',
    title: 'حركة النجوم الدائرية فوق الجبال (Star Trails)',
    category: 'night',
    categoryNameAr: 'الفضاء والنجوم',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-star-trails-in-the-night-sky-42437-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 15,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['نجوم', 'سماء', 'ليل', 'كون', 'stars', 'cosmos', 'night'],
  },

  // 5. 🌊 البحار والأمواج والشواطئ
  {
    id: 'vid_ocean_1',
    title: 'تلاطم أمواج البحر الزرقاء الصافية على الشاطئ',
    category: 'ocean',
    categoryNameAr: 'أمواج البحار',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-sea-waves-breaking-on-the-beach-rocks-42845-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 15,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['بحر', 'أمواج', 'شاطئ', 'ماء', 'ocean', 'waves', 'sea'],
  },
  {
    id: 'vid_ocean_2',
    title: 'انعكاس ضوء الشمس الذهبي على مياه المحيط',
    category: 'ocean',
    categoryNameAr: 'أمواج البحار',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-calm-sea-water-at-sunset-42847-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 14,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['غروب', 'بحر', 'محيط', 'ذهب', 'sunset', 'ocean', 'sea'],
  },

  // 6. 🌿 الطبيعة والشلالات والغابات
  {
    id: 'vid_nature_1',
    title: 'شلال ماء عذب يتدفق وسط الغابات الخضراء',
    category: 'nature',
    categoryNameAr: 'الطبيعة والشلالات',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 16,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['شلال', 'طبيعة', 'غابة', 'ماء', 'waterfall', 'nature', 'forest'],
  },
  {
    id: 'vid_nature_2',
    title: 'أوراق الشجر الخضراء مع نسيم الرياح وأشعة الشمس',
    category: 'nature',
    categoryNameAr: 'الطبيعة والشلالات',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-sun-shining-through-tree-leaves-42404-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/338936/pexels-photo-338936.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 15,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['شجر', 'شمس', 'طبيعة', 'نور', 'leaves', 'sun', 'nature'],
  },

  // 7. 🏜️ الصحراء والغروب والرمال الذهبية
  {
    id: 'vid_desert_1',
    title: 'كثبان الرمال الذهبية وانعكاس شمس الغروب',
    category: 'desert',
    categoryNameAr: 'الصحراء والغروب',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-sand-dunes-in-a-desert-during-sunset-42848-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 16,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['صحراء', 'رمال', 'غروب', 'شمس', 'desert', 'dunes', 'sunset'],
  },
  {
    id: 'vid_desert_2',
    title: 'حركة الرياح الناعمة على رمال الصحراء',
    category: 'desert',
    categoryNameAr: 'الصحراء والغروب',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-wind-blowing-sand-on-a-desert-dune-42849-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 14,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['صحراء', 'رياح', 'رمال', 'desert', 'wind', 'sand'],
  },

  // 8. 🕯️ الفوانيس والإضاءات الروحانية
  {
    id: 'vid_lanterns_1',
    title: 'توهج فانوس رمضان الروحاني مع البوكيه الذهبي',
    category: 'lanterns',
    categoryNameAr: 'الفوانيس والروحانيات',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-candle-flame-flickering-in-a-lantern-44336-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/4346403/pexels-photo-4346403.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 15,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['فانوس', 'شمعة', 'رمضان', 'نور', 'lantern', 'candle', 'ramadan'],
  },
  {
    id: 'vid_lanterns_2',
    title: 'شموع مضيئة ونقاط ضوئية متلألئة في الظلام',
    category: 'lanterns',
    categoryNameAr: 'الفوانيس والروحانيات',
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-burning-candles-in-the-dark-42407-large.mp4',
    thumbnailUrl:
      'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: 15,
    quality: '1080p',
    orientation: 'portrait',
    tags: ['شموع', 'نور', 'روحاني', 'ضوء', 'candles', 'light', 'spiritual'],
  },
];
