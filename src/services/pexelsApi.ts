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

// ==================== Pexels Cache & Rate Limiting ====================

// Cache configuration
export const PEXELS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
export const PEXELS_MAX_CACHE_ENTRIES = 50;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const pexelsCache = new Map<string, CacheEntry<unknown>>();

export function getPexelsCacheEntry<T>(key: string): T | null {
  const entry = pexelsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > PEXELS_CACHE_TTL) {
    pexelsCache.delete(key);
    return null;
  }
  // Refresh position in Map for LRU
  pexelsCache.delete(key);
  pexelsCache.set(key, entry);
  return entry.data as T;
}

export function setPexelsCacheEntry<T>(key: string, data: T): void {
  if (pexelsCache.has(key)) {
    pexelsCache.delete(key);
  } else if (pexelsCache.size >= PEXELS_MAX_CACHE_ENTRIES) {
    // Evict oldest entry
    const oldestKey = pexelsCache.keys().next().value;
    if (oldestKey) pexelsCache.delete(oldestKey);
  }
  pexelsCache.set(key, { data, timestamp: Date.now() });
}

export function clearPexelsCache(): void {
  pexelsCache.clear();
}

// Rate Limiter configuration
// Pexels free API limit: 200 requests/hour.
// Safe budget: 180 requests/hour and a minimum 250ms spacing between calls.
export const PEXELS_MAX_REQUESTS_PER_HOUR = 180;
export const PEXELS_MIN_REQUEST_INTERVAL_MS = 250;

let requestTimestamps: number[] = [];
let lastRequestTime = 0;

export function getPexelsRemainingHourlyQuota(): number {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  requestTimestamps = requestTimestamps.filter((t) => t > oneHourAgo);
  return Math.max(0, PEXELS_MAX_REQUESTS_PER_HOUR - requestTimestamps.length);
}

export function _resetPexelsRateLimiterForTesting(): void {
  requestTimestamps = [];
  lastRequestTime = 0;
  pexelsCache.clear();
}

async function waitForPexelsRateLimit(): Promise<void> {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  requestTimestamps = requestTimestamps.filter((t) => t > oneHourAgo);

  if (requestTimestamps.length >= PEXELS_MAX_REQUESTS_PER_HOUR) {
    const oldest = requestTimestamps[0];
    const waitTimeMs = Math.max(1000, oldest + 60 * 60 * 1000 - now);
    throw new Error(
      `تم تجاوز الحد المسموح به لطلبات Pexels (الحد الأقصى 200 طلب/ساعة). يرجى الانتظار لمدة ${Math.ceil(
        waitTimeMs / 60000
      )} دقيقة.`
    );
  }

  // Minimum spacing between sequential requests
  const elapsedSinceLast = now - lastRequestTime;
  if (elapsedSinceLast < PEXELS_MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, PEXELS_MIN_REQUEST_INTERVAL_MS - elapsedSinceLast)
    );
  }

  lastRequestTime = Date.now();
}

function recordPexelsRequestSuccess(): void {
  requestTimestamps.push(Date.now());
}

async function pexelsFetch<T = unknown>(endpoint: string, retries = 2): Promise<T> {
  const key = getPexelsApiKey();
  if (!key || key === 'YOUR_PEXELS_API_KEY') {
    throw new Error('يرجى إدخال مفتاح Pexels API المجاني في الإعدادات لتصفح وتنزيل وسائط Pexels.');
  }

  const cacheKey = `pexels:${endpoint}`;
  const cached = getPexelsCacheEntry<T>(cacheKey);
  if (cached) {
    return cached;
  }

  await waitForPexelsRateLimit();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: key,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('مفتاح Pexels API غير صالح أو منتهي الصلاحية. يرجى مراجعته في الإعدادات.');
    }
    if ((response.status === 429 || response.status === 503) && retries > 0) {
      const retryAfterHeader = response.headers.get('Retry-After');
      let delayMs = 1500;
      if (retryAfterHeader) {
        const parsed = parseInt(retryAfterHeader, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          delayMs = parsed * 1000;
        }
      }
      if (delayMs > 0) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
      return pexelsFetch<T>(endpoint, retries - 1);
    }
    throw new Error(`خطأ في خدمة Pexels: ${response.status}`);
  }

  const data = (await response.json()) as T;
  recordPexelsRequestSuccess();
  setPexelsCacheEntry(cacheKey, data);
  return data;
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
