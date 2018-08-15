const cacheName = 'turtleDB v1';

const cacheAssets = [
  'index.html',
  'images/turtle.png',
  'bundle.js',
]

self.addEventListener("install", e => {
  console.log("ServiceWorker Installed");

  e.waitUntil(
    caches
      .open(cacheName)
      .then(cache => {
        console.log("Service Worker: Caching static files...");
        cache.addAll(cacheAssets);
      })
      .catch(err => console.log("Failed to cache static files...", err))
  )
})

self.addEventListener("activate", e => {
  console.log("ServiceWorker Activated")
  // clean up unwanted caches
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== cacheName) {
            console.log("Service Worker clearing old caches...");
            return caches.delete(cache);
          }
        })
      )
    })
  )
})

self.addEventListener("fetch", e => {
  console.log("ServiceWorker Fetching", e.request.url)
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  )
})
