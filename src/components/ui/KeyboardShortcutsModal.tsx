import React from 'react';
import {
  Keyboard,
  Play,
  SkipForward,
  SkipBack,
  Undo,
  Redo,
  Download,
  VolumeX,
  Maximize2,
} from 'lucide-react';
import { Modal } from './Modal';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const shortcuts = [
    {
      icon: <Play size={16} className="text-gold-400" />,
      title: 'تشغيل / إيقاف التلاوة',
      keys: ['المسافة (Space)'],
      category: 'التشغيل',
    },
    {
      icon: <SkipForward size={16} className="text-emerald-400" />,
      title: 'الآية التالية',
      keys: ['← السهم الأيسر'],
      category: 'التنقل',
    },
    {
      icon: <SkipBack size={16} className="text-emerald-400" />,
      title: 'الآية السابقة',
      keys: ['→ السهم الأيمن'],
      category: 'التنقل',
    },
    {
      icon: <Undo size={16} className="text-sky-400" />,
      title: 'تراجع (Undo)',
      keys: ['Ctrl', 'Z'],
      category: 'التحرير',
    },
    {
      icon: <Redo size={16} className="text-sky-400" />,
      title: 'إعادة (Redo)',
      keys: ['Ctrl', 'Y'],
      category: 'التحرير',
    },
    {
      icon: <Download size={16} className="text-purple-400" />,
      title: 'فتح نافذة التصدير',
      keys: ['Ctrl', 'E'],
      category: 'التصدير',
    },
    {
      icon: <VolumeX size={16} className="text-amber-400" />,
      title: 'كتم / تشغيل صوت الطبيعة',
      keys: ['M'],
      category: 'الصوت',
    },
    {
      icon: <Maximize2 size={16} className="text-blue-400" />,
      title: 'ملء الشاشة للمعاينة',
      keys: ['F'],
      category: 'العرض',
    },
    {
      icon: <Keyboard size={16} className="text-gold-400" />,
      title: 'فتح دليل الاختصارات',
      keys: ['?'],
      category: 'المساعدة',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="دليل اختصارات لوحة المفاتيح"
      subtitle="التحكم السريع في تشغيل وتعديل وتصدير الآيات"
      headerIcon={<Keyboard size={18} />}
      size="md"
    >
      <div className="space-y-4 text-start">
        {/* Shortcuts List */}
        <div className="grid grid-cols-1 gap-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-2xl bg-surface-950/60 border border-white/[0.04] hover:border-gold-500/30 transition-all"
            >
              {/* Keys Badges */}
              <div className="flex items-center gap-1.5" dir="ltr">
                {sc.keys.map((k, kIdx) => (
                  <React.Fragment key={kIdx}>
                    <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-gold-300 bg-surface-800 border border-gold-500/30 rounded-lg shadow-sm">
                      {k}
                    </kbd>
                    {kIdx < sc.keys.length - 1 && (
                      <span className="text-white/40 text-xs font-bold">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Title & Icon */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-white/90">{sc.title}</span>
                <div className="p-1.5 rounded-lg bg-surface-900 border border-white/5">
                  {sc.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-2 flex items-center justify-between border-t border-white/10 text-[11px] text-white/60">
          <span>
            اضغط{' '}
            <kbd className="px-1.5 py-0.5 bg-surface-800 border border-white/10 rounded font-mono text-white/80">
              Esc
            </kbd>{' '}
            للإغلاق
          </span>
          <span>⚡ تتيح لك العمل بسرعة واحترافية</span>
        </div>
      </div>
    </Modal>
  );
};
