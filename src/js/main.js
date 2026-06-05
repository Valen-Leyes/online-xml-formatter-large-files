// Captura de elementos del DOM existentes
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const donationBox = document.getElementById('donationBox');
const downloadBtn = document.getElementById('downloadBtn');
const kofiBtn = document.getElementById('kofiBtn');
let formattedBlobUrl = null;

// Captura de elementos del Panel de Configuración
const configPanel = document.getElementById('configPanel');
const formatMode = document.getElementById('formatMode');
const indentSpaces = document.getElementById('indentSpaces');
const lineEnding = document.getElementById('lineEnding');
const indentGroup = document.getElementById('indentGroup');
const lineGroup = document.getElementById('lineGroup');

// Feedback visual en la UI al cambiar de modo
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

// Eventos de Drag & Drop Visual
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

    // Reset de UI básico
    statusText.innerText = `Reading ${file.name}...`;
    donationBox.style.display = 'none';
    dropZone.style.display = 'none';
    configPanel.style.display = 'none'; 
    progressContainer.style.display = 'block';
    
    // Inicializar el Web Worker nativo usando módulos nativos
    const worker = new Worker(new URL('./xmlWorker.js', import.meta.url), { type: 'module' });

    // Escuchar las respuestas del hilo de fondo
    worker.onmessage = function (e) {
        const { type, percentage, blob, error } = e.data;

        if (type === 'PROGRESS') {
            progressBar.style.width = `${percentage}%`;
            statusText.innerText = `Processing... ${percentage}%`;
        } 
        
        else if (type === 'SUCCESS') {
            if (formattedBlobUrl) URL.revokeObjectURL(formattedBlobUrl);
            formattedBlobUrl = URL.createObjectURL(blob);
            
            const triggerDownload = () => {
                const a = document.createElement('a');
                a.href = formattedBlobUrl;
                const prefix = options.minify ? 'minified_' : 'formatted_';
                a.download = `${prefix}${file.name}`;
                a.click();
            };
            
            downloadBtn.onclick = triggerDownload;
            kofiBtn.onclick = () => setTimeout(triggerDownload, 1000);
            
            statusText.innerText = "";
            progressContainer.style.display = 'none';
            donationBox.style.display = 'block';
            
            worker.terminate(); // Limpieza del hilo para liberar memoria RAM instantáneamente
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

    // Enviar el archivo y las opciones al hilo secundario
    worker.postMessage({ file, options });
}
