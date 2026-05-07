// Simple Service Worker for PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests
  event.respondWith(fetch(event.request));
});
