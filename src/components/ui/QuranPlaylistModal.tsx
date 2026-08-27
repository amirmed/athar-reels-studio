import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen, Play, Heart, Moon, Zap, Check } from 'lucide-react';
import {
  MOOD_CATEGORIES,
  QURAN_PLAYLISTS,
  MoodCategory,
  QuranPlaylistItem,
} from '../../data/quranPlaylists';
import { useHotkeys } from '../../hooks/useHotkeys';

interface QuranPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlaylist: (item: QuranPlaylistItem) => void;
}

export const QuranPlaylistModal: React.FC<QuranPlaylistModalProps> = ({
  isOpen,
  onClose,
  onSelectPlaylist,
}) => {
  const [activeCategory, setActiveCategory] = useState<MoodCategory>('peace');

  useHotkeys('Escape', onClose, { enabled: isOpen });

  if (!isOpen) return null;

  const currentCategoryMeta =
    MOOD_CATEGORIES.find((c) => c.id === activeCategory) || MOOD_CATEGORIES[0];
  const filteredPlaylists = QURAN_PLAYLISTS.filter((p) => p.category === activeCategory);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label="قوائم التلاوات القرآنية المختارة"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-3xl bg-surface-900 border border-gold-500/30 rounded-3xl p-6 shadow-2xl shadow-gold-500/10 flex flex-col text-right max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-800 hover:bg-surface-700 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5 justify-end">
                  <span>مكتبة المقاطع القرآنية حسب المشاعر والاحتياج</span>
                  <BookOpen size={18} className="text-gold-400" />
                </h3>
                <p className="text-xs text-white/50">
                  مقاطع قرآنية جاهزة بتصميم سينمائي وقراء مختارين للتطبيق بضغطة واحدة
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gold-500/20 text-gold-400 flex items-center justify-center shrink-0">
                <Sparkles size={22} />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
            {MOOD_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-surface-800 border-gold-400/60 shadow-lg shadow-gold-500/10 -translate-y-0.5'
                    : 'bg-surface-950/60 border-white/[0.06] text-white/50 hover:text-white hover:bg-surface-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">{cat.icon}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${cat.accentColor}20`,
                      color: cat.accentColor,
                    }}
                  >
                    {cat.badge}
                  </span>
                </div>
                <div>
                  <h4
                    className={`text-xs font-bold ${activeCategory === cat.id ? 'text-white' : 'text-white/70'}`}
                  >
                    {cat.name}
                  </h4>
                </div>
              </button>
            ))}
          </div>

          {/* Category Description Banner */}
          <div className="p-3 rounded-xl bg-surface-950/70 border border-white/[0.06] mb-3 flex items-center justify-between text-xs text-white/60">
            <span>{currentCategoryMeta.description}</span>
            <span className="font-bold text-gold-400 shrink-0 mr-2">
              {filteredPlaylists.length} مقاطع مختارة ✦
            </span>
          </div>

          {/* Playlist Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {filteredPlaylists.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-surface-950/90 border border-white/[0.08] hover:border-gold-400/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="w-16 h-16 rounded-xl overflow-hidden relative border border-white/[0.1] shrink-0">
                    <img
                      src={item.backgroundUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play size={16} className="text-white opacity-80" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-gold-500/15 border border-gold-400/30 text-gold-300 text-[11px] font-bold">
                        {item.themeBadge}
                      </span>
                      <span className="text-[11px] text-white/40">{item.subtitle}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-gold-300 transition-colors">
                      {item.title}
                    </h4>

                    <p className="text-xs text-white/60 mt-0.5">
                      القارئ: <strong className="text-sky-300">{item.reciterName}</strong> • الآيات
                      ({item.fromAyah} - {item.toAyah})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectPlaylist(item);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-surface-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-gold-500/15 transition-all hover:scale-102 active:scale-98 shrink-0 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>تطبيق هذا المقطع ⚡</span>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
