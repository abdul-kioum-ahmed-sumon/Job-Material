import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for PDF generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;

      if (status === 429) {
        const msg = typeof detail === 'object' ? detail.message : detail;
        throw new Error(msg || 'Too many requests. Please try again later.');
      }
      if (status === 413) {
        throw new Error('The upload is too large. Please reduce the number or size of images.');
      }
      if (status >= 500) {
        throw new Error(
          typeof detail === 'string'
            ? detail
            : 'A server error occurred. Please try again later.'
        );
      }
      if (typeof detail === 'string') {
        throw new Error(detail);
      }
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('The request timed out. Please try again.');
    }
    if (!error.response) {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    throw error;
  }
);

export default api;
