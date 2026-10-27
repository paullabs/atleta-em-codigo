// Boxe, guarda ortodoxa (pé esquerdo na frente) e os quatro golpes básicos. O adversário fica em +Z.
// Tudo é descrito como um treinador descreve (pés, joelhos, quadril, tronco, queixo, mãos e cotovelos)
// e vira pose por cinemática inversa. A ordem do corpo em cada golpe segue a cadeia cinética medida
// em boxeadores (quadril e ombro saem antes, depois cotovelo, depois punho; Piorkowski et al., 2011).
// O ponto de impacto de cada golpe é calibrado por medida quando o módulo carrega (ver calibrar()).
import * as THREE from 'three';
import { OSSOS, IDX, paraMundo, paraRepouso } from '../corpo/esqueleto.js';
import { posar, posturaNeutra, V3 } from '../corpo/pose.js';

const J_CABECA = OSSOS[IDX.cabeca].j;
// ponto preso à cabeça (desvio a partir da junta da cabeça, eixos do modelo em repouso)
export const naCabeca = (d) => (E) => paraMundo(E, IDX.cabeca, J_CABECA.clone().add(V3(d)));
export const dirCabeca = (d) => (E) => V3(d).applyQuaternion(E.R[IDX.cabeca]);
export const dirPeito = (d) => (E) => V3(d).applyQuaternion(E.R[IDX.peito]);
// referencial do rosto sem a inclinação do queixo: posição da junta da cabeça e só o giro (yaw) do rosto
export function quadroFrente(E) {
  const f = new THREE.Vector3(0, 0, 1).applyQuaternion(E.R[IDX.cabeca]);
  const yaw = Math.atan2(f.x, f.z);
  return { pos: E.P[IDX.cabeca].clone(), q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw) };
}
export const naFrente = (d) => (E) => {
  const F = quadroFrente(E);
  return V3(d).applyQuaternion(F.q).add(F.pos);
};
export const dirFrente = (d) => (E) => V3(d).applyQuaternion(quadroFrente(E).q);

// ---- curvas ----
const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const minjerk = (u) => {
  u = clamp01(u);
  return u * u * u * (10 - 15 * u + 6 * u * u);
};
// saída do golpe: começa sem tranco e acelera até perto do fim (pico de velocidade tardio)
export const curvaGolpe = (u) => minjerk(Math.pow(clamp01(u), 1.5));
// volta para a guarda: sai rápido e assenta suave
export const curvaVolta = (u) => minjerk(Math.pow(clamp01(u), 0.8));
const janela = (t, a, b) => clamp01((t - a) / (b - a));
const lerpV = (a, b, s) => a.clone().lerp(b, s);
const misturaDir = (a, b, s) => a.clone().multiplyScalar(1 - s).addScaledVector(b, s).normalize();
const vet = (v, E) => V3(typeof v === 'function' ? v(E) : v);

// ---- guarda ----
export function guarda() {
  return {
    pelve: { pos: [-0.03, 0.94, -0.02], yaw: -38, pitch: 4, roll: 0 },
    tronco: { yaw: -6, pitch: 8, roll: 2 },
    cabeca: { olhar: [0, 1.6, 2.5], queixo: 14 },
    clav: { e: { elev: 6, prot: 4 }, d: { elev: 3, prot: 2 } },
    maos: {
      e: { alvo: naFrente([0.05, -0.125, 0.385]), polo: [0.2, -1, -0.15], palma: dirFrente([-0.9, 0, 0.1]) },
      d: { alvo: naFrente([-0.126, -0.125, 0.133]), polo: [-0.2, -1, 0.1], palma: dirFrente([0.6, 0, 0.8]) },
    },
    pes: {
      e: { bola: [0.07, 0.2], yaw: -12, calc: 3 },
      d: { bola: [-0.15, -0.19], yaw: -48, calc: 11 },
    },
  };
}

export const LUVA_FRENTE = 0.17; // do punho até a face de golpe da luva, ao longo do antebraço
// impacto: o queixo do adversário para os retos; para gancho e uppercut, a forma do braço no impacto
// (u = ombro -> cotovelo, f = cotovelo -> punho, no mundo); a face da luva sai da conta (calibrar)
export const ALVOS = {
  reto: new THREE.Vector3(-0.06, 1.5, 0.98), // queixo do adversário na distância do jab e do direto (z calibrado)
  gancho: { u: [0.8, 0.15, 0.58], f: [-0.6, 0, 0.8] }, // cotovelo para fora na altura do ombro, antebraço deitado, ~90°
  upper: { u: [0.2, -0.77, 0.6], f: [0.12, 0.75, 0.65] }, // cotovelo embaixo, antebraço subindo pelo centro, ~80°
};
const L_BRACO = OSSOS[IDX.antebraco_e].j.distanceTo(OSSOS[IDX.braco_e].j);
const L_ANTEBRACO = OSSOS[IDX.mao_e].j.distanceTo(OSSOS[IDX.antebraco_e].j);
// metas de técnica que a calibração persegue
export const METAS = { cotoveloJab: 168, cotoveloDireto: 171 };
// valores que a calibração ajusta
export const CAL = { avancoDireto: 0.06 };

// soma um "delta" de postura (números somam; listas somam por componente) multiplicado por s
function somar(p, d, s) {
  for (const [k, v] of Object.entries(d)) {
    if (typeof v === 'number') p[k] = (p[k] ?? 0) + v * s;
    else if (Array.isArray(v)) p[k] = (p[k] || v.map(() => 0)).map((x, i) => x + v[i] * s);
    else {
      p[k] = p[k] || {};
      somar(p[k], v, s);
    }
  }
}

// mão que sai da guarda para um ponto (e volta): alvo, polo e palma misturados pelo avanço s
function levarMao(m, ponto, { palma, polo, s, sPalma = s }) {
  const g = { alvo: m.alvo, polo: m.polo, palma: m.palma };
  m.alvo = (E) => lerpV(vet(g.alvo, E), vet(ponto, E), s);
  m.polo = (E) => misturaDir(vet(g.polo, E).normalize(), vet(polo, E).normalize(), s);
  m.palma = (E) => misturaDir(vet(g.palma, E).normalize(), vet(palma, E).normalize(), sPalma);
}

// soco reto: na ida a mão anda em linha reta do ponto onde estava na guarda até o alvo;
// na volta, do alvo para a guarda (que acompanha o corpo voltando)
let INICIO = null;
function inicioDaGuarda(s) {
  if (!INICIO) {
    const p = guarda();
    const E = posar(p);
    INICIO = { e: vet(p.maos.e.alvo, E), d: vet(p.maos.d.alvo, E) };
  }
  return INICIO[s];
}
function socoReto(m, lado, alvo, { palma, polo, ida, volta, sPalma }) {
  const g = { alvo: m.alvo, polo: m.polo, palma: m.palma };
  const ini = inicioDaGuarda(lado);
  const s = ida * (1 - volta);
  // no começo a mão sai junto com o rosto (o corpo já gira); a partir de ~1/3 do caminho segue a linha reta
  const prende = minjerk(clamp01(ida * 3));
  m.alvo = (E) => (volta <= 0 ? lerpV(lerpV(vet(g.alvo, E), ini, prende), vet(alvo, E), ida) : lerpV(vet(alvo, E), vet(g.alvo, E), volta));
  m.polo = (E) => misturaDir(vet(g.polo, E).normalize(), vet(polo, E).normalize(), s);
  m.palma = (E) => misturaDir(vet(g.palma, E).normalize(), vet(palma, E).normalize(), sPalma);
}

// punho no ponto em que a face da luva toca o queixo do adversário, vindo do ombro do lado
const punhoNoQueixo = (s) => (E) => {
  const ombro = E.P[IDX[`braco_${s}`]];
  const dir = ALVOS.reto.clone().sub(ombro).normalize();
  return ALVOS.reto.clone().addScaledVector(dir, -LUVA_FRENTE);
};
// punho e polo presos ao peito (calibrados no impacto): o braço trava e o giro do corpo leva a luva
const noPeito = (local) => (E) => paraMundo(E, IDX.peito, local);
const dirNoPeito = (local) => (E) => local.clone().applyQuaternion(E.R[IDX.peito]);

// ---- golpes ----
// cada golpe: duração (s), instante do impacto, lado que golpeia e postura(t)
export const GOLPES = {
  // JAB: mão da frente reta no queixo, punho gira no fim (palma para baixo), ombro da frente sobe e protege o queixo,
  // mão de trás fica colada no queixo, peso vai um pouco para a frente, volta pela mesma linha.
  jab: {
    nome: 'Jab',
    lado: 'e',
    dur: 0.38,
    impacto: 0.15,
    postura(t) {
      const p = guarda();
      const ida = curvaGolpe(janela(t, 0.02, 0.15));
      const corpo = minjerk(janela(t, 0.0, 0.13));
      const volta = curvaVolta(janela(t, 0.18, 0.38));
      const s = ida * (1 - volta);
      const sc = corpo * (1 - volta);
      somar(p, { pelve: { pos: [0.008, -0.004, 0.03], yaw: -5 }, tronco: { yaw: -8, pitch: 3 }, clav: { e: { elev: 12, prot: 14 } }, pes: { d: { calc: 5 } } }, sc);
      socoReto(p.maos.e, 'e', punhoNoQueixo('e'), { palma: [0, -1, 0], polo: [0.35, -1, 0], ida, volta, sPalma: clamp01((s - 0.35) / 0.65) });
      return p;
    },
  },
  // DIRETO (de trás): pé de trás gira na ponta (calcanhar para fora), joelho de trás vira para dentro,
  // quadril e ombro giram para o alvo, peso passa para a perna da frente, braço de trás vai reto e o punho gira;
  // a mão da frente volta para o rosto e o queixo fica escondido atrás do ombro de trás.
  direto: {
    nome: 'Direto',
    lado: 'd',
    dur: 0.52,
    impacto: 0.22,
    postura(t) {
      const p = guarda();
      const corpo = minjerk(janela(t, 0.0, 0.2));
      const ida = curvaGolpe(janela(t, 0.02, 0.22));
      const volta = curvaVolta(janela(t, 0.25, 0.52));
      const sc = corpo * (1 - volta);
      const s = ida * (1 - volta);
      somar(p, {
        pelve: { pos: [0.03, -0.012, CAL.avancoDireto], yaw: 40, roll: -2 },
        tronco: { yaw: 14, pitch: 5, roll: -2 },
        clav: { d: { elev: 8, prot: 16 }, e: { prot: -6 } },
        pes: { d: { yaw: 36, calc: 22, joelho: 15 }, e: { calc: 2 } },
      }, sc);
      socoReto(p.maos.d, 'd', punhoNoQueixo('d'), { palma: [0, -1, 0], polo: [-0.35, -1, 0], ida, volta, sPalma: clamp01((s - 0.35) / 0.65) });
      // a mão da frente só sai do rosto depois que a de trás voltou (as duas não se cruzam na frente do rosto)
      const sProtege = corpo * (1 - curvaVolta(janela(t, 0.38, 0.52)));
      levarMao(p.maos.e, naFrente([0.13, -0.12, 0.172]), { palma: dirFrente([-0.6, 0, 0.8]), polo: [0.2, -1, 0.1], s: sProtege });
      return p;
    },
  },
  // GANCHO DE FRENTE (cabeça): cotovelo sobe até a altura do ombro com o braço em ~90°, antebraço paralelo ao chão,
  // palma para baixo; o braço fica travado e quem leva o soco é o giro: pé da frente gira (calcanhar para fora),
  // quadril e ombros giram para a direita; a mão de trás fica no queixo.
  gancho: {
    nome: 'Gancho',
    lado: 'e',
    dur: 0.52,
    impacto: 0.22,
    postura(t) {
      const p = guarda();
      const braco = minjerk(janela(t, 0.0, 0.1));
      const giro = curvaGolpe(janela(t, 0.03, 0.22));
      const volta = curvaVolta(janela(t, 0.25, 0.52));
      const sb = braco * (1 - volta);
      const sg = giro * (1 - volta);
      somar(p, {
        pelve: { pos: [-0.02, -0.008, 0.0], yaw: -22 },
        tronco: { yaw: -4, pitch: -2, roll: 3 },
        clav: { e: { elev: 4, prot: 6 } },
        pes: { e: { yaw: -46, calc: 20, joelho: 22 }, d: { calc: -6 } },
      }, sg);
      if (this.punhoLocal) levarMao(p.maos.e, noPeito(this.punhoLocal), { palma: dirPeito([0, -1, 0]), polo: dirNoPeito(this.poloLocal), s: sb });
      return p;
    },
  },
  // UPPERCUT DE TRÁS: dobra um pouco os joelhos e desce a mão de trás uns 5 cm (sem armar), depois as pernas
  // empurram para cima, o quadril gira para o alvo, o pé de trás gira e o punho sobe pelo centro com a palma
  // virada para o próprio rosto e o cotovelo em ~90°; a mão da frente protege o rosto.
  upper: {
    nome: 'Uppercut',
    lado: 'd',
    dur: 0.56,
    impacto: 0.26,
    postura(t) {
      const p = guarda();
      const desce = minjerk(janela(t, 0.0, 0.1));
      const sobe = curvaGolpe(janela(t, 0.08, 0.26));
      const volta = curvaVolta(janela(t, 0.29, 0.56));
      const sd = desce * (1 - sobe);
      const ss = sobe * (1 - volta);
      somar(p, { pelve: { pos: [0, -0.035, 0], yaw: -6, roll: 3 }, tronco: { yaw: -4, roll: 5 } }, sd);
      somar(p, {
        pelve: { pos: [0.02, 0.005, 0.04], yaw: 30, roll: -2 },
        tronco: { yaw: 3, pitch: 2, roll: -4 },
        clav: { d: { elev: 6, prot: 8 } },
        pes: { d: { yaw: 30, calc: 18, joelho: 15 } },
      }, ss);
      if (this.punhoLocal) {
        const m = p.maos.d;
        const g = { alvo: m.alvo, polo: m.polo, palma: m.palma };
        const baixa = naFrente([-0.09, -0.19, 0.11]);
        const topo = noPeito(this.punhoLocal);
        const poloTopo = dirNoPeito(this.poloLocal);
        m.alvo = (E) => lerpV(lerpV(vet(g.alvo, E), baixa(E), sd), topo(E), ss);
        m.polo = (E) => misturaDir(vet(g.polo, E).normalize(), poloTopo(E).normalize(), Math.max(sd, ss));
        m.palma = (E) => misturaDir(vet(g.palma, E).normalize(), dirPeito([0.1, 0.35, -1])(E).normalize(), Math.max(sd * 0.7, ss));
      }
      levarMao(p.maos.e, naFrente([0.125, -0.115, 0.185]), { palma: dirFrente([-0.7, 0, 0.7]), polo: [0.2, -1, 0.1], s: ss });
      return p;
    },
  },
};

// face da luva (onde a luva bate) no mundo: do punho, ao longo do antebraço
export function faceDaLuva(E, s) {
  const c = E.P[IDX[`antebraco_${s}`]];
  const p = E.P[IDX[`mao_${s}`]];
  return p.clone().addScaledVector(p.clone().sub(c).normalize(), LUVA_FRENTE);
}

// ângulo interno do cotovelo (graus) de um lado
export function anguloCotovelo(E, s) {
  const a = E.P[IDX[`braco_${s}`]];
  const b = E.P[IDX[`antebraco_${s}`]];
  const c = E.P[IDX[`mao_${s}`]];
  return (a.clone().sub(b).angleTo(c.clone().sub(b)) * 180) / Math.PI;
}

// bissecção simples: acha x em [a, b] com f(x) = alvo (f monótona)
function resolver(f, alvo, a, b, n = 30) {
  let fa = f(a) - alvo;
  for (let i = 0; i < n; i++) {
    const m = (a + b) / 2;
    const fm = f(m) - alvo;
    if (Math.sign(fm) === Math.sign(fa)) {
      a = m;
      fa = fm;
    } else b = m;
  }
  return (a + b) / 2;
}

// calibra os pontos de impacto: o jab e o direto acertam o mesmo queixo com o cotovelo quase reto;
// gancho e uppercut prendem no peito o punho e o cotovelo que dão a luva no ponto marcado
export function calibrar() {
  const jab = GOLPES.jab;
  ALVOS.reto.z = resolver((z) => {
    ALVOS.reto.z = z;
    return -anguloCotovelo(posar(jab.postura(jab.impacto)), 'e');
  }, -METAS.cotoveloJab, 0.7, 1.2);
  const dir = GOLPES.direto;
  CAL.avancoDireto = resolver((a) => {
    CAL.avancoDireto = a;
    return anguloCotovelo(posar(dir.postura(dir.impacto)), 'd');
  }, METAS.cotoveloDireto, -0.06, 0.14);
  for (const nome of ['gancho', 'upper']) {
    const g = GOLPES[nome];
    const A = ALVOS[nome];
    g.punhoLocal = null;
    const Ei = posar(g.postura(g.impacto));
    const u = V3(A.u).normalize();
    const f = V3(A.f).normalize();
    const punho = Ei.P[IDX[`braco_${g.lado}`]].clone().addScaledVector(u, L_BRACO).addScaledVector(f, L_ANTEBRACO);
    g.punhoLocal = paraRepouso(Ei, IDX.peito, punho);
    g.poloLocal = u.clone().applyQuaternion(Ei.R[IDX.peito].clone().invert());
    A.face = punho.clone().addScaledVector(f, LUVA_FRENTE);
  }
}
calibrar();

export function estadoEm(nome, t) {
  if (nome === 'guarda') return posar(guarda());
  if (nome === 'neutra') return posar(posturaNeutra());
  const g = GOLPES[nome];
  if (g) return posar(g.postura(t === 'impacto' || Number.isNaN(Number(t)) ? g.impacto : Number(t)));
  return posar(posturaNeutra());
}
