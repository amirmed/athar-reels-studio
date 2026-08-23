export interface ArabicFontInfo {
  id: string;
  name: string;
  category: 'quranic' | 'modern' | 'kufi' | 'artistic' | 'ruqaa';
  categoryLabel: string;
  description: string;
  tag: string;
  recommendedFor: string;
  googleFontFamily: string;
}

export const ARABIC_FONTS: ArabicFontInfo[] = [
  {
    id: 'Amiri',
    name: 'المصحف الأميري',
    category: 'quranic',
    categoryLabel: 'قرآني كلاسيكي',
    description:
      'خط المصحف الشريف الكلاسيكي الفاخر، الأفضل لتلاوات القرآن الرسمية والمقاطع الخاشعة.',
    tag: 'الأكثر شعبية 👑',
    recommendedFor: 'القرآن الكريم، التلاوات الخاشعة، الخط العثماني',
    googleFontFamily: 'Amiri, serif',
  },
  {
    id: 'Noto Naskh Arabic',
    name: 'النسخ القرآني المعتمد',
    category: 'quranic',
    categoryLabel: 'نسخ أصيل',
    description: 'خط النسخ فائق الدقة، متقن التشكيل والتنوين، يوفر أعلى درجات القراءة السلسة.',
    tag: 'وضوح فائق 📜',
    recommendedFor: 'الآيات مع التشكيل الكامل، الأذكار، المصاحف',
    googleFontFamily: '"Noto Naskh Arabic", serif',
  },
  {
    id: 'Scheherazade New',
    name: 'شهرزاد العثماني',
    category: 'quranic',
    categoryLabel: 'رسم عثماني',
    description: 'خط مستوحى من المخطوطات القرآنية التاريخية والزخارف العثمانية الأصيلة.',
    tag: 'طراز عثماني 🕌',
    recommendedFor: 'المقاطع التاريخية والروحانية، السور الطويلة',
    googleFontFamily: '"Scheherazade New", serif',
  },
  {
    id: 'Cairo',
    name: 'كايرو العصري (Cairo)',
    category: 'modern',
    categoryLabel: 'عصري للمنصات',
    description:
      'خط السوشيال ميديا والريلز الأول؛ هندسي متوازن، يمنح الفيديو طابعاً احترافياً وحديثاً.',
    tag: 'ترند ريلز ⚡',
    recommendedFor: 'Instagram Reels, TikTok, YouTube Shorts',
    googleFontFamily: 'Cairo, sans-serif',
  },
  {
    id: 'Tajawal',
    name: 'تجوال الحديث (Tajawal)',
    category: 'modern',
    categoryLabel: 'سلس وأنيق',
    description: 'خط عربي حديث يتميز بالنعومة والوضوح الفوري على شاشات الهواتف.',
    tag: 'تصميم ناعم 🌿',
    recommendedFor: 'الأدعية، الخواطر الإيمانية، السنابات',
    googleFontFamily: 'Tajawal, sans-serif',
  },
  {
    id: 'Almarai',
    name: 'المراعي (Almarai)',
    category: 'modern',
    categoryLabel: 'واضح ومقروء',
    description: 'خط مريح جداً للعين ومصمم خصيصاً للواجهات الرقمية ومقاطع الفيديو السريعة.',
    tag: 'سهل القراءة 📱',
    recommendedFor: 'الترجمات، التفسير، العناوين البارزة',
    googleFontFamily: 'Almarai, sans-serif',
  },
  {
    id: 'Reem Kufi',
    name: 'ريم كوفي الهندسي',
    category: 'kufi',
    categoryLabel: 'كوفي فاخر',
    description: 'الخط الكوفي المطور بلمسات فاخرة وهندسية تضفي هيبة وفخامة للريلز.',
    tag: 'فخامة ملكية 🏛️',
    recommendedFor: 'مقاطع يوم الجمعة، الأعياد، الآيات القصيرة المؤثرة',
    googleFontFamily: '"Reem Kufi", sans-serif',
  },
  {
    id: 'El Messiri',
    name: 'المسيري الفني',
    category: 'artistic',
    categoryLabel: 'فني ساحر',
    description: 'خط ذو تموجات فنية وانحناءات جمالية تعبر عن الخشوع والسكينة والجمال.',
    tag: 'جمالي ساحر 🎨',
    recommendedFor: 'القصص القرآنية، التأملات، التدبر',
    googleFontFamily: '"El Messiri", sans-serif',
  },
  {
    id: 'Lateef',
    name: 'لطيف الكلاسيكي',
    category: 'artistic',
    categoryLabel: 'كلاسيكي مرن',
    description: 'خط لين بانسيابية خطاطي الشرق الساحرين، يعطي إحساساً بالمخطوطات النادرة.',
    tag: 'مخطوطات نادرة 🕊️',
    recommendedFor: 'الأدعية المأثورة، القصائد الإسلامية',
    googleFontFamily: 'Lateef, cursive',
  },
  {
    id: 'Marhey',
    name: 'مرحي الجذاب (Marhey)',
    category: 'artistic',
    categoryLabel: 'عصري جريء',
    description: 'خط فريد ومميز يلفت الانتباه بقوة في أول ثانيتين من الفيديو.',
    tag: 'جذاب للعين 🌟',
    recommendedFor: 'فيديوهات الشباب، التذكيرات السريعة',
    googleFontFamily: 'Marhey, cursive',
  },
  {
    id: 'Aref Ruqaa',
    name: 'عارف رقعة',
    category: 'ruqaa',
    categoryLabel: 'خط الرقعة',
    description: 'جمال خط الرقعة العربي الأصيل بأصالة حركة يد الخطاط.',
    tag: 'يدوي أصيل ✍️',
    recommendedFor: 'الأحاديث الشريفة، الاقتباسات، الحكم',
    googleFontFamily: '"Aref Ruqaa", serif',
  },
];

export interface TypographyPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  wordSpacing: number;
  letterSpacing: number;
  enableShadow: boolean;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetY: number;
  enableGlow: boolean;
  glowColor: string;
  glowIntensity: number;
  enableStroke: boolean;
  strokeColor: string;
  strokeWidth: number;
  textGradient?: 'none' | 'gold' | 'silver' | 'emerald' | 'amber' | 'celestial';
  textAnimation?:
    'none' | 'wordByWord' | 'lineByLine' | 'fadeIn' | 'typewriter' | 'scaleBounce' | 'glowPulse';
  wordHighlightColor?: string;
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: 'royal_gold_glow',
    name: 'الذهب الملكي المتوهج',
    icon: '👑',
    description: 'خط أميري مع توهج ذهبي فائق وتظليل سينمائي عالي الوضوح',
    fontFamily: 'Amiri',
    fontSize: 26,
    lineHeight: 2.2,
    wordSpacing: 3,
    letterSpacing: 0,
    enableShadow: true,
    shadowBlur: 14,
    shadowColor: 'rgba(0,0,0,0.95)',
    shadowOffsetY: 4,
    enableGlow: true,
    glowColor: '#fbbf24',
    glowIntensity: 18,
    enableStroke: false,
    strokeColor: '#000000',
    strokeWidth: 1,
    textGradient: 'gold',
    textAnimation: 'wordByWord',
    wordHighlightColor: '#fbbf24',
  },
  {
    id: 'tiktok_viral_punch',
    name: 'ريلز تيك توك بارز (TikTok Punch)',
    icon: '⚡',
    description: 'خط كايرو عريض مع حدود سوداء مانعة وتوهج أبيض للانتشار الفيروسي',
    fontFamily: 'Cairo',
    fontSize: 25,
    lineHeight: 1.8,
    wordSpacing: 2,
    letterSpacing: 0,
    enableShadow: true,
    shadowBlur: 18,
    shadowColor: 'rgba(0,0,0,1)',
    shadowOffsetY: 5,
    enableGlow: true,
    glowColor: '#ffffff',
    glowIntensity: 12,
    enableStroke: true,
    strokeColor: '#000000',
    strokeWidth: 1.5,
    textGradient: 'none',
    textAnimation: 'wordByWord',
    wordHighlightColor: '#fbbf24',
  },
  {
    id: 'emerald_noor',
    name: 'الزمرد النوراني',
    icon: '🌿',
    description: 'خط النسخ القرآني مع هالة زمردية خاشعة وظلال عميقة',
    fontFamily: 'Noto Naskh Arabic',
    fontSize: 24,
    lineHeight: 2.4,
    wordSpacing: 2,
    letterSpacing: 0,
    enableShadow: true,
    shadowBlur: 16,
    shadowColor: 'rgba(0,0,0,0.9)',
    shadowOffsetY: 3,
    enableGlow: true,
    glowColor: '#34d399',
    glowIntensity: 20,
    enableStroke: false,
    strokeColor: '#000000',
    strokeWidth: 1,
    textGradient: 'emerald',
    textAnimation: 'fadeIn',
    wordHighlightColor: '#34d399',
  },
  {
    id: 'kufi_grand_mosque',
    name: 'الكوفي المهيب',
    icon: '🏛️',
    description: 'خط ريم كوفي الفاخر مع تباعد متزن وأناقة مساجد الأندلس',
    fontFamily: 'Reem Kufi',
    fontSize: 24,
    lineHeight: 2.0,
    wordSpacing: 4,
    letterSpacing: 1,
    enableShadow: true,
    shadowBlur: 12,
    shadowColor: 'rgba(0,0,0,0.85)',
    shadowOffsetY: 3,
    enableGlow: false,
    glowColor: '#fbbf24',
    glowIntensity: 0,
    enableStroke: true,
    strokeColor: 'rgba(0,0,0,0.8)',
    strokeWidth: 1,
    textGradient: 'none',
    textAnimation: 'scaleBounce',
    wordHighlightColor: '#fbbf24',
  },
  {
    id: 'minimal_clean_silver',
    name: 'الفضي النقي (Minimal Clean)',
    icon: '⚪',
    description: 'خط تجوال الأنيق مع تدرج فضي ناعم وظل خفيف للقراءة المريحة',
    fontFamily: 'Tajawal',
    fontSize: 24,
    lineHeight: 2.0,
    wordSpacing: 1,
    letterSpacing: 0,
    enableShadow: true,
    shadowBlur: 8,
    shadowColor: 'rgba(0,0,0,0.7)',
    shadowOffsetY: 2,
    enableGlow: false,
    glowColor: '#ffffff',
    glowIntensity: 0,
    enableStroke: false,
    strokeColor: '#000000',
    strokeWidth: 1,
    textGradient: 'silver',
    textAnimation: 'typewriter',
    wordHighlightColor: '#38bdf8',
  },
];
