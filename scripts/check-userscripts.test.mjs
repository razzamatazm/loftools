/* Run: node --test scripts/check-userscripts.test.mjs

   Teammates install the userscripts from /install/ and Tampermonkey updates them
   from here. Three things have to agree, and none of them fails loudly:
   - the files in userscripts/, which Nginx serves at /userscripts/<name>,
   - each script's @downloadURL / @updateURL, which Tampermonkey re-fetches
     (a wrong one means nobody ever gets another update),
   - the install guide's Install links (a wrong one is a 404 in a teammate's browser). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

// Public address teammates' browsers reach loftools at, no trailing slash.
const HOST = "https://loftools.thepopcorn.party";

const ROOT = new URL("..", import.meta.url);
const read = (relative) => readFileSync(new URL(relative, ROOT), "utf8");
const INSTALL_PAGE = read("install/index.html");
const FILES = readdirSync(new URL("userscripts/", ROOT)).filter((name) => name.endsWith(".js"));

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
    assert.match(name, /\.user\.js$/, "Tampermonkey only installs a .user.js address");
    const source = read(`userscripts/${name}`);
    const address = `${HOST}/userscripts/${name}`;
    assert.deepEqual(headerValues(source, "downloadURL"), [address]);
    assert.deepEqual(headerValues(source, "updateURL"), [address]);
    assert.equal(headerValues(source, "version").length, 1, "one @version, or updates are never offered");
  });
}

test("the install guide links every served script and nothing else", () => {
  const linked = [...INSTALL_PAGE.matchAll(/href="([^"]+\.user\.js)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(linked, FILES.map((name) => `/userscripts/${name}`).sort());
});
