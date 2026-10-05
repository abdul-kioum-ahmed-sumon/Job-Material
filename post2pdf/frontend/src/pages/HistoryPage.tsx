import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  Download,
  Trash2,
  Pen,
  FileText,
  Clock,
  HardDrive,
  Check,
  X,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import {
  getAllPDFRecords,
  getPDFBlob,
  deletePDFRecord,
  renamePDFRecord,
  formatFileSize,
} from '../services/storage';
import { downloadBlob } from '../utils';
import type { PDFHistoryRecord } from '../types';
import { Link } from 'react-router-dom';

export default function HistoryPage() {
  const [records, setRecords] = useState<PDFHistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'size'>('newest');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const handleOpenPreview = useCallback(async (record: PDFHistoryRecord) => {
    const blob = await getPDFBlob(record.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await deletePDFRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirmId(null);
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

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let result = records.filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortOrder === 'size') {
      result.sort((a, b) => b.size - a.size);
    }

    return result;
  }, [records, searchQuery, sortOrder]);

  const totalPages = records.reduce((acc, r) => acc + (r.pageCount || 0), 0);
  const totalBytes = records.reduce((acc, r) => acc + (r.size || 0), 0);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Accessing local IndexedDB storage...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              My PDF Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Locally stored in your browser • No server transmission
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="btn-primary btn-sm self-start sm:self-center"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New PDF</span>
        </Link>
      </div>

      {/* Metrics Row */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total PDFs
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {records.length}
            </p>
          </div>

          <div className="card p-4 border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Pages
            </span>
            <p className="text-xl sm:text-2xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
              {totalPages}
            </p>
          </div>

          <div className="card p-4 border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Storage Used
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatFileSize(totalBytes)}
            </p>
          </div>
        </div>
      )}

      {/* Search & Sort Controls */}
      {records.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PDFs by title..."
              className="input pl-10 py-2.5 text-xs sm:text-sm"
              aria-label="Search PDFs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
              aria-label="Sort order"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="size">Largest Size</option>
            </select>
          </div>
        </div>
      )}

      {/* Records List or Empty State */}
      {records.length === 0 ? (
        <div className="card p-12 text-center space-y-4 border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-500 flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No PDFs in your local history yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Generated PDFs are saved directly in your browser's IndexedDB storage for offline revision and quick access.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/" className="btn-primary btn-md">
              <Sparkles className="w-4 h-4" />
              Generate Your First PDF
            </Link>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          No PDFs match &ldquo;{searchQuery}&rdquo;. Try another search keyword.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800 hover:border-brand-400/80 dark:hover:border-brand-600/70 transition-all duration-200 hover:shadow-md"
            >
              {/* Document Icon & Details */}
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
                  <FileText className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === record.id ? (
                    <div className="flex items-center gap-1.5 max-w-md">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(record.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="input py-1 px-2.5 text-xs font-mono flex-1"
                        autoFocus
                        aria-label="New document name"
                      />
                      <button
                        onClick={() => handleSaveRename(record.id)}
                        className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {record.name}
                    </h3>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDate(record.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-brand-500" />
                      {record.pageCount} {record.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-emerald-500" />
                      {formatFileSize(record.size)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleOpenPreview(record)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Open / Preview in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleStartRename(record)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Rename PDF"
                >
                  <Pen className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDownload(record)}
                  className="btn-primary btn-sm py-1.5 px-3 text-xs"
                  title="Download to computer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setDeleteConfirmId(record.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete this PDF?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This record will be permanently deleted from your browser storage.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary btn-sm flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="btn-danger btn-sm flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Footer Assurance */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-4">
        🔒 All files are strictly cached inside your local browser via IndexedDB. Nothing is uploaded to any remote server or stored in any database.
      </p>
    </div>
  );
}
