import { processXMLStream } from './xmlProcessor.js';

self.onmessage = async function (e) {
    const { file, options } = e.data;

    await processXMLStream(
        file,
        options,
        (percentage) => {
            // Envía el progreso a la UI
            self.postMessage({ type: 'PROGRESS', percentage });
        },
        (blob) => {
            // Envía el resultado final exitoso
            self.postMessage({ type: 'SUCCESS', blob });
        },
        (error) => {
            // Envía el error estructurado
            self.postMessage({ type: 'ERROR', error: error.message });
        }
    );
};
