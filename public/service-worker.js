const cacheName = 'turtleDB v1';

const cacheAssets = [
  'index.html',
  'images/spinning-turtle.gif',
  'images/turtle.png',
  'bundle.js',
]

self.addEventListener("install", e => {
  console.log("ServiceWorker Installed :) ");

  e.waitUntil(
    caches
      .open(cacheName)
      .then(cache => {
        console.log("Service Worker: Caching static files...");
        cache.addAll(cacheAssets);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.log("Failed to cache static files...", err))
  )
})

self.addEventListener("activate", e => {
  console.log("ServiceWorker Activated :) ")
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
  console.log("ServiceWorker Fetching :)", e.request.url)
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
  // Attempts to cache entire response but breaks
  // e.respondWith(
  //   fetch(e.request)
  //     .then(res => {
  //       // cache entire response (site)
  //       const resClone = res.clone();
  //       // open a cache
  //       caches
  //         .open(cacheName)
  //         .then(cache => {
  //           // Add response to cache
  //           cache.put(e.request, resClone);
  //         });
  //       return res;
  //     })
  //     .catch(err => caches.match(e.request))
  // )
})
