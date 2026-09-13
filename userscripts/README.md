# Userscripts

Tampermonkey userscripts for Humperdink. Teammates install them from the guide at
https://loftools.thepopcorn.party/install/ (`install/index.html`), and Tampermonkey
updates them from the addresses in each script's header.

| File | Source of truth |
|---|---|
| `send-to-hot-task.user.js` | `operation-hot-task` repo, `tools/humperdink/send-to-hot-task.user.js`. Hot Task's tests run that file against its parser and Teams app id. This is a served copy. |
| `titlepro-to-humperdink.user.js` | This file. Behaviour notes live in `operation-hot-task` at `tools/titlepro/README.md`. |

## Rules

- Every change to a script raises its `@version`. Tampermonkey only offers an update when the version goes up, so a change without a bump reaches nobody.
- `@downloadURL` and `@updateURL` must both be `https://loftools.thepopcorn.party/userscripts/<file name>`, and the file name must end in `.user.js`.
- Don't edit the logic of `send-to-hot-task.user.js` here. Change it in `operation-hot-task`, then copy it over, keeping this copy's update addresses.
- Refresh that copy when Hot Task deploys the script change, not before. A copy running ahead of the live Hot Task app can open a Teams screen the app doesn't have yet.
- Adding or renaming a script means adding or renaming its Install link in `install/index.html`.

## Check

```sh
node --test scripts/check-userscripts.test.mjs
```

Checks each script's update addresses against where it's served, that there's exactly one `@version`, and that the install guide links every script and nothing else.
