# Online XML Formatter for Large Files 🚀

[![GitHub license](https://shields.io)](https://github.com/valen-leyes/online-xml-formatter-large-files/blob/main/LICENSE)
[![GitHub stars](https://shields.io)](https://github.com/valen-leyes/online-xml-formatter-large-files/stargazers)

A high-performance, 100% private, and local browser-based **XML beautifier, formatter, and minifier**. Designed specifically to parse, format, and validate massive, heavy, and large XML files (400MB+) without crashing your browser or locking the UI thread.

If you are looking for an open-source alternative to standard web tools that freeze with big data, this offline-first solution processes everything in memory safely.

👉 **Live Demo:** [https://valen-leyes.github.io/online-xml-formatter-large-files](https://valen-leyes.github.io/online-xml-formatter-large-files)

## Why use this XML Formatter tool?
Standard online tools fail when a file exceeds a few megabytes. This **large file XML formatter tool** solves this by using local client-side processing, making it the perfect developer tool for big datasets, logs, and database exports.

## Key Features
* **Zero Server Uploads:** 100% private. Processing happens entirely on your local machine using streams.
* **Stream-Based Architecture:** Handles heavy files over 500MB easily with optimized binary chunks.
* **Online XML Formatting & Prettifying:** Clean up messy code with custom indentation levels.
* **Strict Minifier & Validator:** Reduce megabytes by stripping whitespaces and validating tag structures.
* **Super Fast Performance:** Pure vanilla JavaScript leveraging `TextDecoder`, `ReadableStream`, and custom buffering.

## 🧠 Architecture & Performance Breakdown

Processing a 500MB+ text file in a browser tab usually results in an out-of-memory crash because string concatenation in JavaScript clones objects in the V8 heap. This tool circumvents that limitation through three technical choices:

1. **Multiprocessor Threading (Web Workers):** The heavy tokenization loop is fully offloaded to a background `Worker` thread, keeping the user interface operating smoothly at 60 FPS.
2. **Backpressure-Safe Remainder Handling:** Input files are processed as a `ReadableStream`. The engine dynamically looks for safe structural boundary points (`>`) before chunk tokenization to ensure XML tree components never break across chunks.
3. **Binary Pre-allocation:** Instead of accumulation via JavaScript string variables, chunks are encoded into `Uint8Array` binary blocks instantly. The final data structural build uses a low-level native `Blob` wrapper to drop memory allocation requirements by half.

## How to use this repository
1. Open the **Live Demo** link above.
2. Drag and drop your large `.xml` file.
3. Choose your formatting options (Beautify / Minify).
4. Download the formatted file instantly.

## Development & Local Setup
This web application uses native JS Modules. You can preview it locally using any static web server:

```bash
# Using Node/npx
npx serve .

# Using Python 3
python3 -m http.server 8000
```

## License
MIT License - See the [LICENSE](LICENSE) file for details.
