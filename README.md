# LOF Tools

Standalone valuation calculator extracted from the LOF Website draft and served as a static site in Docker.

## Run locally

```bash
cd /Users/tylerhereford/repos/loftools
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080).

## Test keyboard flow

```bash
cd /Users/tylerhereford/repos/loftools
npm install
npx playwright install chromium
npm run test:e2e
```

## Behavior

- Four calculators: `Lease`, `Sale Comps`, `Apt Sale Comps`, `Apt Rent Comps`
- Copy buttons place the current result on the clipboard as a plain-text whole-dollar USD amount
- State is saved in browser local storage and restored on refresh

## Stop

```bash
cd /Users/tylerhereford/repos/loftools
docker compose down
```
