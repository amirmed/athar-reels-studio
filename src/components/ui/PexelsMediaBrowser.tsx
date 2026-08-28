import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Image, Film, Loader2, ChevronLeft, ChevronRight, Key } from 'lucide-react';
import {
  PexelsPhoto,
  PexelsVideo,
  getPexelsApiKey,
  setPexelsApiKey,
  hasPexelsApiKey,
  getBestVideoFile,
} from '../../services/pexelsApi';

interface PexelsMediaBrowserProps {
  onSelectPhoto: (url: string) => void;
  onSelectVideo: (url: string) => void;
}

const ISLAMIC_PRESETS = [
  'mosque',
  'quran',
  'kaaba',
  'medina',
  'islamic architecture',
  'nature peaceful',
  'night sky stars',
  'desert dunes',
];

export const PexelsMediaBrowser: React.FC<PexelsMediaBrowserProps> = ({
  onSelectPhoto,
  onSelectVideo,
}) => {
  const [tab, setTab] = useState<'photos' | 'videos'>('photos');
  const [query, setQuery] = useState('');
  const [_apiKey, setApiKey] = useState(() => getPexelsApiKey());
  const [showKeyInput, setShowKeyInput] = useState(!hasPexelsApiKey());
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const patchApiKey = (key: string) => {
    setPexelsApiKey(key);
    setApiKey(key);
    setShowKeyInput(false);
  };

  const doSearch = useCallback(
    async (q: string, p: number) => {
      const key = getPexelsApiKey();
      if (!key || key === 'YOUR_PEXELS_API_KEY') {
        setShowKeyInput(true);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Inject API key dynamically
        const headers = { Authorization: key };

        if (tab === 'photos') {
          const url = q
            ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${p}&per_page=15&orientation=portrait`
            : `https://api.pexels.com/v1/curated?page=${p}&per_page=15`;
          const res = await fetch(url, { headers });
          if (!res.ok) throw new Error('فشل الاتصال بـ Pexels. تحقق من مفتاح API.');
          const data = await res.json();
          setPhotos(data.photos || []);
          setTotalResults(data.total_results || 0);
        } else {
          const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(q || 'nature')}&page=${p}&per_page=10&orientation=portrait`;
          const res = await fetch(url, { headers });
          if (!res.ok) throw new Error('فشل الاتصال بـ Pexels. تحقق من مفتاح API.');
          const data = await res.json();
          setVideos(data.videos || []);
          setTotalResults(data.total_results || 0);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'خطأ في التحميل');
      } finally {
        setLoading(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    doSearch(query, page);
  }, [tab, page]);

  const handleSearch = () => {
    setPage(1);
    doSearch(query, 1);
  };

  if (showKeyInput) {
    return (
      <div className="space-y-3 p-3 bg-surface-800/40 rounded-xl border border-white/[0.06]">
        <div className="flex items-center gap-2 text-accent-400">
          <Key size={14} />
          <span className="text-xs font-medium">مفتاح Pexels API مطلوب</span>
        </div>
        <p className="text-[11px] text-white/40 leading-relaxed">
          احصل على مفتاح مجاني من{' '}
          <a
            href="https://www.pexels.com/api/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-400 underline"
          >
            pexels.com/api
          </a>
        </p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="الصق مفتاح API هنا..."
            className="glass-input flex-1 text-xs"
            dir="ltr"
          />
          <button
            onClick={() => {
              const val = inputRef.current?.value?.trim();
              if (val) patchApiKey(val);
            }}
            className="px-3 py-2 bg-accent-500 hover:bg-accent-600 text-white text-xs rounded-lg transition-colors"
          >
            حفظ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-800/40 rounded-lg">
        <button
          onClick={() => {
            setTab('photos');
            setPage(1);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
            tab === 'photos'
              ? 'bg-accent-500/20 text-accent-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Image size={11} /> صور
        </button>
        <button
          onClick={() => {
            setTab('videos');
            setPage(1);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
            tab === 'videos'
              ? 'bg-accent-500/20 text-accent-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Film size={11} /> فيديو
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={12}
            className="absolute start-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="ابحث... مثال: mosque"
            className="glass-input w-full text-xs ps-8"
            dir="ltr"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-3 py-2 bg-accent-500/20 border border-accent-500/20 hover:bg-accent-500/30 text-accent-400 text-[11px] rounded-lg transition-colors"
        >
          بحث
        </button>
      </div>

      {/* Preset tags */}
      <div className="flex flex-wrap gap-1.5">
        {ISLAMIC_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setQuery(p);
              setPage(1);
              doSearch(p, 1);
            }}
            className="px-2 py-0.5 text-[10px] rounded-full bg-surface-700/40 border border-white/[0.06] text-white/40 hover:border-accent-500/30 hover:text-accent-400 transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Reset API key */}
      <button
        onClick={() => {
          setPexelsApiKey('');
          setApiKey('');
          setShowKeyInput(true);
        }}
        className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
      >
        تغيير مفتاح API
      </button>

      {/* Error */}
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="text-accent-400 animate-spin" />
        </div>
      )}

      {/* Photos grid */}
      {!loading && tab === 'photos' && (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => onSelectPhoto(photo.src.portrait || photo.src.large)}
              className="relative aspect-[9/16] rounded-lg overflow-hidden group border border-white/[0.06] hover:border-accent-500/40 transition-all"
            >
              <img
                src={photo.src.small}
                alt={photo.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="text-[10px] text-white font-medium bg-accent-500/80 px-1.5 py-0.5 rounded">
                  اختر
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Videos grid */}
      {!loading && tab === 'videos' && (
        <div className="grid grid-cols-2 gap-1.5">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => onSelectVideo(getBestVideoFile(video))}
              className="relative aspect-[9/16] rounded-lg overflow-hidden group border border-white/[0.06] hover:border-accent-500/40 transition-all"
            >
              <img
                src={video.image}
                alt={`Video by ${video.user.name}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="text-[10px] text-white font-medium bg-accent-500/80 px-1.5 py-0.5 rounded">
                  اختر
                </span>
              </div>
              <div className="absolute bottom-1 end-1 bg-black/60 rounded text-[8px] text-white px-1">
                {Math.round(video.duration)}ث
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalResults > 0 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-1.5 rounded-lg bg-surface-800/40 border border-white/[0.06] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={12} />
          </button>
          <span className="text-[11px] text-white/30">صفحة {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg bg-surface-800/40 border border-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
          >
            <ChevronLeft size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
