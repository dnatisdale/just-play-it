const CACHE_NAME = "just-play-it-v24";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.jsx",
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
  "./audio/remember-the-lord/Remember the Lord Part 4.mp3"
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => caches.match("./index.html"))
      );
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
