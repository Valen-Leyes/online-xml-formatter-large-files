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

## 🧠 Architecture & Performance

Processing XML files larger than 1.5 GB in a browser tab usually freezes the screen or causes out-of-memory crashes. This tool avoids those issues using four engineering solutions:

* **Multiprocessor Threading (Web Workers):** Heavy text parsing runs entirely in a background thread. This keeps the user interface running smoothly at 60 FPS.
* **Backpressure-Safe Handling:** Input files are read chunk-by-chunk as a native `ReadableStream`. The engine searches for structural boundary tags (`>`) so XML nodes never break across stream boundaries.
* **IndexedDB Inter-Thread Caching:** Processed binary blocks are streamed instantly into a local `IndexedDB` layer. This avoids accumulating gigabytes of data in the browser's RAM.
* **Paced Service Worker Delivery:** A background `Service Worker` pulls data blocks from `IndexedDB` on-demand. It safely caps the download rate between 70 MB/s and 110 MB/s to prevent the host computer from freezing.

## 💾 Storage Management & Precision UX

* **Accurate Progress Tracking:** The engine computes the exact file size before the download starts. This provides a clean `Content-Length` header to the browser for a perfect progress bar.
* **Automated Disk Purge:** As soon as the file download finishes, a production hook deletes the temporary `IndexedDB` store instantly to keep the user's hard drive spotless.

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
