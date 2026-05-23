#!/usr/bin/env node
/**
 * Called from GitHub Actions before `vercel build`.
 * Writes VERCEL_TARGET_API_URL into Angular environment.prod.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const repoRoot = path.join(__dirname, '..');
const target = path.join(repoRoot, 'frontend', 'src', 'environments', 'environment.prod.ts');

let api = (process.env.API_URL || '').trim();
if (!api) {
  console.log('API_URL unset; leaving environment.prod.ts unchanged');
  process.exit(0);
}
if (!api.endsWith('/api')) {
  api = api.replace(/\/+$/, '') + '/api';
}

let text = fs.readFileSync(target, 'utf8');
const next = text.replace(/apiUrl:\s*['"][^'"]*['"]/, `apiUrl: '${api.replace(/'/g, "\\'")}'`);
if (next === text) {
  console.error('Could not find apiUrl pattern in environment.prod.ts');
  process.exit(1);
}
fs.writeFileSync(target, next, 'utf8');
console.log('Patched apiUrl for CI build:', api);
