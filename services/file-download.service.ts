import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  /**
   * Download a JS object as a JSON file.
   *
   * @param obj - object to serialize
   * @param filename - desired filename (will get `.json` appended if missing)
   * @param options
   * @param options.pretty - if true, format JSON with indentation
   * @param options.addBOM - if true, prepend UTF-8 BOM (helps some Windows apps)
   */
  downloadJson(obj: unknown, filename = `data-${new Date().toISOString()}.json`, options: { pretty?: boolean; addBOM?: boolean } = {}): void {
    const { pretty = true, addBOM = false } = options;

    // ensure .json extension
    if (!filename.toLowerCase().endsWith('.json')) {
      filename += '.json';
    }

    // try normal stringify first (fast path)
    let jsonText: string;
    try {
      jsonText = JSON.stringify(obj, null, pretty ? 2 : 0);
    } catch (err) {
      // fallback to cycle-safe serializer
      jsonText = this.safeStringify(obj, pretty ? 2 : 0);
    }

    // optional BOM prefix (helps Excel/Windows apps that expect BOM)
    const textToWrite = addBOM ? '\uFEFF' + jsonText : jsonText;

    const blob = new Blob([textToWrite], { type: 'application/json;charset=utf-8' });

    // IE / Edge (legacy) support
    const nav = window.navigator as any;
    if (nav && typeof nav.msSaveOrOpenBlob === 'function') {
      nav.msSaveOrOpenBlob(blob, filename);
      return;
    }

    // modern browsers
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // append to DOM to make click work in some browsers
    document.body.appendChild(a);
    a.click();
    // cleanup
    a.remove();
    // revoke after a short delay to ensure the download has been initiated
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /**
   * A simple cycle-safe JSON.stringify replacer that marks circular refs as "[Circular]".
   * Uses WeakSet to track visited objects (so it won't leak memory).
   */
  private safeStringify(obj: unknown, space: number | string | undefined): string {
    const seen = new WeakSet<object>();
    return JSON.stringify(obj, function (_key, value) {
      if (value && typeof value === 'object') {
        // value can be an object or array
        if (seen.has(value as object)) {
          return '[Circular]';
        }
        seen.add(value as object);
      }
      return value;
    }, space);
  }
}
