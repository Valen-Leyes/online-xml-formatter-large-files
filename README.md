# Online XML Formatter for Large Files 🚀

[![GitHub license](https://shields.io)](https://github.com/Valen-Leyes/online-xml-formatter-large-files/blob/main/LICENSE)
[![GitHub stars](https://shields.io)](https://github.com/Valen-Leyes/online-xml-formatter-large-files/stargazers)
[![Support me on Ko-fi](https://shields.io)](https://ko-fi.com/valenleyes)

A high-performance, 100% private, and local browser-based **XML beautifier, formatter, and minifier**. Designed specifically to parse, format, and validate massive, heavy, and large XML files (up to 1.5GB+) without crashing your browser or locking the UI thread.

If you are looking for an open-source alternative to standard web tools that freeze with big data, this offline-first solution processes everything locally and safely.

👉 **Live Demo:** [https://valen-leyes.github.io/online-xml-formatter-large-files](https://valen-leyes.github.io/online-xml-formatter-large-files)

---

## Why use this XML Formatter tool?
Standard online tools fail when a file exceeds a few megabytes. This **large file XML formatter tool** solves this by using client-side processing, making it the perfect developer tool for big datasets, logs, and database exports.

## Key Features
* **Zero Server Uploads:** 100% private. Processing happens entirely on your local machine using streams.
* **Stream-Based Architecture:** Handles heavy files up to 1.5GB comfortably using optimized binary chunks.
* **Online XML Formatting & Prettifying:** Clean up messy code with custom indentation levels.
* **Strict Minifier & Validator:** Reduce megabytes by stripping whitespaces and validating tag structures.
* **Super Fast Performance:** Pure vanilla JavaScript leveraging `TextDecoder`, `ReadableStream`, and custom buffering.

## 🧠 Architecture & Performance

Processing XML files larger than 1 GB in a browser tab usually freezes the screen or causes out-of-memory crashes. This tool avoids those issues using four core engineering solutions:

* **Multiprocessor Threading (Web Workers):** Heavy text parsing runs entirely in a background thread (`xmlWorker.js`). This keeps the user interface running smoothly at 60 FPS.
* **Backpressure-Safe Handling:** Input files are read chunk-by-chunk as a native `ReadableStream`. The engine searches for structural boundary tags (`>`) so XML nodes never break across stream boundaries.
* **IndexedDB Inter-Thread Caching:** Processed binary blocks are streamed instantly into a local `IndexedDB` layer (`XMLStreamingCacheDB`). This avoids accumulating gigabytes of data in the browser's active RAM.
* **Paced Service Worker Delivery:** A background `Service Worker` (`sw.js`) pulls data blocks from `IndexedDB` on-demand.

> ⚠️ **Technical Note on File Size Limits:** While the streaming parser doesn't consume your system's RAM, the ultimate file size boundary is dictated by your **browser's local IndexedDB quota restrictions**. Chrome, Edge, and Firefox will typically allow files up to 1.5GB - 2GB on desktop platforms, while other browsers (like Safari) enforce stricter sandboxed storage caps around 1GB.

## 💾 Storage Management & Precision UX

* **Accurate Progress Tracking:** The engine computes the exact file size before the download starts. This provides a clean `Content-Length` header to the browser for a perfect native progress bar.
* **Automated Disk Purge:** As soon as the file download finishes, a transaction hook deletes the temporary `IndexedDB` store instantly to keep the user's hard drive spotless.

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

## ❤️ Support & Contribution

This tool is open-source and free to use. If it saved your browser from crashing, saved your development time, or helped your workflow, please consider supporting the project:

* ⭐ **Star this repository** to help others find it.
* ☕ **[Buy me a coffee on Ko-fi](https://ko-fi.com/valenleyes)** to support future updates and server/domain maintenance.
* 🐛 **Report bugs or suggest features** by opening an issue!

## License
MIT License - See the [LICENSE](LICENSE) file for details.
