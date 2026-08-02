#!/usr/bin/env node
/**
 * Minimal static server for the built Angular app — used to preview or record
 * the production bundle locally without a full dev server.
 *
 *   node serve-dist.mjs [port] [dir]
 *
 * Falls back to index.html for unknown paths so client-side routes resolve.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const PORT = Number(process.argv[2] || 4300);
const ROOT = resolve(process.argv[3] || '../frontend/dist/karan-portfolio');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain',
};

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let file = join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!existsSync(file) || !extname(file)) file = join(ROOT, 'index.html');
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
