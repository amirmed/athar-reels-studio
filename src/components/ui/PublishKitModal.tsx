import React, { useState } from 'react';
import { Modal } from './Modal';
import { ViralCaptionGenerator } from './ViralCaptionGenerator';
import { useAppStore } from '../../store/useAppStore';
import { Project } from '../../types';
import {
  Share2,
  ExternalLink,
  Folder,
  Calendar,
  Trash2,
  Flame,
  History,
} from 'lucide-react';

export interface PublishLogItem {
  id: string;
  projectName: string;
  surahName: string;
  platform: 'tiktok' | 'youtube' | 'instagram' | 'whatsapp' | 'telegram' | 'other';
  publishedAt: string;
  captionSnippet?: string;
  videoPath?: string;
}

interface PublishKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  videoPath?: string;
  surahName?: string;
  ayahRange?: string;
  ayahText?: string;
}

const PLATFORM_DESTINATIONS = [
  {
    id: 'tiktok' as const,
    name: 'تيك توك',
    sub: 'TikTok Creator Upload',
    icon: '🎵',
    url: 'https://www.tiktok.com/creator-center/upload',
    color: 'from-cyan-500/20 to-pink-500/20 border-cyan-500/40 hover:border-pink-500',
    btnColor: 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white',
  },
  {
    id: 'youtube' as const,
    name: 'يوتيوب شورتس',
    sub: 'YouTube Studio Shorts',
    icon: '▶️',
    url: 'https://studio.youtube.com/channel/UC/videos/upload?d=ud',
    color: 'from-red-500/20 to-rose-500/20 border-red-500/40 hover:border-red-400',
    btnColor: 'bg-gradient-to-r from-red-600 to-rose-600 text-white',
  },
  {
    id: 'instagram' as const,
    name: 'إنستغرام ريلز',
    sub: 'Instagram Web Creator',
    icon: '📸',
    url: 'https://www.instagram.com/',
    color:
      'from-purple-500/20 via-pink-500/20 to-amber-500/20 border-purple-500/40 hover:border-pink-400',
    btnColor: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white',
  },
  {
    id: 'whatsapp' as const,
    name: 'واتساب ويب',
    sub: 'WhatsApp Status / Groups',
    icon: '💬',
    url: 'https://web.whatsapp.com/',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 hover:border-emerald-400',
    btnColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
  },
  {
    id: 'telegram' as const,
    name: 'تيليجرام',
    sub: 'Telegram Channel Upload',
    icon: '✈️',
    url: 'https://web.telegram.org/',
    color: 'from-sky-500/20 to-blue-500/20 border-sky-500/40 hover:border-sky-400',
    btnColor: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white',
  },
];

export const PublishKitModal: React.FC<PublishKitModalProps> = ({
  isOpen,
  onClose,
  project,
  videoPath,
  surahName,
  ayahRange,
  ayahText,
}) => {
  const addToast = useAppStore((s) => s.addToast);
  const [activeTab, setActiveTab] = useState<'kit' | 'history'>('kit');

  const finalSurah = surahName || project?.surah || 'سورة الفاتحة';
  const finalRange = ayahRange || (project ? `${project.fromAyah} - ${project.toAyah}` : '1 - 7');
  const finalProjectName = project?.name || `ريلز ${finalSurah}`;

  // Local storage publish logs
  const [publishLogs, setPublishLogs] = useState<PublishLogItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('athar_publish_logs') || '[]');
    } catch {
      return [];
    }
  });

  const savePublishLogs = (newLogs: PublishLogItem[]) => {
    setPublishLogs(newLogs);
    try {
      localStorage.setItem('athar_publish_logs', JSON.stringify(newLogs));
    } catch (err) {
      console.debug('[PublishKitModal] localStorage save error:', err);
    }
  };

  const handleOpenPlatform = async (
    platformId: PublishLogItem['platform'],
    platformUrl: string,
    platformName: string
  ) => {
    // 1. Open External Web Link
    if (window.electronAPI?.shell?.openExternal) {
      await window.electronAPI.shell.openExternal(platformUrl);
    } else {
      window.open(platformUrl, '_blank', 'noopener,noreferrer');
    }

    // 2. Record to Publish Log
    const newLogItem: PublishLogItem = {
      id: `pub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectName: finalProjectName,
      surahName: finalSurah,
      platform: platformId,
      publishedAt: new Date().toISOString(),
      videoPath,
    };

    const updated = [newLogItem, ...publishLogs];
    savePublishLogs(updated);

    addToast({
      message: `تم فتح صفحة رفع ${platformName} وتسجيل الفيديو في سجل نشر قناتك 🚀`,
      type: 'success',
    });
  };

  const handleOpenFolder = () => {
    if (videoPath && window.electronAPI?.shell?.showItemInFolder) {
      window.electronAPI.shell.showItemInFolder(videoPath);
      addToast({ message: 'تم فتح المجلد المحتوي على الفيديو في مستعرض الملفات 📁', type: 'info' });
    } else if (window.electronAPI?.shell?.openPath) {
      window.electronAPI.shell.openPath(videoPath || '');
    } else {
      addToast({ message: 'مسار الفيديو محفوظ محلياً على جهازك', type: 'info' });
    }
  };

  const handleDeleteLogItem = (id: string) => {
    const updated = publishLogs.filter((item) => item.id !== id);
    savePublishLogs(updated);
  };

  const handleClearAllLogs = () => {
    savePublishLogs([]);
    addToast({ message: 'تم مسح سجل النشر بالكامل 🗑️', type: 'info' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="عدة النشر السريع وسجل القناة (Publish Kit) 🚀"
      size="lg"
    >
      <div className="space-y-5 text-start font-sans" dir="rtl">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('kit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'kit'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-surface-950 shadow-md font-black'
                  : 'text-white/60 hover:text-white bg-surface-900 border border-white/[0.06]'
              }`}
            >
              <Share2 size={14} />
              <span>عدة النشر المباشر</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-surface-950 shadow-md font-black'
                  : 'text-white/60 hover:text-white bg-surface-900 border border-white/[0.06]'
              }`}
            >
              <History size={14} />
              <span>سجل نشر القناة ({publishLogs.length})</span>
            </button>
          </div>

          {videoPath && (
            <button
              type="button"
              onClick={handleOpenFolder}
              className="text-xs text-gold-400 hover:text-gold-300 font-bold flex items-center gap-1.5 hover:underline bg-gold-400/10 px-3 py-1.5 rounded-xl border border-gold-400/20 cursor-pointer"
            >
              <Folder size={14} />
              <span>فتح مجلد الفيديو</span>
            </button>
          )}
        </div>

        {/* ==================== TAB 1: PUBLISH KIT ==================== */}
        {activeTab === 'kit' && (
          <div className="space-y-5">
            {/* Quick Upload Platforms Grid */}
            <div>
              <label className="block text-xs font-bold text-white/80 mb-2 flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400" />
                <span>رفع الفيديو مباشرة بنقرة واحدة (Deep Links):</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {PLATFORM_DESTINATIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleOpenPlatform(p.id, p.url, p.name)}
                    className={`p-3 rounded-2xl bg-gradient-to-br ${p.color} border transition-all text-start group cursor-pointer hover:scale-[1.02] shadow-sm flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl shrink-0">{p.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-gold-300 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-[10px] text-white/50">{p.sub}</p>
                      </div>
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-white/40 group-hover:text-white transition-colors"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* AI Viral Caption & Hashtags Generator */}
            <div className="p-4 rounded-2xl bg-surface-900 border border-white/[0.08]">
              <ViralCaptionGenerator
                surahName={finalSurah}
                ayahRange={finalRange}
                ayahText={ayahText || ''}
              />
            </div>
          </div>
        )}

        {/* ==================== TAB 2: CHANNEL PUBLISHING HISTORY ==================== */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70">
                سجل الفيديوهات التي تم توجيهها ونشرها على المنصات:
              </span>
              {publishLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllLogs}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>مسح السجل</span>
                </button>
              )}
            </div>

            {publishLogs.length === 0 ? (
              <div className="p-10 rounded-2xl bg-surface-900/60 border border-white/[0.04] text-center space-y-2">
                <Calendar size={28} className="mx-auto text-white/20" />
                <p className="text-xs font-bold text-white/60">لا يوجد سجل نشر بعد</p>
                <p className="text-[11px] text-white/40 max-w-sm mx-auto leading-relaxed">
                  عندما تضغط على أحد أزرار النشر أعلاه (TikTok، YouTube، Instagram)، سيتم توثيق
                  الفيديو هنا لبناء أرشيف قناتك.
                </p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar">
                {publishLogs.map((log) => {
                  const targetPlatform = PLATFORM_DESTINATIONS.find((p) => p.id === log.platform);
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl bg-surface-900 border border-white/[0.06] flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-surface-800 flex items-center justify-center text-base shrink-0">
                          {targetPlatform?.icon || '🎬'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">
                              {log.projectName}
                            </h4>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              تم التوجيه ✓
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
                            <span>منصة: {targetPlatform?.name || log.platform}</span>
                            <span>•</span>
                            <span className="font-mono">
                              {new Date(log.publishedAt).toLocaleDateString('ar-EG', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLogItem(log.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        title="حذف من السجل"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
