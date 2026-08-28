import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

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
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element inside modal
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          focusables[0].focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap for Tab key
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null); // only visible elements

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      // Restore previous focus on close
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function'
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={title || 'نافذة حوار'}
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
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className={`
              relative glass-panel-solid p-0 ${sizeMap[size] || sizeMap.md} w-full max-h-[85vh] flex flex-col overflow-hidden
              shadow-2xl shadow-black/50 border border-white/[0.08] ${className}
            `}
          >
            {/* Header */}
            {(title || headerIcon || headerActions) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-surface-900/90 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {headerIcon && (
                    <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400 shrink-0">
                      {headerIcon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && <h3 className="text-sm sm:text-base font-bold text-white/95 truncate">{title}</h3>}
                    {subtitle && <p className="text-[11px] text-white/60 truncate">{subtitle}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {headerActions}
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-surface-800/60 hover:bg-surface-700/80 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer border border-white/[0.04]"
                    aria-label="إغلاق النافذة"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Body */}
            <div className={`p-6 overflow-y-auto custom-scrollbar flex-1 ${bodyClassName}`}>{children}</div>
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
      <p className="text-sm text-white/60 leading-relaxed mb-6">{message}</p>
      <div className="flex gap-3 justify-start">
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={variant === 'danger' ? 'btn-danger px-5' : 'btn-primary-sm px-5'}
        >
          {confirmLabel}
        </button>
        <button onClick={onClose} className="btn-ghost px-5">
          {cancelLabel}
        </button>
      </div>
    </Modal>
  );
};
