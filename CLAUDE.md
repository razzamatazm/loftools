# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LOF standalone valuation calculator and tooling — small static site for local team use, extracted from larger LOF Website draft.

- Plain static HTML/CSS/JS, no framework
- Served locally via Docker + Nginx on port 8080
- State persists in browser `localStorage` under single key in `app.js`
- Copy buttons output plain-text whole-dollar USD amounts

## Stack

| File | Purpose |
|---|---|
| `index.html` | Main app markup, top-level tab panels |
| `consumerdebt.html` | Standalone consumer debt page (linked from main app) |
| `styles.css` | Full responsive UI styling |
| `app.js` | State, calculator logic, rendering, clipboard, localStorage (~200KB single file) |
| `loan-docs-data.js` | Data for Loan Doc Manual tab |
| `loandoctemplates/` | `.docx` templates: AGREEMENT, EFT, INSTRUCTIONS, NOTE, TD |
| `Dockerfile`, `nginx.conf`, `docker-compose.yml` | Static Nginx serving |
| `tests/keyboard-flow.spec.mjs` | Playwright e2e |

## Top-level tabs (index.html)

`1-4 Unit Valuations`, `Commercial Valuations`, `Apartment Valuations`, `Consumer Debt Checker`, `Blended LOI Checker`, `Loan Doc Manual`. Each tab contains its own sub-calculators (lease comps, sale comps, apt sale, apt rent, etc.) with cap-rate rows, outlier auto-exclude, and copy buttons.

## Rules

- No frontend framework, build tooling, package managers, or compilation steps unless explicitly requested.
- No shared persistence, auth, or APIs without explicit user direction. State stays browser-local.
- Preserve parity with source of truth `/Users/tylerhereford/repos/LOF Website/loan-detail-draft.html` unless behavior change explicitly requested.

## Clipboard output

Always USD, comma-separated, whole dollars, no labels, no cents. Centralized in `copyAmount()` in `app.js`.

## Key patterns

- `createDefaultState()` for new defaults; `normalizeState()` for backward-compatible migrations.
- Never assume existing `localStorage` matches newest state shape — always add normalization path.
- Tab switching uses `activeTab` pattern.
- Calculation helpers kept separate from DOM update code where practical.
- Outlier handling depends on row ranking — recheck after any formula change.

## Commands

```sh
# Run locally
docker compose up --build      # http://localhost:8080
docker compose down

# Verify
node --check app.js
docker compose config

# E2E test
npm install
npx playwright install chromium
npm run test:e2e               # runs all specs
npx playwright test tests/keyboard-flow.spec.mjs   # single spec
```
