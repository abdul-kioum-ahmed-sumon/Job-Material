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
 * Load an image and return as base64 data URL.
 */
async function imageToDataUrl(image: ImportedImage): Promise<string> {
  if (image.file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(image.file!);
    });
  }
  if (image.previewUrl) {
    return image.previewUrl;
  }
  throw new Error('No image data available');
}

/**
 * Load an HTMLImageElement from a data URL.
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
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
    [pageW, pageH] = PAGE_SIZES[settings.pageSize];
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageW, pageH],
  });

  let pageAdded = false;
  let imgIdx = 0;

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
      } catch (err) {
        console.error(`Failed to process image ${imgIdx}:`, err);
      }

      imgIdx++;
    }
  }

  onProgress?.(sorted.length, sorted.length, 'generating');

  const blob = doc.output('blob');
  return blob;
}

/**
 * Generate PDF server-side (for remote images).
 */
export async function generatePDFServerSide(
  images: ImportedImage[],
  settings: PDFSettings,
  onProgress?: (current: number, total: number, stage: string) => void
): Promise<Blob> {
  const sorted = [...images].sort((a, b) => a.order - b.order);

  // Convert images to base64 for sending
  const imageItems = [];
  for (let i = 0; i < sorted.length; i++) {
    const image = sorted[i];
    onProgress?.(i + 1, sorted.length, 'preparing');

    let imageData: string | undefined;
    let url: string | undefined;

    if (image.file) {
      imageData = await imageToDataUrl(image);
    } else if (image.url) {
      url = image.url;
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
 * Smart PDF generation: use client-side for local files, server-side for remote.
 */
export async function generatePDF(
  images: ImportedImage[],
  settings: PDFSettings,
  onProgress?: (current: number, total: number, stage: string) => void
): Promise<Blob> {
  const hasRemoteImages = images.some((img) => img.source === 'facebook' && !img.file);

  if (hasRemoteImages) {
    return generatePDFServerSide(images, settings, onProgress);
  }
  return generatePDFClientSide(images, settings, onProgress);
}
