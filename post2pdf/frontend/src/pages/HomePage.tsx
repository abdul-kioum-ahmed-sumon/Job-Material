import { useState, useCallback, useRef, useEffect } from 'react';
import { FileDown, Sparkles, SlidersHorizontal } from 'lucide-react';
import ImportSection from '../components/ImportSection';
import ImageGrid from '../components/ImageGrid';
import PDFSettingsPanel from '../components/PDFSettingsPanel';
import ProgressOverlay from '../components/ProgressOverlay';
import { useImages } from '../hooks/useImages';
import { generatePDF } from '../services/pdf';
import { savePDFRecord } from '../services/storage';
import { generatePDFFilename, downloadBlob, generateId } from '../utils';
import type { PDFSettings, ProgressState } from '../types';

export default function HomePage() {
  const {
    images,
    addFilesAsImages,
    addFacebookImages,
    removeImage,
    rotateImage,
    rotateAllImages,
    reverseImages,
    reorderImages,
    clearImages,
  } = useImages();

  // Support 1-click import from browser bookmarklet via ?import_urls= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importUrlsParam = params.get('import_urls');
    if (importUrlsParam) {
      try {
        const rawUrls = JSON.parse(decodeURIComponent(importUrlsParam));
        if (Array.isArray(rawUrls) && rawUrls.length > 0) {
          addFacebookImages(rawUrls.map((u: string) => ({ url: u })));
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Failed to parse import_urls query parameter:', err);
      }
    }
  }, [addFacebookImages]);

  const [settings, setSettings] = useState<PDFSettings>({
    pageSize: 'a4',
    layout: '1',
    imageFit: 'fit',
    margin: 'small',
    quality: 'high',
    filename: generatePDFFilename(),
  });

  const [progress, setProgress] = useState<ProgressState>({
    active: false,
    current: 0,
    total: 0,
    stage: 'preparing',
    message: '',
  });

  const [pdfReady, setPdfReady] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [generating, setGenerating] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = useCallback(async () => {
    if (images.length === 0 || generating) return;

    setGenerating(true);
    setPdfReady(false);
    setProgress({
      active: true,
      current: 0,
      total: images.length,
      stage: 'preparing',
      message: '',
    });

    try {
      const blob = await generatePDF(
        images,
        settings,
        (current, total, stage) => {
          setProgress({
            active: true,
            current,
            total,
            stage: stage as 'preparing' | 'generating',
            message: '',
          });
        }
      );

      const pageCount = Math.ceil(
        images.length / parseInt(settings.layout)
      );

      setPdfBlob(blob);
      setPdfPageCount(pageCount);
      setPdfReady(true);
      setProgress((p) => ({ ...p, active: false }));

      // Save to history
      const filename = settings.filename || generatePDFFilename();
      await savePDFRecord(
        {
          id: generateId(),
          name: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
          createdAt: new Date().toISOString(),
          pageCount,
          size: blob.size,
        },
        blob
      );
    } catch (err) {
      console.error('PDF generation error:', err);
      setProgress({ active: false, current: 0, total: 0, stage: 'preparing', message: '' });
      setPdfReady(false);
    } finally {
      setGenerating(false);
    }
  }, [images, settings, generating]);

  const handleDownload = useCallback(() => {
    if (!pdfBlob) return;
    const filename = settings.filename || generatePDFFilename();
    downloadBlob(pdfBlob, filename);
  }, [pdfBlob, settings.filename]);

  const handleCloseProgress = useCallback(() => {
    setPdfReady(false);
    setProgress({ active: false, current: 0, total: 0, stage: 'preparing', message: '' });
  }, []);

  const estimatedPages = images.length > 0
    ? Math.ceil(images.length / parseInt(settings.layout))
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10 pb-28">
      {/* Import Section */}
      <ImportSection
        onFilesSelected={addFilesAsImages}
        onFacebookImport={addFacebookImages}
        hasImages={images.length > 0}
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-8 animate-slide-up">
          <ImageGrid
            images={images}
            onReorder={reorderImages}
            onRemove={removeImage}
            onRotate={rotateImage}
            onAddMore={addFilesAsImages}
            onRotateAll={rotateAllImages}
            onReverse={reverseImages}
            onClear={clearImages}
          />

          {/* PDF Settings */}
          <div ref={settingsRef}>
            <PDFSettingsPanel
              settings={settings}
              onSettingsChange={setSettings}
              totalImages={images.length}
            />
          </div>

          {/* Standalone Primary Generate Button */}
          <div className="flex flex-col items-center justify-center gap-3 pt-4">
            <button
              onClick={handleGenerate}
              disabled={images.length === 0 || generating}
              className="btn-primary btn-xl text-base sm:text-lg shadow-2xl shadow-brand-500/30 group"
              aria-label="Generate PDF Document"
            >
              <FileDown className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Generate PDF Document</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold ml-1">
                {images.length} {images.length === 1 ? 'Page' : 'Pages'}
              </span>
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ⚡ Generated 100% locally in your browser. No files uploaded to external servers.
            </p>
          </div>
        </div>
      )}

      {/* Floating Sticky Quick Bar (Visible when images are loaded) */}
      {images.length > 0 && (
        <div className="fixed bottom-5 inset-x-0 z-30 pointer-events-none flex justify-center px-4 animate-slide-up">
          <div className="pointer-events-auto p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-center gap-2 sm:gap-4 text-white max-w-xl w-full justify-between">
            <div className="flex items-center gap-2 pl-2">
              <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white">{images.length}</span> images
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-brand-300 font-semibold">{estimatedPages}</span> {estimatedPages === 1 ? 'page' : 'pages'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
                title="Scroll to PDF Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary btn-sm py-2 px-4 shadow-lg shadow-brand-500/30 text-xs"
              >
                <FileDown className="w-4 h-4" />
                <span>Generate PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress / Download Overlay */}
      <ProgressOverlay
        progress={progress}
        pdfReady={pdfReady}
        pdfSize={pdfBlob?.size}
        pageCount={pdfPageCount}
        pdfBlob={pdfBlob}
        filename={settings.filename}
        onDownload={handleDownload}
        onClose={handleCloseProgress}
      />
    </div>
  );
}
