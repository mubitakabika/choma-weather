// ==========================================
// CHOMA WEATHER SERVICE WORKER
// Created by TIVANNAH INNOVATIONS
// ==========================================

// CHANGE THIS VERSION WHENEVER THE APP IS UPDATED.

const CACHE_NAME = "choma-weather-v3";

const APP_FILES = [
    "./",
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

            .then(cache => {
                return cache.addAll(APP_FILES);
            })

            .then(() => {
                return self.skipWaiting();
            })

    );

});


// ==========================================
// ACTIVATE NEW VERSION
// REMOVE OLD CACHES
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

            .then(() => {
                return self.clients.claim();
            })

    );

});


// ==========================================
// FETCH AND UPDATE APP FILES
// ==========================================

self.addEventListener("fetch", event => {

    const request = event.request;

    const url = new URL(request.url);

    // Do not cache weather API requests.

    if (
        url.hostname === "api.open-meteo.com"
    ) {
        return;
    }

    // Only handle GET requests.

    if (request.method !== "GET") {
        return;
    }

    // Only handle requests from this website.

    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(

        fetch(request, {
            cache: "no-store"
        })

            .then(response => {

                if (
                    response &&
                    response.ok &&
                    response.status === 200
                ) {

                    const copy = response.clone();

                    caches.open(CACHE_NAME)

                        .then(cache => {
                            cache.put(request, copy);
                        });

                }

                return response;

            })

            .catch(async () => {

                // If internet is unavailable,
                // load the saved version.

                const cached = await caches.match(request);

                if (cached) {
                    return cached;
                }

                // If a page is unavailable offline,
                // return the saved homepage.

                if (request.mode === "navigate") {

                    const homepage =
                        await caches.match("./index.html");

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
