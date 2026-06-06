// xmlProcessor.js - High-Performance Parser with IndexedDB Offloading Strategy

/**
 * Main orchestration function for parsing and formatting the XML structure.
 * @param {File} file - The raw massive file input instance.
 * @param {Object} options - Configuration parameters (minify, indentSpaces, lineEnding).
 * @param {Function} onProgress - Progress tracking UI hook callback.
 * @param {Function} onSuccess - Target success completion descriptor hook.
 * @param {Function} onError - Execution fault boundary handler callback.
 * @returns {Object} Core control handles exposed back to the background supervisor thread.
 */
export async function processXMLStream(file, options, onProgress, onSuccess, onError) {
    const stream = file.stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder();
    
    const isMinify = options.minify || false;
    const indentSpaces = options.indentSpaces !== undefined ? options.indentSpaces : 2;
    const lineEnding = options.lineEnding !== undefined ? options.lineEnding : "\n";

    let remainder = '';
    let bytesProcessed = 0;
    let indentLevel = 0;

    // Internal memory allocation array queue to hold raw formatted binary chunks
    let outputQueue = [];
    let textBuffer = '';
    const tokenRegex = /(<[^>]+>|[^<]+)/g;

    // Buffer chunk layout configuration sizing constraints
    const CHUNK_TARGET_SIZE = 4 * 1024 * 1024; // 4 MB payload block consolidation
    let isProcessingComplete = false;

    // SCOPE CORRECTION: Declare the counter at the top of the scope so it's accessible everywhere
    let totalFormattedBytes = 0; 

    /**
     * Utility interface to open a dedicated connection channel to IndexedDB.
     */
    function openWorkerDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('XMLStreamingCacheDB', 1);
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * Iterates over the memory buffer queue and dumps chunks into IndexedDB on user download request.
     * @param {string} streamId - Unique execution signature for tracking files across scopes.
     */
    async function startIndexedDbStreaming(streamId) {
        try {
            const db = await openWorkerDB();
            let chunkIndex = 0;

            // Maintain loop state until the processing pipeline shuts down and the queue is clear
            while (outputQueue.length > 0 || !isProcessingComplete) {
                if (outputQueue.length > 0) {
                    let bytesAccumulated = 0;
                    const slicesToMerge = [];

                    // Pull micro segments from the array buffer layout until reaching 1MB
                    while (outputQueue.length > 0 && bytesAccumulated < CHUNK_TARGET_SIZE) {
                        const slice = outputQueue.shift();
                        slicesToMerge.push(slice);
                        bytesAccumulated += slice.length;
                    }

                    // Assemble discrete binary segments into a consolidated payload
                    const chunk = new Uint8Array(bytesAccumulated);
                    let offset = 0;
                    for (const slice of slicesToMerge) {
                        chunk.set(slice, offset);
                        offset += slice.length;
                    }

                    // Write binary allocation structure into the IndexedDB database storage layer
                    await new Promise((resolve, reject) => {
                        const tx = db.transaction('chunks', 'readwrite');
                        const store = tx.objectStore('chunks');
                        store.put({ id: `${streamId}-chunk-${chunkIndex}`, data: chunk });
                        
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => reject(tx.error);
                    });

                    chunkIndex++;
                } else {
                    // Fallback micro-sleep if the queue drains faster than the formatter processes
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            // Document lifecycle complete: finalize storage descriptor flag state
            const tx = db.transaction('chunks', 'readwrite');
            tx.objectStore('chunks').put({ id: `${streamId}-status`, finished: true });

        } catch (storageError) {
            console.error("IndexedDB background synchronization failure:", storageError);
        }
    }

    // Initialize the high-speed background processing parsing sequence asynchronously
    (async () => {
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                bytesProcessed += value.length;
                let percentage = ((bytesProcessed / file.size) * 100).toFixed(0);
                onProgress(percentage);

                let text = decoder.decode(value, { stream: true });
                let chunkText = remainder + text;

                // Enforce proper token string tag closing boundary boundaries
                let lastCloseTag = chunkText.lastIndexOf('>');
                if (lastCloseTag !== -1) {
                    remainder = chunkText.substring(lastCloseTag + 1);
                    chunkText = chunkText.substring(0, lastCloseTag + 1);
                } else {
                    let lastOpenTag = chunkText.lastIndexOf('<');
                    if (lastOpenTag !== -1 && lastOpenTag > 0) {
                        remainder = chunkText.substring(lastOpenTag);
                        chunkText = chunkText.substring(0, lastOpenTag);
                    } else if (chunkText.length > 50 * 1024 * 1024) { 
                        throw new Error("Continuous XML text chunk exceeded the 50MB size limit.");
                    } else {
                        remainder = chunkText;
                        continue;
                    }
                }

                // Process input data segments depending on token layout parameters
                if (isMinify) {
                    let minifiedChunk = chunkText.replace(/>\s+</g, '><').trim();
                    if (minifiedChunk) textBuffer += minifiedChunk;
                } else {
                    let tokens = chunkText.match(tokenRegex);
                    if (tokens) {
                        let chunkResult = '';
                        for (let i = 0; i < tokens.length; i++) {
                            let token = tokens[i].trim();
                            if (!token) continue;

                            if (token.startsWith('</')) {
                                indentLevel = Math.max(0, indentLevel - 1);
                                chunkResult += ' '.repeat(indentLevel * indentSpaces) + token + lineEnding;
                            } else if (token.startsWith('<') && !token.endsWith('/>') && !token.startsWith('<?') && !token.startsWith('<!')) {
                                chunkResult += ' '.repeat(indentLevel * indentSpaces) + token + lineEnding;
                                indentLevel++;
                            } else {
                                chunkResult += ' '.repeat(indentLevel * indentSpaces) + token + lineEnding;
                            }
                        }
                        textBuffer += chunkResult;
                    }
                }

                // Periodically dump string cache buffers into binary memory slots (~40MB spans)
                if (textBuffer.length > 40 * 1024 * 1024) {
                    const encoded = encoder.encode(textBuffer);
                    totalFormattedBytes += encoded.length; // Accumulate sizes correctly
                    outputQueue.push(encoded);
                    textBuffer = ''; 
                    
                    // Relinquish process priority frames temporarily to allow worker breathing space
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            // Cleanup remaining trailing tag string configurations
            if (remainder.trim()) {
                let finalToken = remainder.trim();
                let finalResult = '';
                if (isMinify) {
                    finalResult = finalToken.replace(/>\s+</g, '><');
                } else {
                    if (finalToken.startsWith('</')) indentLevel = Math.max(0, indentLevel - 1);
                    finalResult = ' '.repeat(indentLevel * indentSpaces) + finalToken + lineEnding;
                }
                textBuffer += finalResult;
            }

            // Flush final textual segments to the array queue layout wrapper
            if (textBuffer.length > 0) {
                const encoded = encoder.encode(textBuffer);
                totalFormattedBytes += encoded.length; // Accumulate final tail chunk size
                outputQueue.push(encoded);
                textBuffer = '';
            }

            onProgress("100");
            isProcessingComplete = true;
            
            // Core formatting loop successful. Pass the complete tracked weight down to the callback
            onSuccess(totalFormattedBytes);

        } catch (error) {
            onError(error);
        }
    })();

    // Expose control hook configurations directly back to the supervisor script bindings context
    return { startIndexedDbStreaming };
}
