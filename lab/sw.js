// Film Lab — lets the Lab open without an internet connection.
//
// The first time the Lab is opened, its files are saved on the phone. After that:
// with a connection, the newest version is fetched (and saved); without one, the saved copy
// is used. Your photos never pass through here — only the Lab's own files.

const CACHE = 'film-lab-v0.1.0';
const APP_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './develop.js',
  './worker.js',
  './contact-sheet.js',
  './zip.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  '../films/index.json',
  '../films/portra400.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('film-lab-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })),
  );
});
