import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  bodyClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm w-full',
  md: 'max-w-md w-full',
  lg: 'max-w-xl w-full',
  xl: 'max-w-2xl w-full',
  full: 'max-w-3xl w-full',
};

// Global counter for nested / multiple modals body scroll locking
let activeModalCount = 0;
let initialBodyOverflow = '';

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (activeModalCount === 0) {
    initialBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeModalCount++;
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  activeModalCount = Math.max(0, activeModalCount - 1);
  if (activeModalCount === 0) {
    document.body.style.overflow = initialBodyOverflow;
  }
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerIcon,
  headerActions,
  children,
  size = 'md',
  className = '',
  bodyClassName = '',
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) => {
  const { t } = useTranslation();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    // Capture the trigger element that opened the modal to return focus later
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Prevent body scroll when modal dialog is open
    lockBodyScroll();

    // Focus the first actionable or focusable element within the modal dialog
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
          focusable.focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }

      // Trap focus inside modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
      // Restore previous focus on close
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function'
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, closeOnEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 overflow-y-auto custom-scrollbar overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-label={title || t('common.dialogModal', 'نافذة حوار')}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal content */}
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-[calc(100vw-1.5rem)] ${sizeMap[size] || sizeMap.md} mx-auto bg-surface-900 border border-surface-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] my-auto shrink-0 z-10 ${className}`}
          >
            {/* Header */}
            {(title || headerIcon || headerActions) && (
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-surface-700/40 bg-surface-900/95 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {headerIcon && (
                    <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 shrink-0">
                      {headerIcon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && <h3 className="text-sm sm:text-base font-bold text-surface-50 truncate">{title}</h3>}
                    {subtitle && <p className="text-[11px] text-surface-400 truncate">{subtitle}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {headerActions}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-surface-800/60 hover:bg-surface-700/80 flex items-center justify-center text-surface-400 hover:text-surface-50 transition-all cursor-pointer border border-surface-700/30"
                    aria-label={t('common.closeModal', 'إغلاق النافذة')}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Body */}
            <div className={`p-4 sm:p-6 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 min-h-0 overscroll-contain text-start ${bodyClassName}`}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'default',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-surface-300 leading-relaxed mb-6">{message}</p>
      <div className="flex gap-3 justify-start flex-wrap">
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={variant === 'danger' ? 'btn-danger px-5 cursor-pointer' : 'btn-primary-sm px-5 cursor-pointer'}
        >
          {confirmLabel}
        </button>
        <button type="button" onClick={onClose} className="btn-ghost px-5 cursor-pointer">
          {cancelLabel}
        </button>
      </div>
    </Modal>
  );
};
