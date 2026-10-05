import { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Link as LinkIcon, Loader2, AlertCircle, Info, Sparkles, Clipboard, X, CheckCircle, ShieldCheck, Zap, Layers } from 'lucide-react';
import { importFacebookImages } from '../services/facebook';
import { isFacebookUrl } from '../utils';

interface ImportSectionProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onFacebookImport: (images: Array<{ url: string; preview_url?: string; width?: number; height?: number }>) => void;
  hasImages: boolean;
}

export default function ImportSection({
  onFilesSelected,
  onFacebookImport,
  hasImages,
}: ImportSectionProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [fbUrl, setFbUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      setFbUrl(urlParam);
      setActiveTab('url');
    }
  }, []);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setFbUrl(text.trim());
          setError(null);
          setCopiedNotification(true);
          setTimeout(() => setCopiedNotification(false), 2000);
        }
      }
    } catch {
      // Clipboard access might be blocked by browser permissions
    }
  };

  const handleFacebookFetch = useCallback(async () => {
    if (!fbUrl.trim()) {
      setError('Please enter a Facebook post URL.');
      return;
    }
    if (!isFacebookUrl(fbUrl)) {
      setError('Please enter a valid Facebook URL (e.g., https://www.facebook.com/...).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await importFacebookImages(fbUrl);
      if (result.success && result.images && result.images.length > 0) {
        onFacebookImport(result.images);
        setFbUrl('');
      } else {
        setError(
          result.message ||
          'Facebook prevented automatic image retrieval for this post. You can upload the post images manually via drag & drop.'
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fbUrl, onFacebookImport]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files);
        e.target.value = '';
      }
    },
    [onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [onFilesSelected]
  );

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        {/* Modern Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-50 via-indigo-50 to-purple-50 dark:from-brand-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-brand-200/80 dark:border-brand-800/80 text-brand-700 dark:text-brand-300 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
          <span>Post2PDF Studio • Engineered by <strong className="font-bold text-brand-800 dark:text-brand-200">A.K.A.SUMON</strong></span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Convert Study Posts into{' '}
          <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 dark:from-brand-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
            Clean, Crisp PDFs
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Transform multi-photo Facebook study materials, BCS prep notes, and question sheets into high-resolution, printable documents in seconds.
        </p>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            100% In-Browser & Private
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Instant Generation
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
            <Layers className="w-3.5 h-3.5 text-brand-500" />
            1, 2, or 4 Grid Layouts
          </span>
        </div>
      </div>

      {/* Main Import Card with Tabs */}
      <div className="card max-w-3xl mx-auto overflow-hidden shadow-xl shadow-brand-500/5 dark:shadow-none border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl">
        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200
              ${activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/80 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            type="button"
          >
            <Upload className="w-4 h-4 text-brand-500" />
            <span>Upload Images Directly</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              Fastest
            </span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200
              ${activeTab === 'url'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/80 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            type="button"
          >
            <LinkIcon className="w-4 h-4 text-brand-500" />
            <span>Import from Facebook URL</span>
          </button>
        </div>

        {/* Tab 1: Direct File Upload & Dropzone */}
        {activeTab === 'upload' && (
          <div className="p-6 sm:p-10 space-y-6">
            <div
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center cursor-pointer group
                ${dragOver
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01] shadow-lg shadow-brand-500/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500/70 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4 max-w-md mx-auto">
                <div
                  className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                    dragOver
                      ? 'bg-brand-600 text-white scale-110 shadow-brand-500/40'
                      : 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 group-hover:scale-105 group-hover:bg-brand-500 group-hover:text-white'
                  }`}
                >
                  <Upload className="w-8 h-8 transition-transform group-hover:-translate-y-0.5" />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {hasImages ? 'Add More Study Images' : 'Drag & Drop Your Study Images Here'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Select multiple files at once. You can reorder, rotate, and customize page layouts later.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="btn-primary btn-md shadow-md shadow-brand-500/20"
                  >
                    <Upload className="w-4 h-4" />
                    Browse Files from Device
                  </button>
                </div>

                {/* Supported Formats */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">JPG</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">PNG</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">WEBP</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">HEIC</span>
                  <span>• Up to 25 MB each</span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload images"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Facebook URL Import */}
        {activeTab === 'url' && (
          <div className="p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="fb-url-input" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-brand-500" />
                  Public Facebook Post Link
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Works best on open pages & public groups
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    id="fb-url-input"
                    type="url"
                    value={fbUrl}
                    onChange={(e) => {
                      setFbUrl(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleFacebookFetch()}
                    placeholder="https://www.facebook.com/..."
                    className="input w-full pr-16"
                    aria-label="Facebook post URL"
                    disabled={loading}
                  />

                  {/* Actions inside input */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {fbUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFbUrl('');
                          setError(null);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Clear"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      title="Paste from clipboard"
                    >
                      {copiedNotification ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Clipboard className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFacebookFetch}
                  disabled={loading || !fbUrl.trim()}
                  className="btn-primary btn-md whitespace-nowrap min-w-[130px]"
                  aria-label="Fetch images from Facebook"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch Images'
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 animate-fade-in"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 underline hover:no-underline"
                  >
                    Switch to manual file upload instead &rarr;
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-brand-50/50 dark:bg-slate-800/60 border border-brand-100 dark:border-slate-700/80">
              <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Automatic retrieval requires the Facebook post to be completely public. If the post is in a private group or restricted by login wall, simply save/screenshot the photos and use the <strong>Upload Images Directly</strong> tab above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
