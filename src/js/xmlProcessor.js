export async function processXMLStream(file, options, onProgress, onSuccess, onError) {
    const stream = file.stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder();
    
    const isMinify = options.minify || false;
    const indentSpaces = options.indentSpaces !== undefined ? options.indentSpaces : 2;
    const lineEnding = options.lineEnding !== undefined ? options.lineEnding : "\n";

    let remainder = '';
    let formattedChunks = [];
    let bytesProcessed = 0;
    let indentLevel = 0;
    let chunkCounter = 0;

    // Regex optimizada y pre-compilada para tokens XML
    const tokenRegex = /(<[^>]+>|[^<]+)/g;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            bytesProcessed += value.length;
            chunkCounter++;

            if (chunkCounter % 80 === 0) { // Ajustado a 80 para un reporte de progreso más fluido
                let percentage = ((bytesProcessed / file.size) * 100).toFixed(0);
                onProgress(percentage);
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            let text = decoder.decode(value, { stream: true });
            let chunkText = remainder + text;

            // BUSCA UN PUNTO DE CORTE SEGURO: El último cierre de etiqueta '>'
            let lastCloseTag = chunkText.lastIndexOf('>');
            
            if (lastCloseTag !== -1) {
                remainder = chunkText.substring(lastCloseTag + 1);
                chunkText = chunkText.substring(0, lastCloseTag + 1);
            } else {
                // PROTECCIÓN ANTICOLAPSO: Si un bloque es gigantesco y no tiene '>', buscamos la última apertura '<'
                let lastOpenTag = chunkText.lastIndexOf('<');
                if (lastOpenTag !== -1 && lastOpenTag > 0) {
                    remainder = chunkText.substring(lastOpenTag);
                    chunkText = chunkText.substring(0, lastOpenTag);
                } else if (chunkText.length > 50 * 1024 * 1024) { 
                    // Si un token plano supera los 50MB sin etiquetas (ej. un Base64 enorme), forzamos el procesamiento
                    remainder = '';
                } else {
                    remainder = chunkText;
                    continue;
                }
            }

            if (isMinify) {
                let minifiedChunk = chunkText.replace(/>\s+</g, '><').trim();
                if (minifiedChunk) {
                    formattedChunks.push(encoder.encode(minifiedChunk));
                }
                continue;
            }

            // MODO FORMATEAR (BEAUTIFY)
            let tokens = chunkText.match(tokenRegex);
            if (!tokens) continue;

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
                    // Captura texto plano, comentarios (<!--), declaraciones (<?xml) y auto-conclusivas (/>)
                    chunkResult += ' '.repeat(indentLevel * indentSpaces) + token + lineEnding;
                }
            }

            if (chunkResult) {
                formattedChunks.push(encoder.encode(chunkResult));
            }
        }

        // Procesar el residuo final que haya quedado en el "remainder"
        if (remainder.trim()) {
            let finalToken = remainder.trim();
            if (isMinify) {
                formattedChunks.push(encoder.encode(finalToken.replace(/>\s+</g, '><')));
            } else {
                if (finalToken.startsWith('</')) indentLevel = Math.max(0, indentLevel - 1);
                formattedChunks.push(encoder.encode(' '.repeat(indentLevel * indentSpaces) + finalToken + lineEnding));
            }
        }

        onProgress("100");
        const blob = new Blob(formattedChunks, { type: 'text/xml' });
        
        // Liberamos memoria del array intermedio inmediatamente después de crear el Blob
        formattedChunks = []; 
        
        onSuccess(blob);
    } catch (error) {
        onError(error);
    }
}
