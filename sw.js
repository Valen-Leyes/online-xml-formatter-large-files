// sw.js - Service Worker reading directly from IndexedDB to bypass MessageChannel race conditions

// Force immediate lifecycle activation
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Utility helper to open or connect to IndexedDB securely
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('XMLStreamingCacheDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('chunks')) {
        db.createObjectStore('chunks', { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// Helper function to read a specific data block from the database
async function getChunkFromDB(chunkId) {
  const db = await openDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('chunks', 'readonly');
    const store = transaction.objectStore('chunks');
    const request = store.get(chunkId);
    request.onsuccess = () => resolve(request.result ? request.result.data : null);
    request.onerror = () => resolve(null);
  });
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.includes('download-stream-xml')) {
    const streamId = url.searchParams.get('id');
    const filename = url.searchParams.get('name') || 'output.xml';
    const fileSize = url.searchParams.get('size');

    let currentChunkIndex = 0;
    const PACING_DELAY_MS = 10;

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const readableStream = new ReadableStream({
      async pull(controller) {
        const chunkKey = `${streamId}-chunk-${currentChunkIndex}`;
        const chunkData = await getChunkFromDB(chunkKey);

        if (chunkData) {
          controller.enqueue(chunkData);
          currentChunkIndex++;
          await sleep(PACING_DELAY_MS);
        } else {
          const statusDB = await openDB();
          const isFinished = await new Promise((res) => {
            const tx = statusDB.transaction('chunks', 'readonly');
            const req = tx.objectStore('chunks').get(`${streamId}-status`);
            req.onsuccess = () => res(req.result ? req.result.finished : false);
          });

          if (isFinished) {
            controller.close();
            
            // The browser successfully consumed the entire data stream.
            // Open the database and clear all temporary chunks to free up local disk space.
            openDB().then((db) => {
              const tx = db.transaction('chunks', 'readwrite');
              const store = tx.objectStore('chunks');
              
              // Wipe out the entire object store in one clean transaction
              const clearRequest = store.clear();
              
              clearRequest.onsuccess = () => {
                console.log("IndexedDB streaming storage successfully cleared. Disk space reclaimed.");
                db.close();
              };
              
              clearRequest.onerror = (e) => {
                console.error("Failed to purge temporary storage blocks:", e.target.error);
                db.close();
              };
            }).catch(err => console.error("Error opening DB during cleanup phase:", err));

          } else {
            // Keep pulling data blocks if the processing layout isn't marked as complete
            await sleep(50);
          }
        }
      }
    });

    // Formulate response headers
    const responseHeaders = {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff'
    };

    // Lock the native browser download UI with the exact payload byte weight
    if (fileSize) {
      responseHeaders['Content-Length'] = fileSize;
    }

    event.respondWith(new Response(readableStream, { headers: responseHeaders }));
  }
});