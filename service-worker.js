const CACHE_NAME = "just-play-it-build-1730-24MAR2026-v73";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.jsx",
  "./privacy.html",
  "./manifest.json",
  "./builtin-playlists.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./audio/jonahs-songs/Song 1 Run to Tarshish.mp3",
  "./audio/jonahs-songs/Song 2 Who Is This God.mp3",
  "./audio/jonahs-songs/Song 3 A God Who Relents.mp3",
  "./audio/jonahs-songs/Song 4 Who Knows.mp3",
  "./audio/jonahs-songs/The Jonah Songs.mp3",
  "./audio/remember-the-lord/Remember the Lord Part 1.mp3",
  "./audio/remember-the-lord/Remember the Lord Part 2.mp3",
  "./audio/remember-the-lord/Remember the Lord Part 3.mp3",
  "./audio/remember-the-lord/Remember the Lord Part 4.mp3",
  "./audio/remember-the-lord/Part 1 Remember the Lord.wav",
  "./audio/remember-the-lord/Part 2 Remember the Lord.wav",
  "./audio/remember-the-lord/Part 3 Remember the Lord.wav",
  "./audio/remember-the-lord/Part 4 Remember the Lord.wav",
  "./audio/nas-songs_plus/Before My Eyes.mp3",
  "./audio/nas-songs_plus/God is My H O M E.mp3",
  "./audio/nas-songs_plus/God with Us.mp3",
  "./audio/nas-songs_plus/In the Darkest Night.mp3",
  "./audio/nas-songs_plus/LOOK UP!.mp3",
  "./audio/nas-songs_plus/The God Who Fights For Me.mp3",
  "./audio/nas-songs_plus/When My Loved One is Gone!.mp3",
  "./audio/nas-songs_plus/You are loved, so very loved!.mp3"
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

const CORE_FILES = ["index.html", "style.css", "app.jsx", "manifest.json", "builtin-playlists.json", "privacy.html", "/"];

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isCoreFile = CORE_FILES.some(f => url.pathname.endsWith(f) || url.pathname === "/");

  if (isCoreFile) {
    // Network First strategy for core files: get the latest from the web if possible
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache First for everything else (like music files)
    // IMPORTANT: Supporting Range Headers specifically for iOS/Safari audio stability
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          if (event.request.headers.get("Range")) {
            return handleRangeRequest(event.request, cachedResponse);
          }
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          
          if (event.request.headers.get("Range")) {
            // We can't easily range-slice a full fetch response stream here without extra buffering
            // but the browser will handle the network fetch range correctly. 
            // The issue is mostly with CACHED assets.
            return response;
          }
          return response;
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

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
