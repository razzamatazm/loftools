# CLAUDE.md

## Project

LOF standalone valuation calculator — a small static site for local team use, extracted from the larger LOF Website draft.

- Plain static HTML/CSS/JS, no framework
- Served locally via Docker + Nginx
- State persists in browser `localStorage`
- Copy buttons output plain-text whole-dollar USD amounts

## Stack

| File | Purpose |
|---|---|
| `index.html` | App markup and tab panels |
| `styles.css` | Full responsive UI styling |
| `app.js` | State, calculator logic, rendering, clipboard, localStorage |
| `Dockerfile` | Static Nginx image |
| `docker-compose.yml` | Local container entrypoint |
| `nginx.conf` | Nginx config for static serving |

## Rules

- Do not introduce a frontend framework unless explicitly requested.
- Do not add build tooling, package managers, or compilation steps unless explicitly requested.
- Do not add shared persistence, auth, or APIs without explicit user direction.
- State stays browser-local only.

## Calculator tabs

- **Lease** — Rent per SF rows, expense adjustments, outlier auto-exclude, copy from selected cap-rate row.
- **Sale Comps** — `$/SF` from price/sqft or manual, listing discount, outlier auto-exclude, copy indicated value.
- **Apt Sale Comps** — `$/Unit` or `$/SF` valuation, outlier auto-exclude per method, copy indicated value.
- **Apt Rent Comps** — Unit mix + monthly rent by type, outlier per type, copy from selected cap-rate row.

## Clipboard output

Always: USD formatted, comma-separated, whole dollars only, no labels, no cents. Centralized in `copyAmount()` in `app.js`.

## Verification commands

```sh
node --check app.js
docker compose config
docker compose up --build
```

## Source of truth

Original calculator behavior: `/Users/tylerhereford/repos/LOF Website/loan-detail-draft.html`
Preserve parity with that source unless a behavior change is explicitly requested.

## Key patterns

- Calculation helpers separate from DOM update code where practical.
- `createDefaultState()` for new defaults; `normalizeState()` for backward-compatible migrations.
- Never assume existing `localStorage` entries match the newest state shape — always add normalization paths.
- Tab switching uses the existing `activeTab` pattern.
- Outlier handling depends on row ranking — recheck after any formula change.
