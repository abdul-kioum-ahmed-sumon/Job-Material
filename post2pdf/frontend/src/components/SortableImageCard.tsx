import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RotateCw, X, GripVertical, ZoomIn } from 'lucide-react';
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
      className={`group relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg hover:border-brand-400 dark:hover:border-brand-500/60 transition-all duration-200 select-none ${
        isDragging ? 'opacity-60 scale-95 border-brand-500 shadow-2xl z-50 ring-2 ring-brand-500' : ''
      }`}
      aria-label={`Image ${index}${image.originalName ? `: ${image.originalName}` : ''}`}
    >
      {/* Aspect Square Image Container */}
      <div className="aspect-square relative overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <img
          src={image.previewUrl}
          alt={`Study Sheet ${index}`}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `rotate(${image.rotation}deg)` }}
          loading="lazy"
          draggable={false}
          onError={() => {
            // Automatically purge unavailable or non-renderable media
            onRemove(image.id);
          }}
        />

        {/* Desktop Hover Backdrop Scrim (fades in on hover on desktop, transparent on mobile) */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10" />

        {/* Index Badge & Reorder Handle (Top-left) */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
          <span className="h-8 px-2.5 sm:h-7 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-bold tabular-nums shadow-sm select-none">
            #{String(index).padStart(2, '0')}
          </span>

          {/* Reorder drag handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none' }}
            className={`h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded-xl bg-black/60 hover:bg-black/80 active:bg-brand-600 text-white cursor-grab active:cursor-grabbing backdrop-blur-md transition-all shadow-sm touch-none select-none touch-control-visible ${
              isDragging
                ? 'opacity-100 pointer-events-auto ring-2 ring-brand-400 scale-105'
                : 'opacity-100 pointer-events-auto md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto'
            }`}
            aria-label={`Drag to reorder image ${index}`}
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Top-Right: Delete Page Button */}
        <div className="absolute top-2 right-2 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(image.id);
            }}
            className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded-xl bg-red-500/85 hover:bg-red-600 active:bg-red-700 text-white backdrop-blur-md transition-all shadow-sm opacity-100 pointer-events-auto md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto touch-control-visible active:scale-95"
            aria-label={`Remove image ${index}`}
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom-Left: Rotation Indicator Pill */}
        {image.rotation > 0 && (
          <div className="absolute bottom-2 left-2 z-20">
            <span className="h-8 px-2 sm:h-6 flex items-center rounded-lg bg-brand-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
              {image.rotation}°
            </span>
          </div>
        )}

        {/* Bottom-Right: View & Rotate Actions */}
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5 opacity-100 pointer-events-auto md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto touch-control-visible transition-opacity duration-200">
          {/* Zoom / Full Preview (View button) */}
          {onPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(image);
              }}
              className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded-xl bg-black/60 hover:bg-black/80 active:bg-brand-600 text-white backdrop-blur-md transition-colors shadow-sm active:scale-95"
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
            className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded-xl bg-black/60 hover:bg-brand-500 active:bg-brand-600 text-white backdrop-blur-md transition-colors shadow-sm active:scale-95"
            aria-label={`Rotate image ${index}`}
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
