// 过渡版本接管旧服务工作线程，删除离线应用壳后主动注销
self.addEventListener('install', (event) => {
  event.waitUntil(Promise.resolve())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith('saylo-')).map((name) => caches.delete(name))))
      .then(() => self.registration.unregister()),
  )
})
