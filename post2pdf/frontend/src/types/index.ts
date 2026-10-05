export interface ImportedImage {
  id: string;
  source: 'facebook' | 'upload';
  file?: File;
  url?: string;
  previewUrl: string;
  originalName?: string;
  width?: number;
  height?: number;
  rotation: number;
  order: number;
}

export interface FacebookImportResponse {
  success: boolean;
  images?: Array<{
    url: string;
    preview_url?: string;
    width?: number;
    height?: number;
  }>;
  code?: string;
  message?: string;
}

export type PageSize = 'a4' | 'letter' | 'original';
export type LayoutOption = '1' | '2' | '4';
export type ImageFit = 'fit' | 'fill' | 'original';
export type MarginOption = 'none' | 'small' | 'medium';
export type QualityOption = 'standard' | 'high';

export interface PDFSettings {
  pageSize: PageSize;
  layout: LayoutOption;
  imageFit: ImageFit;
  margin: MarginOption;
  quality: QualityOption;
  filename: string;
}

export interface PDFHistoryRecord {
  id: string;
  name: string;
  createdAt: string;
  pageCount: number;
  size: number;
  blob?: Blob;
}

export type Theme = 'light' | 'dark' | 'system';

export interface ProgressState {
  active: boolean;
  current: number;
  total: number;
  stage: 'preparing' | 'generating' | 'done';
  message: string;
}
