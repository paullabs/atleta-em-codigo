// Tira uma foto de uma página do estúdio no Chrome sem janela (GPU) e salva o PNG que a página deixa em window.__png.
// Uso: node esportes/foto.mjs --url "/esportes/laboratorio.html?vistas=0,90" --saida esportes/saida/teste.png
// (rodar da pasta estudio/; o servidor serve a pasta estudio inteira, para usar o three.js do motor3d)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../motor3d/node_modules/playwright-core/index.mjs';
import { opcoesNavegador } from '../ambiente.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const A = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) A[process.argv[i].slice(2)] = process.argv[++i];

const srv = http.createServer((req, res) => {
  const p = path.normalize(path.join(RAIZ, decodeURIComponent(new URL(req.url, 'http://l').pathname)));
  if (!p.startsWith(RAIZ)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(p, (e, d) => {
    if (e) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(d);
  });
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const nav = await chromium.launch(opcoesNavegador());
const pg = await nav.newPage({ viewport: { width: 1200, height: 900 } });
pg.on('pageerror', (e) => console.log('[erro]', e.message));
pg.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning' || A.log) console.log('[pagina]', m.text());
});
const t0 = Date.now();
await pg.goto(`http://127.0.0.1:${srv.address().port}${A.url}`);
await pg.waitForFunction(() => window.__pronto || window.__erro, null, { timeout: Number(A.timeout || 300000) });
const erro = await pg.evaluate(() => window.__erro);
if (erro) {
  console.error('ERRO\n' + erro);
  await nav.close();
  srv.close();
  process.exit(1);
}
const [png, ms, info] = await pg.evaluate(() => [window.__png, window.__ms, window.__info]);
const destino = path.resolve(RAIZ, A.saida);
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, Buffer.from(png.split(',')[1], 'base64'));
console.log(`ok ${destino} (render ${Math.round(ms)} ms, total ${Date.now() - t0} ms)`);
if (info) console.log(JSON.stringify(info, null, 1));
await nav.close();
srv.close();
