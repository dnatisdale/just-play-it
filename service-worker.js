// ────────────────────────────────────────────────────────────
// JUST PLAY IT. — Service Worker
//
// IMPORTANT: When you bump the version, change CACHE_VERSION
// below to match the new version number. This is the ONE place
// to edit in the service worker; the canonical version string
// lives in js/version.js.
// ────────────────────────────────────────────────────────────

const CACHE_VERSION = "V.92-03APR2026";
const CACHE_NAME = `just-play-it-${CACHE_VERSION}`;

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
  "./js/version.js",
  "./js/constants.js",
  "./js/utils.js",
  "./js/db.js",
  "./js/library.js",
  "./js/playlist.js",
  "./js/player.js",
  "./js/main.js"
];

// ── Install ──────────────────────────────────────────────────
// NOTE: We do NOT call self.skipWaiting() here automatically.
// The new SW will wait until the user clicks "Update Now" in
// the app, which sends a SKIP_WAITING message.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  // Do NOT skipWaiting here — let the user trigger the update.
});

// ── Activate ─────────────────────────────────────────────────
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

// ── Message handler ──────────────────────────────────────────
// The main app sends SKIP_WAITING when the user clicks "Update Now".
// We also notify all open clients with the new cache version so they
// can update the visible build label after reload.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.source.postMessage({ type: "SW_VERSION", version: CACHE_VERSION });
  }
});

// ── Fetch ────────────────────────────────────────────────────
const CORE_FILES = [
  "index.html", "style.css", "app.jsx", "manifest.json", "builtin-playlists.json", "privacy.html", "guide.html", "/",
  "css/tokens.css", "css/base.css", "css/components.css", "css/sidebar.css", "css/responsive.css",
  "js/version.js", "js/constants.js", "js/utils.js", "js/db.js", "js/library.js", "js/playlist.js", "js/player.js", "js/main.js"
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
            const contentType = response.headers.get("Content-Type") || "";
            const isAudio = contentType.includes("audio") || url.pathname.endsWith(".mp3") || url.pathname.endsWith(".ogg");
            
            if (!isAudio) {
              const cacheCopy = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, cacheCopy).catch(() => {});
              });
            }
          }
          return response;
        }).catch(err => {
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
