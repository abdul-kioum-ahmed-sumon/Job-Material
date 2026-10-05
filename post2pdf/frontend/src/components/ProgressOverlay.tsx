import { Loader2, Download, CheckCircle2, FileText, ExternalLink, Sparkles, HardDrive } from 'lucide-react';
import type { ProgressState } from '../types';
import { formatBytes } from '../utils';

interface ProgressOverlayProps {
  progress: ProgressState;
  pdfReady: boolean;
  pdfSize?: number;
  pageCount?: number;
  pdfBlob?: Blob | null;
  filename?: string;
  onDownload: () => void;
  onClose: () => void;
}

export default function ProgressOverlay({
  progress,
  pdfReady,
  pdfSize,
  pageCount,
  pdfBlob,
  filename,
  onDownload,
  onClose,
}: ProgressOverlayProps) {
  if (!progress.active && !pdfReady) return null;

  const percent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  const handleOpenInNewTab = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="card p-6 sm:p-8 max-w-md w-full mx-auto text-center space-y-6 shadow-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl animate-slide-up">
        {pdfReady ? (
          <>
            {/* Success Icon */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-50" />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            {/* Header */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
                <Sparkles className="w-3.5 h-3.5" />
                PDF Successfully Generated!
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white truncate max-w-xs mx-auto pt-1">
                {filename || 'Study_Document.pdf'}
              </h3>
            </div>

            {/* Metrics Chips */}
            <div className="flex items-center justify-center gap-3 py-2 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
              {pageCount && (
                <span className="flex items-center gap-1.5 font-semibold">
                  <FileText className="w-4 h-4 text-brand-500" />
                  {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
                </span>
              )}
              <span className="text-slate-300 dark:text-slate-600">|</span>
              {pdfSize && (
                <span className="flex items-center gap-1.5 font-semibold">
                  <HardDrive className="w-4 h-4 text-emerald-500" />
                  {formatBytes(pdfSize)}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onDownload}
                className="btn-primary btn-lg w-full shadow-lg shadow-brand-500/25"
                type="button"
              >
                <Download className="w-5 h-5" />
                Download PDF File
              </button>

              <div className="flex gap-2">
                {pdfBlob && (
                  <button
                    onClick={handleOpenInNewTab}
                    className="btn-secondary btn-md flex-1 text-xs"
                    type="button"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview in Tab
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="btn-ghost btn-md flex-1 text-xs"
                  type="button"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Loading Spinner */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {progress.stage === 'preparing'
                  ? `Rendering Image ${progress.current} of ${progress.total}...`
                  : 'Compiling PDF Pages & Packaging...'}
              </h3>

              {/* Modern Progress Bar */}
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 transition-all duration-300 shadow-sm"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
                <span>Processing high-resolution pages</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">{percent}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
