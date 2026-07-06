const CACHE="milo-trainer-pro-v31-cachefix";
const FILES=["./","index.html","styles-v31.css?v=31","app-v31.js?v=31","programme-v31.js?v=31","manifest-v31.json"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES).catch(()=>{})))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE?null:caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  const url=new URL(e.request.url);
  if(url.pathname.endsWith(".css")||url.pathname.endsWith(".js")||url.pathname.endsWith(".html")||url.pathname.endsWith("/")){
    e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
  }
});
