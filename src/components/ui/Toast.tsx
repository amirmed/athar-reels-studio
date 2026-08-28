import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, Toast as ToastType } from '../../store/useAppStore';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const iconMap = {
  success: <CheckCircle2 size={18} className="text-green-400" />,
  error: <XCircle size={18} className="text-red-400" />,
  info: <Info size={18} className="text-blue-400" />,
  warning: <AlertTriangle size={18} className="text-yellow-400" />,
};

const bgMap = {
  success: 'bg-green-500/10 border-green-500/20',
  error: 'bg-red-500/10 border-red-500/20',
  info: 'bg-blue-500/10 border-blue-500/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20',
};

interface ToastItemProps {
  toast: ToastType;
}

const ToastItem: React.FC<ToastItemProps> = React.memo(({ toast }) => {
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl border shadow-xl
        ${bgMap[toast.type || 'info']}
      `}
    >
      {iconMap[toast.type || 'info']}
      <p className="text-sm text-white/90 font-medium flex-1">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            removeToast(toast.id);
          }}
          className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => removeToast(toast.id)}
        className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer"
        aria-label="إغلاق التنبيه"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
});

export const ToastContainer: React.FC = () => {
  const toasts = useAppStore((s) => s.toasts);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 start-6 z-[100] flex flex-col gap-2 max-w-sm"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
