import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  RefreshCw,
  Search,
  Link,
  Loader2,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface MediaUploaderProps {
  type: 'image' | 'video' | 'both';
  currentFile?: string;
  onUpload: (filePath: string) => void;
  onRemove: () => void;
  label?: string;
}

// Curated Islamic/nature background categories for search
const BACKGROUND_CATEGORIES = [
  { id: 'mosque', label: 'مساجد', query: 'mosque islamic architecture' },
  { id: 'nature', label: 'طبيعة', query: 'beautiful nature landscape' },
  { id: 'sky', label: 'سماء', query: 'beautiful sky clouds' },
  { id: 'abstract', label: 'تجريدي', query: 'dark abstract background' },
  { id: 'stars', label: 'نجوم', query: 'stars night sky galaxy' },
  { id: 'ocean', label: 'بحر', query: 'ocean sea water' },
  { id: 'mountain', label: 'جبال', query: 'mountain landscape' },
  { id: 'desert', label: 'صحراء', query: 'desert sand dunes' },
  { id: 'forest', label: 'غابة', query: 'forest trees green' },
  { id: 'flowers', label: 'زهور', query: 'flowers botanical' },
];

function getPicsumUrl(seed: string, width = 1080, height = 1920): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  type,
  currentFile,
  onUpload,
  onRemove,
  label,
}) => {
  const addToast = useAppStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());

  // Clean up any blob URLs created by this component on unmount
  useEffect(() => {
    return () => {
      createdBlobUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      createdBlobUrlsRef.current.clear();
    };
  }, []);

  const revokeOldBlobUrl = useCallback((url?: string) => {
    if (url && url.startsWith('blob:') && createdBlobUrlsRef.current.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
      createdBlobUrlsRef.current.delete(url);
    }
  }, []);

  const [mode, setMode] = useState<'upload' | 'url' | 'search'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const acceptMimeTypes =
    type === 'image'
      ? 'image/jpeg,image/png,image/webp,image/jpg,image/gif'
      : type === 'video'
        ? 'video/mp4,video/webm,video/quicktime,video/x-matroska'
        : 'image/jpeg,image/png,image/webp,image/jpg,image/gif,video/mp4,video/webm,video/quicktime';

  const processFile = useCallback(
    async (file: File) => {
      setIsReadingFile(true);
      try {
        // If Electron provides native file path
        const electronPath = (file as File & { path?: string }).path;
        if (electronPath && typeof electronPath === 'string' && electronPath.length > 3) {
          revokeOldBlobUrl(currentFile);
          onUpload(electronPath);
          addToast({ message: `تم تحميل ملف "${file.name}" بنجاح 📁✨`, type: 'success' });
          setIsReadingFile(false);
          return;
        }

        // For images under 15MB: convert to Base64 DataURL for persistent storage across app reload
        if (file.type.startsWith('image/') && file.size < 15 * 1024 * 1024) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
              revokeOldBlobUrl(currentFile);
              onUpload(dataUrl);
              addToast({ message: `تم رفع الصورة "${file.name}" بنجاح 🖼️✨`, type: 'success' });
            }
            setIsReadingFile(false);
          };
          reader.onerror = () => {
            revokeOldBlobUrl(currentFile);
            const blobUrl = URL.createObjectURL(file);
            createdBlobUrlsRef.current.add(blobUrl);
            onUpload(blobUrl);
            setIsReadingFile(false);
          };
          reader.readAsDataURL(file);
        } else {
          // For videos or large media: use ObjectURL
          revokeOldBlobUrl(currentFile);
          const blobUrl = URL.createObjectURL(file);
          createdBlobUrlsRef.current.add(blobUrl);
          onUpload(blobUrl);
          addToast({ message: `تم رفع وتعيين "${file.name}" كخلفية بنجاح 🎬✨`, type: 'success' });
          setIsReadingFile(false);
        }
      } catch (err) {
        console.error('[MediaUploader] File read error:', err);
        addToast({ message: 'حدث خطأ أثناء قراءة الملف، حاول مرة أخرى', type: 'error' });
        setIsReadingFile(false);
      }
    },
    [onUpload, addToast, currentFile, revokeOldBlobUrl]
  );

  const handleUploadClick = useCallback(async () => {
    // 1. Try native Electron dialog if available
    if (window.electronAPI?.dialog?.openFile) {
      try {
        const filters =
          type === 'image'
            ? [{ name: 'صور', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
            : type === 'video'
              ? [{ name: 'فيديو', extensions: ['mp4', 'mov', 'avi', 'mkv'] }]
              : [
                  {
                    name: 'وسائط',
                    extensions: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi'],
                  },
                ];

        const filePath = await window.electronAPI.dialog.openFile({ filters });
        if (filePath) {
          onUpload(filePath);
          addToast({ message: 'تم اختيار وتحميل ملف الخلفية بنجاح 🎬', type: 'success' });
          return;
        }
      } catch (e) {
        console.warn('[MediaUploader] Electron openFile error, falling back to input:', e);
      }
    }

    // 2. Standard HTML5 File Input Trigger
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, [type, onUpload, addToast]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onUpload(urlInput.trim());
      addToast({ message: 'تم تطبيق رابط الخلفية بنجاح 🌐✨', type: 'success' });
      setUrlInput('');
      setMode('upload');
    }
  };

  const handleSearchFromCategory = (category: (typeof BACKGROUND_CATEGORIES)[0]) => {
    setSelectedCategory(category.id);
    setIsSearching(true);
    setSearchQuery(category.query);

    const results: string[] = [];
    for (let i = 0; i < 8; i++) {
      results.push(getPicsumUrl(`${category.id}-${i}`, 1080, 1920));
    }
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleCustomSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSelectedCategory('');

    const results: string[] = [];
    for (let i = 0; i < 8; i++) {
      results.push(getPicsumUrl(`${searchQuery}-${i}`, 1080, 1920));
    }
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectBackground = (url: string) => {
    onUpload(url);
    addToast({ message: 'تم تطبيق الخلفية المختارة بنجاح 🎨', type: 'success' });
    setSearchResults([]);
    setMode('upload');
  };

  const isCurrentVideo =
    currentFile &&
    (/\.(mp4|webm|mov|ogg|mkv)$/i.test(currentFile) || currentFile.startsWith('data:video/'));

  const typeLabels = {
    image: 'صورة',
    video: 'فيديو',
    both: 'صورة أو فيديو',
  };

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}

      {/* Hidden File Input for 100% Reliable Cross-Platform Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptMimeTypes}
        onChange={handleFileInputChange}
        className="hidden"
        style={{ display: 'none' }}
      />

      {currentFile ? (
        <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-surface-800/60 shadow-lg">
          {/* Media Preview (Video or Image) */}
          <div className="h-32 bg-gradient-to-br from-surface-700 to-surface-850 flex items-center justify-center overflow-hidden relative group">
            {isCurrentVideo ? (
              <video
                src={currentFile}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentFile}
                alt="خلفية"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white/80 font-bold border border-white/10 flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-400" />
              <span>خلفية نشطة</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 p-2 bg-surface-900/80 backdrop-blur-sm border-t border-white/[0.06]">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isReadingFile}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-surface-750 text-white/70 text-xs hover:bg-surface-700 hover:text-white font-medium transition-all cursor-pointer"
            >
              {isReadingFile ? (
                <Loader2 size={13} className="animate-spin text-gold-400" />
              ) : (
                <RefreshCw size={12} />
              )}
              <span>استبدال من جهازي</span>
            </button>
            <button
              type="button"
              onClick={() => {
                revokeOldBlobUrl(currentFile);
                onRemove();
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 font-medium transition-colors cursor-pointer"
            >
              <X size={13} />
              <span>حذف</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-surface-800/40 rounded-xl border border-white/[0.04]">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'upload'
                  ? 'bg-gradient-to-r from-accent-500/20 to-sky-500/20 text-accent-300 border border-accent-500/30 shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Upload size={12} />
              رفع من جهازي
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'url'
                  ? 'bg-gradient-to-r from-accent-500/20 to-sky-500/20 text-accent-300 border border-accent-500/30 shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Link size={12} />
              رابط مباشر
            </button>
            <button
              type="button"
              onClick={() => setMode('search')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'search'
                  ? 'bg-gradient-to-r from-accent-500/20 to-sky-500/20 text-accent-300 border border-accent-500/30 shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Search size={12} />
              مكتبة جاهزة
            </button>
          </div>

          {/* Upload mode: Clickable Box + Drag & Drop */}
          {mode === 'upload' && (
            <div
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full h-32 rounded-2xl border-2 border-dashed transition-all duration-200
                         flex flex-col items-center justify-center gap-2 cursor-pointer select-none group
                         ${
                           isDragging
                             ? 'border-gold-400 bg-gold-500/10 shadow-lg shadow-gold-500/10 scale-[1.01]'
                             : 'border-white/[0.12] bg-surface-800/40 hover:border-gold-400/50 hover:bg-surface-800/70'
                         }`}
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  isDragging
                    ? 'bg-gold-500/20 text-gold-300 scale-110'
                    : 'bg-surface-700/60 text-white/50 group-hover:bg-gold-500/15 group-hover:text-gold-400'
                }`}
              >
                {isReadingFile ? (
                  <Loader2 size={20} className="animate-spin text-gold-400" />
                ) : (
                  <Upload size={20} />
                )}
              </div>
              <div className="text-center px-4">
                <span className="block text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                  {isReadingFile
                    ? 'جارٍ قراءة الملف...'
                    : `اضغط لاختيار ${typeLabels[type]} من جهازك`}
                </span>
                <span className="block text-[11px] text-white/40 mt-0.5 font-sans">
                  أو اسحب وأفلت الملف هنا (JPG, PNG, WEBP, MP4)
                </span>
              </div>
            </div>
          )}

          {/* URL mode */}
          {mode === 'url' && (
            <div className="space-y-2 p-1">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="الصق رابط الصورة أو الفيديو المباشر هنا..."
                  className="flex-1 glass-input text-xs py-2 px-3 rounded-xl border border-white/10"
                  dir="ltr"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-black text-xs font-bold
                             hover:brightness-110 disabled:opacity-30 transition-all cursor-pointer shadow-md"
                >
                  تطبيق
                </button>
              </div>
            </div>
          )}

          {/* Search mode */}
          {mode === 'search' && (
            <div className="space-y-2">
              {/* Search input */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن خلفية (مساجد، طبيعة، سماء...)"
                  className="flex-1 glass-input text-xs py-2 px-3 rounded-xl border border-white/10"
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
                />
                <button
                  type="button"
                  onClick={handleCustomSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="px-3 rounded-xl bg-accent-500/15 text-accent-400 text-xs font-medium 
                             hover:bg-accent-500/25 disabled:opacity-30 transition-all cursor-pointer"
                >
                  {isSearching ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Search size={12} />
                  )}
                </button>
              </div>

              {/* Quick categories */}
              <div className="flex flex-wrap gap-1">
                {BACKGROUND_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSearchFromCategory(cat)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-accent-500/15 border-accent-500/30 text-accent-300'
                        : 'bg-surface-800/50 border-white/[0.05] text-white/50 hover:bg-surface-700 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search results grid */}
              {searchResults.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto rounded-xl p-1.5 bg-surface-850/80 border border-white/[0.06] custom-scrollbar">
                  {searchResults.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectBackground(url)}
                      className="relative aspect-[9/16] rounded-lg overflow-hidden border border-white/[0.06] 
                                 hover:border-gold-400/60 hover:scale-105 transition-all group cursor-pointer"
                    >
                      <img
                        src={url}
                        alt={`خلفية ${i + 1}`}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Download
                          size={14}
                          className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
