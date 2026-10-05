import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RotateCw, X, GripVertical } from 'lucide-react';
import type { ImportedImage } from '../types';

interface SortableImageCardProps {
  image: ImportedImage;
  index: number;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
}

export default function SortableImageCard({
  image,
  index,
  onRemove,
  onRotate,
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
      className={`image-card group ${isDragging ? 'dragging' : ''}`}
      aria-label={`Image ${index}${image.originalName ? `: ${image.originalName}` : ''}`}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-slate-700">
        <img
          src={image.previewUrl}
          alt={`Image ${index}`}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `rotate(${image.rotation}deg)` }}
          loading="lazy"
          draggable={false}
        />

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between p-1.5">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="p-1.5 rounded-lg bg-black/40 text-white/90 hover:bg-black/60 cursor-grab active:cursor-grabbing transition-colors"
              aria-label={`Drag to reorder image ${index}`}
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(image.id);
              }}
              className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
              aria-label={`Remove image ${index}`}
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 inset-x-0 flex items-center justify-between p-1.5">
            {/* Index badge */}
            <span className="px-2 py-0.5 rounded-md bg-black/50 text-white text-xs font-bold tabular-nums">
              {String(index).padStart(2, '0')}
            </span>

            {/* Rotate */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRotate(image.id);
              }}
              className="p-1.5 rounded-lg bg-black/40 text-white/90 hover:bg-black/60 transition-colors"
              aria-label={`Rotate image ${index}`}
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rotation indicator */}
        {image.rotation > 0 && (
          <div className="absolute top-1.5 right-1.5 group-hover:hidden">
            <span className="px-1.5 py-0.5 rounded-md bg-brand-500/80 text-white text-[10px] font-bold">
              {image.rotation}°
            </span>
          </div>
        )}
      </div>

      {/* Number (always visible on mobile) */}
      <div className="absolute bottom-1.5 left-1.5 group-hover:hidden sm:group-hover:hidden">
        <span className="px-2 py-0.5 rounded-md bg-black/50 text-white text-xs font-bold tabular-nums">
          {String(index).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
