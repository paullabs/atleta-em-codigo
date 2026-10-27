// Render do vídeo-aula no Chrome sem janela (GPU), quadro a quadro, direto para o ffmpeg.
// Rodar da pasta estudio/:
//   node esportes/render.mjs --saida esportes/saida/boxe_teste.mp4 [--de 0 --ate 10] [--am 6]
//   node esportes/render.mjs --quadros 1.2,5.0,9.4 --png esportes/saida/q/q_{t}.png
//   node esportes/render.mjs --folha esportes/saida/folha_quadros.jpg --cada 1.0 (um quadro por intervalo, em grade)
//   --folga 0.6: depois de cada quadro espera 60% do tempo que ele levou (a placa de vídeo respira e o computador
//   continua leve para quem está usando; o render fica mais lento)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from '../motor3d/node_modules/playwright-core/index.mjs';
import { opcoesNavegador, FFMPEG } from '../ambiente.mjs';
import { instalarMarca } from '../marca_pagina.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const A = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) A[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;

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
const pg = await nav.newPage({ viewport: { width: 600, height: 1000 } });
pg.on('pageerror', (e) => console.log('[erro]', e.message));
pg.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('404')) console.log('[pagina]', m.text());
});
// --leve (computador travando): metade do tamanho, desfoque simples e uma pausa entre os quadros; os valores dados à mão vencem
const LEVE = !!A.leve;
const w = A.w || (LEVE ? 540 : 1080);
const h = A.h || (LEVE ? 960 : 1920);
await pg.goto(`http://127.0.0.1:${srv.address().port}/esportes/${A.pagina || 'video.html'}?w=${w}&h=${h}&am=${A.am || (LEVE ? 1 : 6)}`);
await pg.waitForFunction(() => window.__pronto || window.__erro, null, { timeout: 300000 });
const erro = await pg.evaluate(() => window.__erro);
if (erro) {
  console.error('ERRO NA PÁGINA\n' + erro);
  await nav.close();
  srv.close();
  process.exit(1);
}
await instalarMarca(pg); // marca d'água do canal em todo quadro (ver marca_pagina.mjs)
const { duracao, fps, blocos } = await pg.evaluate(() => ({ duracao: window.__motor.duracao, fps: window.__motor.fps, blocos: window.__motor.blocos }));
console.log(`duração ${duracao.toFixed(2)} s, ${fps} qps, ${blocos.length} blocos`);
if (A.info) {
  fs.mkdirSync(path.dirname(path.join(RAIZ, A.info)), { recursive: true });
  fs.writeFileSync(path.join(RAIZ, A.info), JSON.stringify({ duracao, fps, blocos }, null, 1));
}
async function quadro(t, tipo = 'image/png') {
  const url = await pg.evaluate(([tt, tp]) => {
    window.__motor.renderAt(tt);
    return window.__motor.capturar(tp);
  }, [t, tipo]);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}
if (A.quadros) {
  for (const t of String(A.quadros).split(',').map(Number)) {
    const t0 = Date.now();
    const buf = await quadro(t);
    const destino = path.join(RAIZ, String(A.png).replace('{t}', t.toFixed(2)));
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, buf);
    console.log(`quadro ${t.toFixed(2)} s -> ${destino} (${Date.now() - t0} ms)`);
  }
}
if (A.folha) {
  // grade de quadros reduzidos (um a cada --cada segundos), montada pelo ffmpeg
  const cada = Number(A.cada || 1);
  const dir = path.join(RAIZ, 'esportes/saida/_folha_tmp');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (let t = Number(A.de || 0) + cada / 2; t < Number(A.ate || duracao); t += cada) {
    fs.writeFileSync(path.join(dir, `q_${String(n).padStart(4, '0')}.jpg`), await quadro(t, 'image/jpeg'));
    n++;
  }
  const col = Number(A.colunas || 8);
  const lin = Math.ceil(n / col);
  await new Promise((r) => spawn(FFMPEG, ['-y', '-loglevel', 'error', '-i', path.join(dir, 'q_%04d.jpg'), '-vf', `scale=270:-1,tile=${col}x${lin}:padding=6:color=0x15171a`, '-frames:v', '1', path.join(RAIZ, A.folha)], { stdio: 'inherit' }).on('close', r));
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('folha', A.folha, n, 'quadros');
}
if (A.saida) {
  fs.mkdirSync(path.dirname(path.join(RAIZ, A.saida)), { recursive: true });
  const f0 = Math.round(Number(A.de || 0) * fps);
  const f1 = Math.round(Number(A.ate || duracao) * fps);
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(RAIZ, A.saida)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  const folga = Number(A.folga ?? (LEVE ? 0.5 : 0));
  for (let f = f0; f < f1; f++) {
    const tq = Date.now();
    const buf = await quadro(f / fps);
    if (folga > 0) await new Promise((r) => setTimeout(r, (Date.now() - tq) * folga));
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 60 === 0) console.log(`quadro ${f}/${f1} em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`vídeo ${A.saida}: ${f1 - f0} quadros em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
await nav.close();
srv.close();
