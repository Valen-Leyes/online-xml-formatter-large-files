// main.js - Core UI Orchestration Script
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const donationBox = document.getElementById('donationBox');
const downloadBtn = document.getElementById('downloadBtn');
const kofiBtn = document.getElementById('kofiBtn');

// Helper function to force-create the database and 'chunks' store safely
function initStreamingDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('XMLStreamingCacheDB', 1);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('chunks')) {
                db.createObjectStore('chunks', { keyPath: 'id' });
                console.log("Database store 'chunks' created successfully.");
            }
        };
        
        request.onsuccess = (e) => {
            const db = e.target.result;
            db.close(); // Close immediately after verification
            resolve();
        };
        
        request.onerror = (e) => reject(e.target.error);
    });
}

// Execute database initialization FIRST, then register the Service Worker agent cleanly
if ('serviceWorker' in navigator) {
    initStreamingDatabase()
        .then(() => {
            return navigator.serviceWorker.register('./sw.js');
        })
        .then(reg => {
            // SUCCESS: The background layout is fully ready and stable
            console.log("Service Worker and Database are fully synchronized.");
            
            // REMOVED THE window.location.reload() BLOCK TO PREVENT ACCIDENTAL REFRESHES
            // The application is now safely initialized and anchored for large tasks
        })
        .catch(err => console.error('Initialization pipeline failed:', err));
}

const configPanel = document.getElementById('configPanel');
const formatMode = document.getElementById('formatMode');
const indentSpaces = document.getElementById('indentSpaces');
const lineEnding = document.getElementById('lineEnding');
const indentGroup = document.getElementById('indentGroup');
const lineGroup = document.getElementById('lineGroup');

formatMode.addEventListener('change', (e) => {
    const isMinify = e.target.value === 'minify';
    if (isMinify) {
        indentGroup.style.opacity = '0.4';
        lineGroup.style.opacity = '0.4';
        indentSpaces.disabled = true;
        lineEnding.disabled = true;
    } else {
        indentGroup.style.opacity = '1';
        lineGroup.style.opacity = '1';
        indentSpaces.disabled = false;
        lineEnding.disabled = false;
    }
});

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if(files.length) {
        fileInput.files = files;
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if(e.target.files.length) handleFile(e.target.files[0]);
});

function handleFile(file) {
    if (!file) return;
    
    const options = {
        minify: formatMode.value === 'minify',
        indentSpaces: parseInt(indentSpaces.value, 10),
        lineEnding: lineEnding.value === '\\r\\n' ? '\r\n' : '\n'
    };
    
    statusText.innerText = `Reading ${file.name}...`;
    donationBox.style.display = 'none';
    dropZone.style.display = 'none';
    configPanel.style.display = 'none'; 
    progressContainer.style.display = 'block';
    
    const worker = new Worker(new URL('./xmlWorker.js', import.meta.url), { type: 'module' });
    
    worker.onmessage = function (e) {
        const { type, percentage, error } = e.data;
        
        if (type === 'PROGRESS') {
            progressBar.style.width = `${percentage}%`;
            statusText.innerText = `Processing... ${percentage}%`;
        } 
        
        else if (type === 'SUCCESS') {
            const finalSize = e.data.finalSize;

            const executeDownloadPipeline = (shouldOpenKofi = false) => {
                const streamId = `xml-stream-${Date.now()}`;
                
                worker.postMessage({ type: 'START_DOWNLOAD_STREAM', streamId: streamId });

                const prefix = options.minify ? 'minified_' : 'formatted_';
                const filename = `${prefix}${file.name}`;
                
                const basePath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
                
                const downloadUrl = `${window.location.origin}${basePath}download-stream-xml?id=${streamId}&name=${encodeURIComponent(filename)}&size=${finalSize}`;
                
                // Trigger the download link instantly
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Delay opening the external tab slightly to secure background execution thread synchronization
                if (shouldOpenKofi) {
                    setTimeout(() => {
                        window.open('https://ko-fi.com/valenleyes', '_blank', 'noopener,noreferrer');
                    }, 400);
                }
            };
            
            kofiBtn.onclick = () => {
                executeDownloadPipeline(true);
            };
            
            downloadBtn.onclick = () => {
                executeDownloadPipeline(false);
            };
            
            statusText.innerText = "Ready to download!";
            progressContainer.style.display = 'none';
            donationBox.style.display = 'block';
        }
        
        else if (type === 'ERROR') {
            console.error(error);
            statusText.innerText = "Error processing your file.";
            progressContainer.style.display = 'none';
            dropZone.style.display = 'block';
            configPanel.style.display = 'block';
            worker.terminate();
        }
    };
    
    worker.postMessage({ file, options });
}
