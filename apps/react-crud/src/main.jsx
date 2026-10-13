import { createRoot } from 'react-dom/client'; import { useEffect, useReducer, useState } from 'react';
const N=new URLSearchParams(location.search).get('n')||'100', SIZE=50;
function reducer(s,a){switch(a.t){case 'load':return{...s,rows:a.rows,ready:true};case 'add':return{...s,rows:[a.row,...s.rows]};
 case 'edit':return{...s,rows:s.rows.map(r=>r.id===a.row.id?a.row:r)};case 'del':return{...s,rows:s.rows.filter(r=>r.id!==a.id)};default:return s}}
function App(){
  const [s,d]=useReducer(reducer,{rows:[],ready:false}); const [page,setPage]=useState(0); const [form,setForm]=useState({name:'',value:''}); const [err,setErr]=useState('');
  useEffect(()=>{fetch(`/api/records?n=${N}&page=${page}&size=${SIZE}`).then(r=>r.json()).then(j=>d({t:'load',rows:j.rows}))},[page]);
  useEffect(()=>{window.__updateOnce=()=>d({t:'edit',row:{...s.rows[0],name:'Updated '+Date.now()}})});
  const add=async()=>{if(!form.name.trim()||isNaN(+form.value)){setErr('Name required, value must be numeric');return}setErr('');
    const row=await (await fetch('/api/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,value:+form.value,category:'A',active:true})})).json();d({t:'add',row});setForm({name:'',value:''})};
  return <div>
    <h1>CRUD</h1>
    <input placeholder="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
    <input placeholder="value" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/>
    <button onClick={add}>Add</button> <span>{err}</span>
    <table><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Value</th><th/></tr></thead>
    <tbody>{s.rows.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.name}</td><td>{r.category}</td><td>{r.value}</td><td><button onClick={()=>d({t:'del',id:r.id})}>Delete</button></td></tr>)}</tbody></table>
    <button disabled={page===0} onClick={()=>setPage(page-1)}>Prev</button> <button onClick={()=>setPage(page+1)}>Next</button>
    {s.ready&&<div data-testid="ready"/>}
  </div>}
createRoot(document.getElementById('root')).render(<App/>);
