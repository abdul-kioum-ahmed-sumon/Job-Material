import { useMemo, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { Upload, Image as ImageIcon } from 'lucide-react';
import type { ImportedImage } from '../types';
import SortableImageCard from './SortableImageCard';

interface ImageGridProps {
  images: ImportedImage[];
  onReorder: (images: ImportedImage[]) => void;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onAddMore: (files: FileList | File[]) => void;
}

export default function ImageGrid({
  images,
  onReorder,
  onRemove,
  onRotate,
  onAddMore,
}: ImageGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sorted = useMemo(
    () => [...images].sort((a, b) => a.order - b.order),
    [images]
  );
  const ids = useMemo(() => sorted.map((img) => img.id), [sorted]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
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

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Images</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {images.length} image{images.length !== 1 ? 's' : ''} selected
              <span className="hidden sm:inline"> · Drag to reorder</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary btn-sm"
            aria-label="Add more images"
          >
            <Upload className="w-4 h-4" />
            Add More
          </button>
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

      {/* Grid */}
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
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
