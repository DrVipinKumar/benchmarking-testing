# Front-end framework benchmark (React / Angular / Vue)

Reproducible benchmark protocol and harness. **This repository contains no results until you run it.**
All per-trial data must be produced by `harness/measure.mjs` and written to `data/raw_trials.csv`;
nothing in `analysis/` fabricates or simulates measurements.

## Layout
- `backend/` shared REST + WebSocket server (deterministic seeded records, identical for all frameworks)
- `apps/SPEC.md` functional spec for the five tiers; `apps/*-crud` Tier-1 reference implementations
- `harness/measure.mjs` Playwright + Chrome DevTools Protocol runner (CPU 4x throttle, Fast-3G, 5 warm-ups, 30 trials)
- `harness/load.k6.js` concurrent-client load script (1/25/100/250/500)
- `analysis/analyze.py` Shapiro-Wilk, ANOVA, Kruskal-Wallis, Hedges' g, log-linear regression from the raw CSV

## Quick start
```bash
cd backend && npm i && npm start            # http://localhost:3000
cd apps/react-crud && npm i && npm run build # repeat for vue-crud; Angular: see apps/angular-crud/README.md
cd harness && npm i && npx playwright install chromium
node measure.mjs --framework react --tier crud --records 10000 --trials 30
# repeat for vue, angular and for records 1000, 50000 (3 sizes needed for the scalability regression)
python analysis/analyze.py data/raw_trials.csv
```
## Notes on methodology
- TTI is not exposed by the browser Performance API; take TTI from Lighthouse (`npx lighthouse`) and merge it into the CSV (`tti_ms`). The harness records FP, FCP, LCP, long-task total, JS heap, CPU task time and DOM-update latency.
- Record environment (CPU, OS, Chrome version) in `data/environment.json` (harness writes it automatically).
- Tiers 2-5 still need to be implemented against `apps/SPEC.md` for each framework.
