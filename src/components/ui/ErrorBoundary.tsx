import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, Copy, Check, Terminal } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isCopied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isCopied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, isCopied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    try {
      useAppStore.getState().setCurrentPage('dashboard');
    } catch {
      // Ignore store errors
    }
    this.setState({ hasError: false, error: null, errorInfo: null, isCopied: false });
  };

  private handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    const errorDetails = `=== Athar Reels Studio Error Report ===
Timestamp: ${new Date().toISOString()}
Message: ${error?.message || 'Unknown error'}
Stack:
${error?.stack || 'No stack trace'}

Component Stack:
${errorInfo?.componentStack || 'No component stack'}
`;

    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ isCopied: true });
      setTimeout(() => this.setState({ isCopied: false }), 2500);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-screen w-screen flex items-center justify-center bg-surface-950 p-6 text-right select-none font-sans"
          dir="rtl"
        >
          {/* Ambient Glow */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-xl w-full rounded-3xl bg-surface-900/90 border border-white/10 p-8 shadow-2xl backdrop-blur-xl space-y-6">
            {/* Header Icon & Title */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/10">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">حدث خطأ غير متوقع في الواجهة</h2>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  تم رصد الخطأ وحماية بياناتك المحفوظة بأمان. يمكنك إعادة التحميل أو العودة
                  للرئيسية.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-4 rounded-2xl bg-surface-950 border border-white/[0.06] text-xs font-mono text-rose-300/90 break-words leading-relaxed">
              <div className="flex items-center gap-1.5 text-white/40 mb-1.5 font-bold font-sans">
                <Terminal size={13} />
                <span>رسالة الخطأ:</span>
              </div>
              <p className="selectable-text">
                {this.state.error?.message || 'خطأ غير محدد في المكونات'}
              </p>
            </div>

            {/* Collapsible Stack Trace */}
            {this.state.error?.stack && (
              <details className="group rounded-2xl bg-surface-950/60 border border-white/[0.04] p-3 text-xs">
                <summary className="font-bold text-white/50 hover:text-white/80 cursor-pointer flex items-center justify-between">
                  <span>عرض التفاصيل التقنية والـ Stack Trace</span>
                  <span className="text-[10px] text-white/30 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-3 p-3 rounded-xl bg-black/50 text-[11px] font-mono text-white/50 overflow-x-auto max-h-40 custom-scrollbar selectable-text whitespace-pre-wrap">
                  {this.state.error.stack}
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-surface-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>إعادة تحميل التطبيق 🔄</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-4 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all cursor-pointer"
              >
                <Home size={15} />
                <span>العودة للرئيسية 🏠</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopyError}
                className="py-3 px-3 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-white/70 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/[0.06] transition-all cursor-pointer shrink-0"
                title="نسخ تقرير الخطأ للتشخيص"
              >
                {this.state.isCopied ? (
                  <Check size={15} className="text-emerald-400" />
                ) : (
                  <Copy size={15} />
                )}
                <span className="hidden sm:inline">
                  {this.state.isCopied ? 'تم النسخ' : 'نسخ التقرير'}
                </span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
