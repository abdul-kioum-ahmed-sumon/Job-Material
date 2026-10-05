import { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Link as LinkIcon, Loader2, AlertCircle, Info } from 'lucide-react';
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
  const [fbUrl, setFbUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      setFbUrl(urlParam);
    }
  }, []);

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
          'Facebook prevented automatic image retrieval for this post. You can upload the post images manually instead.'
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
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-purple-500 bg-clip-text text-transparent">
            Post2PDF
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
          Convert Facebook study images into a clean, organized PDF
        </p>
      </div>

      {/* Facebook URL Import */}
      <div className="card p-6 sm:p-8 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
          <LinkIcon className="w-4 h-4 text-brand-500" />
          Paste Facebook Public Post URL
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={fbUrl}
            onChange={(e) => {
              setFbUrl(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleFacebookFetch()}
            placeholder="https://www.facebook.com/..."
            className="input flex-1"
            aria-label="Facebook post URL"
            disabled={loading}
          />
          <button
            onClick={handleFacebookFetch}
            disabled={loading || !fbUrl.trim()}
            className="btn-primary btn-md whitespace-nowrap"
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

        {error && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Automatic Facebook image import works only when the post and image data are publicly accessible.
            Facebook may block automated requests. If that happens, simply upload the images manually.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 max-w-2xl mx-auto">
        <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
        <span className="text-sm font-medium text-gray-400 dark:text-slate-500">OR</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
      </div>

      {/* Manual Upload */}
      <div
        className={`card max-w-2xl mx-auto transition-all duration-200 ${
          dragOver
            ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 shadow-xl shadow-brand-500/10'
            : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="p-8 sm:p-12 text-center space-y-4">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
              dragOver
                ? 'bg-brand-500 text-white scale-110'
                : 'bg-brand-50 text-brand-500 dark:bg-brand-900/30'
            }`}
          >
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {hasImages ? 'Add More Images' : 'Upload Images'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Drag & drop images here, or click to browse
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary btn-md"
            aria-label="Browse files to upload"
          >
            <Upload className="w-4 h-4" />
            Browse Files
          </button>

          <p className="text-xs text-gray-400 dark:text-slate-500">
            Supported: JPG, PNG, WEBP • Max 15 MB per image
          </p>

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
    </div>
  );
}
