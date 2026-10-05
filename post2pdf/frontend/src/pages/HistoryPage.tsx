import { useState, useEffect, useCallback } from 'react';
import { History, Download, Trash2, Pen, FileText, Clock, HardDrive, Check, X } from 'lucide-react';
import {
  getAllPDFRecords,
  getPDFBlob,
  deletePDFRecord,
  renamePDFRecord,
  formatFileSize,
} from '../services/storage';
import { downloadBlob } from '../utils';
import type { PDFHistoryRecord } from '../types';

export default function HistoryPage() {
  const [records, setRecords] = useState<PDFHistoryRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    try {
      const data = await getAllPDFRecords();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load PDF history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDownload = useCallback(async (record: PDFHistoryRecord) => {
    const blob = await getPDFBlob(record.id);
    if (blob) {
      downloadBlob(blob, record.name);
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await deletePDFRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    },
    []
  );

  const handleStartRename = useCallback((record: PDFHistoryRecord) => {
    setEditingId(record.id);
    setEditName(record.name.replace(/\.pdf$/i, ''));
  }, []);

  const handleSaveRename = useCallback(
    async (id: string) => {
      const newName = editName.trim();
      if (!newName) return;
      const finalName = newName.endsWith('.pdf') ? newName : `${newName}.pdf`;
      await renamePDFRecord(id, finalName);
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, name: finalName } : r))
      );
      setEditingId(null);
    },
    [editName]
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
        <p className="mt-4 text-gray-500 dark:text-slate-400">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <History className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My PDFs</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {records.length} PDF{records.length !== 1 ? 's' : ''} saved locally
          </p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No PDFs yet</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
            Generated PDFs will appear here. They are stored locally in your browser.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="card-hover p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-red-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {editingId === record.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(record.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="input py-1 px-2 text-sm"
                      autoFocus
                      aria-label="New filename"
                    />
                    <button
                      onClick={() => handleSaveRename(record.id)}
                      className="btn-ghost btn-sm text-green-500"
                      aria-label="Save name"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-ghost btn-sm text-gray-400"
                      aria-label="Cancel rename"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {record.name}
                  </h3>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(record.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {record.pageCount} page{record.pageCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5" />
                    {formatFileSize(record.size)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  onClick={() => handleStartRename(record)}
                  className="btn-ghost btn-sm"
                  aria-label={`Rename ${record.name}`}
                  title="Rename"
                >
                  <Pen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownload(record)}
                  className="btn-ghost btn-sm text-brand-500"
                  aria-label={`Download ${record.name}`}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="btn-ghost btn-sm text-red-500"
                  aria-label={`Delete ${record.name}`}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Privacy note */}
      <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
        PDFs are stored locally in your browser using IndexedDB. They are not uploaded to any server.
      </p>
    </div>
  );
}
