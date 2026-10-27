// Esqueleto do atleta (1,80 m). Unidades em metros, Y para cima, frente em +Z, esquerda do atleta em +X.
// Todo osso tem o quadro de repouso alinhado aos eixos do modelo; a junta de repouso fica no ponto de giro.
// O corpo é descrito na pose de repouso (de pé, braços soltos, palmas viradas para as coxas) e cada
// primitiva anda rígida com o seu osso; o shader leva o ponto do espaço posado de volta ao repouso.
import * as THREE from 'three';

export const ALTURA = 1.8;

// [nome, pai, junta em repouso]
const CENTRO = [
  ['pelve', null, [0, 0.955, -0.01]],
  ['lombar', 'pelve', [0, 1.02, -0.045]],
  ['toracica', 'lombar', [0, 1.14, -0.06]],
  ['peito', 'toracica', [0, 1.28, -0.07]],
  ['pescoco', 'peito', [0, 1.475, -0.05]],
  ['cabeca', 'pescoco', [0, 1.615, -0.02]],
];
// lado esquerdo (+X); o direito é o espelho em X
const LADO = [
  ['clav', 'peito', [0.022, 1.455, 0.045]],
  ['braco', 'clav', [0.185, 1.435, -0.025]],
  ['antebraco', 'braco', [0.212, 1.11, -0.04]],
  ['torcao', 'antebraco', [0.226, 0.98, -0.02]],
  ['mao', 'torcao', [0.24, 0.85, 0.0]],
  ['coxa', 'pelve', [0.09, 0.925, 0.0]],
  ['canela', 'coxa', [0.095, 0.49, 0.008]],
  ['pe', 'canela', [0.1, 0.075, -0.02]],
  ['dedos', 'pe', [0.108, 0.025, 0.135]],
];

export const OSSOS = [];
for (const [nome, pai, j] of CENTRO) OSSOS.push({ nome, pai, j: new THREE.Vector3(...j), lado: 0 });
for (const [s, sx] of [['e', 1], ['d', -1]]) {
  for (const [nome, pai, j] of LADO) {
    const paiNome = pai === 'peito' || pai === 'pelve' ? pai : `${pai}_${s}`;
    OSSOS.push({ nome: `${nome}_${s}`, pai: paiNome, j: new THREE.Vector3(j[0] * sx, j[1], j[2]), lado: sx });
  }
}
export const IDX = Object.fromEntries(OSSOS.map((o, i) => [o.nome, i]));
for (const o of OSSOS) o.ipai = o.pai == null ? -1 : IDX[o.pai];
export const NB = OSSOS.length;

// estado posado: rotação no mundo (R) e posição da junta no mundo (P) de cada osso
export function estadoRepouso(raiz = new THREE.Vector3()) {
  return {
    R: OSSOS.map(() => new THREE.Quaternion()),
    P: OSSOS.map((o) => o.j.clone().add(raiz)),
  };
}

// posição posada da junta do osso i a partir do pai já posado
export function posicaoFilho(E, i) {
  const o = OSSOS[i];
  if (o.ipai < 0) return E.P[i];
  const off = o.j.clone().sub(OSSOS[o.ipai].j).applyQuaternion(E.R[o.ipai]);
  return E.P[i].copy(E.P[o.ipai]).add(off);
}

// rotação local (relativa ao pai) -> rotação no mundo, e posiciona a junta
export function porLocal(E, i, qLocal) {
  const o = OSSOS[i];
  if (o.ipai < 0) E.R[i].copy(qLocal);
  else E.R[i].copy(E.R[o.ipai]).multiply(qLocal);
  posicaoFilho(E, i);
}

// rotação já no mundo
export function porMundo(E, i, qMundo) {
  E.R[i].copy(qMundo);
  posicaoFilho(E, i);
}

// ponto do repouso (modelo) levado para o mundo pelo osso i
export function paraMundo(E, i, pRepouso, alvo = new THREE.Vector3()) {
  return alvo.copy(pRepouso).sub(OSSOS[i].j).applyQuaternion(E.R[i]).add(E.P[i]);
}

// ponto do mundo levado ao repouso do osso i
export function paraRepouso(E, i, pMundo, alvo = new THREE.Vector3()) {
  const qi = E.R[i].clone().invert();
  return alvo.copy(pMundo).sub(E.P[i]).applyQuaternion(qi).add(OSSOS[i].j);
}

// leva a pose inteira para outro lugar do mundo: gira em torno do eixo vertical (graus) e desloca
export function posicionar(E, pos = [0, 0, 0], yawGraus = 0) {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(yawGraus));
  const t = new THREE.Vector3(...pos);
  for (let i = 0; i < E.R.length; i++) {
    E.R[i].premultiply(q);
    E.P[i].applyQuaternion(q).add(t);
  }
  return E;
}

// matrizes repouso -> mundo de cada osso (para pele de malha: a anatomia interna), em Float32Array de 16*NB
export function matrizesMundo(E, saida = new Float32Array(16 * NB)) {
  const m = new THREE.Matrix4();
  const t1 = new THREE.Matrix4();
  const t2 = new THREE.Matrix4();
  for (let i = 0; i < NB; i++) {
    t1.makeTranslation(-OSSOS[i].j.x, -OSSOS[i].j.y, -OSSOS[i].j.z);
    m.makeRotationFromQuaternion(E.R[i]);
    t2.makeTranslation(E.P[i].x, E.P[i].y, E.P[i].z);
    t2.multiply(m).multiply(t1);
    saida.set(t2.elements, 16 * i);
  }
  return saida;
}

// matrizes mundo -> repouso de cada osso (o que o shader usa), em Float32Array de 16*NB
export function matrizesRepouso(E, saida = new Float32Array(16 * NB)) {
  const m = new THREE.Matrix4();
  const t1 = new THREE.Matrix4();
  const t2 = new THREE.Matrix4();
  for (let i = 0; i < NB; i++) {
    const qi = E.R[i].clone().invert();
    t1.makeTranslation(-E.P[i].x, -E.P[i].y, -E.P[i].z);
    m.makeRotationFromQuaternion(qi).multiply(t1);
    t2.makeTranslation(OSSOS[i].j.x, OSSOS[i].j.y, OSSOS[i].j.z);
    t2.multiply(m);
    saida.set(t2.elements, 16 * i);
  }
  return saida;
}
