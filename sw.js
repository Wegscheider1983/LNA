// App: cache-first (sofortiger Start, Update im Hintergrund).
// Kartenkacheln (OpenStreetMap): nur bereits angesehene Kacheln werden gespeichert – kein Massen-Download.
const C="lna-v1101", T="lna-tiles-v1", TMAX=1500;
const F=["./","./index.html","./manifest.json","./icon-180.png","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==T).map(x=>caches.delete(x)))));self.clients.claim()});
async function trim(){const c=await caches.open(T);const k=await c.keys();if(k.length>TMAX)for(const r of k.slice(0,k.length-TMAX+200))await c.delete(r)}
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.hostname==="tile.openstreetmap.org"){
    e.respondWith(caches.open(T).then(async c=>{
      const hit=await c.match(e.request); if(hit) return hit;
      try{const r=await fetch(e.request); if(r&&(r.ok||r.type==="opaque")){c.put(e.request,r.clone()); trim()} return r}
      catch(err){return new Response("",{status:504})}
    }));
    return;
  }
  if(u.origin!==location.origin)return;
  e.respondWith(caches.open(C).then(async c=>{
    const hit=await c.match(e.request,{ignoreSearch:true});
    const net=fetch(e.request).then(r=>{if(r&&r.ok)c.put(e.request,r.clone());return r}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const r=await net;
    return r||(await c.match("./index.html"))||new Response("Offline",{status:503});
  }));
});
