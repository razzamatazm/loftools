/* Run: node --test scripts/check-userscripts.test.mjs

   Teammates install the userscripts from /install/ and Violentmonkey updates them
   from here. Three things have to agree, and none of them fails loudly:
   - the files in userscripts/, which Nginx serves at /userscripts/<name>,
   - each script's @downloadURL / @updateURL, which Violentmonkey re-fetches
     (a wrong one means nobody ever gets another update),
   - the install guide's Install links (a wrong one is a 404 in a teammate's browser). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

// Public address teammates' browsers reach loftools at, no trailing slash.
const HOST = "https://loftools.azurewebsites.net";
// Hot Task serves its own scripts; the guide links them there.
const HOT_TASK = "https://operation-hot-task-app-lof.azurewebsites.net";
const HOT_TASK_SCRIPTS = ["hot-task-panel.user.js"];
// Kept here only so installs from the old address follow it to Hot Task's.
const BRIDGES = ["send-to-hot-task.user.js"];

const ROOT = new URL("..", import.meta.url);
const read = (relative) => readFileSync(new URL(relative, ROOT), "utf8");
const INSTALL_PAGE = read("install/index.html");
const FILES = readdirSync(new URL("userscripts/", ROOT)).filter((name) => name.endsWith(".js"));
// Served and auto-updated like the rest, but personal, so never on the install guide.
const PERSONAL = ["humperdink-copy-link.user.js"];

const headerValues = (source, key) => {
  const header = source.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
  assert.ok(header, "has a ==UserScript== header");
  return [...header[1].matchAll(new RegExp(`^//\\s*@${key}\\s+(.+?)\\s*$`, "gm"))].map((m) => m[1]);
};

test("there are scripts to serve", () => {
  assert.ok(FILES.length > 0);
});

for (const name of FILES) {
  test(`userscripts/${name} updates from where it's served`, () => {
    assert.match(name, /\.user\.js$/, "Violentmonkey only installs a .user.js address");
    const source = read(`userscripts/${name}`);
    const address = `${BRIDGES.includes(name) ? HOT_TASK : HOST}/userscripts/${name}`;
    assert.deepEqual(headerValues(source, "downloadURL"), [address]);
    assert.deepEqual(headerValues(source, "updateURL"), [address]);
    assert.equal(headerValues(source, "version").length, 1, "one @version, or updates are never offered");
  });
}

test("the install guide links every shared script and nothing else", () => {
  const linked = [...INSTALL_PAGE.matchAll(/href="([^"]+\.user\.js)"/g)].map((m) => m[1]).sort();
  const shared = FILES.filter((name) => !PERSONAL.includes(name) && !BRIDGES.includes(name));
  assert.deepEqual(
    linked,
    [...shared.map((name) => `/userscripts/${name}`), ...HOT_TASK_SCRIPTS.map((name) => `${HOT_TASK}/userscripts/${name}`)].sort()
  );
});
