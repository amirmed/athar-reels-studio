// Pexels API Integration
// Get your free API key from https://www.pexels.com/api/
const BASE_URL = 'https://api.pexels.com';

export function getPexelsApiKey(): string {
  try {
    return localStorage.getItem('athar_pexels_key') || '';
  } catch {
    return '';
  }
}

export function setPexelsApiKey(key: string): void {
  try {
    localStorage.setItem('athar_pexels_key', key.trim());
  } catch {
    // Ignore localStorage errors
  }
}

export function hasPexelsApiKey(): boolean {
  const k = getPexelsApiKey();
  return Boolean(k && k.length > 10 && k !== 'YOUR_PEXELS_API_KEY');
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: { name: string };
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
}

export type PexelsVideoFile = PexelsVideo['video_files'][number];

export interface PexelsPhotosResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
}

export interface PexelsVideosResponse {
  total_results: number;
  page: number;
  per_page: number;
  videos: PexelsVideo[];
}

async function pexelsFetch<T = unknown>(endpoint: string): Promise<T> {
  const key = getPexelsApiKey();
  if (!key || key === 'YOUR_PEXELS_API_KEY') {
    throw new Error('يرجى إدخال مفتاح Pexels API المجاني في الإعدادات لتصفح وتنزيل وسائط Pexels.');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: key,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('مفتاح Pexels API غير صالح أو منتهي الصلاحية. يرجى مراجعته في الإعدادات.');
    }
    throw new Error(`خطأ في خدمة Pexels: ${response.status}`);
  }

  return response.json();
}

export async function searchPhotos(
  query: string,
  page = 1,
  perPage = 15
): Promise<PexelsPhotosResponse> {
  return pexelsFetch(
    `/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=portrait`
  );
}

export async function searchVideos(
  query: string,
  page = 1,
  perPage = 10
): Promise<PexelsVideosResponse> {
  return pexelsFetch(
    `/videos/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=portrait`
  );
}

export async function getCuratedPhotos(page = 1, perPage = 15): Promise<PexelsPhotosResponse> {
  return pexelsFetch(`/v1/curated?page=${page}&per_page=${perPage}`);
}

export function getBestVideoFile(video: PexelsVideo): string {
  // Prefer HD quality portrait video
  const files = [...video.video_files].sort((a, b) => b.height - a.height);
  const hd = files.find((f) => f.height >= 1080 && f.quality === 'hd');
  const sd = files.find((f) => f.height >= 720);
  return (hd || sd || files[0])?.link || '';
}
