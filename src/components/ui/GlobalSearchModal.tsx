import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  BookOpen,
  Mic,
  FolderOpen,
  PlusCircle,
  Settings,
  Sparkles,
  BookHeart,
  Image as ImageIcon,
  Flame,
  Home,
  Sun,
  Moon,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { surahs } from '../../data/mockData';
import { everyAyahReciters } from '../../services/quranApi';
import { Page } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMotherDua?: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onOpenMotherDua,
}) => {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const projects = useAppStore((s) => s.projects);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const theme = useAppStore((s) => s.theme);
  const addToast = useAppStore((s) => s.addToast);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static Quick Pages
  const pagesList = [
    {
      id: 'dashboard',
      label: 'الرئيسية ولوحة التحكم',
      icon: <Home size={16} />,
      category: 'الصفحات',
    },
    {
      id: 'create',
      label: 'إنشاء ريل مخصص جديد',
      icon: <PlusCircle size={16} />,
      category: 'الصفحات',
    },
    {
      id: 'azkar',
      label: 'استوديو الأذكار والأحاديث',
      icon: <BookHeart size={16} />,
      category: 'الصفحات',
    },
    {
      id: 'quotes',
      label: 'استوديو كروت وبوستات الصور',
      icon: <ImageIcon size={16} />,
      category: 'الصفحات',
    },
    {
      id: 'projects',
      label: 'مشاريعي المحفوظة',
      icon: <FolderOpen size={16} />,
      category: 'الصفحات',
    },
    {
      id: 'settings',
      label: 'الإعدادات العامة واللغات',
      icon: <Settings size={16} />,
      category: 'الصفحات',
    },
    {
      id: 'welcome',
      label: 'صفحة البداية والترحيب',
      icon: <Sparkles size={16} />,
      category: 'الصفحات',
    },
  ];

  // Filter items based on query
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'سور قرآنية' | 'قراء وأصوات' | 'مشاريعي' | 'صفحات وأدوات' | 'إجراءات سريعة';
      icon: React.ReactNode;
      action: () => void;
    }> = [];

    // Quick Actions
    results.push({
      id: 'action-theme',
      title:
        theme === 'dark'
          ? 'التحويل إلى الوضع الفاتح (Light Mode)'
          : 'التحويل إلى الوضع الداكن (Dark Mode)',
      subtitle: 'تبديل مظهر واجهة التطبيق',
      category: 'إجراءات سريعة',
      icon:
        theme === 'dark' ? (
          <Sun size={16} className="text-amber-400" />
        ) : (
          <Moon size={16} className="text-sky-400" />
        ),
      action: () => {
        toggleTheme();
        onClose();
      },
    });

    // 1. Pages
    pagesList.forEach((p) => {
      results.push({
        id: `page-${p.id}`,
        title: p.label,
        subtitle: `الانتقال إلى ${p.label}`,
        category: 'صفحات وأدوات',
        icon: p.icon,
        action: () => {
          setCurrentPage(p.id as Page);
          onClose();
        },
      });
    });

    // 2. User Projects
    projects.forEach((proj) => {
      results.push({
        id: `proj-${proj.id}`,
        title: proj.name,
        subtitle: `مشروع: ${proj.surah || 'ريل إسلامي'} (آيات ${proj.fromAyah} - ${proj.toAyah})`,
        category: 'مشاريعي',
        icon: <FolderOpen size={16} className="text-gold-400" />,
        action: () => {
          setCurrentProject(proj);
          setCurrentPage('editor');
          onClose();
        },
      });
    });

    // 3. Surahs (All 114 Surahs)
    surahs.forEach((s: any) => {
      results.push({
        id: `surah-${s.number}`,
        title: `سورة ${s.name} (${s.englishName})`,
        subtitle: `رقم ${s.number} • ${s.numberOfAyahs} آية • ${s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}`,
        category: 'سور قرآنية',
        icon: <BookOpen size={16} className="text-emerald-400" />,
        action: () => {
          setCurrentPage('create');
          addToast({ message: `تم اختيار سورة ${s.name} للبدء ✨`, type: 'info' });
          onClose();
        },
      });
    });

    // 4. Reciters
    everyAyahReciters.forEach((r) => {
      results.push({
        id: `reciter-${r.id}`,
        title: r.nameAr,
        subtitle: `${r.nameEn} • ${r.style} • ${r.bitrate}`,
        category: 'قراء وأصوات',
        icon: <Mic size={16} className="text-accent-400" />,
        action: () => {
          setCurrentPage('create');
          addToast({ message: `تم اختيار القارئ: ${r.nameAr} 🎙️`, type: 'info' });
          onClose();
        },
      });
    });

    if (!q) {
      // Return top suggestions when empty
      return results.slice(0, 8);
    }

    return results
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [query, projects, theme]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          searchResults[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 text-right select-none"
        role="dialog"
        aria-modal="true"
        aria-label="البحث الشامل والأوامر السريعة"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Search Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-surface-900 border border-white/[0.1] rounded-3xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[75vh]"
        >
          {/* Search Input Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center gap-3 bg-surface-950/60">
            <Search size={20} className="text-gold-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="ابحث عن سورة، قارئ، مشروع، صفحة أو أمر سريع..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
            <div className="px-2 py-1 rounded-lg bg-surface-800 border border-white/[0.06] text-[11px] font-bold text-white/50">
              ESC للإغلاق
            </div>
          </div>

          {/* Results List */}
          <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
            {searchResults.length === 0 ? (
              <div className="py-12 text-center text-white/40 text-xs">
                لا توجد نتائج تطابق "{query}"
              </div>
            ) : (
              searchResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-right ${
                      isSelected
                        ? 'bg-gold-500/15 border border-gold-400/40 text-white shadow-sm'
                        : 'hover:bg-white/[0.04] border border-transparent text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-gold-400/20 text-gold-300'
                            : 'bg-surface-800 text-white/60'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{item.title}</div>
                        <div className="text-xs text-white/45 truncate mt-0.5">{item.subtitle}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                        isSelected
                          ? 'bg-gold-400/20 text-gold-300'
                          : 'bg-white/[0.06] text-white/50'
                      }`}
                    >
                      {item.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Search Footer */}
          <div className="px-4 py-2.5 bg-surface-950/80 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-4">
              <span>
                استخدم الأسهم <strong>↑ ↓</strong> للتنقل
              </span>
              <span>
                <strong>Enter</strong> للاختيار
              </span>
            </div>
            <div className="flex items-center gap-1 text-gold-400 font-bold">
              <Sparkles size={12} />
              <span>أَثَــر ستوديو البحث الشامل</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
