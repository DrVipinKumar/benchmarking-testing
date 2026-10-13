<script setup>
import { ref, onMounted, watch } from 'vue'; import { defineStore } from 'pinia';
const N=new URLSearchParams(location.search).get('n')||'100', SIZE=50;
const useStore=defineStore('rows',()=>{const rows=ref([]),ready=ref(false);return{rows,ready}});
const s=useStore(); const page=ref(0); const form=ref({name:'',value:''}); const err=ref('');
const load=async()=>{const j=await (await fetch(`/api/records?n=${N}&page=${page.value}&size=${SIZE}`)).json();s.rows=j.rows;s.ready=true};
onMounted(()=>{load();window.__updateOnce=()=>{s.rows[0].name='Updated '+Date.now()}}); watch(page,load);
const add=async()=>{if(!form.value.name.trim()||isNaN(+form.value.value)){err.value='Name required, value must be numeric';return}err.value='';
  const row=await (await fetch('/api/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form.value,value:+form.value.value,category:'A',active:true})})).json();
  s.rows.unshift(row);form.value={name:'',value:''}};
const del=id=>{s.rows=s.rows.filter(r=>r.id!==id)};
</script>
<template><div><h1>CRUD</h1>
<input placeholder="name" v-model="form.name"/><input placeholder="value" v-model="form.value"/><button @click="add">Add</button> <span>{{err}}</span>
<table><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Value</th><th/></tr></thead>
<tbody><tr v-for="r in s.rows" :key="r.id"><td>{{r.id}}</td><td>{{r.name}}</td><td>{{r.category}}</td><td>{{r.value}}</td><td><button @click="del(r.id)">Delete</button></td></tr></tbody></table>
<button :disabled="page===0" @click="page--">Prev</button> <button @click="page++">Next</button>
<div v-if="s.ready" data-testid="ready"/></div></template>
