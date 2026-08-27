import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Search,
  Volume2,
  Clock,
  Mic,
  BookOpen,
  X,
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
import { useHotkeys } from '../../hooks/useHotkeys';

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
    const project = buildProjectFromClipTemplate(clip);
    addProject(project);
    setCurrentProject(project);
    addToast({
      message: `تم تجهيز المقطع الجاهز: "${clip.title}" بنجاح! 🎬✨`,
      type: 'success',
    });
    onClose();
    setTimeout(() => {
      setCurrentPage('editor');
    }, 200);
  };

  useHotkeys('Escape', onClose, { enabled: isOpen });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 md:p-6 select-none font-arabic"
        role="dialog"
        aria-modal="true"
        aria-label="مكتبة المقاطع الجاهزة"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="w-full max-w-5xl bg-surface-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-surface-900/90 relative">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gold-500 to-amber-500 flex items-center justify-center text-surface-950 shadow-lg shadow-gold-500/20">
                <Film size={24} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-white flex items-center gap-2">
                  <span>مكتبة المقاطع الجاهزة (Clip Library) 🎬</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 font-bold border border-gold-400/30">
                    جاهزة 100% للنشر
                  </span>
                </h2>
                <p className="text-xs text-white/50 mt-0.5">
                  مقاطع مسبقة الصنع للأذكار، الجمعة، والأدعية — فقط بدّل الخلفية أو القارئ إن أردت!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-800/80 hover:bg-surface-700 text-white/60 hover:text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search & Category Tabs */}
          <div className="p-4 border-b border-white/5 bg-surface-900/40 space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، السورة، القارئ، أو الهاشتاج (مثل: أذكار الصباح، الكهف، الدوسري)..."
                className="w-full pr-10 pl-4 py-2.5 bg-surface-950 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-gold-400/60 transition-all text-right"
                dir="rtl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {CLIP_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-surface-950 shadow-md shadow-gold-500/20 font-extrabold'
                        : 'bg-surface-900 text-white/60 hover:text-white hover:bg-surface-800 border border-white/5'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clips Grid Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            {filteredClips.length === 0 ? (
              <div className="py-16 text-center text-white/40 space-y-3">
                <Film size={40} className="mx-auto opacity-30" />
                <p className="text-sm">لم يتم العثور على مقاطع مطابقة لبحثك</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="text-xs text-gold-400 hover:underline"
                >
                  عرض جميع المقاطع
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClips.map((clip) => (
                  <motion.div
                    key={clip.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-surface-900/70 border border-white/10 hover:border-gold-400/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-gold-500/10 relative"
                  >
                    {/* Top Image Preview Banner */}
                    <div className="relative h-40 overflow-hidden bg-surface-950">
                      <img
                        src={clip.backgroundUrl}
                        alt={clip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/40 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-surface-950/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white flex items-center gap-1">
                          <span>{clip.categoryIcon}</span>
                          <span>{clip.categoryLabel}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gold-500 text-surface-950 text-[11px] font-extrabold shadow-sm">
                          {clip.badge}
                        </span>
                      </div>

                      {/* Bottom Info on Image */}
                      <div className="absolute bottom-2 right-3 left-3 text-right">
                        <div className="text-xs font-mono text-gold-300 font-bold flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <BookOpen size={11} />
                            <span>
                              سورة {clip.surahName} (
                              {clip.fromAyah === clip.toAyah
                                ? `آية ${clip.fromAyah}`
                                : `الآيات ${clip.fromAyah}-${clip.toAyah}`}
                              )
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div
                      className="p-4 space-y-3 flex-1 flex flex-col justify-between text-right"
                      dir="rtl"
                    >
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-sm text-white group-hover:text-gold-300 transition-colors line-clamp-1">
                          {clip.title}
                        </h3>
                        <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                          {clip.description}
                        </p>
                      </div>

                      {/* Metadata Chips */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-white/50 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-1 bg-surface-950/80 px-2 py-0.5 rounded border border-white/5">
                          <Mic size={10} className="text-gold-400" />
                          <span className="text-white/80">{clip.reciterName}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-surface-950/80 px-2 py-0.5 rounded border border-white/5">
                          <Clock size={10} className="text-sky-400" />
                          <span>{clip.estimatedDuration}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-surface-950/80 px-2 py-0.5 rounded border border-white/5">
                          <Volume2 size={10} className="text-emerald-400" />
                          <span>صوت طبيعي 🌿</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLaunchClip(clip)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-surface-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-gold-500/20 active:scale-95 transition-all cursor-pointer"
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
          <div className="p-3.5 border-t border-white/10 bg-surface-900/80 flex items-center justify-between text-xs text-white/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>
                جميع المقاطع مضبوطة الأبعاد (9:16)، وتزامن الكلمات، والتلاوة العذبة، والكابشن
                الفيروسي.
              </span>
            </div>
            <div className="font-bold text-gold-400">{filteredClips.length} مقطع متوفر</div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
