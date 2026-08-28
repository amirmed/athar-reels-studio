import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
  return (
    <div className="drag-region relative w-full h-9 flex items-center justify-between bg-surface-950/80 backdrop-blur-sm border-b border-white/[0.04] shrink-0 z-[200] select-none">
      {/* App title - pointer-events-none so drag still works */}
      <div className="pointer-events-none flex items-center gap-2 px-4">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-500/60"></div>
        <span className="text-xs text-white/50 font-medium whitespace-nowrap font-arabic">
          أَثَــر ستوديو | Athar Studio
        </span>
      </div>

      {/* Window control buttons — use CSS class no-drag, NOT inline style */}
      <div className="no-drag flex items-center h-full">
        <button
          type="button"
          className="no-drag h-full px-4 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => {
            if (window.electronAPI?.window?.minimize) {
              window.electronAPI.window.minimize();
            }
          }}
          title="تصغير النافذة"
          aria-label="تصغير النافذة"
        >
          <Minus size={14} className="pointer-events-none" />
        </button>

        <button
          type="button"
          className="no-drag h-full px-4 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => {
            if (window.electronAPI?.window?.maximize) {
              window.electronAPI.window.maximize();
            }
          }}
          title="تكبير النافذة"
          aria-label="تكبير النافذة"
        >
          <Square size={12} className="pointer-events-none" />
        </button>

        <button
          type="button"
          className="no-drag h-full px-4 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-500 transition-colors"
          onClick={() => {
            if (window.electronAPI?.window?.close) {
              window.electronAPI.window.close();
            }
          }}
          title="إغلاق التطبيق"
          aria-label="إغلاق التطبيق"
        >
          <X size={14} className="pointer-events-none" />
        </button>
      </div>
    </div>
  );
};
