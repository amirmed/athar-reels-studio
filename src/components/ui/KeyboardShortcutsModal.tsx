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
import { useTranslation } from '../../i18n';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  const shortcuts = [
    {
      icon: <Play size={16} className="text-gold-400" />,
      title: t('shortcutsModal.playPause', 'تشغيل / إيقاف التلاوة'),
      keys: [t('shortcutsModal.spaceKey', 'المسافة (Space)')],
      category: t('shortcutsModal.catPlayback', 'التشغيل'),
    },
    {
      icon: <SkipForward size={16} className="text-emerald-400" />,
      title: t('shortcutsModal.nextAyah', 'الآية التالية'),
      keys: [t('shortcutsModal.leftArrowKey', '← السهم الأيسر')],
      category: t('shortcutsModal.catNav', 'التنقل'),
    },
    {
      icon: <SkipBack size={16} className="text-emerald-400" />,
      title: t('shortcutsModal.prevAyah', 'الآية السابقة'),
      keys: [t('shortcutsModal.rightArrowKey', '→ السهم الأيمن')],
      category: t('shortcutsModal.catNav', 'التنقل'),
    },
    {
      icon: <Undo size={16} className="text-sky-400" />,
      title: t('shortcutsModal.undo', 'تراجع (Undo)'),
      keys: ['Ctrl', 'Z'],
      category: t('shortcutsModal.catEdit', 'التحرير'),
    },
    {
      icon: <Redo size={16} className="text-sky-400" />,
      title: t('shortcutsModal.redo', 'إعادة (Redo)'),
      keys: ['Ctrl', 'Y'],
      category: t('shortcutsModal.catEdit', 'التحرير'),
    },
    {
      icon: <Download size={16} className="text-purple-400" />,
      title: t('shortcutsModal.openExport', 'فتح نافذة التصدير'),
      keys: ['Ctrl', 'E'],
      category: t('shortcutsModal.catExport', 'التصدير'),
    },
    {
      icon: <VolumeX size={16} className="text-amber-400" />,
      title: t('shortcutsModal.muteAmbient', 'كتم / تشغيل صوت الطبيعة'),
      keys: ['M'],
      category: t('shortcutsModal.catAudio', 'الصوت'),
    },
    {
      icon: <Maximize2 size={16} className="text-blue-400" />,
      title: t('shortcutsModal.fullscreenPreview', 'ملء الشاشة للمعاينة'),
      keys: ['F'],
      category: t('shortcutsModal.catView', 'العرض'),
    },
    {
      icon: <Keyboard size={16} className="text-gold-400" />,
      title: t('shortcutsModal.openShortcutsGuide', 'فتح دليل الاختصارات'),
      keys: ['?'],
      category: t('shortcutsModal.catHelp', 'المساعدة'),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('shortcutsModal.title', 'دليل اختصارات لوحة المفاتيح')}
      subtitle={t('shortcutsModal.subtitle', 'التحكم السريع في تشغيل وتعديل وتصدير الآيات')}
      headerIcon={<Keyboard size={18} />}
      size="md"
    >
      <div className="space-y-4 text-start">
        {/* Shortcuts List */}
        <div className="grid grid-cols-1 gap-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-2xl bg-surface-950/60 border border-surface-700/40 hover:border-gold-500/30 transition-all"
            >
              {/* Keys Badges */}
              <div className="flex items-center gap-1.5" dir="ltr">
                {sc.keys.map((k, kIdx) => (
                  <React.Fragment key={kIdx}>
                    <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-gold-300 bg-surface-800 border border-gold-500/30 rounded-lg shadow-sm">
                      {k}
                    </kbd>
                    {kIdx < sc.keys.length - 1 && (
                      <span className="text-surface-400 text-xs font-bold">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Title & Icon */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-surface-50">{sc.title}</span>
                <div className="p-1.5 rounded-lg bg-surface-900 border border-surface-700/40">
                  {sc.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-2 flex items-center justify-between border-t border-surface-700/40 text-[11px] text-surface-400">
          <span>
            {t('shortcutsModal.escToClose', 'اضغط {key} للإغلاق').replace('{key}', '')}{' '}
            <kbd className="px-1.5 py-0.5 bg-surface-800 border border-surface-700/40 rounded font-mono text-surface-200">
              Esc
            </kbd>
          </span>
          <span>{t('shortcutsModal.proTip', '⚡ تتيح لك العمل بسرعة واحترافية')}</span>
        </div>
      </div>
    </Modal>
  );
};
