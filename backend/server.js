import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '../apps/dist');
// Deterministic PRNG so every framework sees identical data.
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const cache=new Map();
function dataset(n){
  if(cache.has(n))return cache.get(n);
  const r=mulberry32(42),cats=['A','B','C','D','E'],rows=new Array(n);
  for(let i=0;i<n;i++)rows[i]={id:i+1,name:'Item '+(i+1),category:cats[Math.floor(r()*5)],value:Math.round(r()*1e4)/100,active:r()>0.5};
  cache.set(n,rows);return rows;
}
const app=express();app.use(express.json());
app.get('/api/records',(q,s)=>{
  const n=Math.min(parseInt(q.query.n||'100'),1e6),size=parseInt(q.query.size||'50'),page=parseInt(q.query.page||'0');
  const rows=dataset(n);
  s.json(size<=0?{total:n,rows}:{total:n,rows:rows.slice(page*size,page*size+size)});
});
app.post('/api/records',(q,s)=>s.status(201).json({...q.body,id:Date.now()}));
app.put('/api/records/:id',(q,s)=>s.json({...q.body,id:+q.params.id}));
app.delete('/api/records/:id',(q,s)=>s.status(204).end());
app.use(express.static(DIST));
const server=http.createServer(app);
const wss=new WebSocketServer({server,path:'/ws'});
wss.on('connection',ws=>{let i=0;const t=setInterval(()=>ws.send(JSON.stringify({id:++i,user:'u'+(i%10),text:'msg '+i,ts:Date.now()})),50);ws.on('close',()=>clearInterval(t));});
server.listen(3000,()=>console.log('backend on :3000 serving '+DIST));
