import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RotateCw, X, GripVertical, ZoomIn, AlertTriangle } from 'lucide-react';
import type { ImportedImage } from '../types';

interface SortableImageCardProps {
  image: ImportedImage;
  index: number;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onPreview?: (image: ImportedImage) => void;
}

export default function SortableImageCard({
  image,
  index,
  onRemove,
  onRotate,
  onPreview,
}: SortableImageCardProps) {
  const [imageError, setImageError] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg hover:border-brand-400 dark:hover:border-brand-500/60 transition-all duration-200 ${
        isDragging ? 'opacity-60 scale-95 border-brand-500 shadow-2xl z-50 ring-2 ring-brand-500' : ''
      }`}
      aria-label={`Image ${index}${image.originalName ? `: ${image.originalName}` : ''}`}
    >
      {/* Aspect Square Image Container */}
      <div className="aspect-square relative overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        {imageError ? (
          <div className="flex flex-col items-center justify-center p-3 text-center space-y-2 bg-slate-100 dark:bg-slate-900 w-full h-full select-none">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Image Unavailable
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(image.id);
              }}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <img
            src={image.previewUrl}
            alt={`Study Sheet ${index}`}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ transform: `rotate(${image.rotation}deg)` }}
            loading="lazy"
            draggable={false}
            onError={() => setImageError(true)}
          />
        )}

        {/* Index Badge & Reorder Handle (Top-left, non-overlapping flex layout) */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
          <span className="h-7 px-2.5 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-bold tabular-nums shadow-sm select-none">
            #{String(index).padStart(2, '0')}
          </span>

          {/* Reorder drag handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={`h-7 w-7 flex items-center justify-center rounded-xl bg-black/60 hover:bg-black/80 active:bg-brand-600 text-white cursor-grab active:cursor-grabbing backdrop-blur-md transition-all shadow-sm ${
              isDragging
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
            }`}
            aria-label={`Drag to reorder image ${index}`}
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Rotation indicator pill */}
        {image.rotation > 0 && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="h-6 px-2 flex items-center rounded-lg bg-brand-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
              {image.rotation}°
            </span>
          </div>
        )}

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2 pointer-events-none group-hover:pointer-events-auto">
          {/* Top Actions: Delete on top-right */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(image.id);
              }}
              className="h-7 w-7 flex items-center justify-center rounded-xl bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-md transition-colors shadow-sm"
              aria-label={`Remove image ${index}`}
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-1.5">
            {/* Zoom / Full Preview */}
            {onPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(image);
                }}
                className="h-7 w-7 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                aria-label={`Preview image ${index}`}
                title="Inspect high-res"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            )}

            {/* Rotate button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRotate(image.id);
              }}
              className="h-7 w-7 flex items-center justify-center rounded-xl bg-white/20 hover:bg-brand-500 text-white backdrop-blur-md transition-colors"
              aria-label={`Rotate image ${index}`}
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
