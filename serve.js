// Static file server for the VPS, which runs no nginx.
//
// Mirrors the nginx rules documented in deploy.md:
//   try_files $uri $uri.html $uri/index.html =404
// so /work/eduledger resolves to work/eduledger.html and matches the
// canonical URLs in the pages. No dependencies, so there is nothing to
// install on the server and nothing to keep up to date.
//
//   PORT=3005 node serve.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3005;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
};

// Only these may be served. The repo also holds CLAUDE.md, deploy.md, this
// file and .git, none of which are part of the site. An allowlist means a
// file added to the repo later is private until it is named here, rather
// than public the moment it lands.
const PUBLIC = new Set(['index.html', 'favicon.svg', 'robots.txt', 'sitemap.xml', 'work', 'assets']);

function resolve(urlPath) {
  // Decode, drop the query, and refuse anything that climbs out of ROOT.
  let p;
  try {
    p = decodeURIComponent(urlPath.split('?')[0]);
  } catch (e) {
    return null;
  }
  if (p.indexOf('\0') !== -1) return null;

  const norm = path.normalize(p).split(path.sep).join('/').replace(/^\/+/, '');

  // No dot segments anywhere, so .git and friends are unreachable by name.
  const segs = norm.split('/').filter(Boolean);
  if (segs.some(s => s.startsWith('.'))) return null;
  if (segs.length && !PUBLIC.has(segs[0])) return null;

  const full = path.join(ROOT, norm);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;

  const candidates = [full, full + '.html', path.join(full, 'index.html')];
  for (const c of candidates) {
    if (c !== full && !c.startsWith(ROOT + path.sep)) continue;
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch (e) {
      // try the next candidate
    }
  }
  return null;
}

function cacheFor(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  if (rel.startsWith('assets/')) return 'public, max-age=2592000, immutable';
  if (file.endsWith('.html')) return 'no-cache';
  return 'public, max-age=3600';
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Allow': 'GET, HEAD' });
    return res.end('Method not allowed');
  }

  const file = resolve(req.url);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }

  const ext = path.extname(file).toLowerCase();
  const stat = fs.statSync(file);

  res.writeHead(200, {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': cacheFor(file),
    'X-Content-Type-Options': 'nosniff',
  });

  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('portfolio listening on http://127.0.0.1:' + PORT);
});
