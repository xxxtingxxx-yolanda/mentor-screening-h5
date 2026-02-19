/* Minimal static server for local regression checks (no deps). */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 5173);

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function safeJoin(root, urlPath) {
  const clean = urlPath.replace(/^\/+/, "");
  const full = path.join(root, clean);
  const resolvedRoot = path.resolve(root);
  const resolvedFull = path.resolve(full);
  if (!resolvedFull.startsWith(resolvedRoot)) return null;
  return resolvedFull;
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    let pathname = decodeURIComponent(url.pathname || "/");
    if (pathname === "/") pathname = "/index.html";

    const filePath = safeJoin(ROOT, pathname);
    if (!filePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  } catch (err) {
    res.writeHead(500);
    res.end("Server Error");
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Preview server: http://${HOST}:${PORT}`);
});

