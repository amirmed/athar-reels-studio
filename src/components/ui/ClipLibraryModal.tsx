import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Search,
  Volume2,
  Clock,
  Mic,
  BookOpen,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import {
  READY_CLIPS_LIBRARY,
  CLIP_CATEGORIES,
  ClipTemplate,
  buildProjectFromClipTemplate,
} from '../../data/clipLibraryData';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from './Modal';

interface ClipLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClipLibraryModal: React.FC<ClipLibraryModalProps> = ({ isOpen, onClose }) => {
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const addProject = useAppStore((s) => s.addProject);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addToast = useAppStore((s) => s.addToast);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClips = useMemo(() => {
    return READY_CLIPS_LIBRARY.filter((clip) => {
      const matchesCategory = selectedCategory === 'all' || clip.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        clip.title.toLowerCase().includes(q) ||
        clip.surahName.toLowerCase().includes(q) ||
        clip.reciterName.toLowerCase().includes(q) ||
        clip.description.toLowerCase().includes(q) ||
        clip.hashtags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleLaunchClip = (clip: ClipTemplate) => {
    const newProj = buildProjectFromClipTemplate(clip);
    addProject(newProj);
    setCurrentProject(newProj);
    addToast({
      message: `تم تحميل وتجهيز مقطع «${clip.title}» في المحرر بنجاح! ✨`,
      type: 'success',
    });
    onClose();
    setTimeout(() => {
      setCurrentPage('editor');
    }, 200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="مكتبة المقاطع الجاهزة (Clip Library) 🎬"
      subtitle="مقاطع مسبقة الصنع — فقط بدّل الخلفية أو القارئ إن أردت!"
      headerIcon={<Film size={22} className="text-gold-400" />}
      size="full"
    >
      <div className="space-y-4">
        {/* Search & Category Filter Toolbar */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المقطع، السورة، القارئ، أو الموضوع..."
              className="glass-input w-full ps-11 text-xs"
            />
            <Search
              size={18}
              className="absolute start-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {CLIP_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'btn-gold shadow-md'
                      : 'bg-surface-950 border-surface-700/40 text-surface-400 hover:text-surface-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clips Grid */}
        <div className="overflow-y-auto max-h-[55vh] custom-scrollbar pe-1">
          {filteredClips.length === 0 ? (
            <div className="py-16 text-center text-surface-400 space-y-2">
              <Film size={36} className="mx-auto opacity-30" />
              <p className="text-sm font-bold">لا توجد مقاطع مطابقة لبحثك</p>
              <p className="text-xs text-surface-500">جرّب تغيير كلمات البحث أو اختيار تصنيف آخر</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClips.map((clip) => (
                <motion.div
                  key={clip.id}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl bg-surface-900/90 border border-surface-700/40 hover:border-gold-400/40 overflow-hidden shadow-lg flex flex-col justify-between transition-all group"
                >
                  {/* Thumbnail / Video Preview Banner */}
                  <div className="relative h-36 w-full overflow-hidden bg-surface-950">
                    <img
                      src={clip.backgroundUrl}
                      alt={clip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/40 to-transparent" />

                    <div className="absolute top-2.5 end-2.5">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-surface-950/80 backdrop-blur-md text-gold-300 border border-gold-400/30">
                        {clip.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-white">
                      <div className="flex items-center gap-1.5 text-xs font-black drop-shadow-md">
                        <BookOpen size={13} className="text-gold-400" />
                        <span>سورة {clip.surahName}</span>
                      </div>
                      <span className="text-[11px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        {clip.fromAyah === clip.toAyah ? `الآية ${clip.fromAyah}` : `الآيات ${clip.fromAyah}-${clip.toAyah}`}
                      </span>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-surface-50 group-hover:text-gold-300 transition-colors line-clamp-1 mb-1">
                        {clip.title}
                      </h4>
                      <p className="text-[11px] text-surface-300 line-clamp-2 leading-relaxed bg-surface-950/60 p-2 rounded-xl border border-surface-700/30">
                        « {clip.description} »
                      </p>
                    </div>

                    {/* Metadata Chips */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-surface-400 pt-1 border-t border-surface-700/30">
                      <div className="flex items-center gap-1 bg-surface-950/80 px-2 py-0.5 rounded border border-surface-700/30">
                        <Mic size={10} className="text-gold-400" />
                        <span className="text-surface-200">{clip.reciterName}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-surface-950/80 px-2 py-0.5 rounded border border-surface-700/30">
                        <Clock size={10} className="text-sky-400" />
                        <span>{clip.estimatedDuration}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-surface-950/80 px-2 py-0.5 rounded border border-surface-700/30">
                        <Volume2 size={10} className="text-emerald-400" />
                        <span>صوت طبيعي 🌿</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchClip(clip)}
                        className="btn-gold w-full py-2.5 px-3 text-xs flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Zap size={14} className="fill-surface-950" />
                        <span>فتح وتعديل في الاستوديو 🎬</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info Ribbon */}
        <div className="p-3 border-t border-surface-700/40 flex items-center justify-between text-xs text-surface-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>
              جميع المقاطع مضبوطة الأبعاد (9:16)، وتزامن الكلمات، والتلاوة العذبة، والكابشن
              الفيروسي.
            </span>
          </div>
          <div className="font-bold text-gold-400">{filteredClips.length} مقطع متوفر</div>
        </div>
      </div>
    </Modal>
  );
};
