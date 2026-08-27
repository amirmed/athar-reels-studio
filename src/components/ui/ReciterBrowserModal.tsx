import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mic,
  Play,
  Pause,
  Check,
  Sparkles,
  Volume2,
  X,
  Star,
  Flame,
  Crown,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  everyAyahReciters,
  EveryAyahReciter,
  getEveryAyahAudioUrl,
  getAvailableSurahsForReciter,
} from '../../services/quranApi';
import { surahs } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { useHotkeys } from '../../hooks/useHotkeys';

interface ReciterBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReciterId: string;
  onSelectReciter: (reciter: EveryAyahReciter) => void;
  onSelectSurah?: (surahNumber: number) => void;
}

export const ReciterBrowserModal: React.FC<ReciterBrowserModalProps> = ({
  isOpen,
  onClose,
  selectedReciterId,
  onSelectReciter,
  onSelectSurah,
}) => {
  const addToast = useAppStore((s) => s.addToast);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<
    'all' | 'viral' | 'imams' | 'legends' | 'full' | 'warsh' | 'mujawwad'
  >('all');
  const [auditioningId, setAuditioningId] = useState<string | null>(null);
  const [expandedReciterId, setExpandedReciterId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Group reciters into categories
  const viralReciterIds = [
    'yasser_128',
    'nasser_128',
    'abdulrahman_aloosi_128',
    'idrees_128',
    'khalid_jileel_128',
    'wadih_yamani_128',
    'muhammad_luhaidan_128',
    'abdullah_mousa_128',
    'alafasy_128',
    'maher_128',
  ];
  const imamReciterIds = [
    'yasser_128',
    'sudais_192',
    'shuraim_128',
    'maher_128',
    'ali_jaber_64',
    'juhaynee_128',
    'bandar_baleela_128',
    'salah_budair_128',
    'muhsin_qasim_192',
    'hudhaify_128',
    'ayyoub_128',
  ];
  const legendReciterIds = [
    'abdulbasit_murat_192',
    'abdulbasit_mujaw',
    'minshawi_murattal',
    'minshawi_mujawwad_192',
    'husary_128',
    'husary_mujawwad_128',
    'tablaway_128',
  ];

  // Filter reciters
  const filteredReciters = useMemo(() => {
    let list = everyAyahReciters;

    if (filterCategory === 'viral') {
      list = list.filter((r) => viralReciterIds.includes(r.id));
    } else if (filterCategory === 'imams') {
      list = list.filter((r) => imamReciterIds.includes(r.id));
    } else if (filterCategory === 'legends') {
      list = list.filter((r) => legendReciterIds.includes(r.id));
    } else if (filterCategory === 'full') {
      list = list.filter((r) => r.isCompleteQuran !== false && !r.availableSurahs);
    } else if (filterCategory === 'warsh') {
      list = list.filter((r) => r.style.includes('ورش') || r.id.startsWith('warsh'));
    } else if (filterCategory === 'mujawwad') {
      list = list.filter(
        (r) => r.style.includes('مجوّد') || r.subfolder.toLowerCase().includes('mujawwad')
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.nameAr.toLowerCase().includes(q) ||
          r.nameEn.toLowerCase().includes(q) ||
          r.style.toLowerCase().includes(q)
      );
    }

    return list;
  }, [searchQuery, filterCategory]);

  // Audio sample preview (plays sample)
  const handleToggleAudition = (reciter: EveryAyahReciter, e: React.MouseEvent) => {
    e.stopPropagation();

    if (auditioningId === reciter.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setAuditioningId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const sampleUrl =
      reciter.sampleAudioUrl ||
      (reciter.serverUrl
        ? `${reciter.serverUrl}001.mp3`
        : getEveryAyahAudioUrl(reciter.subfolder, 1, 1, reciter.serverUrl, reciter.id));
    const audio = new Audio(sampleUrl);
    audioRef.current = audio;
    setAuditioningId(reciter.id);

    audio.play().catch((err) => {
      console.warn('Audio audition error:', err);
      setAuditioningId(null);
    });

    audio.onended = () => {
      setAuditioningId(null);
    };
  };

  const handleSelect = (reciter: EveryAyahReciter, chosenSurah?: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAuditioningId(null);
    onSelectReciter(reciter);
    if (chosenSurah && onSelectSurah) {
      onSelectSurah(chosenSurah);
      const sObj = surahs.find((s) => s.number === chosenSurah);
      addToast({
        message: `تم اختيار القارئ: ${reciter.nameAr} وسورة ${sObj?.name || chosenSurah} ✨`,
        type: 'success',
      });
    } else {
      addToast({ message: `تم اختيار القارئ: ${reciter.nameAr} ✨`, type: 'success' });
    }
    onClose();
  };

  const filterButtons = [
    { id: 'all', label: 'الكل (جميع القراء)', icon: <Mic size={13} /> },
    {
      id: 'viral',
      label: 'الأكثر شهرة وترند 🔥',
      icon: <Flame size={13} className="text-gold-400" />,
    },
    {
      id: 'full',
      label: 'مصحف كامل 114 سورة 🟢',
      icon: <Check size={13} className="text-emerald-400" />,
    },
    { id: 'imams', label: 'أئمة الحرمين 🕋', icon: <Star size={13} className="text-accent-400" /> },
    {
      id: 'legends',
      label: 'عمالقة التلاوة 👑',
      icon: <Crown size={13} className="text-yellow-400" />,
    },
    {
      id: 'warsh',
      label: 'رواية ورش 🌴',
      icon: <Sparkles size={13} className="text-emerald-400" />,
    },
    {
      id: 'mujawwad',
      label: 'تجويد خاشع 📜',
      icon: <Volume2 size={13} className="text-purple-400" />,
    },
  ];

  useHotkeys(
    'Escape',
    () => {
      if (audioRef.current) audioRef.current.pause();
      onClose();
    },
    { enabled: isOpen }
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="تصفح واختيار قراء القرآن الكريم"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            onClose();
          }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl bg-surface-950/95 border border-white/[0.1] shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-gradient-to-r from-accent-500/10 via-gold-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-500 to-gold-500 flex items-center justify-center text-white shadow-lg shadow-accent-500/25">
                <Mic size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    مكتبة كبار قراء العالم الإسلامي
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-300 font-bold border border-accent-500/30">
                    {everyAyahReciters.length} قارئ ورواية
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  تصفح القراء، واعرف السور المسجلة لكل قارئ مع ميزة الاستماع التجريبي الفوري
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-surface-800/60 hover:bg-surface-700 text-white/60 hover:text-white flex items-center justify-center border border-white/[0.06] transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Controls: Search & Category Chips */}
          <div className="p-4 border-b border-white/[0.06] space-y-3 bg-surface-900/40">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم: عبد الرحمن مسعد، شريف مصطفى، إسلام صبحي، ياسر الدوسري، عبد الباسط..."
                className="glass-input w-full pr-10 pl-4 py-2.5 text-xs rounded-xl no-drag select-text cursor-text"
              />
              <Search size={16} className="absolute right-3 top-3 text-white/40" />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {filterButtons.map((fb) => (
                <button
                  key={fb.id}
                  onClick={() => setFilterCategory(fb.id as 'all' | 'viral' | 'imams' | 'legends' | 'full' | 'warsh' | 'mujawwad')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer ${
                    filterCategory === fb.id
                      ? 'bg-accent-500 text-white border-accent-400 shadow-md shadow-accent-500/20'
                      : 'bg-surface-800/80 hover:bg-surface-700 text-white/60 hover:text-white border-white/[0.04]'
                  }`}
                >
                  {fb.icon}
                  <span>{fb.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reciter Grid */}
          <div className="p-5 flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredReciters.map((reciter) => {
              const isSelected = selectedReciterId === reciter.id;
              const isAuditioning = auditioningId === reciter.id;
              const isExpanded = expandedReciterId === reciter.id;
              const availableSurahsList = getAvailableSurahsForReciter(reciter.id);
              const isFullQuran = reciter.isCompleteQuran !== false && !reciter.availableSurahs;

              return (
                <div
                  key={reciter.id}
                  className={`group relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-accent-500/15 border-accent-400 shadow-lg shadow-accent-500/15'
                      : 'bg-surface-900/60 hover:bg-surface-800/80 border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div>
                    <div
                      onClick={() => handleSelect(reciter)}
                      className="flex items-start justify-between gap-2.5 mb-2.5 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-surface-800 to-surface-700 border border-white/[0.08] flex items-center justify-center text-white/80 group-hover:scale-105 group-hover:text-gold-400 transition-all shrink-0 shadow-inner">
                          <Mic size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-white group-hover:text-gold-300 transition-colors truncate">
                            {reciter.nameAr}
                          </h4>
                          <p className="text-[11px] text-white/40 truncate font-sans">
                            {reciter.nameEn}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-accent-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Check size={13} />
                        </span>
                      )}
                    </div>

                    {/* Surahs Availability & Style Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-800 text-gold-300 font-bold border border-white/[0.04]">
                        {reciter.style}
                      </span>
                      {isFullQuran ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1">
                          <span>🟢 114 سورة كاملة</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 flex items-center gap-1">
                          <span>🟡 {availableSurahsList.length} سورة مسجلة</span>
                        </span>
                      )}
                    </div>

                    {/* Expandable Available Surahs List */}
                    {!isFullQuran && (
                      <div className="mb-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedReciterId(isExpanded ? null : reciter.id);
                          }}
                          className="w-full text-[11px] py-1 px-2 rounded-lg bg-surface-950/60 hover:bg-gold-500/10 text-gold-300/90 hover:text-gold-300 border border-gold-500/20 flex items-center justify-between font-bold transition-all cursor-pointer"
                        >
                          <span className="flex items-center gap-1">
                            <BookOpen size={11} />
                            <span>تصفح سور القارئ المتاحة ({availableSurahsList.length} سورة)</span>
                          </span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-1.5 p-2 rounded-xl bg-surface-950 border border-white/10 max-h-36 overflow-y-auto space-y-1"
                          >
                            <p className="text-[10px] text-white/50 mb-1 font-bold">
                              انقر لاختيار السورة فوراً مع القارئ:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {availableSurahsList.map((sNum) => {
                                const sObj = surahs.find((s) => s.number === sNum);
                                return (
                                  <button
                                    key={sNum}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelect(reciter, sNum);
                                    }}
                                    className="px-1.5 py-0.5 rounded-md bg-surface-800 hover:bg-gold-500/20 text-white/80 hover:text-gold-300 text-[10px] font-bold border border-white/[0.04] transition-all cursor-pointer"
                                  >
                                    {sNum}. {sObj?.name || `سورة ${sNum}`}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] mt-1">
                    <button
                      type="button"
                      onClick={() => handleSelect(reciter)}
                      className="text-[11px] text-accent-400 hover:text-accent-300 font-bold hover:underline cursor-pointer"
                    >
                      اختيار القارئ ✓
                    </button>

                    {/* Play Sample Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleAudition(reciter, e)}
                      className={`py-1 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isAuditioning
                          ? 'bg-gold-400 text-black shadow-md shadow-gold-500/30 animate-pulse'
                          : 'bg-surface-800 hover:bg-gold-400/20 text-white/70 hover:text-gold-300 border border-white/[0.06]'
                      }`}
                      title="استماع لتلاوة تجريبية"
                    >
                      {isAuditioning ? <Pause size={10} /> : <Play size={10} />}
                      <span>{isAuditioning ? 'إيقاف' : 'استماع'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
