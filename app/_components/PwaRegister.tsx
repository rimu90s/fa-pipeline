"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isProd = process.env.NODE_ENV === "production";

    // DEV: jangan pernah register SW karena akan menyebabkan ChunkLoadError
    // saat turbopack mengganti hash chunk.
    if (!isProd) {
      (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        } catch {
          // ignore
        }

        // Best-effort: bersihkan Cache Storage (kalau SW pernah cache file)
        try {
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        } catch {
          // ignore
        }
      })();

      return;
    }

    // PROD: register SW normal
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // keep silent (per your original behavior)
    });
  }, []);

  return null;
}
