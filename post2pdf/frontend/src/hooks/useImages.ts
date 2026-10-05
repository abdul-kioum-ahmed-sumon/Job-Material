import { useState, useCallback, useRef } from 'react';
import type { ImportedImage } from '../types';
import { generateId, createPreviewUrl, revokePreviewUrl } from '../utils';

export function useImages() {
  const [images, setImages] = useState<ImportedImage[]>([]);
  const orderCounter = useRef(0);

  const addFilesAsImages = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((f) =>
      f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(f.name)
    );

    const newImages: ImportedImage[] = validFiles.map((file) => {
      const id = generateId();
      orderCounter.current += 1;
      return {
        id,
        source: 'upload' as const,
        file,
        previewUrl: createPreviewUrl(file),
        originalName: file.name,
        rotation: 0,
        order: orderCounter.current,
      };
    });

    setImages((prev) => [...prev, ...newImages]);
    return newImages;
  }, []);

  const addFacebookImages = useCallback(
    (
      fbImages: Array<{ url: string; preview_url?: string; width?: number; height?: number }>
    ) => {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const newImages: ImportedImage[] = fbImages.map((img) => {
        orderCounter.current += 1;
        let preview = img.preview_url || img.url;
        if (preview.startsWith('/')) {
          preview = `${apiBase}${preview}`;
        }
        return {
          id: generateId(),
          source: 'facebook' as const,
          url: img.url,
          previewUrl: preview,
          width: img.width,
          height: img.height,
          rotation: 0,
          order: orderCounter.current,
        };
      });

      setImages((prev) => [...prev, ...newImages]);
      return newImages;
    },
    []
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        revokePreviewUrl(img.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const rotateImage = useCallback((id: string, degrees: number = 90) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? { ...img, rotation: (img.rotation + degrees) % 360 }
          : img
      )
    );
  }, []);

  const reorderImages = useCallback((reorderedImages: ImportedImage[]) => {
    const updated = reorderedImages.map((img, idx) => ({
      ...img,
      order: idx + 1,
    }));
    setImages(updated);
  }, []);

  const rotateAllImages = useCallback((degrees: number = 90) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        rotation: (img.rotation + degrees) % 360,
      }))
    );
  }, []);

  const reverseImages = useCallback(() => {
    setImages((prev) => {
      const reversed = [...prev].reverse().map((img, idx) => ({
        ...img,
        order: idx + 1,
      }));
      return reversed;
    });
  }, []);

  const clearImages = useCallback(() => {
    images.forEach((img) => revokePreviewUrl(img.previewUrl));
    setImages([]);
    orderCounter.current = 0;
  }, [images]);

  return {
    images,
    addFilesAsImages,
    addFacebookImages,
    removeImage,
    rotateImage,
    rotateAllImages,
    reverseImages,
    reorderImages,
    clearImages,
  };
}
