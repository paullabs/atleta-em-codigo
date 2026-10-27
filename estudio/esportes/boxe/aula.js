// Aula em blocos: guarda e golpes em velocidade real e em câmera lenta que freia e para no impacto.
// O tempo do vídeo (T) vira tempo de animação (τ) por bloco; a pose sai de golpes.js.
// Uma dica por vez: texto no alto da tela e um anel na parte do corpo de que a dica fala.
import * as THREE from 'three';
import { IDX, paraMundo, posicionar } from '../corpo/esqueleto.js';
import { posar } from '../corpo/pose.js';
import { GOLPES, guarda, faceDaLuva, minjerk } from './golpes.js';

const V = (a) => new THREE.Vector3(...a);
// pontos do corpo para as dicas apontarem
export const PONTOS = {
  luva: (s) => (E) => faceDaLuva(E, s),
  punho: (s) => (E) => E.P[IDX[`mao_${s}`]].clone(),
  cotovelo: (s) => (E) => E.P[IDX[`antebraco_${s}`]].clone(),
  ombro: (s) => (E) => paraMundo(E, IDX[`clav_${s}`], V([0.17 * (s === 'e' ? 1 : -1), 1.48, -0.02])),
  queixo: (E) => paraMundo(E, IDX.cabeca, V([0, 1.565, 0.06])),
  quadril: (E) => paraMundo(E, IDX.pelve, V([0, 0.93, 0.1])),
  calcanhar: (s) => (E) => paraMundo(E, IDX[`pe_${s}`], V([0.1 * (s === 'e' ? 1 : -1), 0.03, -0.075])),
  pe: (s) => (E) => paraMundo(E, IDX[`pe_${s}`], V([0.105 * (s === 'e' ? 1 : -1), 0.03, 0.04])),
  joelho: (s) => (E) => paraMundo(E, IDX[`canela_${s}`], V([0.095 * (s === 'e' ? 1 : -1), 0.51, 0.06])),
};

// câmeras: posição, ponto de mira e lente (mm, sensor de 36 mm em pé)
export const CAMERAS = {
  frente34: { pos: [-1.9, 1.45, 2.5], alvo: [-0.02, 1.05, 0.25], mm: 35 },
  lado: { pos: [-2.75, 1.3, 0.75], alvo: [-0.02, 1.08, 0.4], mm: 35 },
  frente: { pos: [0.35, 1.5, 3.25], alvo: [-0.04, 1.12, 0.25], mm: 38 },
  cima: { pos: [-1.65, 2.75, 1.85], alvo: [-0.02, 0.9, 0.25], mm: 30 },
  cimaEsq: { pos: [1.55, 2.55, 2.35], alvo: [-0.05, 1.1, 0.3], mm: 33 },
};
// câmera girando em volta de um eixo vertical que passa pelo alvo (graus)
export function orbitar(cam, graus) {
  const a = THREE.MathUtils.degToRad(graus);
  const alvo = V(cam.alvo);
  const d = V(cam.pos).sub(alvo);
  d.applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
  return { ...cam, pos: alvo.clone().add(d).toArray() };
}
function misturarCam(a, b, s) {
  return { pos: V(a.pos).lerp(V(b.pos), s).toArray(), alvo: V(a.alvo).lerp(V(b.alvo), s).toArray(), mm: a.mm + (b.mm - a.mm) * s };
}
const dica = (texto, ponto) => ({ texto, ponto });

// ---- roteiro da aula de teste ----
// dupla: o segundo lutador (canto azul) no mundo { pos, yaw, atraso } e a cena dos dois
export const AULA_TESTE = [
  { tipo: 'guarda', dur: 3.8, dupla: { pos: [0, 0, 1.65], yaw: 180, atraso: 0.27 }, cam: { de: { pos: [-4.15, 1.4, 0.45], alvo: [0, 0.92, 0.82], mm: 30 }, ate: { pos: [-3.95, 1.55, 1.55], alvo: [0, 0.92, 0.82], mm: 30 } }, chao: { centro: [0, 0, 0.82], raio: 2.4 }, titulo: 'OS LUTADORES', tag: 'canto vermelho × canto azul',
    rotulos: [{ texto: 'CANTO VERMELHO', lutador: 0 }, { texto: 'CANTO AZUL', lutador: 1 }] },
  { tipo: 'guarda', dur: 5.8, cam: { de: orbitar(CAMERAS.frente34, -12), ate: orbitar(CAMERAS.frente34, 20) }, titulo: 'GUARDA', tag: 'base ortodoxa · pé esquerdo na frente',
    dicas: [
      { de: 0.5, ate: 1.8, ...dica('pé de trás a 45°, calcanhar levantado', PONTOS.calcanhar('d')) },
      { de: 1.8, ate: 3.1, ...dica('joelhos levemente dobrados', PONTOS.joelho('e')) },
      { de: 3.1, ate: 4.4, ...dica('cotovelos fechados, protegendo a costela', PONTOS.cotovelo('d')) },
      { de: 4.4, ate: 5.8, ...dica('queixo baixo, luvas no rosto', PONTOS.queixo) },
    ] },
  { tipo: 'real', golpe: 'jab', repete: 2, cam: { de: CAMERAS.lado, ate: orbitar(CAMERAS.lado, 6) }, titulo: 'JAB', tag: 'velocidade real' },
  { tipo: 'lento', golpe: 'jab', cam: { de: orbitar(CAMERAS.lado, -8), ate: orbitar(CAMERAS.lado, -20) }, titulo: 'JAB', tag: 'câmera lenta',
    dicas: { ida: dica('sai reto da guarda, sem armar', PONTOS.luva('e')), pausa: [dica('punho gira: palma para baixo', PONTOS.punho('e')), dica('ombro sobe e protege o queixo', PONTOS.ombro('e'))], volta: dica('volta pela mesma linha', PONTOS.luva('e')) } },
  { tipo: 'real', golpe: 'direto', repete: 2, cam: { de: CAMERAS.frente34, ate: orbitar(CAMERAS.frente34, -8) }, titulo: 'DIRETO', tag: 'velocidade real' },
  { tipo: 'lento', golpe: 'direto', cam: { de: orbitar(CAMERAS.cima, -6), ate: orbitar(CAMERAS.cima, 8) }, titulo: 'DIRETO', tag: 'câmera lenta',
    dicas: { ida: dica('pé de trás gira na ponta', PONTOS.calcanhar('d')), pausa: [dica('quadril e ombro giram para o alvo', PONTOS.quadril), dica('mão da frente volta ao rosto', PONTOS.luva('e'))], volta: dica('volta pelo mesmo caminho', PONTOS.luva('d')) } },
  { tipo: 'real', golpe: 'gancho', repete: 2, cam: { de: orbitar(CAMERAS.frente, 8), ate: orbitar(CAMERAS.frente, -4) }, titulo: 'GANCHO', tag: 'velocidade real' },
  { tipo: 'lento', golpe: 'gancho', cam: { de: orbitar(CAMERAS.cimaEsq, -6), ate: orbitar(CAMERAS.cimaEsq, 8) }, titulo: 'GANCHO', tag: 'câmera lenta',
    dicas: { ida: dica('cotovelo sobe até a altura do ombro', PONTOS.cotovelo('e')), pausa: [dica('braço em 90°, travado', PONTOS.luva('e')), dica('quem leva o soco é o giro do corpo', PONTOS.quadril)], volta: dica('pé da frente gira e volta', PONTOS.pe('e')) } },
  { tipo: 'real', golpe: 'upper', repete: 2, cam: { de: orbitar(CAMERAS.lado, -22), ate: orbitar(CAMERAS.lado, -12) }, titulo: 'UPPERCUT', tag: 'velocidade real' },
  { tipo: 'lento', golpe: 'upper', cam: { de: orbitar(CAMERAS.lado, -4), ate: orbitar(CAMERAS.lado, 8) }, titulo: 'UPPERCUT', tag: 'câmera lenta',
    dicas: { ida: dica('dobra os joelhos e desce só um palmo', PONTOS.joelho('d')), pausa: [dica('as pernas empurram para cima', PONTOS.quadril), dica('punho pelo centro, palma para você', PONTOS.luva('d'))], volta: dica('volta direto para o queixo', PONTOS.luva('d')) } },
  { tipo: 'combo', golpes: ['jab', 'direto', 'gancho', 'direto'], antes: 0.5, depois: 1.1, dupla: { pos: [-1.35, 0, 0.12], yaw: 0, atraso: 0.12 }, cam: { de: { pos: [-1.55, 1.5, 3.9], alvo: [-0.68, 1.0, 0.3], mm: 30 }, ate: { pos: [0.25, 1.5, 3.95], alvo: [-0.68, 1.0, 0.3], mm: 30 } }, chao: { centro: [-0.68, 0, 0.1], raio: 2.4 }, titulo: '1 · 2 · 3 · 2', tag: 'jab, direto, gancho, direto' },
];

// câmera lenta que freia até parar no impacto, segura e volta: devolve τ(tl) e os tempos de cada fase
function tempoLento(g, v0 = 0.25, pausa = 2.6) {
  const T1 = (2 * g.impacto) / v0; // ida: sai a v0 e freia até parar no impacto
  const T2 = (2 * (g.dur - g.impacto)) / v0; // volta: sai parado e termina a v0
  const tau = (u) => {
    if (u <= 0) return 0;
    if (u < T1) {
      const x = u / T1;
      return g.impacto * (1 - (1 - x) * (1 - x));
    }
    if (u < T1 + pausa) return g.impacto;
    const x = Math.min(1, (u - T1 - pausa) / T2);
    return g.impacto + (g.dur - g.impacto) * x * x;
  };
  return { tau, T1, pausa, T2, total: T1 + pausa + T2 };
}

// monta a linha do tempo: blocos com início, duração e eventos de golpe (em tempo do vídeo)
export function montarAula(roteiro = AULA_TESTE) {
  let T = 0;
  const blocos = roteiro.map((b) => {
    const eventos = [];
    let dur;
    if (b.tipo === 'guarda') dur = b.dur;
    else if (b.tipo === 'real') {
      const g = GOLPES[b.golpe];
      let t = b.antes ?? 0.5;
      for (let k = 0; k < (b.repete ?? 1); k++) {
        const T0 = t;
        eventos.push({ golpe: b.golpe, T0, dur: g.dur, tau: (tl) => tl - T0 });
        t += g.dur + (k < (b.repete ?? 1) - 1 ? b.intervalo ?? 0.6 : 0);
      }
      dur = t + (b.depois ?? 0.5);
    } else if (b.tipo === 'lento') {
      const g = GOLPES[b.golpe];
      const L = tempoLento(g, b.v0, b.pausa);
      const T0 = b.antes ?? 0.35;
      eventos.push({ golpe: b.golpe, T0, dur: L.total, tau: (tl) => L.tau(tl - T0), lento: L });
      dur = T0 + L.total + (b.depois ?? 0.45);
    } else if (b.tipo === 'combo') {
      let t = b.antes ?? 0.4;
      for (const nome of b.golpes) {
        const T0 = t;
        eventos.push({ golpe: nome, T0, dur: GOLPES[nome].dur, tau: (tl) => tl - T0 });
        t += GOLPES[nome].dur + 0.04;
      }
      dur = t + (b.depois ?? 0.6);
    }
    const bloco = { ...b, T0: T, dur, eventos };
    T += dur;
    return bloco;
  });
  const duracao = T;

  function blocoEm(T) {
    for (const b of blocos) if (T < b.T0 + b.dur) return b;
    return blocos[blocos.length - 1];
  }

  // golpe ativo (ou nenhum) no tempo do vídeo
  function golpeEm(T) {
    const b = blocoEm(T);
    const tl = T - b.T0;
    for (const ev of b.eventos) if (tl >= ev.T0 && tl <= ev.T0 + ev.dur) return { b, ev, tau: ev.tau(tl), tl };
    return { b, ev: null, tau: 0, tl };
  }

  // dica da vez: { texto, ponto, alfa }
  function dicaEm(T) {
    const { b, tl } = golpeEm(T);
    const janela = (a, z) => Math.min(1, Math.max(0, Math.min((tl - a) / 0.22, (z - tl) / 0.22)));
    if (Array.isArray(b.dicas)) {
      for (const d of b.dicas) if (tl >= d.de && tl <= d.ate) return { ...d, alfa: janela(d.de, d.ate) };
      return null;
    }
    if (b.tipo === 'lento' && b.dicas) {
      const ev = b.eventos[0];
      const L = ev.lento;
      const a = ev.T0;
      const fases = [[b.dicas.ida, a - 0.2, a + L.T1]];
      const pz = [].concat(b.dicas.pausa);
      pz.forEach((d, i) => fases.push([d, a + L.T1 + (i * L.pausa) / pz.length, a + L.T1 + ((i + 1) * L.pausa) / pz.length]));
      fases.push([b.dicas.volta, a + L.T1 + L.pausa, b.dur]);
      for (const [d, de, ate] of fases) if (tl >= de && tl <= ate) return { ...d, alfa: janela(de, ate) };
    }
    return null;
  }

  // postura no tempo do vídeo: golpe ativo ou guarda com um balanço leve (some perto dos golpes e na câmera lenta)
  // fase: desloca o balanço (o segundo lutador não balança junto com o primeiro)
  function posturaEm(T, fase = 0) {
    const { b, ev, tau, tl } = golpeEm(T);
    const p = ev ? GOLPES[ev.golpe].postura(tau) : guarda();
    if (b.tipo === 'lento') return p;
    let perto = 0;
    for (const e of b.eventos) {
      const dist = tl < e.T0 ? e.T0 - tl : tl > e.T0 + e.dur ? tl - e.T0 - e.dur : 0;
      perto = Math.max(perto, 1 - minjerk(dist / 0.2));
    }
    const amp = 1 - perto;
    const w = 2 * Math.PI * 1.6;
    p.pelve.pos[1] += 0.006 * Math.sin(w * T + fase) * amp;
    p.pelve.yaw += 1.2 * Math.sin(w * 0.5 * T + 0.7 + fase) * amp;
    p.tronco.pitch += 0.8 * Math.sin(w * T + 0.9 + fase) * amp;
    return p;
  }

  // o segundo lutador do bloco (se houver): a mesma aula um pouco atrasada, levada para o lugar dele
  function estadoDuplaEm(T) {
    const b = blocoEm(T);
    if (!b.dupla) return null;
    const Tb = Math.max(b.T0, T - (b.dupla.atraso || 0));
    return posicionar(posar(posturaEm(Tb, 2.1)), b.dupla.pos, b.dupla.yaw || 0);
  }

  // a câmera desliza o tempo todo dentro do bloco (sem parar) e corta entre blocos
  function cameraEm(T) {
    const b = blocoEm(T);
    const u = Math.min(1, Math.max(0, (T - b.T0) / b.dur));
    return misturarCam(b.cam.de, b.cam.ate, 0.5 * minjerk(u) + 0.5 * u);
  }

  return { blocos, duracao, blocoEm, golpeEm, dicaEm, posturaEm, cameraEm, estadoEm: (T) => posar(posturaEm(T)), estadoDuplaEm };
}
