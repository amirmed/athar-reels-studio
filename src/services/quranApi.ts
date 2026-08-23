// Quran API Service
// Audio: everyayah.com (direct MP3 URLs, no API key needed)
// Text:  alquran.cloud (free, no API key)

const TEXT_API = 'https://api.alquran.cloud/v1';
const AUDIO_BASE = 'https://everyayah.com/data';

import { removeQuranicMarks, cleanAyahTextForDuration } from '../utils/arabicTextUtils';

// ==================== EveryAyah Reciters ====================
// Each reciter maps to a subfolder on everyayah.com
export interface EveryAyahReciter {
  id: string;
  subfolder: string;
  nameAr: string;
  nameEn: string;
  style: string;
  bitrate: string;
  serverUrl?: string;
  sampleAudioUrl?: string;
  isCompleteQuran?: boolean;
  availableSurahs?: number[];
}

export const everyAyahReciters: EveryAyahReciter[] = [
  // ==================== ⚡ نجوم الترند الفيروسي 2026 (القرآن كاملاً 114 سورة) ====================
  {
    id: 'yasser_128',
    subfolder: 'Yasser_Ad-Dussary_128kbps',
    nameAr: 'ياسر الدوسري (ترند 2026 🔥)',
    nameEn: 'Yasser Ad-Dussary',
    style: 'ترتيل حماسي',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'nasser_128',
    subfolder: 'Nasser_Alqatami_128kbps',
    nameAr: 'ناصر القطامي (ترند 2026 🔥)',
    nameEn: 'Nasser Alqatami',
    style: 'ترتيل حجازي',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'abdulrahman_aloosi_128',
    subfolder: 'Abdulrahman_Aloosi_128kbps',
    nameAr: 'عبد الرحمن العوسي (ترند 2026 🔥)',
    nameEn: 'Abdulrahman Al-Oosi',
    style: 'ترتيل عذب',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'idrees_128',
    subfolder: 'Idrees_Abkar_128kbps',
    nameAr: 'إدريس أبكر (ترند 2026 🔥)',
    nameEn: 'Idrees Abkar',
    style: 'تلاوة باكية',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'khalid_jileel_128',
    subfolder: 'Khalid_Al-Jileel_128kbps',
    nameAr: 'خالد الجليل',
    nameEn: 'Khalid Al-Jileel',
    style: 'ترتيل مؤثر',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'wadih_yamani_128',
    subfolder: 'Wadih_Al-Yamani_128kbps',
    nameAr: 'وديع اليمني',
    nameEn: 'Wadih Al-Yamani',
    style: 'ترتيل خاشع',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'muhammad_luhaidan_128',
    subfolder: 'Mohammad_Al-Luhaydan_128kbps',
    nameAr: 'محمد اللحيدان',
    nameEn: 'Mohammad Al-Luhaydan',
    style: 'ترتيل فجر',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'abdullah_mousa_128',
    subfolder: 'Abdullah_Al_Mousa_128kbps',
    nameAr: 'عبد الله الموسى',
    nameEn: 'Abdullah Al-Mousa',
    style: 'ترتيل خاشع',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },

  // ==================== أئمة الحرمين والشهرة العالمية ====================
  {
    id: 'alafasy_128',
    subfolder: 'Alafasy_128kbps',
    nameAr: 'مشاري راشد العفاسي',
    nameEn: 'Alafasy',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'sudais_192',
    subfolder: 'Abdurrahmaan_As-Sudais_192kbps',
    nameAr: 'عبد الرحمن السديس (إمام الحرم)',
    nameEn: 'Abdurrahmaan As-Sudais',
    style: 'ترتيل',
    bitrate: '192kbps',
    isCompleteQuran: true,
  },
  {
    id: 'shuraim_128',
    subfolder: 'Saood_ash-Shuraym_128kbps',
    nameAr: 'سعود الشريم (إمام الحرم)',
    nameEn: 'Saood Ash-Shuraym',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'maher_128',
    subfolder: 'MaherAlMuaiqly128kbps',
    nameAr: 'ماهر المعيقلي (إمام الحرم)',
    nameEn: 'Maher Al Muaiqly',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'bandar_baleela_128',
    subfolder: 'Bandar_Baleela_128kbps',
    nameAr: 'بندر بليلة (إمام الحرم)',
    nameEn: 'Bandar Baleela',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'juhaynee_128',
    subfolder: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps',
    nameAr: 'عبد الله عواد الجهني (إمام الحرم)',
    nameEn: 'Abdullaah Al-Juhaynee',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'ali_jaber_64',
    subfolder: 'Ali_Jaber_64kbps',
    nameAr: 'علي جابر (رحمه الله)',
    nameEn: 'Ali Jaber',
    style: 'ترتيل خاشع',
    bitrate: '64kbps',
    isCompleteQuran: true,
  },

  // ==================== أساطير التلاوة المصرية والعالمية ====================
  {
    id: 'husary_128',
    subfolder: 'Husary_128kbps',
    nameAr: 'محمود خليل الحصري (مرتل)',
    nameEn: 'Husary Murattal',
    style: 'مرتل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'husary_mujawwad_128',
    subfolder: 'Husary_128kbps_Mujawwad',
    nameAr: 'محمود خليل الحصري (مجوّد)',
    nameEn: 'Husary Mujawwad',
    style: 'مجوّد',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'husary_muallim',
    subfolder: 'Husary_Muallim_128kbps',
    nameAr: 'محمود خليل الحصري (مصحف معلم)',
    nameEn: 'Husary Muallim',
    style: 'معلم',
    bitrate: '128kbps',
  },
  {
    id: 'minshawi_murattal',
    subfolder: 'Minshawy_Murattal_128kbps',
    nameAr: 'محمد صديق المنشاوي (مرتل)',
    nameEn: 'Minshawy Murattal',
    style: 'مرتل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'minshawi_mujawwad_192',
    subfolder: 'Minshawy_Mujawwad_192kbps',
    nameAr: 'محمد صديق المنشاوي (مجوّد)',
    nameEn: 'Minshawy Mujawwad',
    style: 'مجوّد',
    bitrate: '192kbps',
    isCompleteQuran: true,
  },
  {
    id: 'abdulbasit_murat_192',
    subfolder: 'Abdul_Basit_Murattal_192kbps',
    nameAr: 'عبد الباسط عبد الصمد (مرتل)',
    nameEn: 'Abdul Basit Murattal',
    style: 'مرتل',
    bitrate: '192kbps',
    isCompleteQuran: true,
  },
  {
    id: 'abdulbasit_mujaw',
    subfolder: 'Abdul_Basit_Mujawwad_128kbps',
    nameAr: 'عبد الباسط عبد الصمد (مجوّد)',
    nameEn: 'Abdul Basit Mujawwad',
    style: 'مجوّد',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'tablaway_128',
    subfolder: 'Mohammad_al_Tablaway_128kbps',
    nameAr: 'محمد محمود الطبلاوي',
    nameEn: 'Mohammad al Tablaway',
    style: 'مجوّد',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'mustafa_ismail_48',
    subfolder: 'Mustafa_Ismail_48kbps',
    nameAr: 'مصطفى إسماعيل (مجوّد)',
    nameEn: 'Mustafa Ismail',
    style: 'مجوّد',
    bitrate: '48kbps',
    isCompleteQuran: true,
  },
  {
    id: 'mahmoud_banna_32',
    subfolder: 'mahmoud_ali_al_banna_32kbps',
    nameAr: 'محمود علي البنا',
    nameEn: 'Mahmoud Ali Al-Banna',
    style: 'مجوّد',
    bitrate: '32kbps',
    isCompleteQuran: true,
  },
  {
    id: 'ahmed_neana_128',
    subfolder: 'Ahmed_Neana_128kbps',
    nameAr: 'أحمد نعينع',
    nameEn: 'Ahmed Neana',
    style: 'مجوّد',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'ali_hajjaj_128',
    subfolder: 'Ali_Hajjaj_AlSuesy_128kbps',
    nameAr: 'علي حجاج السويسي',
    nameEn: 'Ali Hajjaj AlSuesy',
    style: 'مجوّد',
    bitrate: '128kbps',
  },

  // ==================== نخبة القراء الخليجيين والعرب ====================
  {
    id: 'ajamy_128',
    subfolder: 'ahmed_ibn_ali_al_ajamy_128kbps',
    nameAr: 'أحمد بن علي العجمي',
    nameEn: 'Ahmed ibn Ali al-Ajamy',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'shaatree_128',
    subfolder: 'Abu_Bakr_Ash-Shaatree_128kbps',
    nameAr: 'أبو بكر الشاطري',
    nameEn: 'Abu Bakr Ash-Shaatree',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'hani_rifai_192',
    subfolder: 'Hani_Rifai_192kbps',
    nameAr: 'هاني الرفاعي',
    nameEn: 'Hani Rifai',
    style: 'ترتيل',
    bitrate: '192kbps',
    isCompleteQuran: true,
  },
  {
    id: 'hudhaify_128',
    subfolder: 'Hudhaify_128kbps',
    nameAr: 'علي بن عبد الرحمن الحذيفي',
    nameEn: 'Hudhaify',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'ghamdi_40',
    subfolder: 'Ghamadi_40kbps',
    nameAr: 'سعد الغامدي',
    nameEn: 'Saad Al-Ghamdi',
    style: 'ترتيل',
    bitrate: '40kbps',
    isCompleteQuran: true,
  },
  {
    id: 'ayyoub_128',
    subfolder: 'Muhammad_Ayyoub_128kbps',
    nameAr: 'محمد أيوب (رحمه الله)',
    nameEn: 'Muhammad Ayyoub',
    style: 'ترتيل حجازي',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'jibreel_128',
    subfolder: 'Muhammad_Jibreel_128kbps',
    nameAr: 'محمد جبريل',
    nameEn: 'Muhammad Jibreel',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'basfar_192',
    subfolder: 'Abdullah_Basfar_192kbps',
    nameAr: 'عبد الله بصفر',
    nameEn: 'Abdullah Basfar',
    style: 'ترتيل',
    bitrate: '192kbps',
    isCompleteQuran: true,
  },
  {
    id: 'bukhatir_128',
    subfolder: 'Salaah_AbdulRahman_Bukhatir_128kbps',
    nameAr: 'صلاح عبد الرحمن بوخاطر',
    nameEn: 'Salaah AbdulRahman Bukhatir',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'fares_abbad_64',
    subfolder: 'Fares_Abbad_64kbps',
    nameAr: 'فارس عباد',
    nameEn: 'Fares Abbad',
    style: 'ترتيل',
    bitrate: '64kbps',
    isCompleteQuran: true,
  },
  {
    id: 'ibrahim_akhdar_64',
    subfolder: 'Ibrahim_Akhdar_64kbps',
    nameAr: 'إبراهيم الأخضر',
    nameEn: 'Ibrahim Akhdar',
    style: 'ترتيل',
    bitrate: '64kbps',
    isCompleteQuran: true,
  },
  {
    id: 'muhsin_qasim_192',
    subfolder: 'Muhsin_Al_Qasim_192kbps',
    nameAr: 'عبد المحسن القاسم',
    nameEn: 'Muhsin Al Qasim',
    style: 'ترتيل',
    bitrate: '192kbps',
    isCompleteQuran: true,
  },
  {
    id: 'salah_budair_128',
    subfolder: 'Salah_Al_Budair_128kbps',
    nameAr: 'صلاح البدير',
    nameEn: 'Salah Al Budair',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'matroud_128',
    subfolder: 'Abdullah_Matroud_128kbps',
    nameAr: 'عبد الله مطرود',
    nameEn: 'Abdullah Matroud',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'khalid_qahtanee_192',
    subfolder: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps',
    nameAr: 'خالد القحطاني',
    nameEn: 'Khalid al-Qahtanee',
    style: 'ترتيل',
    bitrate: '192kbps',
    isCompleteQuran: true,
  },
  {
    id: 'yaser_salamah_128',
    subfolder: 'Yaser_Salamah_128kbps',
    nameAr: 'ياسر سلامة',
    nameEn: 'Yaser Salamah',
    style: 'حدر سريع',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'abdulkareem_128',
    subfolder: 'Muhammad_AbdulKareem_128kbps',
    nameAr: 'محمد عبد الكريم',
    nameEn: 'Muhammad AbdulKareem',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'khalefa_tunaiji_64',
    subfolder: 'khalefa_al_tunaiji_64kbps',
    nameAr: 'خليفة الطنيجي',
    nameEn: 'Khalefa Al-Tunaiji',
    style: 'ترتيل',
    bitrate: '64kbps',
    isCompleteQuran: true,
  },
  {
    id: 'akram_alaqimy_128',
    subfolder: 'Akram_AlAlaqimy_128kbps',
    nameAr: 'أكرم العلاقمي',
    nameEn: 'Akram Al Alaqimy',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'sahl_yassin_128',
    subfolder: 'Sahl_Yassin_128kbps',
    nameAr: 'سهل ياسين',
    nameEn: 'Sahl Yassin',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'aziz_alili_128',
    subfolder: 'aziz_alili_128kbps',
    nameAr: 'عزيز عليلي',
    nameEn: 'Aziz Alili',
    style: 'ترتيل',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'karim_mansoori_40',
    subfolder: 'Karim_Mansoori_40kbps',
    nameAr: 'كريم منصوري',
    nameEn: 'Karim Mansoori',
    style: 'ترتيل',
    bitrate: '40kbps',
    isCompleteQuran: true,
  },
  {
    id: 'ayman_sowaid_64',
    subfolder: 'Ayman_Sowaid_64kbps',
    nameAr: 'أيمن سويد (مصحف معلم)',
    nameEn: 'Ayman Sowaid',
    style: 'معلم',
    bitrate: '64kbps',
  },

  // ==================== قراءة ورش والروايات المتواترة ====================
  {
    id: 'warsh_dosary_128',
    subfolder: 'warsh/warsh_ibrahim_aldosary_128kbps',
    nameAr: 'إبراهيم الدوسري (ورش عن نافع)',
    nameEn: '(Warsh) Ibrahim Al-Dosary',
    style: 'ورش',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'warsh_jazaery_64',
    subfolder: 'warsh/warsh_yassin_al_jazaery_64kbps',
    nameAr: 'ياسين الجزائري (ورش عن نافع)',
    nameEn: '(Warsh) Yassin Al-Jazaery',
    style: 'ورش',
    bitrate: '64kbps',
    isCompleteQuran: true,
  },
  {
    id: 'warsh_abdulbasit_128',
    subfolder: 'warsh/warsh_Abdul_Basit_128kbps',
    nameAr: 'عبد الباسط عبد الصمد (ورش عن نافع)',
    nameEn: '(Warsh) Abdul Basit',
    style: 'ورش',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'warsh_kazaabri_128',
    subfolder: 'warsh/warsh_Omar_AlKazabri_128kbps',
    nameAr: 'عمر القزابري (ورش عن نافع)',
    nameEn: '(Warsh) Omar Al-Kazabri',
    style: 'ورش',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'soufi_shuba_128',
    subfolder: 'Abdul_Rasheed_Soufi_Shuba_128kbps',
    nameAr: 'عبد الرشيد صوفي (شعبة عن عاصم)',
    nameEn: 'Abdul Rasheed Soufi (Shuba)',
    style: 'شعبة',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'soufi_soussi_128',
    subfolder: 'Abdul_Rasheed_Soufi_Soussi_128kbps',
    nameAr: 'عبد الرشيد صوفي (السوسي عن أبي عمرو)',
    nameEn: 'Abdul Rasheed Soufi (Soussi)',
    style: 'السوسي',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
];

export const TOTAL_RECITERS_COUNT = everyAyahReciters.length;

// Backwards compatibility alias resolution for any old saved projects
const RECITER_ID_ALIASES: Record<string, string> = {
  sudais_64: 'sudais_192',
  shuraim_64: 'shuraim_128',
  maher_64: 'maher_128',
  husary_64: 'husary_128',
  husary_mujawwad_64: 'husary_mujawwad_128',
  minshawi_mujawwad_64: 'minshawi_mujawwad_192',
  menshawi_32: 'minshawi_murattal',
  abdulbasit_murat_64: 'abdulbasit_murat_192',
  basfar_64: 'basfar_192',
  ajamy_ketab_128: 'ajamy_128',
  shaatree_64: 'shaatree_128',
  hani_rifai_64: 'hani_rifai_192',
  hudhaify_64: 'hudhaify_128',
  ayyoub_64: 'ayyoub_128',
  jibreel_64: 'jibreel_128',
  tablaway_64: 'tablaway_128',
  ibrahim_akhdar_32: 'ibrahim_akhdar_64',
};

export function resolveReciter(reciterId: string): EveryAyahReciter | undefined {
  const resolvedId = RECITER_ID_ALIASES[reciterId] || reciterId;
  return everyAyahReciters.find((r) => r.id === resolvedId || r.id === reciterId);
}

// ==================== Audio URL Builder ====================
/**
 * Build the direct MP3 URL for an ayah from everyayah.com.
 * URL pattern: https://everyayah.com/data/{subfolder}/{SSS}{AAA}.mp3
 * SSS = surah number padded to 3 digits
 * AAA = ayah number padded to 3 digits
 */
export function getEveryAyahAudioUrl(
  subfolder: string,
  surahNumber: number,
  ayahNumber: number,
  serverUrl?: string,
  reciterId?: string
): string {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');

  if (serverUrl) {
    return `${serverUrl}${s}.mp3`;
  }
  return `${AUDIO_BASE}/${subfolder}/${s}${a}.mp3`;
}

/**
 * Multi-CDN Fallback Audio URL Builder with real mirror CDNs (EveryAyah, Archive.org, Quran.com, Islamic Network)
 */
export function getMultiCdnFallbackAudioUrls(
  subfolder: string,
  surahNumber: number,
  ayahNumber: number,
  serverUrl?: string,
  reciterId?: string
): string[] {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  const primaryUrl = getEveryAyahAudioUrl(subfolder, surahNumber, ayahNumber, serverUrl, reciterId);

  const urls: string[] = [primaryUrl];

  if (serverUrl) {
    urls.push(`${serverUrl}${s}.mp3`);
    if (serverUrl.includes('mp3quran.net')) {
      urls.push(serverUrl.replace(/server\d+\./, 'server10.') + `${s}.mp3`);
      urls.push(serverUrl.replace(/server\d+\./, 'server6.') + `${s}.mp3`);
    }
  } else {
    // EveryAyah Multi-CDN mirrors
    urls.push(`https://cdn.everyayah.com/data/${subfolder}/${s}${a}.mp3`);
    urls.push(`https://archive.org/download/EveryAyah.com_${subfolder}/${s}${a}.mp3`);
    urls.push(`https://verses.quran.com/${subfolder}/${s}${a}.mp3`);
    urls.push(`https://audio.qurancdn.com/${subfolder}/${s}${a}.mp3`);
  }

  return urls.filter((url, idx, arr) => Boolean(url) && arr.indexOf(url) === idx);
}

/**
 * Get all audio URLs for a range of ayahs from a specific reciter
 */
export function getAudioUrls(
  reciterId: string,
  surahNumber: number,
  fromAyah: number,
  toAyah: number
): string[] {
  const reciter = resolveReciter(reciterId);
  if (!reciter) return [];

  const urls: string[] = [];
  for (let ayah = fromAyah; ayah <= toAyah; ayah++) {
    urls.push(
      getEveryAyahAudioUrl(reciter.subfolder, surahNumber, ayah, reciter.serverUrl, reciter.id)
    );
  }
  return urls;
}

import { QuranWord, AyahChunk } from '../types';

const QURAN_COM_API = 'https://api.quran.com/api/v4';

// ==================== Quran.com Reciter ID Mappings ====================
export const EVERYAYAH_TO_QURANCOM_RECITERS: Record<string, number> = {
  alafasy_128: 7,
  sudais_192: 3,
  sudais_64: 3,
  shuraim_128: 10,
  shuraim_64: 10,
  maher_128: 13,
  maher_64: 13,
  husary_128: 6,
  husary_64: 6,
  husary_mujawwad_128: 12,
  minshawi_mujawwad_192: 8,
  minshawi_mujawwad_64: 8,
  minshawi_murattal: 9,
  menshawi_32: 9,
  abdulbasit_murat_192: 2,
  abdulbasit_murat_64: 2,
  abdulbasit_mujaw: 1,
  shaatree_128: 4,
  shaatree_64: 4,
  hani_rifai_192: 5,
  hani_rifai_64: 5,
  hudhaify_128: 12,
  hudhaify_64: 12,
  ghamdi_40: 11,
  ayyoub_128: 14,
  ayyoub_64: 14,
  jibreel_128: 15,
  jibreel_64: 15,
};

// ==================== Text Data Types ====================
export interface AyahData {
  number: number; // Global ayah number
  numberInSurah: number; // Ayah number within surah
  text: string; // Arabic text
  audioUrl: string; // Direct MP3 URL from everyayah.com
  fallbackUrls?: string[]; // Backup CDN URLs if primary 404s
  surahNumber: number;
  surahName: string;
  juz: number;
  page: number;
  duration?: number; // Ayah duration in seconds
  startTimeMs?: number; // Start timestamp in ms for full-surah files
  endTimeMs?: number; // End timestamp in ms for full-surah files
  isFullSurahFile?: boolean;
  words?: QuranWord[]; // Word-by-word data and timing
  chunks?: AyahChunk[]; // Waqf-aware authenticated slices
  translationText?: string;
}

// Sacred phrases that must never be broken apart
const SACRED_CONNECTED_PHRASES = [
  'لا إله إلا الله',
  'لا إله إلا هو',
  'لا إله إلا أنت',
  'وما أرسلناك إلا',
  'وما من إله إلا',
  'يا أيها الذين آمنوا',
  'يا أيها الناس',
  'قل هو الله أحد',
  'فويل للمصلين',
  'ولا تقربوا الصلاة',
];

/**
 * Split long Quranic verses into authentic Waqf-aware chunks.
 * Strictly respects Uthmani waqf markers (مـ, قلى, ج, صلى) and avoids forbidden waqf (لا).
 */
export function splitAyahIntoWaqfChunks(
  words: QuranWord[],
  ayahText: string,
  totalDuration: number
): AyahChunk[] {
  if (!words || words.length <= 10) {
    return [
      {
        index: 0,
        text: ayahText,
        words: words || [],
        startTime: words?.[0]?.startTime || 0,
        endTime: words?.[words.length - 1]?.endTime || totalDuration,
      },
    ];
  }

  const chunks: QuranWord[][] = [];
  let currentSlice: QuranWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentSlice.push(word);

    const isLastWord = i === words.length - 1;
    if (isLastWord) {
      chunks.push(currentSlice);
      break;
    }

    // 1. Check for authentic Uthmani Waqf signs (صلى ، قلى ، مـ ، ج ، ۛ)
    // EXCLUDE 'لا' (u06D9) because 'لا' means 'لا تقف' (Do not stop!)
    const hasAllowedWaqf =
      /[\u06D6\u06D7\u06D8\u06DA\u06DB\u0615]/.test(word.text) && !/[\u06D9]/.test(word.text);

    if (hasAllowedWaqf && currentSlice.length >= 4) {
      chunks.push(currentSlice);
      currentSlice = [];
      continue;
    }

    // 2. Safe grammatical boundary if slice exceeds 8 words
    if (currentSlice.length >= 7 && i + 1 < words.length) {
      const nextWord = words[i + 1].text.trim();
      const currentCombined = currentSlice.map((w) => w.text).join(' ');

      const isProtected = SACRED_CONNECTED_PHRASES.some((phrase) => {
        const cleanPhrase = removeQuranicMarks(phrase);
        const cleanCombined = removeQuranicMarks(currentCombined);
        return (
          cleanPhrase.startsWith(cleanCombined) || cleanCombined.endsWith(cleanPhrase.split(' ')[0])
        );
      });

      const isSafeNextStart = /^(و|فـ|ف|ثم|إذ|إن|أن|الذين|بل|كلا|لكن)/.test(nextWord);

      if (!isProtected && isSafeNextStart && currentSlice.length >= 5) {
        chunks.push(currentSlice);
        currentSlice = [];
      }
    }
  }

  if (currentSlice.length > 0) {
    if (chunks.length > 0 && currentSlice.length <= 3) {
      chunks[chunks.length - 1] = [...chunks[chunks.length - 1], ...currentSlice];
    } else {
      chunks.push(currentSlice);
    }
  }

  return chunks.map((chunkWords, idx) => {
    const chunkText = chunkWords.map((w) => w.text).join(' ');
    const startTime = chunkWords[0]?.startTime || 0;
    const endTime = chunkWords[chunkWords.length - 1]?.endTime || totalDuration;
    const waqfMatch = chunkText.match(/[\u06D6\u06D7\u06D8\u06DA\u06DB]/);

    return {
      index: idx,
      text: chunkText,
      words: chunkWords,
      startTime,
      endTime,
      hasWaqfSign: !!waqfMatch,
      waqfSign: waqfMatch ? waqfMatch[0] : undefined,
    };
  });
}

export interface TranslationData {
  numberInSurah: number;
  text: string;
}

export interface SurahMetadata {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

// ==================== Cache ====================
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

import { quranCacheService } from './quranCacheService';

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchTextApi<T>(endpoint: string): Promise<T> {
  const cacheKey = `text:${endpoint}`;
  const memoryCached = getCached<T>(cacheKey);
  if (memoryCached) return memoryCached;

  // Check persistent IndexedDB cache with explicit edition separation
  const surahMatch = endpoint.match(/\/surah\/(\d+)(?:\/([a-zA-Z0-9._-]+))?$/);
  const sNum = surahMatch ? Number(surahMatch[1]) : 0;
  const edition = surahMatch && surahMatch[2] ? surahMatch[2] : 'quran-uthmani';

  if (surahMatch && sNum > 0) {
    const localCached = await quranCacheService.getCachedAyahs(sNum, edition);
    if (localCached) {
      setCache(cacheKey, localCached);
      return localCached as T;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${TEXT_API}${endpoint}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const json = await response.json();

    if (json.code !== 200) {
      throw new Error(`API Error: ${json.status}`);
    }

    setCache(cacheKey, json.data);
    if (surahMatch && sNum > 0) {
      quranCacheService.setCachedAyahs(sNum, json.data, edition).catch(() => {});
    }
    return json.data as T;
  } catch (primaryErr) {
    console.warn(
      `[QuranApi] Primary Text API failed for ${endpoint}, checking fallbacks...`,
      primaryErr
    );

    // Fallback: try fetching from Quran.com API v4 directly for Arabic text
    if (surahMatch && sNum > 0 && (edition.includes('ar') || edition.includes('uthmani'))) {
      try {
        const qdcData = await fetchQuranCom<any>(
          `/verses/by_chapter/${sNum}?language=ar&words=true&word_fields=text_uthmani,location,verse_key&per_page=300`
        );
        if (qdcData?.verses) {
          const transformed = {
            number: sNum,
            name: '',
            englishName: '',
            numberOfAyahs: qdcData.verses.length,
            ayahs: qdcData.verses.map((v: any) => ({
              number: v.id,
              text:
                v.text_uthmani ||
                v.words?.map((w: any) => w.text_uthmani || w.text).join(' ') ||
                '',
              numberInSurah: v.verse_number,
              juz: v.juz_number,
              page: v.page_number,
            })),
          };
          setCache(cacheKey, transformed);
          quranCacheService.setCachedAyahs(sNum, transformed, edition).catch(() => {});
          return transformed as unknown as T;
        }
      } catch (fallbackErr) {
        console.warn(`[QuranApi] Quran.com fallback also failed for surah ${sNum}:`, fallbackErr);
      }
    }
    throw primaryErr;
  }
}

async function fetchQuranCom<T>(endpoint: string): Promise<T> {
  const cacheKey = `qurancom:${endpoint}`;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${QURAN_COM_API}${endpoint}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Quran.com API Error: ${response.status} ${response.statusText}`);
    }
    const json = await response.json();
    setCache(cacheKey, json);
    return json as T;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Fetch chapter audio timestamps and segments from Quran.com API v4
 */
export async function fetchQuranComTimestamps(
  reciterId: string,
  surahNumber: number
): Promise<
  Map<
    string,
    { timestampFrom: number; timestampTo: number; duration: number; segments: number[][] }
  >
> {
  const map = new Map<
    string,
    { timestampFrom: number; timestampTo: number; duration: number; segments: number[][] }
  >();
  const qdcReciterId = EVERYAYAH_TO_QURANCOM_RECITERS[reciterId] || 7; // default to Alafasy

  try {
    const data = await fetchQuranCom<any>(
      `/chapter_recitations/${qdcReciterId}/${surahNumber}?segments=true`
    );
    const timestamps = data?.audio_file?.timestamps || [];
    for (const item of timestamps) {
      if (item.verse_key) {
        map.set(item.verse_key, {
          timestampFrom: item.timestamp_from,
          timestampTo: item.timestamp_to,
          duration: item.duration || item.timestamp_to - item.timestamp_from,
          segments: item.segments || [],
        });
      }
    }
  } catch (err) {
    console.warn(`[QuranApi] Could not load chapter timestamps for reciter ${reciterId}:`, err);
  }
  return map;
}

/**
 * Fetch verses with words from Quran.com API v4
 */
export async function fetchQuranComWords(surahNumber: number): Promise<Map<string, any[]>> {
  const map = new Map<string, any[]>();
  try {
    const data = await fetchQuranCom<any>(
      `/verses/by_chapter/${surahNumber}?language=ar&words=true&word_fields=text_uthmani,location,verse_key&per_page=300`
    );
    const verses = data?.verses || [];
    for (const v of verses) {
      if (v.verse_key) {
        map.set(v.verse_key, v.words || []);
      }
    }
  } catch (err) {
    console.warn(`[QuranApi] Could not load Quran.com words for surah ${surahNumber}:`, err);
  }
  return map;
}

// ==================== Fetch Ayahs with Audio & Words ====================
/**
 * Fetch ayahs text, everyayah audio URLs, and precise Quran.com word segments for karaoke sync.
 */
export async function fetchAyahsWithAudio(
  surahNumber: number,
  fromAyah: number,
  toAyah: number,
  reciterId: string
): Promise<AyahData[]> {
  try {
    const [surahData, wordsMap, timestampsMap] = await Promise.all([
      fetchTextApi<any>(`/surah/${surahNumber}/quran-uthmani`),
      fetchQuranComWords(surahNumber).catch(() => new Map()),
      fetchQuranComTimestamps(reciterId, surahNumber).catch(() => new Map()),
    ]);

    const reciter = everyAyahReciters.find((r) => r.id === reciterId);
    const subfolder = reciter?.subfolder || 'Alafasy_128kbps';

    const ayahs: AyahData[] = surahData.ayahs
      .filter((a: any) => a.numberInSurah >= fromAyah && a.numberInSurah <= toAyah)
      .map((a: any) => {
        const verseKey = `${surahNumber}:${a.numberInSurah}`;
        const rawWords = wordsMap.get(verseKey) || [];
        const timing = timestampsMap.get(verseKey);

        const sPadded = String(surahNumber).padStart(3, '0');
        const aPadded = String(a.numberInSurah).padStart(3, '0');
        const primaryAudioUrl = getEveryAyahAudioUrl(
          subfolder,
          surahNumber,
          a.numberInSurah,
          reciter?.serverUrl,
          reciterId
        );

        const fallbackUrls = getMultiCdnFallbackAudioUrls(
          subfolder,
          surahNumber,
          a.numberInSurah,
          reciter?.serverUrl,
          reciterId
        );

        // Smart Phonetic Duration Calculation if Quran.com timestamp is unavailable
        const cleanAyahText = cleanAyahTextForDuration(a.text || '');
        const maddLetters = (cleanAyahText.match(/[آأإاويةىٰـ]/g) || []).length;
        const isMujawwad = reciter?.style === 'مجوّد';
        const styleMultiplier = isMujawwad ? 2.3 : 1.0;
        const estimatedPhoneticSec =
          Math.max(
            cleanAyahText.length * 0.18 + maddLetters * 0.12,
            (rawWords.length || a.text.split(/\s+/).length) * 0.75,
            4
          ) * styleMultiplier;
        const durationSeconds = timing ? timing.duration / 1000 : estimatedPhoneticSec;

        // Process words and timings
        let words: QuranWord[] = [];

        if (rawWords.length > 0) {
          const segments = timing?.segments || [];
          const verseStartMs = timing?.timestampFrom || 0;

          // Filter out or handle end marker words
          const contentWords = rawWords.filter((w: any) => w.char_type_name !== 'end');

          if (segments.length > 0) {
            // Exact segments from Quran.com
            words = contentWords.map((w: any, idx: number) => {
              const seg = segments[idx] || segments.find((s: number[]) => s[0] === w.position);
              let startSec = 0;
              let endSec = 0;

              if (seg && seg.length >= 3) {
                startSec = Math.max(0, (seg[1] - verseStartMs) / 1000);
                endSec = Math.max(startSec + 0.1, (seg[2] - verseStartMs) / 1000);
              } else {
                const fraction = idx / contentWords.length;
                const nextFraction = (idx + 1) / contentWords.length;
                startSec = fraction * durationSeconds;
                endSec = nextFraction * durationSeconds;
              }

              return {
                id: w.id || idx + 1,
                position: w.position || idx + 1,
                text: w.text_uthmani || w.text || '',
                translation: w.translation?.text,
                transliteration: w.transliteration?.text,
                startTime: startSec,
                endTime: endSec,
                charTypeName: 'word' as const,
              };
            });
          } else {
            // Intelligent phonetic length weighting fallback
            const wordWeights = contentWords.map((w: any) => {
              const clean = cleanAyahTextForDuration(w.text_uthmani || w.text || '');
              const madds = (clean.match(/[آأإاويةىٰـ]/g) || []).length;
              return Math.max(1, clean.length + madds * 1.5);
            });
            const totalWeight = wordWeights.reduce((sum: number, wt: number) => sum + wt, 0);

            let accumulatedTime = 0;
            words = contentWords.map((w: any, idx: number) => {
              const wordDuration = (wordWeights[idx] / totalWeight) * durationSeconds;
              const start = accumulatedTime;
              const end = start + wordDuration;
              accumulatedTime = end;

              return {
                id: w.id || idx + 1,
                position: w.position || idx + 1,
                text: w.text_uthmani || w.text || '',
                translation: w.translation?.text,
                transliteration: w.transliteration?.text,
                startTime: start,
                endTime: end,
                charTypeName: 'word' as const,
              };
            });
          }
        } else {
          // Fallback: split text by space if Quran.com words failed to load
          const rawTokens = a.text.trim().split(/\s+/);
          const totalWords = rawTokens.length;
          const wordDuration = durationSeconds / Math.max(totalWords, 1);

          words = rawTokens.map((token: string, idx: number) => ({
            id: idx + 1,
            position: idx + 1,
            text: token,
            startTime: idx * wordDuration,
            endTime: (idx + 1) * wordDuration,
            charTypeName: 'word' as const,
          }));
        }

        // Guarantee authentic Arabic text: if a.text is missing or corrupted, reconstruct from words
        let finalArabicText = (a.text || '').trim();
        if (!/[\u0600-\u06FF]/.test(finalArabicText) && words.length > 0) {
          const reconstructed = words
            .map((w) => w.text)
            .join(' ')
            .trim();
          if (/[\u0600-\u06FF]/.test(reconstructed)) {
            finalArabicText = reconstructed;
          }
        }

        const chunks = splitAyahIntoWaqfChunks(words, finalArabicText, durationSeconds);

        return {
          number: a.number,
          numberInSurah: a.numberInSurah,
          text: finalArabicText,
          audioUrl: primaryAudioUrl,
          fallbackUrls,
          surahNumber: surahData.number,
          surahName: surahData.name,
          juz: a.juz,
          page: a.page,
          duration: durationSeconds,
          startTimeMs: timing?.timestampFrom,
          endTimeMs: timing?.timestampTo,
          isFullSurahFile: !!reciter?.serverUrl,
          words,
          chunks,
        };
      });

    return ayahs;
  } catch (error) {
    console.error('Error fetching ayahs with audio and words:', error);
    throw error;
  }
}

/**
 * Fetch ayah text only (no audio)
 */
export async function fetchAyahs(
  surahNumber: number,
  fromAyah: number,
  toAyah: number
): Promise<AyahData[]> {
  try {
    const surahData = await fetchTextApi<any>(`/surah/${surahNumber}`);
    const ayahs: AyahData[] = surahData.ayahs
      .filter((a: any) => a.numberInSurah >= fromAyah && a.numberInSurah <= toAyah)
      .map((a: any) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: a.text,
        audioUrl: '',
        surahNumber: surahData.number,
        surahName: surahData.name,
        juz: a.juz,
        page: a.page,
      }));
    return ayahs;
  } catch (error) {
    console.error('Error fetching ayahs:', error);
    throw error;
  }
}

export const TRANSLATION_EDITIONS: Record<
  string,
  { id: string; nameAr: string; nameEn: string; langCode: string }
> = {
  en: {
    id: 'en.sahih',
    nameAr: 'الإنجليزية (صحيح إنترناشونال)',
    nameEn: 'English (Saheeh Int.)',
    langCode: 'en',
  },
  fr: {
    id: 'fr.hamidullah',
    nameAr: 'الفرنسية (محمد حميد الله)',
    nameEn: 'Français (Hamidullah)',
    langCode: 'fr',
  },
  ur: {
    id: 'ur.jalandhry',
    nameAr: 'الأردية (فتح محمد جالندري)',
    nameEn: 'Urdu (Jalandhry)',
    langCode: 'ur',
  },
  tr: {
    id: 'tr.ates',
    nameAr: 'التركية (سليمان أتش)',
    nameEn: 'Türkçe (Süleyman Ateş)',
    langCode: 'tr',
  },
  es: {
    id: 'es.cortes',
    nameAr: 'الإسبانية (خوليو كورتيس)',
    nameEn: 'Español (Julio Cortés)',
    langCode: 'es',
  },
  id: {
    id: 'id.indonesian',
    nameAr: 'الإندونيسية (وزارة الشؤون)',
    nameEn: 'Indonesian',
    langCode: 'id',
  },
};

/**
 * Fetch multi-language translation for a surah range (English, French, Urdu, Turkish...)
 */
export async function fetchTranslation(
  surahNumber: number,
  fromAyah: number,
  toAyah: number,
  languageOrEdition: string = 'en'
): Promise<TranslationData[]> {
  try {
    const edition = TRANSLATION_EDITIONS[languageOrEdition]?.id || languageOrEdition || 'en.sahih';
    const surahData = await fetchTextApi<any>(`/surah/${surahNumber}/${edition}`);
    return surahData.ayahs
      .filter((a: any) => a.numberInSurah >= fromAyah && a.numberInSurah <= toAyah)
      .map((a: any) => ({
        numberInSurah: a.numberInSurah,
        text: a.text,
      }));
  } catch (error) {
    console.error('Error fetching translation:', error);
    throw error;
  }
}

/**
 * Fetch all 114 surahs metadata
 */
export async function fetchAllSurahs(): Promise<SurahMetadata[]> {
  try {
    const data = await fetchTextApi<any[]>('/surah');
    return data.map((s: any) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType,
    }));
  } catch (error) {
    console.error('Error fetching surahs:', error);
    throw error;
  }
}

/**
 * Check if a specific Surah is recorded/available for a given reciter
 */
export function isSurahAvailableForReciter(reciterId: string, surahNumber: number): boolean {
  const reciter = everyAyahReciters.find((r) => r.id === reciterId);
  if (!reciter) return true;
  if (reciter.isCompleteQuran !== false && !reciter.availableSurahs) return true; // Full 114 Surahs
  return reciter.availableSurahs ? reciter.availableSurahs.includes(surahNumber) : true;
}

/**
 * Get all available Surah numbers for a given reciter
 */
export function getAvailableSurahsForReciter(reciterId: string): number[] {
  const reciter = everyAyahReciters.find((r) => r.id === reciterId);
  if (!reciter || (reciter.isCompleteQuran !== false && !reciter.availableSurahs)) {
    return Array.from({ length: 114 }, (_, i) => i + 1);
  }
  return reciter.availableSurahs || Array.from({ length: 114 }, (_, i) => i + 1);
}
