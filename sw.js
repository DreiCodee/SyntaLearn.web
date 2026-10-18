const V='syntalearn-v7';
const FILES=['./','index.html','style.css','game.css','quiz.css','script.js','game.js','quiz.js','manifest.json','icon-192.png','icon-512.png','icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
/* online: always get the newest files. offline (or slow, 4s): use the saved copy */
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.open(V).then(c=>{
    const net=fetch(r,{cache:'no-cache'}).then(res=>{if(res.ok)c.put(r,res.clone());return res});
    const slow=new Promise((_,no)=>setTimeout(no,4000));
    return Promise.race([net,slow]).catch(()=>c.match(r,{ignoreSearch:true}).then(h=>h||net));
  }));
});