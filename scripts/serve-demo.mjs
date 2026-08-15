/* Serves the demo preview page over HTTP on :4200.
 *
 * Opening the file directly with file:// would send an Origin of "null", which
 * the API's CORS allowlist rejects. Port 4200 is already trusted in the
 * backend's development origins, so serving from here needs no CORS change. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 4200;

createServer(async (req, res) => {
  const path = (req.url || '/').split('?')[0];
  const file = path === '/' ? 'demo-preview.html' : path.replace(/^\/+/, '');

  // Only ever serve the one page — this is a local preview, not a file server.
  if (file !== 'demo-preview.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found. Open http://localhost:4200/');
  }

  try {
    const html = await readFile(join(here, 'demo-preview.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(err));
  }
}).listen(PORT, () => {
  console.log(`Demo preview → http://localhost:${PORT}/`);
});
