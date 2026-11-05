// Static file server for the Azure Web App (Node runtime, no dependencies).
// Mirrors nginx.conf: index.html is never cached, assets cache for an hour, a directory
// serves its index.html, and any other unknown path falls back to the app's index.html.
// It serves everything under its own directory, so the deploy package must hold only the
// public files: scripts/deploy-azure.sh stages them by name.
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(process.env.SITE_DIR || __dirname);
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};
const ASSET = /\.(css|js|png|jpe?g|gif|svg|webp|ico)$/i;

const fileAt = (target) => {
  try {
    return fs.statSync(target).isFile() ? target : null;
  } catch {
    return null;
  }
};

const send = (req, res, status, file, cacheControl) => {
  res.writeHead(status, {
    "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
};

http
  .createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      return res.end();
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch {
      res.writeHead(400);
      return res.end();
    }
    const target = path.join(ROOT, pathname);
    if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
      res.writeHead(404);
      return res.end();
    }

    const found = fileAt(target);
    if (found) {
      const name = path.basename(found);
      if (name === "index.html") return send(req, res, 200, found, "no-store");
      if (ASSET.test(name)) return send(req, res, 200, found, "public, max-age=3600");
      return send(req, res, 200, found, "no-cache");
    }

    // Unknown assets are a real 404, like nginx's `try_files $uri =404`.
    if (ASSET.test(pathname)) {
      res.writeHead(404);
      return res.end();
    }

    // A directory without its trailing slash redirects (relative, so it survives a proxy).
    const dirIndex = fileAt(path.join(target, "index.html"));
    if (dirIndex && !pathname.endsWith("/")) {
      res.writeHead(301, { Location: `${path.basename(pathname)}/` });
      return res.end();
    }
    send(req, res, 200, dirIndex || path.join(ROOT, "index.html"), "no-store");
  })
  .listen(PORT, () => console.log(`loftools serving ${ROOT} on :${PORT}`));
