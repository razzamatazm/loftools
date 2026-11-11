# Userscripts

Userscripts for Humperdink, TitlePro and Redfin. Teammates run them in Violentmonkey (Chrome or Edge), install
them from the guide at https://loftools.azurewebsites.net/install/ (`install/index.html`), and Violentmonkey
updates them from the addresses in each script's header. The guide used to point at Tampermonkey; it now points
at Violentmonkey, so keep new scripts to APIs Violentmonkey supports (see https://violentmonkey.github.io/api/gm/).

| File | Source of truth |
|---|---|
| `send-to-hot-task.user.js` | `operation-hot-task` repo. Bridge copy only: its update addresses point at Hot Task, so installs from this old address move there. Never edit it. |
| `titlepro-to-humperdink.user.js` | This file. Behaviour notes live in `operation-hot-task` at `tools/titlepro/README.md`. |
| `redfin-sale-summary.user.js` | This file. Runs on Redfin and Zillow; site-specific code is in its `REDFIN` and `ZILLOW` adapters. Its `@name` is "Comp Batching Tool for Redfin and Zillow" (it was "Redfin Comp Printer" up to 3.0.0). Keep the old file name: it is every install's update address, so renaming it cuts everyone off from updates. Change `@name` only with care: automatic updates keep the existing copy, but a manual reinstall from the guide matches by `@namespace` + `@name`, so a reinstall over a copy that hasn't updated yet adds a second copy. |
| `humperdink-new-loan.user.js` | This file. |
| `humperdink-standard-docs.user.js` | This file. Asks local download vs create in Humperdink on first use; the saved default lives in Humperdink's localStorage under `lofStandardDocsMode`. |
| `humperdink-loan-docs-checker.user.js` | This file. Places its button after Standard Docs when that script is installed. |
| `humperdink-copy-link.user.js` | This file. Personal script, not for teammates: keep it off the install guide. |

## Rules

- Every change to a script raises its `@version`. Violentmonkey only offers an update when the version goes up, so a change without a bump reaches nobody.
- `@downloadURL` and `@updateURL` must both be `https://loftools.azurewebsites.net/userscripts/<file name>` (the bridge copy points at Hot Task instead), and the file name must end in `.user.js`.
- Hot Task serves its own scripts (Export to HT and Hot Task Panel) at `https://operation-hot-task-app-lof.azurewebsites.net/userscripts/`, and the install guide links them there. They ship with Hot Task's deploys; nothing to copy here.
- Adding or renaming a script means adding or renaming its Install link in `install/index.html`, unless it's personal. Personal scripts (`humperdink-copy-link.user.js`) are served but never linked from the guide; list them in `PERSONAL` in `scripts/check-userscripts.test.mjs`.

## Check

```sh
node --test scripts/check-userscripts.test.mjs
```

Checks each script's update addresses against where it's served, that there's exactly one `@version`, and that the install guide links every script except the personal ones, and nothing else.
