// Usage: node measure.mjs --framework react --tier crud --records 10000 --trials 30 --net fast3g|none --url http://localhost:3000/react-crud/
import { chromium } from 'playwright';
import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { o[argv[i].slice(2)] = (argv[i+1] && !argv[i+1].startsWith('--')) ? argv[++i] : 'true'; }
  }
  return o;
}
const a = parseArgs(process.argv.slice(2));
const {framework,tier,records='10000',trials='30',net='fast3g'}=a;
if (!framework || !tier) { console.error('Missing required --framework and --tier. Example: node measure.mjs --framework react --tier crud --records 10000 --trials 30'); process.exit(1); }
const url=a.url||`http://localhost:3000/${framework}-${tier}/`;
const WARM=5, out=path.join(__dirname,'../data/raw_trials.csv'), envFile=path.join(__dirname,'../data/environment.json');
const FAST3G={offline:false,latency:562.5,downloadThroughput:1.6*1024*1024/8*0.9,uploadThroughput:750*1024/8*0.9};
const header='timestamp,framework,tier,records,network,trial,fp_ms,fcp_ms,lcp_ms,longtask_total_ms,js_heap_mb,cpu_task_s,dom_update_ms,tti_ms\n';
fs.mkdirSync(path.dirname(out), { recursive: true });
if(!fs.existsSync(out))fs.writeFileSync(out,header);
const browser=await chromium.launch();
fs.writeFileSync(envFile,JSON.stringify({cpus:os.cpus()[0].model,cores:os.cpus().length,ram_gb:Math.round(os.totalmem()/2**30),os:os.platform()+' '+os.release(),chrome:browser.version(),node:process.version,date:new Date().toISOString()},null,1));
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function once(){
  const ctx=await browser.newContext(); const page=await ctx.newPage(); const cdp=await ctx.newCDPSession(page);
  try {
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  if(net==='fast3g'){await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',FAST3G);}
  await cdp.send('Performance.enable');
  await page.addInitScript(()=>{window.__m={lcp:0,lt:0};
    new PerformanceObserver(l=>{for(const e of l.getEntries())window.__m.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(l=>{for(const e of l.getEntries())window.__m.lt+=e.duration}).observe({type:'longtask',buffered:true});});
  await page.goto(`${url}?n=${records}`,{waitUntil:'commit'});
  await page.waitForSelector('[data-testid="ready"]',{timeout:120000,state:'attached'});
  await sleep(1000);
  const paint=await page.evaluate(()=>Object.fromEntries(performance.getEntriesByType('paint').map(e=>[e.name,e.startTime])));
  const m=await page.evaluate(()=>window.__m);
  const dom=await page.evaluate(()=>new Promise(res=>{const t0=performance.now();const mo=new MutationObserver(()=>{mo.disconnect();res(performance.now()-t0)});mo.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true});window.__updateOnce?.();setTimeout(()=>res(-1),3000)}));
  const pm=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  const r={fp:paint['first-paint']??0,fcp:paint['first-contentful-paint']??0,lcp:m.lcp??0,lt:m.lt??0,heap:pm.JSHeapUsedSize/2**20,cpu:pm.TaskDuration,dom};
  return r;
  } finally { await ctx.close(); }
}
try {
for(let i=0;i<WARM;i++)await once();            // warm-up, discarded
for(let t=1;t<=+trials;t++){
  const r=await once();
  fs.appendFileSync(out,[new Date().toISOString(),framework,tier,records,net,t,r.fp,r.fcp,r.lcp,r.lt,r.heap.toFixed(2),r.cpu,r.dom,''].join(',')+'\n');
  console.log(framework,tier,records,'trial',t,'LCP',Math.round(r.lcp));
}
} finally { await browser.close(); }
