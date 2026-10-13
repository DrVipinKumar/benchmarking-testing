// k6 run -e VUS=100 harness/load.k6.js   (VUS in 1,25,100,250,500). Measures shared-backend response time only;
// client-side rendering under N sessions needs the browser harness (measure.mjs) run in parallel.
import http from 'k6/http'; import { check, sleep } from 'k6';
export const options={vus:+(__ENV.VUS||1),duration:'60s',thresholds:{http_req_duration:['p(95)<2000']}};
export default function(){
  const r=http.get('http://localhost:3000/api/records?n=10000&page='+Math.floor(Math.random()*100)+'&size=50');
  check(r,{ok:x=>x.status===200}); sleep(1);
}
