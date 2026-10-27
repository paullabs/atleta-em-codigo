// O alvo que leva o soco (lutador do canto azul, relaxado, sem guarda) e a conta de geometria do impacto.
// Tudo sai do código: a luva encosta na pele sem entrar (distância medida no corpo), o braço de alavanca é a
// distância da linha do soco até o eixo do pescoço, e a reação da cabeça é a de uma pancada em cada ponto:
//   reto no meio do rosto -> a linha do soco passa pelo eixo do pescoço: a cabeça só recua;
//   gancho de lado no queixo -> a linha passa longe do eixo: a cabeça gira (e o corpo cede).
import * as THREE from 'three';
import { IDX, OSSOS, paraMundo, posicionar } from '../corpo/esqueleto.js';
import { construirAnatomia } from '../corpo/anatomia.js';
import { compilarSegmentos } from '../corpo/sdf.js';
import { posar, V3 } from '../corpo/pose.js';
import { GOLPES, ALVOS, calibrar, faceDaLuva } from './golpes.js';

const anat = construirAnatomia();
const segs = compilarSegmentos(anat);
const CABECA = segs.find((s) => s.nome === 'cabeca');

// ---- reação (t em segundos desde o impacto) ----
const sobe = (t, tau) => (t <= 0 ? 0 : 1 - Math.exp(-t / tau)); // chega rápido ao valor
const pulso = (t, tr, td) => (t <= 0 ? 0 : (1 - Math.exp(-t / tr)) * Math.exp(-t / td)); // vai e volta
const pico = (tr, td) => {
  let m = 0;
  for (let t = 0; t < 2; t += 0.002) m = Math.max(m, pulso(t, tr, td));
  return m;
};
const PICO_RETO = pico(0.05, 0.3);
const ease = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };

// postura do alvo (referencial do atleta, de frente para +Z; depois é virado 180° para encarar o vermelho)
function posturaAlvo(tipo, t, queda = 0) {
  const p = {
    pelve: { pos: [0, 0.95 - queda, 0], yaw: 0, pitch: 0, roll: 0 },
    tronco: { yaw: 0, pitch: 3, roll: 0 },
    cabeca: { yaw: 0, pitch: 0, roll: 0, queixo: 0 },
    clav: { e: { elev: 0 }, d: { elev: 0 } },
    pes: { e: { bola: [0.14, 0.1], yaw: 5 }, d: { bola: [-0.14, 0.1], yaw: -5 } },
    // braços soltos, longe do calção: as mãos acompanham o quadril (na queda ficam ao lado das coxas, não dentro)
    maos: {
      e: { alvo: (E) => V3([0.36, E.P[0].y - 0.02, E.P[0].z + 0.1]), polo: [0.6, -0.2, -1], palma: [-1, 0, 0.15] },
      d: { alvo: (E) => V3([-0.36, E.P[0].y - 0.02, E.P[0].z + 0.1]), polo: [-0.6, -0.2, -1], palma: [1, 0, 0.15] },
    },
  };
  if (tipo === 'reto') {
    // linha do soco no centro: empurrão. A cabeça recua e o queixo sobe, o tronco acompanha um pouco.
    const k = pulso(t, 0.05, 0.3) / PICO_RETO;
    p.cabeca.pitch = -24 * k;
    p.cabeca.yaw = 3 * k;
    p.tronco.pitch += -9 * (pulso(t, 0.09, 0.42) / pico(0.09, 0.42));
    p.pelve.pos[2] -= 0.05 * (pulso(t, 0.08, 0.4) / pico(0.08, 0.4));
  } else if (tipo === 'gancho') {
    // linha fora do eixo: a cabeça gira rápido para o lado oposto ao golpe e depois cede
    const g = sobe(t, 0.035) * (0.4 + 0.6 * Math.exp(-t / 0.3));
    p.cabeca.yaw = HOOK_SINAL * 88 * g;
    p.cabeca.roll = HOOK_SINAL * -16 * g;
    p.tronco.yaw = HOOK_SINAL * 26 * sobe(t - 0.03, 0.1);
    p.pelve.yaw = HOOK_SINAL * 10 * sobe(t - 0.06, 0.12);
    // os joelhos cedem (sem comando do cérebro): desce o quadril, o tronco tomba para a frente e a cabeça pende
    const c = ease((t - 0.2) / 0.75);
    p.pelve.pos[1] -= 0.4 * c;
    p.pelve.pos[2] -= 0.1 * c;
    p.tronco.pitch += 36 * c;
    p.cabeca.pitch += 22 * c;
  }
  return p;
}
const HOOK_SINAL = 1; // sinal do giro da cabeça no gancho (conferido nos quadros de teste)

// ---- montagem de uma cena de impacto ----
// A luva é uma cápsula (do punho para a frente, raio de 5,8 cm). O alvo fica onde essa cápsula só encosta na pele
// (2 mm) no instante mais cedo possível: antes disso nada entra na cabeça, e esse instante é o impacto. A luva
// do vermelho fica parada ali por 40 ms (o soco bate e não atravessa) e depois volta pelo mesmo caminho.
const R_LUVA = 0.058;
const HOLD = 0.04;
function montar({ golpe, tipo, alvoLocal, desvio, lado = 1, queda0 = 0.05 }) {
  const g = GOLPES[golpe];
  const Er = posar(g.postura(g.impacto));
  const mao = Er.P[IDX[`mao_${g.lado}`]];
  const cto = Er.P[IDX[`antebraco_${g.lado}`]];
  const f = mao.clone().sub(cto).normalize();
  const dh = new THREE.Vector3(f.x, 0, f.z).normalize();
  const tip = faceDaLuva(Er, g.lado);
  const perp = new THREE.Vector3(-dh.z, 0, dh.x).multiplyScalar(lado);

  const E0 = (queda) => posar(posturaAlvo(tipo, -1, queda)); // sem reação
  // altura: o ponto-alvo da cabeça fica na altura da ponta da luva
  let queda = queda0;
  for (let i = 0; i < 4; i++) {
    const E = posicionar(E0(queda), [0, 0, 0], 180);
    const y = paraMundo(E, IDX.cabeca, V3(alvoLocal)).y;
    queda += y - tip.y;
  }
  const Eb0 = posicionar(E0(queda), [0, 0, 0], 180);
  const c0 = paraMundo(Eb0, IDX.cabeca, new THREE.Vector3(0, 1.64, 0.01));
  const posDe = (s) => {
    const alvoC = tip.clone().addScaledVector(dh, s).addScaledVector(perp, desvio);
    return [alvoC.x - c0.x, 0, alvoC.z - c0.z];
  };
  // trajetória da luva (pontos da cápsula) em cada instante até o impacto previsto
  const trilha = [];
  for (let t = 0; t <= g.impacto + 0.012; t += 0.004) {
    const E = posar(g.postura(t));
    const a = E.P[IDX[`antebraco_${g.lado}`]];
    const m = E.P[IDX[`mao_${g.lado}`]];
    const u = m.clone().sub(a).normalize();
    trilha.push({ t, pts: [0.03, 0.06, 0.09, 0.12, 0.15].map((k) => m.clone().addScaledVector(u, k)) });
  }
  // folga mínima (todas as horas, todos os pontos) entre a luva e a cabeça para um deslocamento s
  const folga = (s) => {
    const E = posicionar(E0(queda), posDe(s), 180);
    let min = Infinity;
    let tm = 0;
    let pm = null;
    for (const { t, pts } of trilha) for (const p of pts) {
      const d = CABECA.fn(E, p) - R_LUVA;
      if (d < min) { min = d; tm = t; pm = p; }
    }
    return { min, tm, pm };
  };
  let a = 0.0;
  let b = 0.8;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (folga(m).min > 0.002) b = m;
    else a = m;
  }
  const s = (a + b) / 2;
  const pos = posDe(s);
  const ch = folga(s);
  const tc = ch.tm; // primeiro toque
  const Ebase = posicionar(E0(queda), pos, 180);
  const pivo = Ebase.P[IDX.cabeca].clone();
  const contato = ch.pm.clone().addScaledVector(dh, R_LUVA);
  // braço de alavanca: distância (no plano do chão) do eixo do pescoço até a linha do soco
  const d = new THREE.Vector3(pivo.x - contato.x, 0, pivo.z - contato.z);
  const alavanca = Math.abs(d.x * dh.z - d.z * dh.x);
  // tempo do vermelho: bate em tc, fica parado HOLD e volta
  const tauV = (tau) => (tau <= tc ? tau : tau <= tc + HOLD ? tc : tau - HOLD);

  return {
    golpe,
    tipo,
    g,
    impacto: tc,
    tip: contato,
    dh,
    pivo,
    alavanca,
    queda,
    pos,
    vermelho: (tau) => posar(g.postura(Math.min(tauV(tau), g.dur + 2))),
    azul: (tau) => posicionar(posar(posturaAlvo(tipo, tau - tc, queda)), pos, 180),
    contato,
  };
}

export function criarCenas() {
  // o reto vai ao meio do rosto (altura do nariz); calibra o braço para esse ponto
  ALVOS.reto.y = 1.6;
  calibrar();
  const reto = montar({ golpe: 'direto', tipo: 'reto', alvoLocal: [0, 1.655, 0.085], desvio: 0 });
  const gancho = montar({ golpe: 'gancho', tipo: 'gancho', alvoLocal: [0.05, 1.595, 0.02], desvio: 0.06, lado: -1 });
  return { reto, gancho };
}
