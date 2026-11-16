// Persistent storage and in-memory Blob cache for uploaded document binary files (PDF, PPTX, DOCX, Images)
const DB_NAME = 'EthioDocumentFilesDB';
const DB_VERSION = 1;
const STORE_NAME = 'doc_files';

function openDocDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const memoryBlobCache: Record<string, Blob> = {};
const memoryUrlCache: Record<string, string> = {};

export async function saveDocumentBlob(docId: string, blob: Blob): Promise<string> {
  memoryBlobCache[docId] = blob;
  const url = URL.createObjectURL(blob);
  memoryUrlCache[docId] = url;

  try {
    const db = await openDocDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(blob, docId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not persist document file to IndexedDB:', err);
  }

  return url;
}

export async function getDocumentBlob(docId: string): Promise<Blob | null> {
  if (memoryBlobCache[docId]) return memoryBlobCache[docId];

  try {
    const db = await openDocDB();
    const blob = await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(docId);
      req.onsuccess = () => {
        if (req.result instanceof Blob && req.result.size > 0) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
    if (blob) {
      memoryBlobCache[docId] = blob;
      if (!memoryUrlCache[docId]) {
        memoryUrlCache[docId] = URL.createObjectURL(blob);
      }
      return blob;
    }
  } catch {}

  return null;
}

export async function getDocumentObjectUrl(docId: string): Promise<string | null> {
  if (memoryUrlCache[docId]) return memoryUrlCache[docId];
  const blob = await getDocumentBlob(docId);
  if (blob) {
    const url = URL.createObjectURL(blob);
    memoryUrlCache[docId] = url;
    return url;
  }
  return null;
}
