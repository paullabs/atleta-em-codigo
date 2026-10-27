// Prepara a anatomia interna do atleta a partir do BodyParts3D e grava dados/interno.bin + dados/interno.json.
//   1. leva cada parte para o nosso corpo (tamanho real; a cabeça cresce EC e a coluna do pescoço acompanha);
//   2. empurra para dentro da pele os vértices que ficaram a menos de 3 mm da superfície;
//   3. calcula os pesos por osso (mistura linear entre ossos vizinhos, por altura) para a malha andar com o esqueleto.
// Uso (da pasta estudio/esportes): node anatomia_interna/preparar.mjs
// Crédito: "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan"
import * as THREE from 'three';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirAnatomia } from '../corpo/anatomia.js';
import { compilarSegmentos } from '../corpo/sdf.js';
import { estadoRepouso, IDX, OSSOS } from '../corpo/esqueleto.js';
import { lerParte } from './bp3d.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SAIDA = path.join(AQUI, 'dados');
fs.mkdirSync(SAIDA, { recursive: true });

// ---- partes (o baço só existe no pacote IS-A de 136 MB, ainda não baixado): de onde vêm, como se vestem e a que ossos se prendem ----
// cadeia: 'cabeca' (rígido na cabeça) | 'tronco' (mistura pelve..peito) | 'coluna' (mistura pelve..cabeça) | 'pelve' (rígido na pelve)
const PARTES = [
  { id: 'cerebro', fma: 'FMA50801', nome: 'Cérebro', cor: '#d9606f', alfa: 1, cadeia: 'cabeca' },
  { id: 'estomago', fma: 'FMA7148', nome: 'Estômago', cor: '#e07a55', alfa: 1, cadeia: 'tronco' },
  { id: 'coracao', fma: 'FMA7088', nome: 'Coração', cor: '#c23b3b', alfa: 1, cadeia: 'tronco' },
  { id: 'figado', fma: 'FMA7197', nome: 'Fígado', cor: '#8a3f2b', alfa: 1, cadeia: 'tronco' },
  { id: 'esofago', fma: 'FMA7131', nome: 'Esôfago', cor: '#d9726a', alfa: 1, cadeia: 'coluna' },
  { id: 'traqueia', fma: 'FMA7394', nome: 'Traqueia', cor: '#9fc3d8', alfa: 1, cadeia: 'coluna' },
  { id: 'pulmao_d', fma: 'FMA7309', nome: 'Pulmão direito', cor: '#7fa3bd', alfa: 0.4, cadeia: 'tronco' },
  { id: 'pulmao_e', fma: 'FMA7310', nome: 'Pulmão esquerdo', cor: '#7fa3bd', alfa: 0.4, cadeia: 'tronco' },
  { id: 'cranio', fma: 'FMA46565', nome: 'Crânio', cor: '#d8cfba', alfa: 0.22, cadeia: 'cabeca' },
  { id: 'mandibula', fma: 'FMA52748', nome: 'Mandíbula', cor: '#d8cfba', alfa: 0.32, cadeia: 'cabeca' },
  { id: 'coluna', fma: 'FMA13478', nome: 'Coluna', cor: '#d2c9b3', alfa: 0.7, cadeia: 'coluna' },
  { id: 'costelas', fma: 'FMA7480', nome: 'Costelas', cor: '#dcd2bc', alfa: 0.45, cadeia: 'tronco' },
  { id: 'esterno', fma: 'FMA7485', nome: 'Esterno', cor: '#dcd2bc', alfa: 0.5, cadeia: 'tronco' },
  { id: 'diafragma', fma: 'FMA13295', nome: 'Diafragma', cor: '#b5605a', alfa: 0.5, cadeia: 'tronco' },
  { id: 'rim_d', fma: 'FMA7204', nome: 'Rim direito', cor: '#a8473f', alfa: 1, cadeia: 'tronco' },
  { id: 'rim_e', fma: 'FMA7205', nome: 'Rim esquerdo', cor: '#a8473f', alfa: 1, cadeia: 'tronco' },
  { id: 'adrenal_d', fma: 'FMA15629', nome: 'Adrenal direita', cor: '#e0b13a', alfa: 1, cadeia: 'tronco' },
  { id: 'adrenal_e', fma: 'FMA15630', nome: 'Adrenal esquerda', cor: '#e0b13a', alfa: 1, cadeia: 'tronco' },
  { id: 'pancreas', fma: 'FMA7198', nome: 'Pâncreas', cor: '#dba37a', alfa: 1, cadeia: 'tronco' },
  { id: 'vesicula', fma: 'FMA7202', nome: 'Vesícula biliar', cor: '#6f9a4c', alfa: 1, cadeia: 'tronco' },
  { id: 'duodeno', fma: 'FMA7206', nome: 'Duodeno', cor: '#e7a58f', alfa: 1, cadeia: 'tronco' },
  { id: 'intestino_delgado', fma: 'FMA7200', nome: 'Intestino delgado', cor: '#e6a08e', alfa: 1, cadeia: 'tronco' },
  { id: 'intestino_grosso', fma: 'FMA7201', nome: 'Intestino grosso', cor: '#c97c62', alfa: 1, cadeia: 'tronco' },
  { id: 'bexiga', fma: 'FMA15900', nome: 'Bexiga', cor: '#e6c36a', alfa: 1, cadeia: 'pelve' },
  { id: 'aorta', fma: 'FMA3734', nome: 'Aorta', cor: '#c43b3b', alfa: 1, cadeia: 'coluna' },
  { id: 'veia_cava_sup', fma: 'FMA4720', nome: 'Veia cava superior', cor: '#4c6fb0', alfa: 1, cadeia: 'coluna' },
  { id: 'veia_cava_inf', fma: 'FMA10951', nome: 'Veia cava inferior', cor: '#4c6fb0', alfa: 1, cadeia: 'coluna' },
  { id: 'medula', fma: 'FMA7647', nome: 'Medula espinhal', cor: '#f1e4a8', alfa: 1, cadeia: 'coluna' },
  { id: 'timo', fma: 'FMA9607', nome: 'Timo', cor: '#e8c7a8', alfa: 1, cadeia: 'tronco' },
  { id: 'olho_d', fma: 'FMA12514', nome: 'Olho direito', cor: '#f4f4ee', alfa: 1, cadeia: 'cabeca' },
  { id: 'olho_e', fma: 'FMA12515', nome: 'Olho esquerdo', cor: '#f4f4ee', alfa: 1, cadeia: 'cabeca' },
  { id: 'pelve', fma: 'FMA9578', nome: 'Pelve', cor: '#d2c9b3', alfa: 0.5, cadeia: 'pelve' },
];
const EC = 1.04; // a cabeça do atleta tem o crânio 4% maior que o do modelo (o atleta tem 1,80 m; o modelo, 1,64 m)
const S = 0.001, TY = 1.795 - 1.6363, TZ = -0.101;
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const CABECA = new Set(['cabeca']);
function mapear(cadeia, X, Y, Z, saida) {
  let x = X * S, y = Z * S + TY, z = -Y * S + TZ;
  // escala da cabeça (e, no pescoço, some com a altura)
  const f = CABECA.has(cadeia) ? 1 : sm(1.42, 1.56, y);
  const e = 1 + (EC - 1) * f;
  x *= e;
  z = -0.015 + (z + 0.015) * e;
  y = 1.795 + (y - 1.795) * e;
  saida.set(x, y, z);
  return saida;
}

// ---- pele (SDF) em grade grossa + cálculo exato perto da superfície ----
const segs = compilarSegmentos(construirAnatomia({ luvas: false, calcao: false })).filter((s) => s.mat === 'pele');
const E0 = estadoRepouso();
const dExato = (p) => { let d = 1e9; for (const s of segs) { const v = s.fn(E0, p); if (v < d) d = v; } return d; };
const G = { x0: -0.45, x1: 0.45, y0: 0.7, y1: 1.9, z0: -0.3, z1: 0.3, h: 0.012 };
G.nx = Math.ceil((G.x1 - G.x0) / G.h) + 1; G.ny = Math.ceil((G.y1 - G.y0) / G.h) + 1; G.nz = Math.ceil((G.z1 - G.z0) / G.h) + 1;
const grade = new Float32Array(G.nx * G.ny * G.nz);
console.log('grade da pele', G.nx, G.ny, G.nz);
{
  const p = new THREE.Vector3();
  for (let k = 0; k < G.nz; k++) for (let j = 0; j < G.ny; j++) for (let i = 0; i < G.nx; i++) grade[(k * G.ny + j) * G.nx + i] = dExato(p.set(G.x0 + i * G.h, G.y0 + j * G.h, G.z0 + k * G.h));
}
const dGrade = (x, y, z) => {
  const fx = (x - G.x0) / G.h, fy = (y - G.y0) / G.h, fz = (z - G.z0) / G.h;
  const i = Math.min(G.nx - 2, Math.max(0, Math.floor(fx))), j = Math.min(G.ny - 2, Math.max(0, Math.floor(fy))), k = Math.min(G.nz - 2, Math.max(0, Math.floor(fz)));
  const tx = Math.min(1, Math.max(0, fx - i)), ty = Math.min(1, Math.max(0, fy - j)), tz = Math.min(1, Math.max(0, fz - k));
  const g = (a, b, c) => grade[((k + c) * G.ny + (j + b)) * G.nx + (i + a)];
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(g(0, 0, 0), g(1, 0, 0), tx), l(g(0, 1, 0), g(1, 1, 0), tx), ty), l(l(g(0, 0, 1), g(1, 0, 1), tx), l(g(0, 1, 1), g(1, 1, 1), tx), ty), tz);
};

// ---- pesos por osso ----
const NOMES_CADEIA = ['pelve', 'lombar', 'toracica', 'peito', 'pescoco', 'cabeca'];
const ALT = NOMES_CADEIA.map((n) => OSSOS[IDX[n]].j.y); // altura da junta de cada osso em repouso
function pesos(cadeia, y) {
  const topo = cadeia === 'tronco' ? 3 : 5; // índice máximo da cadeia
  if (cadeia === 'cabeca') return [[IDX.cabeca, 1]];
  if (cadeia === 'pelve') return [[IDX.pelve, 1]];
  if (y <= ALT[0]) return [[IDX.pelve, 1]];
  if (y >= ALT[topo]) return [[IDX[NOMES_CADEIA[topo]], 1]];
  let k = 0;
  while (y > ALT[k + 1]) k++;
  const t = sm(0, 1, (y - ALT[k]) / (ALT[k + 1] - ALT[k]));
  return [[IDX[NOMES_CADEIA[k]], 1 - t], [IDX[NOMES_CADEIA[k + 1]], t]];
}

// ---- monta os buffers ----
const manifesto = { credito: 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan', ec: EC, partes: [] };
const pos = [], nor = [], osso = [], peso = [];
const idx = [];
let nvTotal = 0;
const v3 = new THREE.Vector3();
const empurradas = {};
for (const parte of PARTES) {
  const m = lerParte(parte.fma);
  const nv = m.v.length / 3;
  const P = new Float32Array(nv * 3);
  const N = new Int8Array(nv * 3);
  const B = new Uint8Array(nv * 4);
  const W = new Uint8Array(nv * 4);
  let empurrou = 0, maior = 0;
  for (let i = 0; i < nv; i++) {
    mapear(parte.cadeia, m.v[3 * i], m.v[3 * i + 1], m.v[3 * i + 2], v3);
    // empurra para dentro se ficou a menos de 3 mm da pele
    let d = dGrade(v3.x, v3.y, v3.z);
    if (d > -0.03) {
      d = dExato(v3);
      if (d > -0.003) {
        const h = 0.002;
        const g = new THREE.Vector3(dExato(new THREE.Vector3(v3.x + h, v3.y, v3.z)) - dExato(new THREE.Vector3(v3.x - h, v3.y, v3.z)), dExato(new THREE.Vector3(v3.x, v3.y + h, v3.z)) - dExato(new THREE.Vector3(v3.x, v3.y - h, v3.z)), dExato(new THREE.Vector3(v3.x, v3.y, v3.z + h)) - dExato(new THREE.Vector3(v3.x, v3.y, v3.z - h))).normalize();
        const passo = d + 0.003;
        v3.addScaledVector(g, -passo);
        empurrou++; maior = Math.max(maior, passo);
      }
    }
    P[3 * i] = v3.x; P[3 * i + 1] = v3.y; P[3 * i + 2] = v3.z;
    // normal: mesma rotação dos eixos (x, z, -y)
    const nx = m.n[3 * i], ny = m.n[3 * i + 1], nz = m.n[3 * i + 2];
    const l = Math.hypot(nx, ny, nz) || 1;
    N[3 * i] = Math.round((nx / l) * 127); N[3 * i + 1] = Math.round((nz / l) * 127); N[3 * i + 2] = Math.round((-ny / l) * 127);
    const w = pesos(parte.cadeia, v3.y);
    for (let k = 0; k < 4; k++) { B[4 * i + k] = k < w.length ? w[k][0] : 0; W[4 * i + k] = k < w.length ? Math.round(w[k][1] * 255) : 0; }
  }
  empurradas[parte.id] = { empurrou, maior_mm: +(maior * 1000).toFixed(1) };
  console.log(parte.id.padEnd(10), String(nv).padStart(7), 'vértices', String(m.f.length / 3).padStart(7), 'triângulos | empurrados', empurrou, 'maior', (maior * 1000).toFixed(1), 'mm');
  pos.push(P); nor.push(N); osso.push(B); peso.push(W);
  const f = new Uint32Array(m.f.length);
  for (let i = 0; i < f.length; i++) f[i] = m.f[i] + nvTotal;
  idx.push(f);
  manifesto.partes.push({ id: parte.id, nome: parte.nome, cor: parte.cor, alfa: parte.alfa, v0: nvTotal, nv, i0: idx.slice(0, -1).reduce((s, a) => s + a.length, 0), ni: f.length });
  nvTotal += nv;
}
const cat = (arrs) => { const n = arrs.reduce((s, a) => s + a.length, 0); const out = new arrs[0].constructor(n); let o = 0; for (const a of arrs) { out.set(a, o); o += a.length; } return out; };
const PP = cat(pos), NN = cat(nor), BB = cat(osso), WW = cat(peso), II = cat(idx);
manifesto.nvTotal = nvTotal; manifesto.niTotal = II.length;
const antes = PP.byteLength + NN.byteLength + BB.byteLength + WW.byteLength;
const pad = (4 - (antes % 4)) % 4; // os triângulos (Uint32) precisam começar em múltiplo de 4 bytes
manifesto.camadas = { pos: [0, PP.byteLength], nor: [PP.byteLength, NN.byteLength], osso: [PP.byteLength + NN.byteLength, BB.byteLength], peso: [PP.byteLength + NN.byteLength + BB.byteLength, WW.byteLength], idx: [antes + pad, II.byteLength] };
const bin = Buffer.concat([PP, NN, BB, WW, Buffer.alloc(pad), II].map((a) => (Buffer.isBuffer(a) ? a : Buffer.from(a.buffer, a.byteOffset, a.byteLength))));
fs.writeFileSync(path.join(SAIDA, 'interno.bin'), bin);
fs.writeFileSync(path.join(SAIDA, 'interno.json'), JSON.stringify(manifesto, null, 1));
console.log('gravado', (bin.length / 1e6).toFixed(1), 'MB;', nvTotal, 'vértices;', II.length / 3, 'triângulos');
