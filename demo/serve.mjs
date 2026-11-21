// A tiny static server for the demo, so nothing needs installing: node demo/serve.mjs, then open the printed address
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.map': 'application/json', '.css': 'text/css' };
const port = Number(process.env.PORT ?? 5173);

createServer(async (request, response) => {
  let path = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://x').pathname));
  if (!path.startsWith(resolve(root) + sep)) return response.writeHead(403).end();
  if (request.url.split('?')[0].endsWith('/')) path += sep + 'index.html';
  try {
    const body = await readFile(path);
    response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Demo: http://localhost:${port}/demo/`));
