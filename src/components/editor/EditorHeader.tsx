import React from 'react';
import { Project } from '../../types';
import {
  ArrowRight,
  Save,
  Download,
  Sparkles,
  Undo2,
  Redo2,
  BookOpen,
  Crown,
  Mic,
  Database,
  Keyboard,
  Image as ImageIcon,
} from 'lucide-react';

interface EditorHeaderProps {
  currentProject: Project | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved';
  onOpenExport: () => void;
  onOpenAutoReel: () => void;
  onOpenPlaylists: () => void;
  onOpenEvents: () => void;
  onOpenVoiceRecorder: () => void;
  onOpenQuotes?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onBack: () => void;
  isProMode?: boolean;
  onToggleProMode?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  currentProject,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  saveStatus = 'saved',
  onOpenExport,
  onOpenAutoReel,
  onOpenPlaylists,
  onOpenEvents,
  onOpenVoiceRecorder,
  onOpenQuotes,
  onOpenKeyboardShortcuts,
  onBack,
  isProMode = false,
  onToggleProMode,
}) => {
  return (
    <header className="h-16 border-b border-white/10 bg-surface-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Back & Project Title & Quick Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          title="الرجوع للرئيسية"
        >
          <ArrowRight size={18} />
          <span className="hidden sm:inline">الرئيسية</span>
        </button>

        <div className="h-5 w-[1px] bg-white/10 mx-1 hidden sm:block" />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold text-white max-w-[160px] md:max-w-[280px] truncate">
              {currentProject?.name || 'مشروع ريلز قرآني'}
            </h1>
            {saveStatus === 'saving' ? (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>جارٍ الحفظ...</span>
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                <Database size={12} className="text-emerald-400" />
                <span>✓ تم الحفظ تلقائياً</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gold-400 font-medium">
            {currentProject?.aspectRatio === '9:16'
              ? 'ريلز عمودي 9:16'
              : currentProject?.aspectRatio === '1:1'
                ? 'مربع 1:1'
                : 'أفقي 16:9'}
          </p>
        </div>

        {/* Undo / Redo Buttons */}
        <div className="flex items-center bg-surface-950/80 p-1 rounded-xl border border-white/10 gap-1 mr-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              canUndo
                ? 'text-white hover:text-gold-300 hover:bg-white/10 cursor-pointer active:scale-95'
                : 'text-white/20 cursor-not-allowed'
            }`}
            title="تراجع (Ctrl + Z)"
          >
            <Undo2 size={15} />
            <span className="hidden xl:inline text-xs">تراجع</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              canRedo
                ? 'text-white hover:text-gold-300 hover:bg-white/10 cursor-pointer active:scale-95'
                : 'text-white/20 cursor-not-allowed'
            }`}
            title="إعادة (Ctrl + Y)"
          >
            <Redo2 size={15} />
            <span className="hidden xl:inline text-xs">إعادة</span>
          </button>
        </div>
      </div>

      {/* Right: Quick Features & Save / Export Buttons */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          type="button"
          onClick={onOpenPlaylists}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gold-400/10 hover:bg-gold-400/20 text-gold-300 text-xs font-bold border border-gold-400/20 transition-all cursor-pointer"
          title="قوائم تشغيل ومزاجات قرآنية جاهزة"
        >
          <BookOpen size={13} />
          <span>مزاجات قرآنية 🎧</span>
        </button>

        <button
          type="button"
          onClick={onOpenEvents}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 transition-all cursor-pointer"
          title="مواسم إسلامية ومناسبات دينية"
        >
          <Crown size={13} />
          <span>مواسم إسلامية 🌙</span>
        </button>

        {onOpenQuotes && (
          <button
            type="button"
            onClick={onOpenQuotes}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/20 transition-all cursor-pointer"
            title="تصدير هذه الآية كـ كرت صورة وبوست إنستغرام/واتساب HD"
          >
            <ImageIcon size={13} className="text-sky-400" />
            <span>بوست صورة 🖼️</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenVoiceRecorder}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
          title="تسجيل صوتك وتلاوتك الخاصة"
        >
          <Mic size={13} className="text-gold-400" />
          <span>تسجيل صوتي 🎙️</span>
        </button>

        {onToggleProMode && (
          <button
            type="button"
            data-tour="editor-mode-toggle"
            onClick={onToggleProMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isProMode
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                : 'bg-surface-800 text-white/80 border-white/10 hover:border-gold-400/40 hover:text-white'
            }`}
            title="التبديل بين الوضع المبسط والوضع المتقدم"
          >
            <span>{isProMode ? '⚡ وضع Pro' : '🎯 وضع مبسط'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenAutoReel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-gold-500/30 hover:from-purple-600/40 hover:to-gold-500/40 text-purple-200 text-xs font-bold border border-purple-400/30 transition-all cursor-pointer shadow-sm"
        >
          <Sparkles size={13} className="text-purple-300 animate-pulse" />
          <span className="hidden sm:inline">Auto-Reel AI ⚡</span>
        </button>

        {onOpenKeyboardShortcuts && (
          <button
            type="button"
            onClick={onOpenKeyboardShortcuts}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-gold-300 transition-all cursor-pointer border border-white/10"
            title="اختصارات لوحة المفاتيح (?)"
          >
            <Keyboard size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={onSave}
          className="p-2 md:px-3.5 md:py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
          title="حفظ المشروع (Ctrl + S)"
        >
          <Save size={14} className="text-gold-400" />
          <span className="hidden md:inline">حفظ</span>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="px-3.5 md:px-4 py-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-surface-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-gold-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Download size={14} />
          <span>تصدير الفيديو 🚀</span>
        </button>
      </div>
    </header>
  );
};
