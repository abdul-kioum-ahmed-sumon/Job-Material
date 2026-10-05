import { jsPDF } from 'jspdf';
import api from './api';
import type { ImportedImage, PDFSettings } from '../types';

// Page sizes in mm
const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [210, 297],
  letter: [215.9, 279.4],
};

const MARGINS: Record<string, number> = {
  none: 0,
  small: 5,
  medium: 10,
};

/**
 * Load an image (file, proxy URL, or CDN URL) and return as a real base64 data URL.
 */
export async function imageToDataUrl(image: ImportedImage): Promise<string> {
  // Case 1: Local File object
  if (image.file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(image.file!);
    });
  }

  // Case 2: Already a base64 data URL
  if (image.previewUrl && image.previewUrl.startsWith('data:')) {
    return image.previewUrl;
  }

  // Case 3: Fetch image as blob from previewUrl (proxy) or url and convert to base64
  const candidates = [image.previewUrl, image.url].filter(Boolean) as string[];
  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.warn(`Direct fetch failed for ${url}:`, e);
    }
  }

  // Case 4: Canvas rendering fallback with crossOrigin
  for (const url of candidates) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not available'));
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error(`Image element failed to load from ${url}`));
        img.src = url;
      });
      return dataUrl;
    } catch (e) {
      console.warn(`Canvas extraction failed for ${url}:`, e);
    }
  }

  throw new Error(`Unable to load image data for image #${image.order}`);
}

/**
 * Load an HTMLImageElement from a data URL.
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image element'));
    img.src = dataUrl;
  });
}

/**
 * Apply rotation to an image using canvas.
 */
function rotateImage(
  img: HTMLImageElement,
  rotation: number,
  quality: number
): { dataUrl: string; width: number; height: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const rad = (rotation * Math.PI) / 180;

  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const newW = Math.round(img.width * cos + img.height * sin);
  const newH = Math.round(img.width * sin + img.height * cos);

  canvas.width = newW;
  canvas.height = newH;

  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  const format = 'image/jpeg';
  return {
    dataUrl: canvas.toDataURL(format, quality),
    width: newW,
    height: newH,
  };
}

/**
 * Generate PDF client-side using jsPDF.
 */
export async function generatePDFClientSide(
  images: ImportedImage[],
  settings: PDFSettings,
  onProgress?: (current: number, total: number, stage: string) => void
): Promise<Blob> {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const margin = MARGINS[settings.margin];
  const quality = settings.quality === 'high' ? 0.95 : 0.8;
  const imagesPerPage = parseInt(settings.layout);

  // Page dimensions in mm
  let pageW: number;
  let pageH: number;

  if (settings.pageSize === 'original') {
    pageW = 210;
    pageH = 297;
  } else {
    [pageW, pageH] = PAGE_SIZES[settings.pageSize] || PAGE_SIZES.a4;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageW, pageH],
  });

  let pageAdded = false;
  let imgIdx = 0;
  let processedCount = 0;

  while (imgIdx < sorted.length) {
    if (pageAdded) {
      doc.addPage([pageW, pageH], 'portrait');
    }
    pageAdded = true;

    // Calculate slot positions
    const usableW = pageW - 2 * margin;
    const usableH = pageH - 2 * margin;
    const gap = margin > 0 ? 2 : 0;

    let slots: Array<{ x: number; y: number; w: number; h: number }> = [];

    if (imagesPerPage === 1) {
      slots = [{ x: margin, y: margin, w: usableW, h: usableH }];
    } else if (imagesPerPage === 2) {
      const slotH = (usableH - gap) / 2;
      slots = [
        { x: margin, y: margin, w: usableW, h: slotH },
        { x: margin, y: margin + slotH + gap, w: usableW, h: slotH },
      ];
    } else if (imagesPerPage === 4) {
      const slotW = (usableW - gap) / 2;
      const slotH = (usableH - gap) / 2;
      slots = [
        { x: margin, y: margin, w: slotW, h: slotH },
        { x: margin + slotW + gap, y: margin, w: slotW, h: slotH },
        { x: margin, y: margin + slotH + gap, w: slotW, h: slotH },
        { x: margin + slotW + gap, y: margin + slotH + gap, w: slotW, h: slotH },
      ];
    }

    for (const slot of slots) {
      if (imgIdx >= sorted.length) break;

      const image = sorted[imgIdx];
      onProgress?.(imgIdx + 1, sorted.length, 'preparing');

      try {
        const dataUrl = await imageToDataUrl(image);
        const htmlImg = await loadImage(dataUrl);

        let finalDataUrl: string;
        let imgW: number;
        let imgH: number;

        if (image.rotation % 360 !== 0) {
          const rotated = rotateImage(htmlImg, image.rotation, quality);
          finalDataUrl = rotated.dataUrl;
          imgW = rotated.width;
          imgH = rotated.height;
        } else {
          // Compress to JPEG at quality setting
          const canvas = document.createElement('canvas');
          canvas.width = htmlImg.width;
          canvas.height = htmlImg.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(htmlImg, 0, 0);
          finalDataUrl = canvas.toDataURL('image/jpeg', quality);
          imgW = htmlImg.width;
          imgH = htmlImg.height;
        }

        // Calculate fit dimensions
        let drawW: number;
        let drawH: number;

        const aspectImg = imgW / imgH;
        const aspectSlot = slot.w / slot.h;

        if (settings.imageFit === 'fit' || settings.imageFit === 'original') {
          if (aspectImg > aspectSlot) {
            drawW = slot.w;
            drawH = slot.w / aspectImg;
          } else {
            drawH = slot.h;
            drawW = slot.h * aspectImg;
          }
        } else {
          // fill
          if (aspectImg > aspectSlot) {
            drawH = slot.h;
            drawW = slot.h * aspectImg;
          } else {
            drawW = slot.w;
            drawH = slot.w / aspectImg;
          }
        }

        // Center in slot
        const x = slot.x + (slot.w - drawW) / 2;
        const y = slot.y + (slot.h - drawH) / 2;

        doc.addImage(finalDataUrl, 'JPEG', x, y, drawW, drawH);
        processedCount++;
      } catch (err) {
        console.error(`Failed to process image ${imgIdx + 1}:`, err);
      }

      imgIdx++;
    }
  }

  if (processedCount === 0) {
    throw new Error('Failed to render images into the PDF. Please check if the images are accessible.');
  }

  onProgress?.(sorted.length, sorted.length, 'generating');

  const blob = doc.output('blob');
  return blob;
}

/**
 * Generate PDF server-side.
 */
export async function generatePDFServerSide(
  images: ImportedImage[],
  settings: PDFSettings,
  onProgress?: (current: number, total: number, stage: string) => void
): Promise<Blob> {
  const sorted = [...images].sort((a, b) => a.order - b.order);

  // Convert images to base64 for reliable transmission without server-side CDN blocking
  const imageItems = [];
  for (let i = 0; i < sorted.length; i++) {
    const image = sorted[i];
    onProgress?.(i + 1, sorted.length, 'preparing');

    let imageData: string | undefined;
    let url: string | undefined;

    try {
      imageData = await imageToDataUrl(image);
    } catch {
      url = image.url || image.previewUrl;
    }

    imageItems.push({
      image_data: imageData,
      url: url,
      rotation: image.rotation,
      order: image.order,
      filename: image.originalName,
    });
  }

  onProgress?.(sorted.length, sorted.length, 'generating');

  const response = await api.post('/api/pdf/generate', {
    images: imageItems,
    page_size: settings.pageSize,
    layout: settings.layout,
    image_fit: settings.imageFit,
    margin: settings.margin,
    quality: settings.quality,
    filename: settings.filename,
  }, {
    responseType: 'blob',
    timeout: 300000, // 5 minutes for server-side generation
  });

  return response.data;
}

/**
 * Smart PDF generation: tries fast client-side rendering first,
 * with automatic server-side fallback if needed.
 */
export async function generatePDF(
  images: ImportedImage[],
  settings: PDFSettings,
  onProgress?: (current: number, total: number, stage: string) => void
): Promise<Blob> {
  if (images.length === 0) {
    throw new Error('No images selected to generate PDF.');
  }

  // 1. Try client-side generation first
  try {
    return await generatePDFClientSide(images, settings, onProgress);
  } catch (clientErr) {
    console.warn('Client-side PDF generation encountered an error, falling back to server-side:', clientErr);

    // 2. Fall back to server-side generation
    try {
      return await generatePDFServerSide(images, settings, onProgress);
    } catch (serverErr) {
      console.error('Server-side PDF generation fallback also failed:', serverErr);
      const clientMsg = clientErr instanceof Error ? clientErr.message : String(clientErr);
      const serverMsg = serverErr instanceof Error ? serverErr.message : String(serverErr);
      throw new Error(clientMsg || serverMsg || 'Failed to generate PDF. Please try again.');
    }
  }
}
