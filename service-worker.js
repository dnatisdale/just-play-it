const CACHE_NAME = "just-play-it-build-1002-27MAR2026-v89";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.jsx",
  "./privacy.html",
  "./guide.html",
  "./manifest.json",
  "./builtin-playlists.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./audio/basketball_court.mp3",
  // CSS modules
  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./css/sidebar.css",
  "./css/responsive.css",
  // JS modules
  "./js/constants.js",
  "./js/utils.js",
  "./js/db.js",
  "./js/library.js",
  "./js/playlist.js",
  "./js/player.js",
  "./js/main.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        }),
      ),
    ),
  );
  self.clients.claim();
});

const CORE_FILES = [
  "index.html", "style.css", "app.jsx", "manifest.json", "builtin-playlists.json", "privacy.html", "guide.html", "/",
  "css/tokens.css", "css/base.css", "css/components.css", "css/sidebar.css", "css/responsive.css",
  "js/constants.js", "js/utils.js", "js/db.js", "js/library.js", "js/playlist.js", "js/player.js", "js/main.js"
];

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // ── FILTER: Ignore non-HTTP schemes (chrome-extension, data, etc.) ──
  if (!url.protocol.startsWith("http")) return;

  const isCoreFile = CORE_FILES.some(f => url.pathname.endsWith(f) || url.pathname === "/");

  if (isCoreFile) {
    // Stale-While-Revalidate strategy for core files
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          return networkResponse;
        }).catch(err => {
          // reportError(`Fetch failed for ${url.pathname}: ${err.message}`);
          throw err;
        });
        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // Cache First for everything else
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          if (event.request.headers.get("Range")) {
            return handleRangeRequest(event.request, cachedResponse);
          }
          return cachedResponse;
        }

        // If not in cache, just fetch it
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            // ── OPT-OUT: Do NOT automatically cache large audio files on-the-fly ──
            // Caching large media via clone().put() can cause significant stalling/memory pressure.
            const contentType = response.headers.get("Content-Type") || "";
            const isAudio = contentType.includes("audio") || url.pathname.endsWith(".mp3") || url.pathname.endsWith(".ogg");
            
            if (!isAudio) {
              const cacheCopy = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, cacheCopy).catch(e => {
                  // Ignore 'Request scheme' errors silently here as it's just a background put
                });
              });
            }
          }
          return response;
        }).catch(err => {
          // reportError(`Fetch failed for ${url.pathname}: ${err.message}`);
          throw err;
        });
      })
    );
  }
});

/**
 * Handle Range Requests for cached assets (Critical for iOS/Safari audio)
 */
async function handleRangeRequest(request, response) {
  const rangeHeader = request.headers.get("Range");
  if (!rangeHeader) return response;

  const arrayBuffer = await response.arrayBuffer();
  const bytes = rangeHeader.replace(/bytes=/, "").split("-");
  const start = parseInt(bytes[0], 10);
  const end = bytes[1] ? parseInt(bytes[1], 10) : arrayBuffer.byteLength - 1;

  if (start >= arrayBuffer.byteLength || end >= arrayBuffer.byteLength) {
    return new Response("", {
      status: 416,
      statusText: "Range Not Satisfiable",
      headers: { "Content-Range": `bytes */${arrayBuffer.byteLength}` },
    });
  }

  const slice = arrayBuffer.slice(start, end + 1);
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Content-Range", `bytes ${start}-${end}/${arrayBuffer.byteLength}`);
  newHeaders.set("Content-Length", slice.byteLength);
  newHeaders.set("Accept-Ranges", "bytes");

  return new Response(slice, {
    status: 206,
    statusText: "Partial Content",
    headers: newHeaders,
  });
}

/**
 * Report error back to the main app for logging
 */
async function reportError(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SW_ERROR',
      message
    });
  });
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
