import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
const N = new URLSearchParams(location.search).get('n') || '100', SIZE = 50;
@Component({selector:'app-root',standalone:true,imports:[FormsModule],template:`
<div><h1>CRUD</h1>
<input placeholder="name" [(ngModel)]="name"/><input placeholder="value" [(ngModel)]="value"/><button (click)="add()">Add</button> <span>{{err()}}</span>
<table><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Value</th><th></th></tr></thead>
<tbody>@for (r of rows(); track r.id) {<tr><td>{{r.id}}</td><td>{{r.name}}</td><td>{{r.category}}</td><td>{{r.value}}</td><td><button (click)="del(r.id)">Delete</button></td></tr>}</tbody></table>
<button [disabled]="page()===0" (click)="go(-1)">Prev</button> <button (click)="go(1)">Next</button>
@if (ready()) {<div data-testid="ready"></div>}</div>`})
export class AppComponent implements OnInit {
  rows = signal<any[]>([]); ready = signal(false); page = signal(0); err = signal(''); name = ''; value = '';
  ngOnInit() { this.load(); (window as any).__updateOnce = () => this.rows.update(r => [{...r[0], name: 'Updated ' + Date.now()}, ...r.slice(1)]); }
  async load() { const j = await (await fetch(`/api/records?n=${N}&page=${this.page()}&size=${SIZE}`)).json(); this.rows.set(j.rows); this.ready.set(true); }
  go(d: number) { this.page.update(p => p + d); this.load(); }
  async add() {
    if (!this.name.trim() || isNaN(+this.value)) { this.err.set('Name required, value must be numeric'); return; } this.err.set('');
    const row = await (await fetch('/api/records', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:this.name, value:+this.value, category:'A', active:true})})).json();
    this.rows.update(r => [row, ...r]); this.name = ''; this.value = '';
  }
  del(id: number) { this.rows.update(r => r.filter(x => x.id !== id)); }
}
