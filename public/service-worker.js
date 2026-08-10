const CACHE_NAME = "zigo-v1";

const STATIC_ASSETS = [
    "/",
    "/manifest.json",
    "/public/icons/icon-192.png",
    "/public/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
    console.log("ZiGo Service Worker installing...");

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("ZiGo Service Worker activated");

    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});