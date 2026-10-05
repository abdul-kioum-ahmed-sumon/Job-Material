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
      className={`group relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg hover:border-brand-400 dark:hover:border-brand-500/60 transition-all duration-200 ${
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
        />

        {/* Index Badge (Always visible on mobile & desktop top-left) */}
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold tabular-nums shadow-sm">
            #{String(index).padStart(2, '0')}
          </span>
        </div>

        {/* Rotation indicator pill */}
        {image.rotation > 0 && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="px-2 py-0.5 rounded-md bg-brand-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
              {image.rotation}°
            </span>
          </div>
        )}

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-grab active:cursor-grabbing backdrop-blur-md transition-colors"
              aria-label={`Drag to reorder image ${index}`}
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(image.id);
              }}
              className="p-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-md transition-colors shadow-sm"
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
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(image);
                }}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                aria-label={`Preview image ${index}`}
                title="Inspect high-res"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            )}

            {/* Rotate button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRotate(image.id);
              }}
              className="p-1.5 rounded-xl bg-white/20 hover:bg-brand-500 text-white backdrop-blur-md transition-colors"
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
