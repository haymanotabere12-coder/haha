import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem('ethio_exam_video_lessons');
      localStorage.removeItem('ethio_exam_live_classes');
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 antialiased selection:bg-emerald-500 selection:text-white">
          <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                የስርዓት ማገገሚያ ገጽ (System Recovery)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                በመተግበሪያው ውስጥ ያልተጠበቀ ስህተት አጋጥሟል። እባክዎ ከታች ያሉትን የማስተካከያ አዝራሮች በመጫን ገጹን ዳግም ያስጀምሩ።
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-700 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
                <span className="text-slate-500 block mb-1">ስህተት (Error Details):</span>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ገጹን ዳግም ጫን (Reload)</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReset}
                className="py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs sm:text-sm border border-slate-600 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span>መሸጎጫ አጽዳና ጀምር (Clear & Reset)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
