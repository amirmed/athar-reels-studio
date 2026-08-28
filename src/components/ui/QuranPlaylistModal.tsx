import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Play } from 'lucide-react';
import {
  MOOD_CATEGORIES,
  QURAN_PLAYLISTS,
  MoodCategory,
  QuranPlaylistItem,
} from '../../data/quranPlaylists';
import { Modal } from './Modal';

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

  const currentCategoryMeta =
    MOOD_CATEGORIES.find((c) => c.id === activeCategory) || MOOD_CATEGORIES[0];
  const filteredPlaylists = QURAN_PLAYLISTS.filter((p) => p.category === activeCategory);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="مكتبة المقاطع القرآنية حسب المشاعر والاحتياج"
      subtitle="مقاطع قرآنية جاهزة بتصميم سينمائي وقراء مختارين للتطبيق بضغطة واحدة"
      headerIcon={<BookOpen size={20} className="text-gold-400" />}
      size="xl"
    >
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
        <div className="p-3 rounded-xl bg-surface-950/70 border border-white/[0.06] flex items-center justify-between text-xs text-white/60">
          <span>{currentCategoryMeta.description}</span>
          <span className="font-bold text-gold-400 shrink-0 mr-2">
            {filteredPlaylists.length} مقاطع مختارة ✦
          </span>
        </div>

        {/* Playlist Cards List */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
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
                className="btn-gold w-full sm:w-auto px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md shrink-0"
              >
                <Sparkles size={14} />
                <span>تطبيق هذا المقطع ⚡</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
