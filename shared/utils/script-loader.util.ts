const scriptCache = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  if (scriptCache.has(src)) return scriptCache.get(src)!;

  const promise = new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });

  scriptCache.set(src, promise);
  return promise;
}

export function loadWebsocketScripts(): Promise<void> {
  return Promise.all([
    loadScript('assets/js/sockjs.min.js'),
    loadScript('assets/js/stomp.min.js'),
  ]).then(() => undefined);
}
