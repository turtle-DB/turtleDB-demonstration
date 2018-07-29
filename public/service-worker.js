const cacheName = 'turtleDB v1'

self.addEventListener("install", e => {
  // console.log("ServiceWorker Installed")
})

self.addEventListener("activate", e => {
  // console.log("ServiceWorker Activated")
})

self.addEventListener("fetch", e => {
  // console.log("ServiceWorker Fetching:", e.request.url)
})
