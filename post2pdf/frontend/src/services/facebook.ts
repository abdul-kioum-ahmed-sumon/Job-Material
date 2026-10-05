import api from './api';
import type { FacebookImportResponse } from '../types';

export async function importFacebookImages(url: string): Promise<FacebookImportResponse> {
  const response = await api.post<FacebookImportResponse>('/api/facebook/import', { url });
  return response.data;
}
