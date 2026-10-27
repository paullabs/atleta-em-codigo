// Postura -> estado posado dos ossos. A postura descreve o corpo como um treinador descreveria:
// onde fica a pelve, quanto o tronco gira e inclina, para onde a cabeça olha e o queixo desce,
// onde cada luva vai (com o cotovelo apontando para onde e a palma virada para onde),
// onde cada pé pisa (bola do pé no chão, ângulo do pé, calcanhar levantado) e para onde o joelho aponta.
// Braços e pernas saem de cinemática inversa de dois ossos com dobradiça de verdade (cotovelo e joelho).
import * as THREE from 'three';
import { OSSOS, IDX, estadoRepouso, porLocal, porMundo, paraMundo, posicaoFilho } from './esqueleto.js';

const rad = THREE.MathUtils.degToRad;
export const V3 = (a) => (a instanceof THREE.Vector3 ? a.clone() : new THREE.Vector3(...a));
const qEixo = (eixo, ang) => new THREE.Quaternion().setFromAxisAngle(eixo.clone().normalize(), ang);
// giro em graus: yaw (Y), pitch (X), roll (Z), aplicado como Ry * Rx * Rz
export const qYPR = (yaw = 0, pitch = 0, roll = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(pitch), rad(yaw), rad(roll), 'YXZ'));

// dobradiças (repouso): ângulo positivo dobra no sentido natural
const DOBRA_COTOVELO = new THREE.Vector3(-1, 0, -0.12).normalize(); // antebraço vem para a frente e um pouco para dentro (lado esquerdo)
const DOBRA_JOELHO = new THREE.Vector3(1, 0, 0);

// resolve dois ossos (iA -> iM -> ponta) para a ponta chegar no alvo, com o meio apontando para o polo
export function ik2(E, iA, iM, pontaRep, alvo, polo, h, lim = [-0.3, 2.5]) {
  const A0 = OSSOS[iA].j;
  const M0 = OSSOS[iM].j;
  const e = M0.clone().sub(A0);
  const w = pontaRep.clone().sub(M0);
  const Pa = posicaoFilho(E, iA).clone();
  const D = alvo.clone().sub(Pa).length();
  const hw = h.dot(w);
  const eh = e.dot(h);
  const A = e.dot(w) - eh * hw;
  const Bc = e.dot(h.clone().cross(w));
  const K = (D * D - e.lengthSq() - w.lengthSq()) / 2 - eh * hw;
  const Rm = Math.hypot(A, Bc);
  const delta = Math.atan2(Bc, A);
  const c = Math.min(1, Math.max(-1, K / Rm));
  let phi = delta + Math.acos(c);
  phi = Math.atan2(Math.sin(phi), Math.cos(phi));
  phi = Math.min(lim[1], Math.max(lim[0], phi));
  const Rh = qEixo(h, phi);
  const v = e.clone().add(w.clone().applyQuaternion(Rh));
  const x1 = v.clone().normalize();
  const apice = h.clone().cross(x1).negate();
  const y1 = e.clone().addScaledVector(x1, -e.dot(x1)).addScaledVector(apice, 0.02).normalize();
  const X1 = alvo.clone().sub(Pa).normalize();
  let Y1 = polo.clone().addScaledVector(X1, -polo.dot(X1));
  if (Y1.lengthSq() < 1e-8) Y1 = new THREE.Vector3(0, 1, 0).cross(X1);
  Y1.normalize();
  const ml = new THREE.Matrix4().makeBasis(x1, y1, x1.clone().cross(y1));
  const mm = new THREE.Matrix4().makeBasis(X1, Y1, X1.clone().cross(Y1));
  const RA = new THREE.Quaternion().setFromRotationMatrix(mm.multiply(ml.transpose()));
  porMundo(E, iA, RA);
  porMundo(E, iM, RA.clone().multiply(Rh));
  return phi;
}

// gira o antebraço (pronação/supinação) para a palma ficar virada para "palma" (mundo); punho reto
function virarPalma(E, s, palma, punho = [0, 0]) {
  const iA = IDX[`antebraco_${s}`];
  const iT = IDX[`torcao_${s}`];
  const iM = IDX[`mao_${s}`];
  const eixoRep = OSSOS[iM].j.clone().sub(OSSOS[iA].j).normalize();
  const palmaRep = new THREE.Vector3(-OSSOS[iM].lado, 0, 0); // palma para dentro no repouso
  const Ra = E.R[iA];
  const eixo = eixoRep.clone().applyQuaternion(Ra);
  const p0 = palmaRep.clone().applyQuaternion(Ra);
  const d = palma.clone().addScaledVector(eixo, -palma.dot(eixo));
  let tau = 0;
  if (d.lengthSq() > 1e-8) {
    d.normalize();
    p0.addScaledVector(eixo, -p0.dot(eixo)).normalize();
    tau = Math.atan2(eixo.dot(p0.clone().cross(d)), p0.dot(d));
  }
  porMundo(E, iT, Ra.clone().multiply(qEixo(eixoRep, tau / 2)));
  const flex = qEixo(new THREE.Vector3(1, 0, 0), rad(punho[0]));
  const desv = qEixo(new THREE.Vector3(0, 0, 1), rad(punho[1]) * OSSOS[iM].lado);
  porMundo(E, iM, Ra.clone().multiply(qEixo(eixoRep, tau)).multiply(flex).multiply(desv));
  return tau;
}

// pé: bola do pé pisando em (x, z), ângulo do pé (yaw), calcanhar levantado (graus, giro em torno da bola)
function colocarPe(E, s, pe) {
  const iC = IDX[`coxa_${s}`];
  const iK = IDX[`canela_${s}`];
  const iP = IDX[`pe_${s}`];
  const iD = IDX[`dedos_${s}`];
  const bolaRep = OSSOS[iD].j;
  const Rpe = qYPR(pe.yaw ?? 0, 0, 0).multiply(qEixo(new THREE.Vector3(1, 0, 0), rad(pe.calc ?? 0)));
  const bola = new THREE.Vector3(pe.bola[0], bolaRep.y + (pe.alt ?? 0), pe.bola[1]);
  const tornozelo = bola.clone().add(OSSOS[iP].j.clone().sub(bolaRep).applyQuaternion(Rpe));
  // joelho aponta para a frente do pé, girado pelo "joelho" (graus; positivo = para dentro)
  const frente = new THREE.Vector3(0, 0, 1).applyQuaternion(qYPR((pe.yaw ?? 0) - (pe.joelho ?? 0) * OSSOS[iP].lado, 0, 0));
  ik2(E, iC, iK, OSSOS[iP].j, tornozelo, frente, DOBRA_JOELHO, [-0.05, 2.4]);
  porMundo(E, iP, Rpe);
  porMundo(E, iD, qYPR(pe.yaw ?? 0, 0, 0).multiply(qEixo(new THREE.Vector3(1, 0, 0), rad(pe.dedos ?? 0))));
}

// ---- postura completa ----
// p.pelve {pos, yaw, pitch, roll} · p.tronco {yaw, pitch, roll} · p.cabeca {olhar, queixo, yaw, pitch, roll}
// p.clav {e:{elev, prot}, d:{...}} · p.maos {e:{alvo, polo, palma, punho}, d:{...}} · p.pes {e:{bola, yaw, calc, joelho}, d:{...}}
export function posar(p, E = estadoRepouso()) {
  const pv = p.pelve || {};
  E.P[0].copy(V3(pv.pos || OSSOS[0].j));
  porLocal(E, 0, qYPR(pv.yaw, pv.pitch, pv.roll));
  const tr = p.tronco || {};
  const dist = tr.dist || [0.3, 0.32, 0.38];
  ['lombar', 'toracica', 'peito'].forEach((n, k) => porLocal(E, IDX[n], qYPR((tr.yaw ?? 0) * dist[k], (tr.pitch ?? 0) * dist[k], (tr.roll ?? 0) * dist[k])));
  // cabeça: olhar para um ponto com o queixo baixo, dividido entre pescoço (40%) e cabeça
  const cb = p.cabeca || {};
  const iPe = IDX.peito;
  const iPs = IDX.pescoco;
  const iCa = IDX.cabeca;
  let qAlvo;
  if (cb.olhar) {
    porLocal(E, iPs, new THREE.Quaternion());
    porLocal(E, iCa, new THREE.Quaternion());
    const olho = paraMundo(E, iCa, new THREE.Vector3(0, 1.67, 0.08));
    const dir = V3(cb.olhar).sub(olho).normalize();
    const yaw = Math.atan2(dir.x, dir.z);
    const pitch = -Math.asin(dir.y);
    qAlvo = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch + rad(cb.queixo ?? 0), yaw, rad(cb.roll ?? 0), 'YXZ'));
  } else {
    qAlvo = E.R[iPe].clone().multiply(qYPR(cb.yaw, (cb.pitch ?? 0) + (cb.queixo ?? 0), cb.roll));
  }
  const rel = E.R[iPe].clone().invert().multiply(qAlvo);
  const qPs = new THREE.Quaternion().slerp(rel, 0.4);
  porLocal(E, iPs, qPs);
  porLocal(E, iCa, qPs.clone().invert().multiply(rel));
  // clavículas: elevar (encolher o ombro) e protrair (ombro para a frente)
  for (const s of ['e', 'd']) {
    const c = (p.clav && p.clav[s]) || {};
    const lado = s === 'e' ? 1 : -1;
    porLocal(E, IDX[`clav_${s}`], qYPR(-(c.prot ?? 0) * lado, 0, (c.elev ?? 0) * lado));
  }
  // braços
  for (const s of ['e', 'd']) {
    const m = p.maos && p.maos[s];
    const iB = IDX[`braco_${s}`];
    const iA = IDX[`antebraco_${s}`];
    const iM = IDX[`mao_${s}`];
    if (!m) {
      porLocal(E, iB, new THREE.Quaternion());
      porLocal(E, iA, new THREE.Quaternion());
      porLocal(E, IDX[`torcao_${s}`], new THREE.Quaternion());
      porLocal(E, iM, new THREE.Quaternion());
      continue;
    }
    const alvo = typeof m.alvo === 'function' ? m.alvo(E) : V3(m.alvo);
    const polo = typeof m.polo === 'function' ? m.polo(E) : V3(m.polo || [0, -1, -0.3]);
    const dobra = DOBRA_COTOVELO.clone();
    if (s === 'd') dobra.z *= -1;
    m.phi = ik2(E, iB, iA, OSSOS[iM].j, alvo, polo.normalize(), dobra.normalize(), [-0.2, 2.45]);
    const palma = typeof m.palma === 'function' ? m.palma(E) : V3(m.palma || [-(s === 'e' ? 1 : -1), 0, 0]);
    m.tau = virarPalma(E, s, palma.normalize(), m.punho);
  }
  // pernas
  for (const s of ['e', 'd']) {
    const pe = (p.pes && p.pes[s]) || { bola: [OSSOS[IDX[`dedos_${s}`]].j.x, OSSOS[IDX[`dedos_${s}`]].j.z] };
    colocarPe(E, s, pe);
  }
  return E;
}

// postura de pé, relaxada, para o giro de apresentação
export function posturaNeutra() {
  return {
    pelve: { pos: [0, 0.952, -0.01] },
    tronco: { pitch: 1 },
    cabeca: { pitch: 0, queixo: 0 },
    maos: {
      e: { alvo: [0.27, 0.875, 0.02], polo: [0.35, -0.2, -1], palma: [-1, 0, 0.15] },
      d: { alvo: [-0.27, 0.875, 0.02], polo: [-0.35, -0.2, -1], palma: [1, 0, 0.15] },
    },
    pes: {
      e: { bola: [0.115, 0.135], yaw: 7 },
      d: { bola: [-0.115, 0.135], yaw: -7 },
    },
  };
}
