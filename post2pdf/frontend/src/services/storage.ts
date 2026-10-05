import { openDB, type IDBPDatabase } from 'idb';
import type { PDFHistoryRecord } from '../types';

const DB_NAME = 'post2pdf';
const DB_VERSION = 1;
const STORE_HISTORY = 'pdfHistory';
const STORE_BLOBS = 'pdfBlobs';

export interface Post2PDFDB {
  pdfHistory: {
    key: string;
    value: PDFHistoryRecord;
  };
  pdfBlobs: {
    key: string;
    value: { id: string; blob: Blob };
  };
}

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

export async function savePDFRecord(
  record: PDFHistoryRecord,
  blob: Blob
): Promise<void> {
  const db = await getDB();
  const { blob: _, ...recordData } = record;
  await db.put(STORE_HISTORY, recordData);
  await db.put(STORE_BLOBS, { id: record.id, blob });
}

export async function getAllPDFRecords(): Promise<PDFHistoryRecord[]> {
  const db = await getDB();
  const records = await db.getAll(STORE_HISTORY);
  return records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getPDFBlob(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  const entry = await db.get(STORE_BLOBS, id);
  return entry?.blob;
}

export async function deletePDFRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_HISTORY, id);
  await db.delete(STORE_BLOBS, id);
}

export async function renamePDFRecord(
  id: string,
  newName: string
): Promise<void> {
  const db = await getDB();
  const record = await db.get(STORE_HISTORY, id);
  if (record) {
    record.name = newName;
    await db.put(STORE_HISTORY, record);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
