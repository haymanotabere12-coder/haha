// Robust storage and retrieval for live class recorded video blobs using IndexedDB and window memory cache
const DB_NAME = 'EthioRecordedLessonsDB';
const DB_VERSION = 1;
const STORE_NAME = 'video_blobs';

function openDB(): Promise<IDBDatabase> {
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

// In-memory runtime cache for instant access
const runtimeUrlCache: Record<string, string> = {};

export async function saveRecordedVideoBlob(id: string, blob: Blob): Promise<string> {
  const url = URL.createObjectURL(blob);
  const cleanId = id.startsWith('vid-') ? id : `vid-${id}`;
  const rawId = id.replace(/^vid-/, '');

  runtimeUrlCache[id] = url;
  runtimeUrlCache[cleanId] = url;
  runtimeUrlCache[rawId] = url;

  if (typeof window !== 'undefined') {
    (window as any).__ETHIO_RECORDED_VIDEOS = (window as any).__ETHIO_RECORDED_VIDEOS || {};
    (window as any).__ETHIO_RECORDED_VIDEOS[id] = url;
    (window as any).__ETHIO_RECORDED_VIDEOS[cleanId] = url;
    (window as any).__ETHIO_RECORDED_VIDEOS[rawId] = url;
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(blob, id);
      store.put(blob, cleanId);
      store.put(blob, rawId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not persist recorded blob to IndexedDB:', err);
  }

  return url;
}

export async function getRecordedVideoUrl(id: string): Promise<string | null> {
  const cleanId = id.startsWith('vid-') ? id : `vid-${id}`;
  const rawId = id.replace(/^vid-/, '');

  // 1. Check in-memory cache
  if (runtimeUrlCache[id]) return runtimeUrlCache[id];
  if (runtimeUrlCache[cleanId]) return runtimeUrlCache[cleanId];
  if (runtimeUrlCache[rawId]) return runtimeUrlCache[rawId];

  // 2. Check window global
  if (typeof window !== 'undefined' && (window as any).__ETHIO_RECORDED_VIDEOS) {
    const g = (window as any).__ETHIO_RECORDED_VIDEOS;
    if (g[id]) return g[id];
    if (g[cleanId]) return g[cleanId];
    if (g[rawId]) return g[rawId];
  }

  // 3. Check IndexedDB and produce fresh Blob URL
  try {
    const db = await openDB();
    const blobFromDb = await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result instanceof Blob && req.result.size > 0) {
          resolve(req.result);
        } else {
          const req2 = store.get(cleanId);
          req2.onsuccess = () => {
            if (req2.result instanceof Blob && req2.result.size > 0) {
              resolve(req2.result);
            } else {
              const req3 = store.get(rawId);
              req3.onsuccess = () => {
                if (req3.result instanceof Blob && req3.result.size > 0) {
                  resolve(req3.result);
                } else {
                  resolve(null);
                }
              };
              req3.onerror = () => resolve(null);
            }
          };
          req2.onerror = () => resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });

    if (blobFromDb) {
      const freshUrl = URL.createObjectURL(blobFromDb);
      runtimeUrlCache[id] = freshUrl;
      runtimeUrlCache[cleanId] = freshUrl;
      runtimeUrlCache[rawId] = freshUrl;
      if (typeof window !== 'undefined') {
        (window as any).__ETHIO_RECORDED_VIDEOS = (window as any).__ETHIO_RECORDED_VIDEOS || {};
        (window as any).__ETHIO_RECORDED_VIDEOS[id] = freshUrl;
        (window as any).__ETHIO_RECORDED_VIDEOS[cleanId] = freshUrl;
        (window as any).__ETHIO_RECORDED_VIDEOS[rawId] = freshUrl;
      }
      return freshUrl;
    }
  } catch {}

  // 4. Default to permanent server stream URL
  return `/api/recordings/stream/${cleanId}`;
}

export async function deleteRecordedVideoBlob(id: string): Promise<void> {
  const cleanId = id.startsWith('vid-') ? id : `vid-${id}`;
  const rawId = id.replace(/^vid-/, '');

  delete runtimeUrlCache[cleanId];
  delete runtimeUrlCache[rawId];
  delete runtimeUrlCache[id];

  if (typeof window !== 'undefined') {
    if ((window as any).__ETHIO_RECORDED_VIDEOS) {
      delete (window as any).__ETHIO_RECORDED_VIDEOS[cleanId];
      delete (window as any).__ETHIO_RECORDED_VIDEOS[rawId];
      delete (window as any).__ETHIO_RECORDED_VIDEOS[id];
    }
    try {
      sessionStorage.removeItem(`ethio_blob_key_${cleanId}`);
      sessionStorage.removeItem(`ethio_blob_key_${rawId}`);
      sessionStorage.removeItem(`ethio_blob_key_${id}`);
    } catch {}
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(cleanId);
      store.delete(rawId);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}
