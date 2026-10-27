// Mede quanto de cada parte cabe dentro da pele do atleta (repouso) e procura o ajuste do tronco.
// Transformação: tamanho real (mm -> m), cabeça escalada (ESC_CABECA) e tronco com um ajuste (kx, kz, dz) que some no pescoço.
import * as THREE from 'three';
import { construirAnatomia } from '../corpo/anatomia.js';
import { compilarSegmentos } from '../corpo/sdf.js';
import { estadoRepouso } from '../corpo/esqueleto.js';
import { lerParte } from './bp3d.mjs';

export const PARTES = { cranio: 'FMA46565', mandibula: 'FMA52748', cerebro: 'FMA50801', coluna: 'FMA13478', costelas: 'FMA7480', esterno: 'FMA7485', pelve: 'FMA9578', estomago: 'FMA7148', esofago: 'FMA7131', coracao: 'FMA7088', figado: 'FMA7197', pulmao_d: 'FMA7309', pulmao_e: 'FMA7310', traqueia: 'FMA7394' };
const CABECA = ['cranio', 'mandibula', 'cerebro'];
const S = 0.001, TY = 1.795 - 1.6363, TZ = -0.101;
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function mapa(nome, X, Y, Z, P) {
  const p = new THREE.Vector3(X * S, Z * S + TY, -Y * S + TZ);
  if (CABECA.includes(nome)) {
    // cabeça: escala uniforme em torno do topo do crânio e do centro dela
    p.x *= P.ec; p.z = -0.015 + (p.z + 0.015) * P.ec; p.y = 1.795 + (p.y - 1.795) * P.ec;
  } else {
    const b = 1 - sm(1.42, 1.56, p.y);
    p.x *= 1 + (P.kx - 1) * b;
    p.z = P.zc + (p.z - P.zc) * (1 + (P.kz - 1) * b) + P.dz * b;
  }
  return p;
}
const segs = compilarSegmentos(construirAnatomia({ luvas: false, calcao: false }));
const pele = segs.filter((s) => s.mat === 'pele');
const E = estadoRepouso();
export const dist = (p) => { let d = 1e9; for (const s of pele) { const v = s.fn(E, p); if (v < d) d = v; } return d; };

export function medir(nome, P, amostras = 4000) {
  const m = lerParte(PARTES[nome]);
  const nv = m.v.length / 3;
  const passo = Math.max(1, Math.floor(nv / amostras));
  let pior = -1e9, n = 0, fora = 0;
  for (let i = 0; i < nv; i += passo) {
    const d = dist(mapa(nome, m.v[3 * i], m.v[3 * i + 1], m.v[3 * i + 2], P));
    pior = Math.max(pior, d); n++; if (d > -0.004) fora++;
  }
  return { pior, fora: fora / n, nv };
}

if (process.argv[1].endsWith('analisar.mjs')) {
  const base = { ec: Number(process.argv[2] || 1), kx: 1, kz: 1, dz: 0, zc: -0.012 };
  console.log('cabeça escala', base.ec);
  for (const nome of Object.keys(PARTES)) {
    const r = medir(nome, base);
    console.log(nome.padEnd(10), 'fora/<4mm:', (r.fora * 100).toFixed(1).padStart(5) + '%', ' pior', (r.pior * 1000).toFixed(0).padStart(4), 'mm');
  }
  // busca do ajuste do tronco
  const tronco = ['costelas', 'esterno', 'pelve', 'estomago', 'figado', 'coracao', 'coluna', 'pulmao_d', 'pulmao_e'];
  let melhor = null;
  for (const kz of [1, 0.97, 0.94, 0.91, 0.88]) for (const dz of [0, -0.004, -0.008, -0.012, -0.016]) for (const kx of [1, 0.98, 0.96]) {
    const P = { ...base, kx, kz, dz };
    let w = -1e9;
    for (const nome of tronco) w = Math.max(w, medir(nome, P, 1200).pior);
    const custo = w + (1 - kz) * 0.1 + (1 - kx) * 0.1 + Math.abs(dz) * 0.3;
    if (!melhor || custo < melhor.custo) melhor = { kx, kz, dz, pior: w, custo };
  }
  console.log('melhor ajuste do tronco', melhor);
}
