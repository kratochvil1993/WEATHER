const CACHE_NAME = "weather-app-v4";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/teploty.html",
  "/dalsi-data.html",
  "/statistiky.html",
  "/style.css",
  "/script.js",
  "/fav/site.webmanifest",
  "/fav/favicon-96x96.png",
  "/fav/favicon.svg",
  "/fav/favicon.ico",
  "/fav/apple-touch-icon.png",
  // External resources (fonts, icons, scripts)
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
  // Local Images (add strictly necessary ones for offline fallback)
  "/images/sunny.jpg",
  "/images/partly_cloudy.jpg",
  "/images/cloudy.jpg",
  "/images/rain.jpg",
  "/images/snow.jpg",
  "/images/hail.jpg"
];

// Install Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Activate worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

// Fetch Strategy: Network First for HTML, Cache First for assets
self.addEventListener("fetch", (event) => {
  // Check if request is for an HTML page (navigation)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Cache First strategy for all other assets (images, css, js)
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
    );
  }
});
