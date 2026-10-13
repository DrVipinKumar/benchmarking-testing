# Functional spec (identical in all frameworks)
API: GET /api/records?n=<count>&page=&size=  | POST/PUT/DELETE /api/records/:id | WS /ws (chat)
Every app renders `<div data-testid="ready">` once first data render is complete (harness waits for it).
Every app reads `?n=` from the URL for dataset size and exposes `window.__updateOnce()` which performs one state update (used for DOM-update latency).
1 CRUD: paginated table, create/edit/delete with client-side validation.
2 E-commerce: catalogue, faceted filters, cart, checkout, client routing.
3 Dashboard: >=4 charts + filters sharing state.
4 Real-time chat: WS stream, typing indicators, presence; 20 msg/s burst mode.
5 Large dashboard: virtualized grid up to 1,000,000 rows, live KPIs, drill-down.
Rules: same component decomposition, same CSS, same virtual-scroll strategy (windowing), no SSR.
