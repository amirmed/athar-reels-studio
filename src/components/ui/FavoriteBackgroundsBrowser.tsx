import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Star,
  Trash2,
  Image as ImageIcon,
  Film,
  Play,
  Check,
  Search,
  Loader2,
} from 'lucide-react';
import {
  getAllFavoriteBackgrounds,
  deleteFavoriteBackground,
  saveFavoriteBackground,
  FavoriteBackground,
} from '../../services/persistentBackgroundStorage';
import { isVideoMedia } from '../../utils/imageUtils';
import { useTranslation } from '../../i18n';
import { EmptyState } from './EmptyState';

interface FavoriteBackgroundsBrowserProps {
  onSelectBackground: (url: string) => void;
  selectedUrl?: string;
  currentActiveUrl?: string;
  addToast?: (toast: { message: string; type?: 'success' | 'error' | 'info' | 'warning' }) => void;
}

export const FavoriteBackgroundsBrowser: React.FC<FavoriteBackgroundsBrowserProps> = ({
  onSelectBackground,
  selectedUrl,
  currentActiveUrl,
  addToast,
}) => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<FavoriteBackground[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getAllFavoriteBackgrounds();
      setFavorites(items);
    } catch (e) {
      console.warn('[FavoriteBackgroundsBrowser] Error loading favorites:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const filteredFavorites = useMemo(() => {
    return favorites.filter((item) => {
      if (filterType !== 'all' && item.mediaType !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return item.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [favorites, filterType, searchQuery]);

  const isCurrentActiveFavorited = useMemo(() => {
    if (!currentActiveUrl) return false;
    return favorites.some((f) => f.url === currentActiveUrl || f.previewUrl === currentActiveUrl);
  }, [favorites, currentActiveUrl]);

  const handleSaveCurrentActive = async () => {
    if (!currentActiveUrl) return;
    if (isCurrentActiveFavorited) {
      addToast?.({
        message: t('editor.bgAlreadyInFavorites', 'هذه الخلفية موجودة بالفعل في المفضلة ✓'),
        type: 'info',
      });
      return;
    }

    setIsSavingCurrent(true);
    try {
      const isVideo = isVideoMedia(currentActiveUrl);
      await saveFavoriteBackground({
        url: currentActiveUrl,
        previewUrl: currentActiveUrl,
        mediaType: isVideo ? 'video' : 'image',
        title: isVideo
          ? t('editor.bgCustomVideo', 'فيديو مخصص')
          : t('editor.bgCustomImage', 'خلفية مخصصة'),
        source: 'custom',
      });
      await loadFavorites();
      addToast?.({
        message: t('editor.bgAddedToFavorites', 'تمت إضافة الخلفية إلى مكتبة المفضلة بنجاح ⭐'),
        type: 'success',
      });
    } catch (e) {
      console.warn('[FavoriteBackgroundsBrowser] Error saving favorite:', e);
    } finally {
      setIsSavingCurrent(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteFavoriteBackground(id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      addToast?.({
        message: t('editor.bgRemovedFromFavorites', 'تم حذف الخلفية من المفضلة 🗑️'),
        type: 'info',
      });
    } catch (e) {
      console.warn('[FavoriteBackgroundsBrowser] Error deleting favorite:', e);
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in">
      {/* 🌟 1-Click Action to Save Current Active Background */}
      {currentActiveUrl && (
        <button
          type="button"
          onClick={handleSaveCurrentActive}
          disabled={isCurrentActiveFavorited || isSavingCurrent}
          className={`w-full p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-sm ${
            isCurrentActiveFavorited
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 opacity-80 cursor-default'
              : 'bg-gradient-to-r from-amber-500/20 to-gold-500/20 hover:from-amber-500/30 hover:to-gold-500/30 border-amber-500/40 text-amber-200 active:scale-95'
          }`}
        >
          {isSavingCurrent ? (
            <Loader2 size={15} className="animate-spin text-amber-400" />
          ) : (
            <Star
              size={15}
              className={isCurrentActiveFavorited ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}
            />
          )}
          <span>
            {isCurrentActiveFavorited
              ? t('editor.bgAlreadyInFavorites', 'الخلفية الحالية محفوظة في المفضلة ✓')
              : t('editor.bgSaveCurrentToFavorites', '⭐ حفظ الخلفية الحالية في مكتبة المفضلة')}
          </span>
        </button>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search', 'بحث في المفضلة...')}
            className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-surface-900 border border-surface-700/40 text-xs text-surface-50 placeholder-surface-500 focus:outline-none focus:border-gold-400"
          />
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-surface-900 rounded-xl border border-surface-700/40 shrink-0">
          {[
            { id: 'all' as const, label: t('editor.filterAll', 'الكل') },
            { id: 'image' as const, label: '🖼️' },
            { id: 'video' as const, label: '🎬' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-amber-500 text-onbrand shadow-sm'
                  : 'text-surface-400 hover:text-surface-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Gallery Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-surface-400 gap-2">
          <Loader2 size={24} className="animate-spin text-amber-400" />
          <span className="text-xs">{t('editor.bgFavoritesLoading', 'جاري تحميل المفضلة...')}</span>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <EmptyState
          variant={searchQuery || filterType !== 'all' ? 'search' : 'default'}
          title={
            searchQuery || filterType !== 'all'
              ? t('editor.noMatchingFavorites', 'لا توجد خلفيات مفضلة مطابقة')
              : t('editor.bgFavoritesEmpty', 'لا توجد خلفيات في المفضلة بعد')
          }
          description={
            searchQuery || filterType !== 'all'
              ? 'جرّب تعديل كلمة البحث أو فلتر النوع للوصول للخلفية المطلوبة.'
              : t(
                  'editor.bgFavoritesEmptyDesc',
                  'احفظ أي خلفية من Pexels أو الذكاء الاصطناعي أو الرفع لتصل إليها في جميع مشاريعك بنقرة واحدة.'
                )
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto custom-scrollbar p-0.5">
          {filteredFavorites.map((item) => {
            const isSelected = selectedUrl === item.url || (selectedUrl && selectedUrl === item.previewUrl);
            const isVideo = item.mediaType === 'video' || isVideoMedia(item.url);

            return (
              <div
                key={item.id}
                onClick={() => onSelectBackground(item.url)}
                onMouseEnter={() => isVideo && setHoveredVideoId(item.id)}
                onMouseLeave={() => isVideo && setHoveredVideoId(null)}
                className={`group relative rounded-xl overflow-hidden aspect-[9/16] cursor-pointer border-2 transition-all shadow-md bg-surface-950 ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/30 scale-[1.01]'
                    : 'border-surface-700/40 hover:border-amber-400/60 hover:scale-[1.02]'
                }`}
              >
                {/* Media Content */}
                {isVideo ? (
                  hoveredVideoId === item.id ? (
                    <video
                      src={item.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : item.previewUrl && !item.previewUrl.endsWith('.mp4') ? (
                    <img
                      src={item.previewUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-900 text-surface-400 gap-1">
                      <Film size={20} className="text-sky-400" />
                      <span className="text-[10px]">{t('editor.bgTypeVideo', 'فيديو')}</span>
                    </div>
                  )
                ) : (
                  <img
                    src={item.previewUrl || item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Media Type Badge */}
                <div className="absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded-md bg-black/80 border border-white/10 text-[10px] font-bold text-white flex items-center gap-1 z-10">
                  {isVideo ? <Film size={10} className="text-sky-400" /> : <ImageIcon size={10} className="text-amber-400" />}
                  <span>{isVideo ? t('editor.bgTypeVideo', 'فيديو') : t('editor.bgTypeImage', 'صورة')}</span>
                </div>

                {/* Top End Actions & Status */}
                <div className="absolute top-1.5 end-1.5 flex items-center gap-1 z-10">
                  {/* Selected Checkmark Badge */}
                  {isSelected && (
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-onbrand flex items-center justify-center shadow-lg font-black">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}

                  {/* Delete Button (Discoverable and larger touch target) */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    title={t('editor.bgDeleteFromFavorites', 'حذف من المفضلة')}
                    aria-label={t('editor.bgDeleteFromFavorites', 'حذف من المفضلة')}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/80 hover:bg-red-600 text-white/80 hover:text-white flex items-center justify-center transition-all opacity-75 hover:opacity-100 shadow-md cursor-pointer active:scale-90"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Title and Action at bottom */}
                <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between text-start pointer-events-none">
                  <span className="text-[10px] font-bold text-white truncate max-w-[85%]">
                    {item.title}
                  </span>
                  {isVideo && hoveredVideoId !== item.id && (
                    <Play size={10} className="text-white/80 fill-white/80 shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
