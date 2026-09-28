import type { EveryAyahReciter } from '../types';
import { AUDIO_BASE } from '../client';

export const everyAyahReciters: EveryAyahReciter[] = [
  // ==================== كبار القراء المشهورين (القرآن كاملاً 114 سورة) ====================
  {
    id: 'yasser_128',
    subfolder: 'Yasser_Ad-Dussary_128kbps',
    nameAr: 'ياسر الدوسري',
    nameEn: 'Yasser Ad-Dussary',
    style: 'ترتيل حماسي',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'nasser_128',
    subfolder: 'Nasser_Alqatami_128kbps',
    nameAr: 'ناصر القطامي',
    nameEn: 'Nasser Alqatami',
    style: 'ترتيل حجازي',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'abdulrahman_aloosi_128',
    subfolder: 'Abdulrahman_Aloosi_128kbps',
    nameAr: 'عبد الرحمن العوسي',
    nameEn: 'Abdulrahman Al-Oosi',
    style: 'ترتيل عذب',
    bitrate: '128kbps',
    isCompleteQuran: true,
  },
  {
    id: 'idrees_128',
    subfolder: 'Idrees_Abkar_128kbps',
    nameAr: 'إدريس أبكر',
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
  alafasy: 'alafasy_128',
  alafasy_64: 'alafasy_128',
  sudais_64: 'sudais_192',
  shuraim_64: 'shuraim_128',
  maher_64: 'maher_128',
  husary_64: 'husary_128',
  husary_mujawwad_64: 'husary_mujawwad_128',
  minshawi_mujawwad_64: 'minshawi_mujawwad_192',
  minshawy_mujawwad_192: 'minshawi_mujawwad_192',
  minshawy_mujawwad_64: 'minshawi_mujawwad_192',
  minshawy_murattal: 'minshawi_murattal',
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
  _reciterId?: string
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

export function isSurahAvailableForReciter(reciterId: string, surahNumber: number): boolean {
  const reciter = resolveReciter(reciterId);
  if (!reciter) return true;
  if (reciter.isCompleteQuran !== false && !reciter.availableSurahs) return true; // Full 114 Surahs
  return reciter.availableSurahs ? reciter.availableSurahs.includes(surahNumber) : true;
}

/**
 * Get all available Surah numbers for a given reciter
 */
export function getAvailableSurahsForReciter(reciterId: string): number[] {
  const reciter = resolveReciter(reciterId);
  if (!reciter || (reciter.isCompleteQuran !== false && !reciter.availableSurahs)) {
    return Array.from({ length: 114 }, (_, i) => i + 1);
  }
  return reciter.availableSurahs || Array.from({ length: 114 }, (_, i) => i + 1);
}
