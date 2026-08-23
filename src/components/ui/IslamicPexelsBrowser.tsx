import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Sparkles,
  Image as ImageIcon,
  Film,
  Play,
  Pause,
  Check,
  Key,
  ExternalLink,
  Loader2,
  X,
  Video,
} from 'lucide-react';

import {
  IslamicWallpaper,
  ISLAMIC_SEARCH_TAGS,
  CURATED_ISLAMIC_WALLPAPERS,
} from '../../data/islamicWallpapers';
import {
  IslamicVideo,
  ISLAMIC_VIDEO_CATEGORIES,
  CURATED_ISLAMIC_VIDEOS,
} from '../../data/islamicVideos';
import { getPexelsApiKey, setPexelsApiKey } from '../../services/pexelsApi';

export type { IslamicWallpaper, IslamicVideo };

interface IslamicPexelsBrowserProps {
  onSelectPhoto: (url: string) => void;
  selectedUrl?: string;
  defaultMediaType?: 'photos' | 'videos';
}

const PHOTO_CATEGORIES = [
  { id: 'all', name: 'الكل' },
  { id: 'mosque', name: '🕌 المساجد والقباب' },
  { id: 'mecca', name: '🕋 مكة والمدينة' },
  { id: 'night', name: '🌌 الليل والهلال' },
  { id: 'desert', name: '🏜️ الصحراء والغروب' },
  { id: 'nature', name: '🌧️ الأمطار والطبيعة' },
  { id: 'lanterns', name: '🏮 الفوانيس والزخارف' },
];

export const IslamicPexelsBrowser: React.FC<IslamicPexelsBrowserProps> = ({
  onSelectPhoto,
  selectedUrl,
  defaultMediaType = 'photos',
}) => {
  const [mediaType, setMediaType] = useState<'photos' | 'videos'>(defaultMediaType);
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>('all');
  const [selectedVideoCategory, setSelectedVideoCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [livePhotos, setLivePhotos] = useState<any[]>([]);
  const [liveVideos, setLiveVideos] = useState<any[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [apiKey, setApiKey] = useState(() => getPexelsApiKey());
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);

  // Filter curated wallpapers based on search and category
  const filteredWallpapers = useMemo(() => {
    let list = CURATED_ISLAMIC_WALLPAPERS;

    if (selectedPhotoCategory !== 'all') {
      list = list.filter((w) => w.category === selectedPhotoCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (w) => w.title.toLowerCase().includes(q) || w.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedPhotoCategory, searchQuery]);

  // Filter curated live videos based on search and category
  const filteredVideos = useMemo(() => {
    let list = CURATED_ISLAMIC_VIDEOS;

    if (selectedVideoCategory !== 'all') {
      list = list.filter((v) => v.category === selectedVideoCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (v) => v.title.toLowerCase().includes(q) || v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedVideoCategory, searchQuery]);

  // Execute Search (both curated and Pexels API if key provided)
  const handleExecuteSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchQuery).trim();
    if (!q) {
      setLivePhotos([]);
      setLiveVideos([]);
      return;
    }

    if (apiKey) {
      setIsSearchingLive(true);
      try {
        if (mediaType === 'photos') {
          const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=18&orientation=portrait`,
            { headers: { Authorization: apiKey } }
          );
          if (res.ok) {
            const data = await res.json();
            setLivePhotos(data.photos || []);
          }
        } else {
          const res = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=15&orientation=portrait`,
            { headers: { Authorization: apiKey } }
          );
          if (res.ok) {
            const data = await res.json();
            setLiveVideos(data.videos || []);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingLive(false);
      }
    }
  };

  const handleSelectPresetTag = (tag: string) => {
    setSearchQuery(tag);
    if (mediaType === 'photos') {
      setSelectedPhotoCategory('all');
    } else {
      setSelectedVideoCategory('all');
    }
    handleExecuteSearch(tag);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setLivePhotos([]);
    setLiveVideos([]);
  };

  const isCurrentUrl = (url: string) => selectedUrl === url;

  return (
    <div className="space-y-3">
      {/* Header Info Banner & Media Type Switcher */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-500/10 via-surface-850 to-amber-500/10 border border-sky-500/20 flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
              {mediaType === 'videos' ? <Film size={16} /> : <ImageIcon size={16} />}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>
                  {mediaType === 'videos' ? 'مكتبة الفيديوهات الحية' : 'مكتبة صور Pexels 4K'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 shrink-0">
                  {mediaType === 'videos' ? '🎬 فيديوهات حية' : '🖼️ صور 4K نقية'}
                </span>
              </h4>
              <p className="text-[11px] text-white/50 truncate">
                {mediaType === 'videos'
                  ? 'فيديوهات سينمائية للحرم، المساجد، والأمطار'
                  : 'خلفيات وصور إسلامية وطبيعية منتقاة للريلز'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowKeyModal(!showKeyModal)}
            className="p-1.5 rounded-xl bg-surface-900/80 hover:bg-surface-800 text-white/60 hover:text-white text-[11px] flex items-center gap-1 border border-white/[0.08] transition-all shrink-0 cursor-pointer shadow-sm"
            title="إعدادات Pexels API المباشر"
          >
            <Key size={11} className={apiKey ? 'text-emerald-400' : 'text-gold-400'} />
            <span className="font-medium">{apiKey ? 'API مفعل ✓' : 'ربط API'}</span>
          </button>
        </div>

        {/* Media Switcher: 🖼️ صور 4K (افتراضي) vs 🎬 فيديوهات حية */}
        <div className="flex p-1 bg-surface-950/90 rounded-xl border border-white/[0.08] text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMediaType('photos');
              setLiveVideos([]);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
              mediaType === 'photos'
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md font-bold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <ImageIcon size={13} />
            <span>صور ثابتة 4K</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMediaType('videos');
              setLivePhotos([]);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
              mediaType === 'videos'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md font-bold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Film size={13} />
            <span>فيديوهات حية</span>
          </button>
        </div>
      </div>

      {/* Pexels API Key Toggle Bar */}
      {showKeyModal && (
        <div className="p-3 rounded-xl bg-surface-900/90 border border-gold-500/30 space-y-2 animate-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key size={13} className="text-gold-400" />
              ربط مفتاح Pexels المجاني (للبحث الحي عن ملايين الفيديوهات والصور):
            </span>
            <a
              href="https://www.pexels.com/api/"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-accent-400 hover:underline flex items-center gap-1"
            >
              الحصول على مفتاح مجاني
              <ExternalLink size={10} />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setPexelsApiKey(e.target.value);
              }}
              placeholder="الصق مفتاح Pexels API هنا..."
              className="glass-input flex-1 px-3 py-1.5 text-xs rounded-lg font-mono"
            />
            <button
              onClick={() => handleExecuteSearch()}
              className="py-1.5 px-3 rounded-lg bg-accent-500 hover:bg-accent-400 text-white text-xs font-bold shrink-0 transition-all cursor-pointer"
            >
              بحث في Pexels
            </button>
          </div>
        </div>
      )}

      {/* Search Bar with Instant Search Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch()}
            placeholder={
              mediaType === 'videos'
                ? 'ابحث عن فيديو: مكة، طواف، مطر، نجوم، بحر، شلال، rain, stars, mecca...'
                : 'ابحث عن صورة: مساجد، مكة، كعبة، مطر، هلال، mosque، moon...'
            }
            className="glass-input w-full pr-9 pl-8 py-2 text-xs rounded-xl no-drag select-text cursor-text relative z-10"
          />
          <Search size={14} className="absolute right-3 top-2.5 text-white/40" />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute left-2.5 top-2.5 text-white/40 hover:text-white cursor-pointer z-20"
              title="مسح البحث"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => handleExecuteSearch()}
          disabled={isSearchingLive}
          className="py-2 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 shrink-0 transition-all cursor-pointer"
        >
          {isSearchingLive ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          <span>بحث</span>
        </button>
      </div>

      {/* Quick Search Preset Tags */}
      <div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-white/40 shrink-0">كلمات سريعة:</span>
          {ISLAMIC_SEARCH_TAGS.map((item) => (
            <button
              key={item.tag}
              onClick={() => handleSelectPresetTag(item.tag)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 border cursor-pointer ${
                searchQuery.toLowerCase() === item.tag
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/50 shadow-sm'
                  : 'bg-surface-800/50 hover:bg-surface-800 text-white/60 hover:text-white border-white/[0.04]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-white/[0.04]">
        {mediaType === 'videos'
          ? ISLAMIC_VIDEO_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedVideoCategory(cat.id);
                  setLiveVideos([]);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedVideoCategory === cat.id
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                    : 'bg-surface-800/60 text-white/60 hover:text-white hover:bg-surface-800 border border-white/[0.04]'
                }`}
              >
                {cat.name}
              </button>
            ))
          : PHOTO_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedPhotoCategory(cat.id);
                  setLivePhotos([]);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedPhotoCategory === cat.id
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'bg-surface-800/60 text-white/60 hover:text-white hover:bg-surface-800 border border-white/[0.04]'
                }`}
              >
                {cat.name}
              </button>
            ))}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
        {isSearchingLive
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`skel-${idx}`}
                className="rounded-xl h-28 bg-surface-800/80 border border-white/[0.06] animate-pulse flex flex-col justify-between p-2"
              >
                <div className="flex justify-end">
                  <div className="w-4 h-4 rounded-full bg-white/10" />
                </div>
                <div className="space-y-1">
                  <div className="w-2/3 h-2.5 rounded bg-white/10" />
                  <div className="w-1/3 h-2 rounded bg-white/5" />
                </div>
              </div>
            ))
          : mediaType === 'videos'
            ? /* ================= LIVE VIDEOS MODE ================= */
              liveVideos.length > 0
              ? liveVideos.map((vid) => {
                  // Extract highest quality MP4 link
                  const videoFiles = vid.video_files || [];
                  const bestFile =
                    videoFiles.find((f: any) => f.height >= 1080 && f.file_type === 'video/mp4') ||
                    videoFiles.find((f: any) => f.height >= 720 && f.file_type === 'video/mp4') ||
                    videoFiles[0];
                  const videoUrl = bestFile?.link || '';
                  const isSelected = isCurrentUrl(videoUrl);
                  const isHovered = hoveredVideoId === String(vid.id);

                  return (
                    <div
                      key={vid.id}
                      onClick={() => onSelectPhoto(videoUrl)}
                      onMouseEnter={() => setHoveredVideoId(String(vid.id))}
                      onMouseLeave={() => setHoveredVideoId(null)}
                      className={`group relative rounded-xl h-32 overflow-hidden cursor-pointer border transition-all duration-300 ${
                        isSelected
                          ? 'border-sky-400 ring-2 ring-sky-500/40 shadow-lg scale-[1.02]'
                          : 'border-white/[0.06] hover:border-sky-400/50 hover:shadow-md'
                      }`}
                    >
                      {isHovered ? (
                        <video
                          src={videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={vid.image}
                          alt="Pexels Video"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 flex flex-col justify-between p-2">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-sky-400 font-mono text-[10px] font-bold border border-white/10 flex items-center gap-1">
                            <Film size={9} />
                            <span>{vid.duration}s</span>
                          </span>

                          {isSelected && (
                            <span className="p-1 rounded-full bg-sky-500 text-white shadow-md">
                              <Check size={11} />
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[11px] text-white font-bold line-clamp-1">
                            {vid.user?.name || 'Pexels Video'}
                          </span>
                          <span className="text-[8px] text-sky-300/80 font-bold block">
                            🎬 1080p HD Video
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              : filteredVideos.map((videoItem) => {
                  const isSelected = isCurrentUrl(videoItem.videoUrl);
                  const isHovered = hoveredVideoId === videoItem.id;

                  return (
                    <div
                      key={videoItem.id}
                      onClick={() => onSelectPhoto(videoItem.videoUrl)}
                      onMouseEnter={() => setHoveredVideoId(videoItem.id)}
                      onMouseLeave={() => setHoveredVideoId(null)}
                      className={`group relative rounded-xl h-32 overflow-hidden cursor-pointer border transition-all duration-300 ${
                        isSelected
                          ? 'border-sky-400 ring-2 ring-sky-500/50 shadow-xl shadow-sky-500/20 scale-[1.02]'
                          : 'border-white/[0.08] hover:border-sky-400/60 hover:shadow-lg'
                      }`}
                    >
                      {isHovered ? (
                        <video
                          src={videoItem.videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={videoItem.thumbnailUrl}
                          alt={videoItem.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/30 flex flex-col justify-between p-2">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-sky-300 font-mono text-[10px] font-bold border border-white/10 flex items-center gap-1">
                            <Play size={8} className="fill-sky-300" />
                            <span>{videoItem.duration}s</span>
                          </span>

                          {isSelected && (
                            <span className="p-1 rounded-full bg-sky-500 text-white shadow-md">
                              <Check size={11} />
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[11px] text-white/95 font-bold line-clamp-1 leading-tight mb-0.5">
                            {videoItem.title}
                          </span>
                          <span className="text-[8px] text-amber-300 font-bold block">
                            🎬 {videoItem.quality} فيديو حي
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
            : /* ================= PHOTOS MODE ================= */
              livePhotos.length > 0
              ? livePhotos.map((photo) => {
                  const photoUrl = photo.src.large2x || photo.src.large || photo.src.original;
                  const isSelected = isCurrentUrl(photoUrl);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => onSelectPhoto(photoUrl)}
                      className={`group relative rounded-xl h-28 overflow-hidden cursor-pointer border transition-all duration-300 ${
                        isSelected
                          ? 'border-sky-400 ring-2 ring-sky-500/40 shadow-lg scale-[1.02]'
                          : 'border-white/[0.06] hover:border-sky-400/50 hover:shadow-md'
                      }`}
                    >
                      <img
                        src={photo.src.medium || photoUrl}
                        alt={photo.alt || 'Pexels Photo'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          {isSelected && (
                            <span className="p-1 rounded-full bg-sky-500 text-white shadow-md">
                              <Check size={11} />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-white/90 font-bold truncate">
                          {photo.photographer || 'Pexels'}
                        </span>
                      </div>
                    </div>
                  );
                })
              : filteredWallpapers.map((item) => {
                  const isSelected = isCurrentUrl(item.url);
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectPhoto(item.url)}
                      className={`group relative rounded-xl h-28 overflow-hidden cursor-pointer border transition-all duration-300 ${
                        isSelected
                          ? 'border-sky-400 ring-2 ring-sky-500/40 shadow-lg scale-[1.02]'
                          : 'border-white/[0.06] hover:border-sky-400/50 hover:shadow-md'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          {isSelected && (
                            <span className="p-1 rounded-full bg-sky-500 text-white shadow-md">
                              <Check size={11} />
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[11px] text-white/95 font-bold line-clamp-1">
                            {item.title}
                          </span>
                          <span className="text-[8px] text-white/40 block">4K Ultra HD</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
      </div>

      {/* Empty State */}
      {((mediaType === 'videos' && filteredVideos.length === 0 && liveVideos.length === 0) ||
        (mediaType === 'photos' && filteredWallpapers.length === 0 && livePhotos.length === 0)) && (
        <div className="py-8 text-center text-white/40">
          <Video size={24} className="mx-auto mb-1.5 opacity-40" />
          <p className="text-xs">لم يتم العثور على وسائط تطابق بحثك</p>
        </div>
      )}
    </div>
  );
};
