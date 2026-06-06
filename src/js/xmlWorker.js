// xmlWorker.js - Supervisor Thread
import { processXMLStream } from './xmlProcessor.js';

let processorControl = null;

self.onmessage = async function (e) {
    const { file, options, type, streamId } = e.data;

    if (type === 'START_DOWNLOAD_STREAM' && processorControl) {
        processorControl.startIndexedDbStreaming(streamId);
        return;
    }

    processorControl = await processXMLStream(
        file,
        options,
        (percentage) => {
            self.postMessage({ type: 'PROGRESS', percentage });
        },
        (totalFormattedBytes) => {
            // Pass the parameter payload directly back to main.js
            self.postMessage({ type: 'SUCCESS', finalSize: totalFormattedBytes });
        },
        (error) => {
            self.postMessage({ type: 'ERROR', error: error.message });
        }
    );
};
