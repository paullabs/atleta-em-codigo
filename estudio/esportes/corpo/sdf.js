// Gera o GLSL do corpo a partir da anatomia e avalia a mesma distância em JS (auditorias).
// O shader recebe, por osso, a matriz mundo -> repouso (uB), a junta posada (uJ) e, por segmento,
// a esfera que o envolve já posada (uS). Longe da esfera usa-se só a distância até ela (mais rápido).
import * as THREE from 'three';
import { OSSOS, IDX } from './esqueleto.js';
import { MATERIAIS, IDM, ZONAS } from './anatomia.js';

const f = (x) => {
  const s = Number(x).toFixed(5);
  return s.includes('.') ? s : s + '.0';
};
const v3 = (v) => `vec3(${f(v[0])},${f(v[1])},${f(v[2])})`;

function rotInv(rot) {
  if (!rot || (rot[0] === 0 && rot[1] === 0 && rot[2] === 0)) return null;
  const e = new THREE.Euler(...rot.map(THREE.MathUtils.degToRad), 'XYZ');
  const m = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(e)).transpose();
  return m;
}
const m3 = (m) => `mat3(${m.elements.map(f).join(',')})`;

// expressão GLSL da primitiva sobre o ponto q (repouso)
function exprPrim(pr) {
  const R = rotInv(pr.rot);
  const loc = (c) => (R ? `${m3(R)}*(q-${v3(c)})` : `(q-${v3(c)})`);
  switch (pr.t) {
    case 'E':
      return `sdElip(${loc(pr.c)},${v3(pr.r)})`;
    case 'C':
      return `sdCone(q,${v3(pr.a)},${v3(pr.b)},${f(pr.ra)},${f(pr.rb)})`;
    case 'B':
      return `sdCaixa(${loc(pr.c)},${v3(pr.h)},${f(pr.rr)})`;
    case 'T': {
      const a = new THREE.Vector3(...pr.a);
      const b = new THREE.Vector3(...pr.b);
      const dir = b.clone().sub(a).normalize();
      const a2 = a.clone().addScaledVector(dir, pr.rr);
      const b2 = b.clone().addScaledVector(dir, -pr.rr);
      return `(sdTronco(q,${v3(a2.toArray())},${v3(b2.toArray())},${f(pr.ra - pr.rr)},${f(pr.rb - pr.rr)})-${f(pr.rr)})`;
    }
    case 'Y':
      return `sdCilE(${loc(pr.c)},vec2(${f(pr.r[0])},${f(pr.r[1])}),${f(pr.h)},${f(pr.rr)})`;
    case 'P':
      return `(dot(q,${v3(pr.n)})-${f(pr.d)})`;
  }
  throw new Error('primitiva desconhecida ' + pr.t);
}

// esfera que envolve a primitiva (repouso)
function esferaPrim(pr) {
  const V = (a) => new THREE.Vector3(...a);
  switch (pr.t) {
    case 'E':
      return [V(pr.c), Math.max(...pr.r)];
    case 'B':
      return [V(pr.c), V(pr.h).length() + pr.rr];
    case 'Y':
      return [V(pr.c), Math.hypot(Math.max(...pr.r), pr.h)];
    case 'C':
    case 'T': {
      const a = V(pr.a);
      const b = V(pr.b);
      return [a.clone().add(b).multiplyScalar(0.5), a.distanceTo(b) / 2 + Math.max(pr.ra, pr.rb)];
    }
  }
  return null;
}

export function esferaSegmento(seg) {
  const es = seg.prims.filter((p) => p.op !== 'sub' && p.op !== 'corte').map(esferaPrim).filter(Boolean);
  const box = new THREE.Box3();
  for (const [c, r] of es) {
    box.expandByPoint(c.clone().addScalar(-r));
    box.expandByPoint(c.clone().addScalar(r));
  }
  const ctr = box.getCenter(new THREE.Vector3());
  let raio = 0;
  for (const [c, r] of es) raio = Math.max(raio, c.distanceTo(ctr) + r);
  return [ctr, raio + 0.01];
}

// cinco blocos do corpo (tronco com cabeça, cada braço, cada perna): longe do bloco, nenhuma parte dele é avaliada
export function blocosDoCorpo(segs) {
  const g = { tronco: [], braco_e: [], braco_d: [], perna_e: [], perna_d: [] };
  segs.forEach((s, i) => {
    const b = s.nome.match(/^(braco|antebraco|torcao|luva|faixa)_(e|d)$/);
    const pn = s.nome.match(/^(coxa|canela|pe|dedos|short_perna)_(e|d)$/);
    if (b) g[`braco_${b[2]}`].push(i);
    else if (pn) g[`perna_${pn[2]}`].push(i);
    else g.tronco.push(i);
  });
  return Object.values(g);
}

// código de um lutador (L = índice do lutador): cada um tem os seus ossos, esferas, blocos e materiais (5 por lutador)
function glslLutador(anat, L) {
  const segs = anat.segmentos;
  const iseg = Object.fromEntries(segs.map((s, i) => [s.nome, i]));
  const blocos = blocosDoCorpo(segs);
  const nb = OSSOS.length;
  const ns = segs.length;
  const ob = L * nb; // deslocamento nos ossos
  const os = L * ns; // nas esferas das partes
  const og = L * blocos.length; // nos blocos
  const om = L * 5; // nos materiais
  let fun = '';
  for (const [i, s] of segs.entries()) {
    const ib = IDX[s.osso];
    let c = `float S${L}_${i}(vec3 p){ // ${s.nome}\n  vec3 q=(uB[${ob + ib}]*vec4(p,1.0)).xyz;\n`;
    s.prims.forEach((pr, j) => {
      const e = exprPrim(pr);
      const k = f(pr.k ?? s.k);
      if (j === 0) c += `  float d=${e};\n`;
      else if (pr.op === 'sub') c += `  d=smax(d,-${e},${k});\n`;
      else if (pr.op === 'corte') c += `  d=smax(d,${e},${k});\n`;
      else c += `  d=smin(d,${e},${k});\n`;
    });
    fun += c + '  return d;\n}\n';
  }
  // mapa do lutador: distância e material
  let mapa = `float mapa${L}(vec3 p, out int mat){\n`;
  mapa += '  ' + segs.map((_, i) => `float s${i};`).join(' ') + '\n';
  blocos.forEach((lista, g) => {
    mapa += `  { float gb=length(p-uG[${og + g}].xyz)-uG[${og + g}].w;\n    if(gb>0.06){ ${lista.map((i) => `s${i}=gb;`).join(' ')} }\n    else {\n`;
    for (const i of lista) mapa += `      { float b=length(p-uS[${os + i}].xyz)-uS[${os + i}].w; s${i}= b>0.06 ? b : S${L}_${i}(p); }\n`;
    mapa += '    }\n  }\n';
  });
  const pele = segs.filter((s) => s.mat === 'pele');
  mapa += '  float pele=1e3;\n';
  for (const s of pele) mapa += `  pele=min(pele,s${iseg[s.nome]});\n`;
  for (const [a, b, k, osso, r0, r1] of anat.pares) {
    mapa += `  if(min(s${iseg[a]},s${iseg[b]})<${f(2.5 * k)}) pele=min(pele,smin(s${iseg[a]},s${iseg[b]},${f(k)}*(1.0-smoothstep(${f(r0)},${f(r1)},length(p-uJ[${ob + IDX[osso]}])))));\n`;
  }
  const porMat = {};
  for (const s of segs) if (s.mat !== 'pele') (porMat[s.mat] ||= []).push(s.nome);
  const ja = new Set();
  mapa += `  float d=pele; mat=${om};\n`;
  for (const g of anat.grupos) {
    let e = `s${iseg[g.segs[0]]}`;
    for (const n of g.segs.slice(1)) e = `smin(${e},s${iseg[n]},${f(g.k)})`;
    g.segs.forEach((n) => ja.add(n));
    mapa += `  { float g=${e}; if(g<d){d=g;mat=${om + MATERIAIS[g.mat]};} }\n`;
  }
  for (const [m, nomes] of Object.entries(porMat)) {
    for (const n of nomes) {
      if (ja.has(n)) continue;
      mapa += `  if(s${iseg[n]}<d){d=s${iseg[n]};mat=${om + MATERIAIS[m]};}\n`;
    }
  }
  mapa += '  return d;\n}\n';

  // músculos: quanto cada músculo está perto da pele no ponto
  let musc = `vec4 musculos${L}(vec3 p){\n  float W[${ZONAS.length}]; for(int i=0;i<${ZONAS.length};i++) W[i]=0.0;\n  vec3 q;\n`;
  for (const s of segs) {
    if (s.mat !== 'pele') continue;
    const ps = s.prims.filter((pr) => pr.m);
    if (!ps.length) continue;
    musc += `  q=(uB[${ob + IDX[s.osso]}]*vec4(p,1.0)).xyz;\n`;
    for (const pr of ps) musc += `  W[${IDM[pr.m]}]=max(W[${IDM[pr.m]}],1.0-smoothstep(0.002,0.018,${exprPrim(pr)}));\n`;
  }
  musc += `  float best=0.0; vec3 cor=vec3(0.0);\n  for(int i=0;i<${ZONAS.length};i++){ float v=W[i]*uMI[i]; if(v>best){best=v;cor=uMC[i];} }\n  return vec4(cor,best);\n}\n`;
  return fun + mapa + musc;
}

// GLSL de 1 ou 2 lutadores. Com dois, cada um tem uma esfera que o envolve (uL): longe dela, o lutador nem é avaliado.
export function gerarGLSL(anat, { lutadores = 1 } = {}) {
  const segs = anat.segmentos;
  const iseg = Object.fromEntries(segs.map((s, i) => [s.nome, i]));
  const blocos = blocosDoCorpo(segs);
  let codigo = '';
  for (let L = 0; L < lutadores; L++) codigo += glslLutador(anat, L);
  let mapa = 'float mapa(vec3 p, out int mat){\n';
  if (lutadores === 1) mapa += '  return mapa0(p, mat);\n}\n';
  else {
    mapa += '  float d=1e3; mat=0;\n';
    for (let L = 0; L < lutadores; L++) {
      mapa += `  if(${L}<uN){ float bl=length(p-uL[${L}].xyz)-uL[${L}].w; int m; float dl= bl>0.08 ? bl : mapa${L}(p,m); if(dl<d){ d=dl; mat= bl>0.08 ? ${L * 5} : m; } }\n`;
    }
    mapa += '  return d;\n}\n';
  }
  let musc = 'vec4 musculos(vec3 p, int mat){\n';
  for (let L = lutadores - 1; L >= 1; L--) musc += `  if(mat>=${L * 5}) return musculos${L}(p);\n`;
  musc += '  return musculos0(p);\n}\n';
  return { codigo: codigo + mapa + musc, nseg: segs.length, iseg, blocos };
}

// ---------- a mesma distância em JS (para auditorias de colisão e de técnica) ----------
const tmp = new THREE.Vector3();
function sdElip(p, r) {
  const k0 = Math.hypot(p.x / r[0], p.y / r[1], p.z / r[2]);
  const k1 = Math.hypot(p.x / (r[0] * r[0]), p.y / (r[1] * r[1]), p.z / (r[2] * r[2]));
  return (k0 * (k0 - 1)) / Math.max(k1, 1e-9);
}
function sdCone(p, a, b, r1, r2) {
  const ba = b.clone().sub(a);
  const l2 = ba.dot(ba);
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pa = p.clone().sub(a);
  const y = pa.dot(ba);
  const z = y - l2;
  const xv = pa.clone().multiplyScalar(l2).addScaledVector(ba, -y);
  const x2 = xv.dot(xv);
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
function sdCaixa(p, h, r) {
  const qx = Math.abs(p.x) - h[0] + r;
  const qy = Math.abs(p.y) - h[1] + r;
  const qz = Math.abs(p.z) - h[2] + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
function sdTronco(p, a, b, ra, rb) {
  const rba = rb - ra;
  const baba = b.clone().sub(a).lengthSq();
  const papa = p.clone().sub(a).lengthSq();
  const paba = p.clone().sub(a).dot(b.clone().sub(a)) / baba;
  const x = Math.sqrt(Math.max(papa - paba * paba * baba, 0));
  const cax = Math.max(0, x - (paba < 0.5 ? ra : rb));
  const cay = Math.abs(paba - 0.5) - 0.5;
  const k = rba * rba + baba;
  const ff = Math.min(Math.max((rba * (x - ra) + paba * baba) / k, 0), 1);
  const cbx = x - ra - ff * rba;
  const cby = paba - ff;
  const s = cbx < 0 && cay < 0 ? -1 : 1;
  return s * Math.sqrt(Math.min(cax * cax + cay * cay * baba, cbx * cbx + cby * cby * baba));
}
function sdCilE(p, r, h, rr) {
  const m = Math.min(r[0], r[1]);
  const dxz = (Math.hypot(p.x / r[0], p.z / r[1]) - 1) * m;
  const dx = dxz + rr;
  const dy = Math.abs(p.y) - h + rr;
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - rr;
}
export function smin(a, b, k) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
const smax = (a, b, k) => -smin(-a, -b, k);

// compila a primitiva para uma função JS q -> distância
function compilarPrim(pr) {
  const R = rotInv(pr.rot);
  const R4 = R ? new THREE.Matrix4().setFromMatrix3(R) : null;
  const c = pr.c ? new THREE.Vector3(...pr.c) : null;
  const loc = (q) => {
    const l = q.clone().sub(c);
    return R4 ? l.applyMatrix4(R4) : l;
  };
  switch (pr.t) {
    case 'E':
      return (q) => sdElip(loc(q), pr.r);
    case 'C': {
      const a = new THREE.Vector3(...pr.a);
      const b = new THREE.Vector3(...pr.b);
      return (q) => sdCone(q, a, b, pr.ra, pr.rb);
    }
    case 'B':
      return (q) => sdCaixa(loc(q), pr.h, pr.rr);
    case 'T': {
      const a = new THREE.Vector3(...pr.a);
      const b = new THREE.Vector3(...pr.b);
      const dir = b.clone().sub(a).normalize();
      const a2 = a.clone().addScaledVector(dir, pr.rr);
      const b2 = b.clone().addScaledVector(dir, -pr.rr);
      return (q) => sdTronco(q, a2, b2, pr.ra - pr.rr, pr.rb - pr.rr) - pr.rr;
    }
    case 'Y':
      return (q) => sdCilE(loc(q), pr.r, pr.h, pr.rr);
    case 'P': {
      const n = new THREE.Vector3(...pr.n);
      return (q) => q.dot(n) - pr.d;
    }
  }
}

// segmentos compilados: cada um vira (E, pMundo) -> distância
export function compilarSegmentos(anat) {
  return anat.segmentos.map((s) => {
    const fs = s.prims.map((pr) => [compilarPrim(pr), pr.op, pr.k ?? s.k]);
    const ib = IDX[s.osso];
    const fn = (E, p) => {
      const qi = E.R[ib].clone().invert();
      const q = tmp.copy(p).sub(E.P[ib]).applyQuaternion(qi).add(OSSOS[ib].j).clone();
      let d = fs[0][0](q);
      for (let j = 1; j < fs.length; j++) {
        const [g, op, k] = fs[j];
        const v = g(q);
        if (op === 'sub') d = smax(d, -v, k);
        else if (op === 'corte') d = smax(d, v, k);
        else d = smin(d, v, k);
      }
      return d;
    };
    return { nome: s.nome, osso: s.osso, mat: s.mat, fn };
  });
}
