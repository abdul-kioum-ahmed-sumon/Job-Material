import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Upload,
  Image as ImageIcon,
  RotateCw,
  ArrowUpDown,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import type { ImportedImage } from '../types';
import SortableImageCard from './SortableImageCard';

interface ImageGridProps {
  images: ImportedImage[];
  onReorder: (images: ImportedImage[]) => void;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onAddMore: (files: FileList | File[]) => void;
  onRotateAll?: () => void;
  onReverse?: () => void;
  onClear?: () => void;
}

export default function ImageGrid({
  images,
  onReorder,
  onRemove,
  onRotate,
  onAddMore,
  onRotateAll,
  onReverse,
  onClear,
}: ImageGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<ImportedImage | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const sorted = useMemo(
    () => [...images].sort((a, b) => a.order - b.order),
    [images]
  );
  const ids = useMemo(() => sorted.map((img) => img.id), [sorted]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sorted.findIndex((img) => img.id === active.id);
      const newIndex = sorted.findIndex((img) => img.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sorted, oldIndex, newIndex);
        onReorder(reordered);
      }
    },
    [sorted, onReorder]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onAddMore(e.target.files);
        e.target.value = '';
      }
    },
    [onAddMore]
  );

  // Keyboard navigation for preview lightbox
  useEffect(() => {
    if (!previewImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
      if (e.key === 'ArrowRight') {
        const currentIndex = sorted.findIndex((img) => img.id === previewImage.id);
        if (currentIndex < sorted.length - 1) {
          setPreviewImage(sorted[currentIndex + 1]);
        }
      }
      if (e.key === 'ArrowLeft') {
        const currentIndex = sorted.findIndex((img) => img.id === previewImage.id);
        if (currentIndex > 0) {
          setPreviewImage(sorted[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage, sorted]);

  const currentPreviewIndex = previewImage
    ? sorted.findIndex((img) => img.id === previewImage.id)
    : -1;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Management Toolbar */}
      <div className="card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xs">
        {/* Title & Count */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Study Materials
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                {images.length} {images.length === 1 ? 'Page' : 'Pages'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag images to rearrange study order • Click zoom to inspect
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rotate All */}
          {onRotateAll && (
            <button
              onClick={onRotateAll}
              className="btn-secondary btn-sm"
              title="Rotate all images 90° clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-brand-500" />
              <span>Rotate All</span>
            </button>
          )}

          {/* Reverse order */}
          {onReverse && images.length > 1 && (
            <button
              onClick={onReverse}
              className="btn-secondary btn-sm"
              title="Reverse image order (flip 1 to N)"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
              <span>Reverse Order</span>
            </button>
          )}

          {/* Add more files */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary btn-sm text-brand-600 dark:text-brand-400 font-semibold"
            aria-label="Add more images"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Add More</span>
          </button>

          {/* Clear all with confirm */}
          {onClear && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn-ghost btn-sm text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              title="Remove all uploaded images"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload more images"
          />
        </div>
      </div>

      {/* Grid of Images */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {sorted.map((image, index) => (
              <SortableImageCard
                key={image.id}
                image={image}
                index={index + 1}
                onRemove={onRemove}
                onRotate={onRotate}
                onPreview={(img) => setPreviewImage(img)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Lightbox / Fullscreen Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative max-w-4xl w-full h-[85vh] flex flex-col bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-brand-600 text-xs font-bold">
                  Page #{currentPreviewIndex + 1} of {sorted.length}
                </span>
                {previewImage.originalName && (
                  <span className="text-xs text-slate-400 truncate max-w-xs">
                    {previewImage.originalName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRotate(previewImage.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-500 text-slate-200 transition-colors"
                  title="Close preview (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image Preview Container */}
            <div className="flex-1 relative overflow-auto flex items-center justify-center p-4">
              <img
                src={previewImage.previewUrl}
                alt="Enlarged study sheet"
                className="max-w-full max-h-full object-contain transition-transform duration-300"
                style={{ transform: `rotate(${previewImage.rotation}deg)` }}
              />

              {/* Prev Button */}
              {currentPreviewIndex > 0 && (
                <button
                  onClick={() => setPreviewImage(sorted[currentPreviewIndex - 1])}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/80 hover:bg-brand-600 text-white backdrop-blur-md transition-all shadow-lg"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Button */}
              {currentPreviewIndex < sorted.length - 1 && (
                <button
                  onClick={() => setPreviewImage(sorted[currentPreviewIndex + 1])}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/80 hover:bg-brand-600 text-white backdrop-blur-md transition-all shadow-lg"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom info */}
            <div className="p-3 text-center text-xs text-slate-400 border-t border-slate-800 bg-slate-950/60">
              Use arrow keys &larr; &rarr; to navigate • Esc to exit
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Clear all {images.length} images?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will remove all currently loaded images from your workspace.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-secondary btn-sm flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  onClear?.();
                }}
                className="btn-danger btn-sm flex-1"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
