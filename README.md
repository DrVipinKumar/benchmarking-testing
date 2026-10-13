# Front-End Framework Benchmark — React vs Angular vs Vue

Reproducible performance benchmark comparing **React 19, Angular 19, and Vue 3** on functionally identical applications backed by a shared REST + WebSocket server.

All results are measured live by `harness/measure.mjs` (Playwright + Chrome DevTools Protocol) and written to `data/raw_trials.csv`. Nothing in `analysis/` fabricates or simulates data — if `data/raw_trials.csv` is empty, no results exist yet.

## 1. What this application does

- **Shared backend (`backend/server.js`):** Express 4 + `ws` 8 server. Serves deterministic, seeded record sets (`mulberry32(42)` — every framework sees identical data), paginated CRUD API, static hosting for all front-end builds, and a WebSocket chat stream (`/ws`, ~1 msg / 50 ms).
  - `GET /api/records?n=<total>&page=&size=` — `size<=0` returns all rows (used for scalability tests)
  - `POST /api/records`, `PUT /api/records/:id`, `DELETE /api/records/:id`
  - `WS /ws` — chat message stream
- **Front-end apps (`apps/`):** Tier-1 CRUD reference implementations built to the identical functional contract in `apps/SPEC.md`:
  - `apps/react-crud` (React 19 + Vite 5), `apps/vue-crud` (Vue 3.5 + Pinia + Vite 5), `apps/angular-crud` (Angular 19 standalone, SSR off)
  - Every app must render `<div data-testid="ready">` on first data render (harness waits for it), read dataset size from `?n=`, and expose `window.__updateOnce()` (one state update, used for DOM-update latency). Same CSS (`apps/shared.css`), same component decomposition, no SSR.
- **Measurement harness (`harness/measure.mjs`):** Launches Chromium via Playwright, applies **4x CPU throttling + Fast-3G emulation**, collects FP, FCP, LCP, long-task total, JS heap (`JSHeapUsedSize`), CDP `TaskDuration`, and DOM-update latency. Default protocol: **5 warm-up runs (discarded) + 30 measured trials** per (framework × dataset size).
- **Load script (`harness/load.k6.js`):** k6 concurrent-client test against the shared backend only (VUs 1 / 25 / 100 / 250 / 500).
- **Analysis (`analysis/analyze.py`):** pandas + SciPy statistics computed **only from `data/raw_trials.csv`**: per-framework mean±SD, Shapiro-Wilk normality, one-way ANOVA, Kruskal-Wallis, pairwise Hedges' g, and log-linear scalability regression (metric vs `log10(records)`).

### Application tiers (spec)

Defined in `apps/SPEC.md`. Only **Tier 1 (CRUD: paginated table, create/edit/delete with validation)** is implemented for all three frameworks. Tiers 2–5 are specified but not yet implemented:

1. CRUD table — ✅ implemented (react / vue / angular)
2. E-commerce (catalogue, faceted filters, cart, checkout, routing) — ❌
3. Dashboard (≥4 charts + shared-state filters) — ❌
4. Real-time chat (WS stream, typing, presence, 20 msg/s burst) — ❌
5. Large dashboard (virtualized grid to 1,000,000 rows, live KPIs, drill-down) — ❌

## 2. Repository layout

```
backend/            Express + WS server, serves apps/dist on :3000
  server.js
  package.json
apps/
  SPEC.md           Functional contract all frameworks must follow
  shared.css        Shared stylesheet (visual parity)
  react-crud/       React 19 + Vite (base /react-crud/, builds to ../dist/react-crud)
  vue-crud/         Vue 3.5 + Pinia + Vite (base /vue-crud/, builds to ../dist/vue-crud)
  angular-crud/     Angular 19 project (build with --base-href /angular-crud/, copy to ../dist/angular-crud)
  dist/             Built bundles served by the backend (react-crud/, vue-crud/, angular-crud/)
harness/
  measure.mjs       Playwright/CDP benchmark runner → data/raw_trials.csv
  load.k6.js        k6 backend load test
analysis/
  analyze.py        Statistical analysis of data/raw_trials.csv
data/
  raw_trials.csv    Per-trial measurements (header + one row per trial)
  environment.json  CPU/OS/Chrome/Node fingerprint (auto-written by harness)
```

### Metrics collected (`data/raw_trials.csv`)

| Column | Source |
|---|---|
| `timestamp, framework, tier, records, network, trial` | harness run config |
| `fp_ms, fcp_ms` | `performance.getEntriesByType('paint')` |
| `lcp_ms` | `PerformanceObserver(largest-contentful-paint)` |
| `longtask_total_ms` | `PerformanceObserver(longtask)` sum |
| `js_heap_mb` | CDP `Performance.getMetrics` → `JSHeapUsedSize` |
| `cpu_task_s` | CDP `TaskDuration` |
| `dom_update_ms` | MutationObserver round-trip around `window.__updateOnce()` (`-1` = timeout) |
| `tti_ms` | **empty by design** — merge Lighthouse TTI manually (see §6) |

## 3. Prerequisites

- **Node.js** (verified with v26.10.0) + npm
- **Python 3.x** with `pandas`, `scipy`, `numpy` (verified: Python 3.14.6, pandas 3.0.3, scipy 1.18.0)
- **Chromium** for Playwright: `npx playwright install chromium`
- Optional: **k6** (backend load test), **Lighthouse** (`npx lighthouse`, for TTI)

## 4. Install and build

Run from the repo root (`benchmark_testing/`):

```bash
# 1. Backend
cd backend && npm install && cd ..

# 2. React + Vue (Vite builds land directly in apps/dist/)
cd apps/react-crud && npm install && npm run build && cd ../..
cd apps/vue-crud   && npm install && npm run build && cd ../..

# 3. Angular 19 (application builder outputs to dist/angular-crud/browser — copy it)
cd apps/angular-crud && npm install
npx ng build --base-href /angular-crud/
# PowerShell:
Copy-Item dist/angular-crud/browser/* ../dist/angular-crud/ -Recurse -Force
# bash:
# cp -r dist/angular-crud/browser/* ../dist/angular-crud/
cd ../..

# 4. Harness
cd harness && npm install && npx playwright install chromium && cd ..

# 5. Analysis deps
pip install pandas scipy numpy
```

## 5. How to run

### 5.1 Start the backend (required — serves API + all apps)

```bash
cd backend && npm start
# backend on :3000 serving <repo>/apps/dist
```

Verify: `http://localhost:3000/react-crud/?n=1000`, `http://localhost:3000/vue-crud/?n=1000`, `http://localhost:3000/angular-crud/`, and `http://localhost:3000/api/records?n=100&size=5`.

### 5.2 Run the browser benchmark

```bash
cd harness
node measure.mjs --framework <react|vue|angular> --tier crud --records <N> --trials 30 [--net fast3g|none] [--url <override>]
```

| Flag | Default | Meaning |
|---|---|---|
| `--framework` | (required) | `react`, `vue`, or `angular` |
| `--tier` | (required) | `crud` (only implemented tier) |
| `--records` | `10000` | Dataset size, passed as `?n=` (use `1000`, `10000`, `50000`) |
| `--trials` | `30` | Measured trials (5 warm-ups always run first and are discarded) |
| `--net` | `fast3g` | `fast3g` emulates Fast-3G; `none` disables network emulation (CPU 4x throttle always on) |
| `--url` | `http://localhost:3000/<framework>-<tier>/` | Override app URL |

Full reproducibility matrix (3 frameworks × 3 sizes, the minimum needed for the scalability regression):

```bash
for FRAMEWORK in react vue angular; do
  for N in 1000 10000 50000; do
    node measure.mjs --framework $FRAMEWORK --tier crud --records $N --trials 30
  done
done
# PowerShell equivalent: nested foreach ($f in 'react','vue','angular') { foreach ($n in 1000,10000,50000) { node measure.mjs --framework $f --tier crud --records $n --trials 30 } }
```

Each trial appends one row to `data/raw_trials.csv` and rewrites `data/environment.json` (CPU model/cores, RAM, OS, Chrome + Node versions).

### 5.3 Backend load test (optional, measures server only)

```bash
# from repo root; VUS in 1, 25, 100, 250, 500
k6 run -e VUS=100 harness/load.k6.js
```

Client-side rendering under N concurrent sessions still requires running `measure.mjs` instances in parallel.

### 5.4 Statistical analysis

```bash
# from repo root
python analysis/analyze.py data/raw_trials.csv [metric] [tier] [records]
# examples:
python analysis/analyze.py data/raw_trials.csv            # default metric lcp_ms, all tiers/sizes
python analysis/analyze.py data/raw_trials.csv lcp_ms crud
python analysis/analyze.py data/raw_trials.csv lcp_ms crud 10000
```

Output: per-framework `(n, mean, SD)`; Shapiro-Wilk per group; one-way ANOVA `F(df1,df2), p`; Kruskal-Wallis `H, p`; pairwise Hedges' g; per-framework scalability slope + R² of mean metric vs `log10(records)` (needs >2 record sizes — hence the 1000/10000/50000 matrix).

## 6. Methodology notes

- **Fairness:** Seeded PRNG (`mulberry32(42)`) guarantees identical datasets; same API, same CSS, same component decomposition, same windowing strategy, no SSR. Throttling (4x CPU, Fast-3G) is applied identically via CDP.
- **TTI is not measurable from the Performance API.** The harness leaves `tti_ms` blank. To fill it, run `npx lighthouse <app-url> --output=json` per configuration and merge the `interactive` value into the CSV's `tti_ms` column.
- **Record your environment.** `harness/measure.mjs` writes `data/environment.json` automatically — keep it alongside the CSV for any published results. Current sample env: 16-core Intel Core Ultra 9 285H, 31 GB RAM, Windows 11 (win32 10.0.26300), Chrome 156, Node v26.10.0.
- **Re-running appends.** `measure.mjs` creates the CSV header only if the file is missing; delete `data/raw_trials.csv` for a clean run, or keep appending for larger samples.
