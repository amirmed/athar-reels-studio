import React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music2,
  Disc,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

export type PlatformOverlayType = 'none' | 'tiktok' | 'reels' | 'shorts' | 'whatsapp';

interface PlatformPreviewOverlayProps {
  platform: PlatformOverlayType;
  showSafeZones?: boolean;
  aspectRatio?: '9:16' | '1:1' | '16:9';
  surahName?: string;
  watermark?: string;
}

export const PlatformPreviewOverlay: React.FC<PlatformPreviewOverlayProps> = ({
  platform,
  showSafeZones = true,
  aspectRatio = '9:16',
  surahName = 'سورة الفاتحة',
  watermark = '@athar_studio',
}) => {
  if (platform === 'none' || aspectRatio !== '9:16') {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Safe Zone Outline Lines */}
      {showSafeZones && (
        <div className="absolute inset-0 border border-dashed border-sky-400/40 m-3 rounded-2xl pointer-events-none">
          <div className="absolute top-1 start-2 text-[8px] font-mono text-sky-300 bg-sky-950/80 px-1 rounded">
            Safe Zone (منطقة الأمان)
          </div>
        </div>
      )}

      {/* 2. TikTok UI Mockup Overlay */}
      {platform === 'tiktok' && (
        <>
          {/* Top Header */}
          <div className="pt-3 px-4 flex items-center justify-between text-white/90 text-xs font-bold">
            <div className="flex items-center gap-3 mx-auto">
              <span className="text-white/60 text-xs">متابعة</span>
              <span className="text-white border-b-2 border-white pb-0.5 text-xs">
                لك (For You)
              </span>
            </div>
          </div>

          {/* Right Action Bar & Bottom Caption */}
          <div className="flex items-end justify-between p-3">
            {/* Bottom Caption & User Handle */}
            <div className="space-y-1 max-w-[70%] text-start" dir="rtl">
              <div className="font-bold text-xs text-white flex items-center gap-1">
                <span>{watermark || '@athar_studio'}</span>
                <span className="text-[10px] px-1 rounded bg-rose-500 text-white font-bold">
                  متابعة
                </span>
              </div>
              <p className="text-[11px] text-white/90 line-clamp-2 leading-tight">
                تلاوة خاشعة من {surahName} 🌿✨ #قرآن #تلاوة #راحة_نفسية #viral #quran
              </p>
              <div className="flex items-center gap-1 text-[10px] text-white/70">
                <Music2 size={10} className="animate-spin" />
                <span className="truncate">الصوت الأصلي - {surahName}</span>
              </div>
            </div>

            {/* Right Buttons */}
            <div className="flex flex-col items-center gap-3 text-white">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-900/60 backdrop-blur flex items-center justify-center">
                  <Heart size={16} className="text-rose-500 fill-rose-500" />
                </div>
                <span className="text-[10px] font-bold">142K</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-900/60 backdrop-blur flex items-center justify-center">
                  <MessageCircle size={16} />
                </div>
                <span className="text-[10px] font-bold">1,820</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-900/60 backdrop-blur flex items-center justify-center">
                  <Bookmark size={16} />
                </div>
                <span className="text-[10px] font-bold">28K</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-900/60 backdrop-blur flex items-center justify-center">
                  <Share2 size={16} />
                </div>
                <span className="text-[10px] font-bold">15K</span>
              </div>

              <div className="w-7 h-7 rounded-full bg-surface-900/80 border border-white/20 flex items-center justify-center animate-spin">
                <Disc size={15} className="text-gold-400" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. Instagram Reels UI Mockup Overlay */}
      {platform === 'reels' && (
        <>
          {/* Top Reels Title */}
          <div className="pt-3 px-4 flex items-center justify-between text-white text-xs font-bold">
            <span className="text-sm font-extrabold tracking-tight">Reels</span>
          </div>

          {/* Bottom & Right Reels Action Bar */}
          <div className="flex items-end justify-between p-3">
            {/* Profile & Audio */}
            <div className="space-y-1.5 max-w-[70%] text-start" dir="rtl">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gold-400 text-surface-950 font-bold text-[10px] flex items-center justify-center">
                  📖
                </div>
                <span className="font-bold text-xs text-white">{watermark || '@athar_studio'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/40 text-white font-bold">
                  متابعة
                </span>
              </div>
              <p className="text-[11px] text-white/90 line-clamp-1">
                تلاوة تريح القلوب من {surahName} 🕊️
              </p>
              <div className="flex items-center gap-1 text-[10px] text-white/70">
                <Music2 size={10} />
                <span>{surahName} • صوت أصلي</span>
              </div>
            </div>

            {/* Right Reels Actions */}
            <div className="flex flex-col items-center gap-3.5 text-white">
              <div className="flex flex-col items-center">
                <Heart size={18} />
                <span className="text-[10px] font-medium mt-0.5">85.4K</span>
              </div>
              <div className="flex flex-col items-center">
                <MessageCircle size={18} />
                <span className="text-[10px] font-medium mt-0.5">940</span>
              </div>
              <div className="flex flex-col items-center">
                <Share2 size={18} />
              </div>
              <div className="flex flex-col items-center">
                <MoreVertical size={18} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* 4. YouTube Shorts UI Mockup Overlay */}
      {platform === 'shorts' && (
        <>
          <div className="pt-3 px-3 flex items-center justify-between text-white">
            <span className="font-bold text-xs">Shorts</span>
          </div>

          <div className="flex items-end justify-between p-3">
            <div className="space-y-1.5 max-w-[70%] text-start" dir="rtl">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center">
                  ▶
                </div>
                <span className="font-bold text-xs text-white">{watermark || '@athar_studio'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-black font-extrabold">
                  اشتراك
                </span>
              </div>
              <p className="text-[11px] text-white/90 line-clamp-2">
                أجمل تلاوة قرآنية مؤثرة - {surahName} 🌿
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 text-white">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-900/60 backdrop-blur flex items-center justify-center">
                  <ThumbsUp size={16} />
                </div>
                <span className="text-[10px] font-bold">52K</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-900/60 backdrop-blur flex items-center justify-center">
                  <ThumbsDown size={16} />
                </div>
                <span className="text-[10px]">لم يعجبني</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-900/60 backdrop-blur flex items-center justify-center">
                  <MessageCircle size={16} />
                </div>
                <span className="text-[10px] font-bold">640</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-900/60 backdrop-blur flex items-center justify-center">
                  <Share2 size={16} />
                </div>
                <span className="text-[10px]">مشاركة</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 5. WhatsApp Status UI Mockup */}
      {platform === 'whatsapp' && (
        <>
          <div className="pt-2 px-3 space-y-1.5">
            {/* Top Stories Progress Bars */}
            <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white w-1/2 rounded-full" />
            </div>
            {/* User Profile */}
            <div className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                📖
              </div>
              <div>
                <div className="font-bold text-xs">{watermark || 'حالتي اليومية'}</div>
                <div className="text-[10px] text-white/70">منذ دقيقة واحدة</div>
              </div>
            </div>
          </div>

          <div className="p-3 text-center">
            <div className="py-2 px-4 rounded-full bg-surface-900/70 border border-white/20 text-white/80 text-xs font-bold inline-flex items-center gap-2">
              <span>رد على الحالة... 💬</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
