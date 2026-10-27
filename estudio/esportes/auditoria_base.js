// Base comum das auditorias de colisão (aula e reels): pontos na superfície de cada parte, pares que podem se tocar.
// Auditoria de colisões do atleta, quadro a quadro, com profundidade medida.
// Pontos espalhados na superfície de cada segmento (no repouso) andam com o osso; em cada quadro mede-se a
// distância deles até cada outro segmento que não se funde com ele. Negativo = dentro.
// Regras do estúdio: encostar vale até 6 mm; o pé não afunda no chão (até 3 mm).
// Uso (da pasta estudio/): node esportes/auditar.mjs [--passo 0.0333] [--saida esportes/saida/colisoes.json]
import * as THREE from 'three';
import fs from 'node:fs';
import { construirAnatomia } from './corpo/anatomia.js';
import { compilarSegmentos } from './corpo/sdf.js';
import { OSSOS, IDX } from './corpo/esqueleto.js';

const A = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) A[process.argv[i].slice(2)] = process.argv[++i];
const PASSO = Number(A.passo || 1 / 30);
const TOQUE = 0.006;
const CHAO = 0.003;

const anat = construirAnatomia();
const segs = compilarSegmentos(anat);
const nomes = segs.map((s) => s.nome);
const iseg = Object.fromEntries(nomes.map((n, i) => [n, i]));

// pares que podem se tocar por construção: os que se fundem, a mesma cadeia do membro e o equipamento com o corpo que veste
const cadeia = (n) => {
  const m = n.match(/^(clav|braco|antebraco|torcao|luva|faixa|coxa|canela|pe|dedos|short_perna)_(e|d)$/);
  if (!m) return null;
  const braco = ['clav', 'braco', 'antebraco', 'torcao', 'luva', 'faixa'].includes(m[1]);
  return `${braco ? 'braco' : 'perna'}_${m[2]}`;
};
const livre = new Set();
const par = (a, b) => [a, b].sort().join('|');
for (const [a, b] of anat.pares) livre.add(par(a, b));
for (const a of nomes) for (const b of nomes) if (a !== b && cadeia(a) && cadeia(a) === cadeia(b)) livre.add(par(a, b));
const veste = { short_tronco: ['pelve', 'lombar', 'coxa_e', 'coxa_d', 'toracica'], short_cos: ['lombar', 'pelve', 'toracica', 'short_tronco', 'short_perna_e', 'short_perna_d'], short_perna_e: ['coxa_e', 'pelve', 'short_tronco', 'short_perna_d'], short_perna_d: ['coxa_d', 'pelve', 'short_tronco', 'short_perna_e'] };
for (const [g, lista] of Object.entries(veste)) for (const b of lista) livre.add(par(g, b));
for (const s of ['e', 'd']) {
  livre.add(par(`clav_${s}`, 'toracica'));
  livre.add(par(`braco_${s}`, 'pescoco'));
  livre.add(par(`coxa_${s}`, 'lombar'));
}
// o calção é tecido: encosta e dobra contra a barriga quando o corpo dobra (ajoelhar)
for (const s of ['e', 'd']) for (const b of ['lombar', 'toracica', 'pelve', 'peito']) livre.add(par(`short_perna_${s}`, b));
for (const s of ['e', 'd']) livre.add(par('short_cos', `coxa_${s}`)); // cós do calção contra a coxa quando o corpo dobra
livre.add(par('cabeca', 'peito'));
livre.add(par('pescoco', 'toracica'));
livre.add(par('lombar', 'peito'));
livre.add(par('pelve', 'toracica'));

// amostras na superfície de cada segmento (repouso), projetadas pelo gradiente da própria distância
function amostrar(seg, n = Number(A.pontos || 700)) {
  const pts = [];
  const sdf = (p) => seg.fn(REPOUSO, p);
  const grad = (p) => {
    const h = 0.0005;
    const g = new THREE.Vector3(sdf(p.clone().setX(p.x + h)) - sdf(p.clone().setX(p.x - h)), sdf(p.clone().setY(p.y + h)) - sdf(p.clone().setY(p.y - h)), sdf(p.clone().setZ(p.z + h)) - sdf(p.clone().setZ(p.z - h)));
    return g.normalize();
  };
  const prims = anat.segmentos[iseg[seg.nome]].prims.filter((p) => p.op !== 'sub' && p.op !== 'corte');
  let semente = 1;
  const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < n * 3 && pts.length < n; k++) {
    const pr = prims[k % prims.length];
    let c;
    let r;
    if (pr.t === 'E' || pr.t === 'B' || pr.t === 'Y') {
      c = new THREE.Vector3(...pr.c);
      r = pr.r ? Math.max(...[].concat(pr.r)) : 0.05;
    } else {
      const a = new THREE.Vector3(...pr.a);
      const b = new THREE.Vector3(...pr.b);
      c = a.lerp(b, rnd());
      r = Math.max(pr.ra, pr.rb);
    }
    const dir = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
    const p = c.clone().addScaledVector(dir, r);
    for (let it = 0; it < 8; it++) {
      const d = sdf(p);
      if (Math.abs(d) < 0.0003) break;
      p.addScaledVector(grad(p), -d);
    }
    if (Math.abs(sdf(p)) < 0.0008) pts.push(p);
  }
  return pts;
}
const REPOUSO = { R: OSSOS.map(() => new THREE.Quaternion()), P: OSSOS.map((o) => o.j.clone()) };
const amostras = segs.map((s) => amostrar(s));
if (A.contar) for (const [i, s] of segs.entries()) console.log(s.nome.padEnd(16), amostras[i].length);
const ossoDe = segs.map((s) => IDX[s.osso]);

function paraMundo(E, ib, p) {
  return p.clone().sub(OSSOS[ib].j).applyQuaternion(E.R[ib]).add(E.P[ib]);
}
export { THREE, A, PASSO, TOQUE, CHAO, segs, nomes, amostras, ossoDe, livre, par, paraMundo, iseg, anat };
