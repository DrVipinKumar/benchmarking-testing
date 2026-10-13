# Angular Tier-1 CRUD (Angular 19, standalone signals)
Complete project is checked in (scaffolded with `@angular/cli@19`, SSR off).
`src/app/app.component.ts` is the spec-compliant CRUD implementation.
```bash
cd apps/angular-crud && npm i
npx ng build --base-href /angular-crud/
# Angular 19 application builder outputs to dist/angular-crud/browser; copy it:
Copy-Item dist/angular-crud/browser/* ../dist/angular-crud/ -Recurse -Force
```
Output must be served at /angular-crud/ (backend serves apps/dist).
