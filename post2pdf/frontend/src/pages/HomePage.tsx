import { useState, useCallback, useRef } from 'react';
import { FileDown, Trash2, ArrowUp } from 'lucide-react';
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
    reorderImages,
    clearImages,
  } = useImages();

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Import Section */}
      <ImportSection
        onFilesSelected={addFilesAsImages}
        onFacebookImport={addFacebookImages}
        hasImages={images.length > 0}
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <>
          <ImageGrid
            images={images}
            onReorder={reorderImages}
            onRemove={removeImage}
            onRotate={rotateImage}
            onAddMore={addFilesAsImages}
          />

          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={clearImages}
              className="btn-ghost btn-md text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Clear all images"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>

            <button
              onClick={() =>
                settingsRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
              className="btn-secondary btn-md sm:hidden"
            >
              <ArrowUp className="w-4 h-4 rotate-180" />
              PDF Settings
            </button>
          </div>

          {/* PDF Settings */}
          <div ref={settingsRef}>
            <PDFSettingsPanel
              settings={settings}
              onSettingsChange={setSettings}
            />
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={images.length === 0 || generating}
              className="btn-primary btn-xl text-lg shadow-2xl shadow-brand-500/30"
              aria-label="Generate PDF"
            >
              <FileDown className="w-6 h-6" />
              Generate PDF
              <span className="badge-brand ml-1">
                {images.length} image{images.length !== 1 ? 's' : ''}
              </span>
            </button>
          </div>
        </>
      )}

      {/* Progress / Download Overlay */}
      <ProgressOverlay
        progress={progress}
        pdfReady={pdfReady}
        pdfSize={pdfBlob?.size}
        pageCount={pdfPageCount}
        onDownload={handleDownload}
        onClose={handleCloseProgress}
      />
    </div>
  );
}
