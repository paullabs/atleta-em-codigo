// Auditoria de colisões da aula de boxe (ver auditoria_base.js). Uso (da pasta estudio/):
//   node esportes/auditar.mjs [--passo 0.0333] [--pontos 700] [--saida esportes/saida/colisoes.json] [--roteiro roteiros/minha_aula.json]
// --roteiro: audita a aula da pessoa em vez da aula de teste: um arquivo .json (esportes/ROTEIRO.md, sem código) ou um módulo .js que
// exporta o roteiro (um array de blocos, como AULA_TESTE em boxe/aula.js) como `export default` ou como o primeiro array que ele exporta.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { THREE, A, PASSO, TOQUE, CHAO, segs, nomes, amostras, ossoDe, livre, par, paraMundo } from './auditoria_base.js';
import { montarAula } from './boxe/aula.js';

let roteiro;
if (A.roteiro) {
  if (/\.json$/i.test(String(A.roteiro))) {
    const { lerRoteiroOuSair } = await import('./roteiro.mjs');
    const r = lerRoteiroOuSair(A.roteiro);
    for (const a of r.avisos) console.log('[aviso]', a);
    roteiro = r.roteiro;
  } else {
    const mod = await import(pathToFileURL(path.resolve(A.roteiro)).href).catch((e) => {
      console.error(`--roteiro ${A.roteiro}: não consegui abrir como módulo JavaScript (${String(e.message).split('\n')[0]})`);
      process.exit(1);
    });
    roteiro = mod.default ?? Object.values(mod).find(Array.isArray);
    if (!Array.isArray(roteiro)) {
      console.error(`--roteiro ${A.roteiro}: o arquivo precisa exportar o roteiro (um array de blocos, como AULA_TESTE em boxe/aula.js)`);
      process.exit(1);
    }
  }
}
const aula = montarAula(roteiro);
const pior = {};
let chao = { afunda: 0, t: 0, seg: '' };
const t0 = Date.now();
let quadros = 0;
for (let T = 0; T <= aula.duracao; T += PASSO) {
  const E = aula.estadoEm(T);
  quadros++;
  // esfera posada de cada segmento para descartar pares longe
  const esf = segs.map((s, i) => {
    const pts = amostras[i].map((p) => paraMundo(E, ossoDe[i], p));
    const box = new THREE.Box3().setFromPoints(pts);
    return { pts, box };
  });
  for (let i = 0; i < segs.length; i++) {
    // chão: pés e dedos
    if (/^(pe|dedos)_/.test(segs[i].nome)) {
      for (const p of esf[i].pts) if (-p.y > chao.afunda) chao = { afunda: -p.y, t: T, seg: segs[i].nome };
    }
    for (let j = 0; j < segs.length; j++) {
      if (i === j || livre.has(par(nomes[i], nomes[j]))) continue;
      if (!esf[i].box.clone().expandByScalar(0.02).intersectsBox(esf[j].box)) continue;
      let min = Infinity;
      for (const p of esf[i].pts) {
        if (!esf[j].box.clone().expandByScalar(0.01).containsPoint(p)) continue;
        const d = segs[j].fn(E, p);
        if (d < min) min = d;
      }
      if (min < -TOQUE) {
        const k = par(nomes[i], nomes[j]);
        if (!pior[k] || min < pior[k].d) pior[k] = { d: min, T, bloco: aula.blocoEm(T).titulo };
      }
    }
  }
}
// nos blocos com dois lutadores: menor distância entre os dois corpos (pontos do vermelho medidos no azul)
let entreDois = { d: Infinity, T: 0 };
for (let T = 0; T <= aula.duracao; T += PASSO) {
  const Eb = aula.estadoDuplaEm(T);
  if (!Eb) continue;
  const E = aula.estadoEm(T);
  for (let i = 0; i < segs.length; i++) {
    for (const p0 of amostras[i]) {
      const p = paraMundo(E, ossoDe[i], p0);
      for (let j = 0; j < segs.length; j++) {
        // só mede de perto: a junta da parte do azul tem de estar a menos de 90 cm do ponto
        const c = Eb.P[ossoDe[j]];
        if (c.distanceTo(p) > 0.9) continue;
        const d = segs[j].fn(Eb, p);
        if (d < entreDois.d) entreDois = { d, T };
      }
    }
  }
}

const lista = Object.entries(pior)
  .map(([k, v]) => ({ par: k, profundidade_cm: +(-v.d * 100).toFixed(2), t: +v.T.toFixed(2), bloco: v.bloco }))
  .sort((a, b) => b.profundidade_cm - a.profundidade_cm);
const rel = { entre_os_dois_cm: Number.isFinite(entreDois.d) ? +(entreDois.d * 100).toFixed(1) : null, entre_os_dois_t: +entreDois.T.toFixed(2), quadros, passo: PASSO, pontos: amostras.reduce((n, a) => n + a.length, 0), tolerancia_toque_cm: TOQUE * 100, atravessa: lista.length, pares: lista, chao: { afunda_cm: +(chao.afunda * 100).toFixed(2), t: +chao.t.toFixed(2), segmento: chao.seg, ok: chao.afunda <= CHAO }, segundos: (Date.now() - t0) / 1000 };
console.log(`quadros ${quadros} · atravessa: ${lista.length} pares · chão: ${rel.chao.afunda_cm} cm (${rel.chao.ok ? 'ok' : 'afunda'}) · ${rel.segundos.toFixed(1)} s`);
if (rel.entre_os_dois_cm != null) console.log(`dois lutadores: menor distância entre os corpos ${rel.entre_os_dois_cm} cm (t=${rel.entre_os_dois_t})`);
for (const p of lista.slice(0, 20)) console.log(`  ${p.par.padEnd(30)} ${String(p.profundidade_cm).padStart(5)} cm  t=${p.t}  ${p.bloco}`);
if (A.saida) {
  fs.mkdirSync(path.dirname(path.resolve(A.saida)), { recursive: true });
  fs.writeFileSync(A.saida, JSON.stringify(rel, null, 1));
}
