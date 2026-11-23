// ==========================================
// CHOMA WEATHER SERVICE WORKER
// Created by TIVANNAH INNOVATIONS
// VERSION 4
// ==========================================

const CACHE_NAME = "choma-weather-v4";

const APP_FILES = [
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./icon.svg"
];


// ==========================================
// INSTALL NEW VERSION
// ==========================================

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(cache => cache.addAll(APP_FILES))

            .then(() => self.skipWaiting())

    );

});


// ==========================================
// ACTIVATE NEW VERSION
// DELETE OLD APP CACHES
// ==========================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()

            .then(keys => {

                return Promise.all(

                    keys

                        .filter(key =>
                            key.startsWith("choma-weather-") &&
                            key !== CACHE_NAME
                        )

                        .map(key => caches.delete(key))

                );

            })

            .then(() => self.clients.claim())

    );

});


// ==========================================
// FETCH APP FILES
// NETWORK FIRST, OFFLINE FALLBACK
// ==========================================

self.addEventListener("fetch", event => {

    const request = event.request;

    const url = new URL(request.url);

    // Only handle GET requests.

    if (request.method !== "GET") {
        return;
    }

    // Ignore external websites and services.

    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(

        fetch(request, {
            cache: "no-store"
        })

            .then(async response => {

                if (response && response.ok) {

                    const cache = await caches.open(CACHE_NAME);

                    await cache.put(
                        request,
                        response.clone()
                    );

                }

                return response;

            })

            .catch(async () => {

                // First, look for the requested file.

                const cached = await caches.match(request);

                if (cached) {
                    return cached;
                }

                // If a page cannot load offline,
                // open the saved homepage.

                if (request.mode === "navigate") {

                    const homepageURL = new URL(
                        "./index.html",
                        self.registration.scope
                    );

                    const homepage = await caches.match(homepageURL);

                    if (homepage) {
                        return homepage;
                    }

                }

                return new Response(
                    "You are offline. Please reconnect to the internet.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain"
                        }
                    }
                );

            })

    );

});


// ==========================================
// TIVANNAH INNOVATIONS
// CHOMA WEATHER
// ==========================================
