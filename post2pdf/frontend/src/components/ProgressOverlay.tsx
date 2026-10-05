import { Loader2, Download, CheckCircle2, FileText } from 'lucide-react';
import type { ProgressState } from '../types';
import { formatBytes } from '../utils';

interface ProgressOverlayProps {
  progress: ProgressState;
  pdfReady: boolean;
  pdfSize?: number;
  pageCount?: number;
  onDownload: () => void;
  onClose: () => void;
}

export default function ProgressOverlay({
  progress,
  pdfReady,
  pdfSize,
  pageCount,
  onDownload,
  onClose,
}: ProgressOverlayProps) {
  if (!progress.active && !pdfReady) return null;

  const percent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card p-8 max-w-md w-full mx-4 text-center space-y-6 animate-slide-up">
        {pdfReady ? (
          <>
            {/* Success state */}
            <div className="w-20 h-20 mx-auto rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">PDF Ready!</h3>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                {pageCount && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {pageCount} page{pageCount !== 1 ? 's' : ''}
                  </span>
                )}
                {pdfSize && <span>{formatBytes(pdfSize)}</span>}
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={onClose} className="btn-secondary btn-md">
                Close
              </button>
              <button onClick={onDownload} className="btn-primary btn-lg">
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Loading state */}
            <div className="w-20 h-20 mx-auto rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin-slow" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {progress.stage === 'preparing'
                  ? `Preparing image ${progress.current} of ${progress.total}...`
                  : 'Generating PDF...'}
              </h3>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 dark:text-slate-500">
                {percent}% complete
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
