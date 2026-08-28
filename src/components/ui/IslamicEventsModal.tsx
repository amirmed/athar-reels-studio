import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  ISLAMIC_SEASONS_DATA,
  IslamicEventItem,
  getCurrentLiveOccasion,
} from '../../data/islamicEventsData';
import { Modal } from './Modal';

interface IslamicEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: IslamicEventItem) => void;
}

export const IslamicEventsModal: React.FC<IslamicEventsModalProps> = ({
  isOpen,
  onClose,
  onSelectEvent,
}) => {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('friday');
  const liveOccasion = getCurrentLiveOccasion();

  const currentCategory =
    ISLAMIC_SEASONS_DATA.find((c) => c.id === selectedSeasonId) || ISLAMIC_SEASONS_DATA[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="مركز المناسبات والمواسم الهجرية 🌙✨"
      subtitle="قوالب حصرية متوافقة مع التقويم الهجري، يوم الجمعة، رمضان، ومواقيت اليوم"
      headerIcon={<Calendar size={20} className="text-gold-400" />}
      size="xl"
    >
      <div className="space-y-4">
        {/* Live Occasion Spotlight Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-gold-900/40 via-surface-900 to-gold-900/20 border border-gold-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-400/20 border border-gold-400/40 text-gold-300 flex items-center justify-center shrink-0">
              <Clock size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gold-300">
                  {liveOccasion.badgeLabel}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-200 border border-gold-400/30">
                  مقترح الآن ⚡
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {liveOccasion.recommendedItem.title}
              </h4>
              <p className="text-xs text-white/50">{liveOccasion.reason}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectEvent(liveOccasion.recommendedItem);
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-accent-500 hover:from-gold-300 hover:to-accent-400 text-surface-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <span>تطبيق مقترح اليوم الآن 🚀</span>
            <ArrowRight size={14} className="rotate-180" />
          </button>
        </div>

        {/* Category Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ISLAMIC_SEASONS_DATA.map((cat) => {
            const isSelected = cat.id === selectedSeasonId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedSeasonId(cat.id)}
                className={`p-3 rounded-2xl text-right transition-all cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? `${cat.borderColor} bg-surface-900 shadow-md`
                    : 'border-white/[0.06] bg-surface-900/40 text-white/60 hover:text-white hover:bg-surface-900/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-gold-500/20 text-gold-300'
                        : 'bg-white/[0.04] text-white/40'
                    }`}
                  >
                    {cat.badge}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-white/70'}`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{currentCategory.name}</span>
            </h4>
            <p className="text-xs text-white/50">{currentCategory.description}</p>
          </div>
          <span className="text-xs text-gold-400 font-bold">
            {currentCategory.items.length} قوالب جاهزة
          </span>
        </div>

        {/* Preset Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {currentCategory.items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-surface-900/90 border border-white/[0.08] hover:border-gold-400/40 transition-all overflow-hidden flex flex-col justify-between shadow-lg group hover:-translate-y-0.5"
            >
              {/* Image Header Preview */}
              <div className="relative h-28 w-full overflow-hidden">
                <img
                  src={item.backgroundUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/40 to-transparent" />

                <div className="absolute top-2 right-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-950/80 backdrop-blur-md text-gold-300 border border-gold-400/30">
                    {item.seasonBadge}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2 left-2">
                  <span className="text-xs font-bold text-white truncate block">
                    سورة {item.surahName} • الآيات ({item.fromAyah} - {item.toAyah})
                  </span>
                </div>
              </div>

              {/* Content Details */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-1 mb-1">
                    {item.title}
                  </h5>
                  <p className="text-xs text-white/70 italic line-clamp-2 leading-relaxed bg-surface-950/50 p-2 rounded-xl border border-white/[0.04]">
                    {item.subtitle}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[11px] text-white/50">
                    <span className="flex items-center gap-1">
                      <span>🎙️</span>
                      <span className="text-white/80">{item.reciterName}</span>
                    </span>
                    <span className="text-gold-400 font-bold">✨ فلتر ملكي</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectEvent(item);
                      onClose();
                    }}
                    className="btn-gold w-full py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Zap size={14} />
                    <span>تطبيق القالب وتصميم الريلز 🚀</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/60">
            💡 نصيحة: نشر مقاطع سورة الكهف يوم الجمعة يرفع التفاعل والمشاركات بأكثر من 300%.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-5 py-2 text-xs font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
};
