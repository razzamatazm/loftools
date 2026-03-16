# AGENTS.md

## Project purpose

This repository hosts the standalone LOF valuation calculator extracted from the larger `LOF Website` draft. It is a small static site intended for local team use before the new website exists.

The app:

- runs as plain static HTML/CSS/JS
- is served locally in Docker with Nginx
- persists user state in browser `localStorage`
- copies calculated values to the clipboard as whole-dollar USD amounts

## Stack

- `index.html`: app markup and tab panels
- `styles.css`: full responsive UI styling
- `app.js`: state, calculator logic, rendering, clipboard behavior, local storage
- `Dockerfile`: static Nginx image
- `docker-compose.yml`: local container entrypoint
- `nginx.conf`: Nginx config for static serving

Do not introduce a frontend framework unless explicitly requested. Keep this app lightweight and static by default.

## Behavioral rules

- The four calculator tabs are:
  - `Lease`
  - `Sale Comps`
  - `Apt Sale Comps`
  - `Apt Rent Comps`
- Copy buttons should copy only the numeric result as plain text currency.
- Clipboard output must stay:
  - USD formatted
  - comma separated
  - whole dollars only
  - no labels
  - no cents
- State should remain browser-local only unless the user explicitly asks for backend/shared persistence.

## Source of truth

The original calculator behavior came from:

- `/Users/tylerhereford/repos/LOF Website/loan-detail-draft.html`

When changing calculation logic, preserve parity with that source unless the user explicitly asks for a behavior change.

## Calculator notes

### Lease

- Uses rent per SF rows with lease type expense adjustments.
- Auto-excludes the highest adjusted-rent row as an outlier unless the user manually re-includes it.
- Copy value comes from the currently selected cap-rate row.

### Sale Comps

- Supports either computed `$ / SF` from `price / sqft` or manual `$ / SF`.
- Listing rows apply the listing discount percent before averaging.
- Auto-excludes the highest adjusted `$ / SF` row as an outlier unless manually overridden.
- Copy value is the indicated value.

### Apt Sale Comps

- Supports valuation by `$ / Unit` or `$ / SF`.
- Auto-excludes the highest comp under the active method unless manually overridden.
- Copy value is the indicated value.

### Apt Rent Comps

- Uses unit mix plus monthly rent samples by unit type.
- Highest rent sample is treated as the outlier for that type and can be re-included.
- Copy value comes from the currently selected cap-rate row.

## Persistence

- App state is stored in `localStorage` under a single key in `app.js`.
- Preserve backward compatibility with saved state when possible.
- If changing saved structure, add a normalization path instead of assuming a clean slate.

## Editing guidance

- Prefer updating `app.js` in small, behavior-focused changes.
- Keep calculation helpers separate from DOM update code where practical.
- Preserve the current responsive, single-page structure unless asked to redesign it.
- Avoid adding build tooling, package managers, or compilation steps unless explicitly requested.

## Verification

When making future changes, prefer these checks:

- `node --check /Users/tylerhereford/repos/loftools/app.js`
- `docker compose config`
- `docker compose up --build`

If Docker is unavailable, at least verify static serving with a simple local HTTP server.

## Common change patterns

### Add a new calculator tab

- Add the tab button in `index.html`.
- Add a matching panel in `index.html` with unique IDs for inputs, outputs, and copy button.
- Extend `state` defaults and normalization in `app.js`.
- Add DOM references in `elements`.
- Add render logic, event binding, calculation helpers, and copy-value wiring in `app.js`.
- Keep the new tab compatible with the existing `activeTab` tab-switching pattern.

### Change clipboard behavior

- Clipboard behavior is centralized in `copyAmount()` and related formatting helpers in `app.js`.
- Preserve the current default unless explicitly asked:
  - plain text only
  - whole-dollar USD
  - no labels
- If labels or alternate formats are requested, implement them there rather than scattering custom copy logic per tab.

### Change saved state structure

- Update `createDefaultState()` for new defaults.
- Update `normalizeState()` to support older saved data.
- Do not assume existing `localStorage` entries match the newest shape.
- Prefer additive migrations and fallback defaults over hard resets.

### Adjust calculator formulas

- Keep formulas aligned with the original extracted LOF draft unless the user explicitly requests a new rule.
- When changing a formula, update both:
  - the calculation logic
  - any related display labels, hints, or disabled-button behavior
- Recheck outlier handling after any formula change because several tabs depend on ranking rows.

### Modify layout or styling

- Preserve the app as a fast single-page static tool.
- Keep desktop and mobile behavior working; do not optimize for one at the expense of the other.
- Preserve the current visual direction unless the user asks for a redesign.

### Add persistence beyond local storage

- This app currently has no backend.
- Do not add shared persistence, auth, or APIs without explicit user direction.
- If backend persistence is requested later, keep the local-only mode functional unless the user says to replace it.
