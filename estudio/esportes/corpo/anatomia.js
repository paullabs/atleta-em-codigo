// Anatomia do atleta em primitivas de distância (SDF), descrita na pose de repouso (ver esqueleto.js).
// Cada segmento anda com um osso; dentro do segmento as primitivas se fundem com mistura suave (k em metros).
// Segmentos vizinhos se fundem só perto da junta que os liga (pares), o resto se encosta sem derreter:
// cotovelo na costela, luva no rosto e coxa com coxa fazem dobra, não massa.
// Toda primitiva de músculo leva o nome do músculo (m), para a academia acender a região trabalhada.

// ---- primitivas ----
// E elipsoide (centro, raios, giro em graus XYZ) · C cone arredondado (a, b, raio em a, raio em b)
// B caixa arredondada (centro, meias medidas, arredondamento, giro) · T tronco de cone de pontas retas (a, b, ra, rb, arredondamento)
// Y cilindro elíptico em pé (centro, [rx, rz], meia altura, arredondamento, giro) · P corte por plano (normal, deslocamento)
const E = (c, r, rot = [0, 0, 0], o = {}) => ({ t: 'E', c, r, rot, ...o });
const C = (a, b, ra, rb, o = {}) => ({ t: 'C', a, b, ra, rb, ...o });
const B = (c, h, rr, rot = [0, 0, 0], o = {}) => ({ t: 'B', c, h, rr, rot, ...o });
const T = (a, b, ra, rb, rr, o = {}) => ({ t: 'T', a, b, ra, rb, rr, ...o });
const Y = (c, r, h, rr, rot = [0, 0, 0], o = {}) => ({ t: 'Y', c, r, h, rr, rot, ...o });
const P = (n, d, o = {}) => ({ t: 'P', n, d, op: 'corte', ...o });
const sub = (pr, k = 0.01) => ({ ...pr, op: 'sub', k });

export const MATERIAIS = { pele: 0, luva: 1, faixa: 2, short: 3, cos: 4 };

export const MUSCULOS = [
  ['peitoral', 'Peitoral maior'],
  ['deltoide_ant', 'Deltoide anterior'],
  ['deltoide_lat', 'Deltoide lateral'],
  ['deltoide_post', 'Deltoide posterior'],
  ['biceps', 'Bíceps'],
  ['braquial', 'Braquial'],
  ['triceps', 'Tríceps'],
  ['antebraco', 'Antebraço'],
  ['reto', 'Reto abdominal'],
  ['obliquos', 'Oblíquos'],
  ['serratil', 'Serrátil anterior'],
  ['dorsal', 'Dorsal (latíssimo)'],
  ['trapezio', 'Trapézio'],
  ['infraespinal', 'Infraespinal'],
  ['redondo', 'Redondo maior'],
  ['eretores', 'Eretores da espinha'],
  ['gluteo_max', 'Glúteo máximo'],
  ['gluteo_med', 'Glúteo médio'],
  ['quadriceps', 'Quadríceps'],
  ['adutores', 'Adutores'],
  ['posteriores', 'Posteriores da coxa'],
  ['panturrilha', 'Panturrilha'],
  ['tibial', 'Tibial anterior'],
  ['esternocleido', 'Esternocleidomastóideo'],
];
// regiões da cabeça que também acendem (ficam fora da lista de músculos das folhas de academia)
export const REGIOES = [
  ['queixo', 'Queixo (mandíbula)'],
  ['rosto', 'Meio do rosto'],
];
export const ZONAS = [...MUSCULOS, ...REGIOES];
export const IDM = Object.fromEntries(ZONAS.map(([id], i) => [id, i]));

// ---- tronco e cabeça (meio do corpo; primitivas com x != 0 marcadas com par:true são espelhadas) ----
const par = (pr) => ({ ...pr, par: true });

// o tórax do modelo original era raso para um esqueleto de tamanho real (costelas e esterno ficavam para fora da pele):
// aprofunda uma lista de formas do tronco (escala em z em torno de z0 e desloca dz), sem mexer em x, y nem nos giros
const profundo = (lista, k, dz, z0 = -0.012) => lista.map((pr) => {
  const q = { ...pr };
  const zz = (z) => z0 + (z - z0) * k + dz;
  if (q.c) q.c = [q.c[0], q.c[1], zz(q.c[2])];
  if (q.a) q.a = [q.a[0], q.a[1], zz(q.a[2])];
  if (q.b) q.b = [q.b[0], q.b[1], zz(q.b[2])];
  if (q.t === 'E') q.r = [q.r[0], q.r[1], q.r[2] * k];
  return q;
});


const PELVE = [
  E([0, 0.945, -0.015], [0.152, 0.097, 0.105]),
  par(E([0.128, 0.905, -0.01], [0.046, 0.066, 0.064], [0, 0, 0], { k: 0.04 })),
  par(E([0.07, 0.885, -0.072], [0.075, 0.088, 0.06], [15, 0, -12], { m: 'gluteo_max', k: 0.035 })),
  par(E([0.118, 0.965, -0.05], [0.045, 0.05, 0.05], [0, 0, 0], { m: 'gluteo_med', k: 0.04 })),
  E([0, 0.985, 0.04], [0.11, 0.07, 0.056], [0, 0, 0], { k: 0.04 }),
  E([0, 0.876, 0.034], [0.055, 0.045, 0.045], [0, 0, 0], { k: 0.04 }),
  E([0, 0.985, 0.07], [0.058, 0.05, 0.022], [0, 0, 0], { m: 'reto', k: 0.03 }),
  par(sub(C([0.117, 1.0, 0.072], [0.035, 0.9, 0.086], 0.006, 0.006), 0.012)),
];

const LOMBAR_BASE = [
  E([0, 1.065, -0.004], [0.128, 0.092, 0.097]),
  E([0, 1.06, 0.074], [0.062, 0.08, 0.026], [0, 0, 0], { m: 'reto', k: 0.03 }),
  par(E([0.098, 1.055, 0.02], [0.04, 0.07, 0.065], [0, 0, -6], { m: 'obliquos', k: 0.035 })),
  par(C([0.034, 1.13, -0.085], [0.034, 0.985, -0.092], 0.03, 0.029, { m: 'eretores', k: 0.03 })),
  sub(C([-0.055, 1.095, 0.103], [0.055, 1.095, 0.103], 0.004, 0.004), 0.01),
  sub(C([0, 1.13, 0.106], [0, 1.0, 0.1], 0.004, 0.004), 0.01),
  sub(E([0, 1.055, 0.1], [0.006, 0.008, 0.01]), 0.006),
  sub(C([0, 1.16, -0.118], [0, 0.97, -0.12], 0.005, 0.005), 0.014),
];
const LOMBAR = profundo(LOMBAR_BASE, 1.1, 0.006);

const TORACICA_BASE = [
  E([0, 1.19, -0.006], [0.14, 0.105, 0.103]),
  E([0, 1.19, 0.08], [0.064, 0.085, 0.028], [0, 0, 0], { m: 'reto', k: 0.03 }),
  par(E([0.105, 1.2, -0.062], [0.03, 0.09, 0.05], [0, 0, 12], { m: 'dorsal', k: 0.045 })),
  par(E([0.112, 1.16, 0.035], [0.035, 0.055, 0.05], [0, 0, 0], { m: 'obliquos', k: 0.035 })),
  par(C([0.032, 1.27, -0.097], [0.033, 1.125, -0.092], 0.024, 0.028, { m: 'eretores', k: 0.03 })),
  sub(C([-0.058, 1.215, 0.11], [0.058, 1.215, 0.11], 0.0045, 0.0045), 0.01),
  sub(C([-0.058, 1.155, 0.111], [0.058, 1.155, 0.111], 0.0045, 0.0045), 0.01),
  sub(C([0, 1.26, 0.112], [0, 1.12, 0.113], 0.0045, 0.0045), 0.01),
  sub(C([0, 1.27, -0.12], [0, 1.12, -0.12], 0.005, 0.005), 0.014),
];
const TORACICA = profundo(TORACICA_BASE, 1.12, 0.008);

const PEITO_BASE = [
  E([0, 1.315, -0.012], [0.15, 0.15, 0.108]),
  E([0, 1.425, -0.03], [0.165, 0.055, 0.085], [0, 0, 0], { k: 0.05 }),
  par(E([0.074, 1.348, 0.07], [0.086, 0.054, 0.024], [0, 0, -18], { m: 'peitoral', k: 0.03 })),
  par(E([0.122, 1.31, -0.055], [0.042, 0.11, 0.07], [0, 0, 18], { m: 'dorsal', k: 0.045 })),
  E([0, 1.37, -0.1], [0.1, 0.1, 0.028], [0, 0, 0], { m: 'trapezio', k: 0.04 }),
  par(E([0.085, 1.33, -0.105], [0.05, 0.055, 0.022], [0, 0, -12], { m: 'infraespinal', k: 0.03 })),
  par(E([0.125, 1.3, -0.085], [0.024, 0.032, 0.022], [0, 0, -40], { m: 'redondo', k: 0.025 })),
  par(E([0.13, 1.245, 0.05], [0.018, 0.04, 0.025], [0, 0, -25], { m: 'serratil', k: 0.03 })),
  par(C([0.03, 1.4, -0.09], [0.032, 1.27, -0.1], 0.02, 0.025, { m: 'eretores', k: 0.03 })),
  sub(C([0, 1.42, 0.09], [0, 1.29, 0.104], 0.004, 0.004), 0.012),
  sub(C([0, 1.43, -0.112], [0, 1.26, -0.124], 0.004, 0.004), 0.014),
];
const PEITO = profundo(PEITO_BASE, 1.12, 0.008);

const PESCOCO = [
  C([0, 1.465, -0.02], [0, 1.6, -0.012], 0.066, 0.056),
  par(C([0.055, 1.61, -0.028], [0.016, 1.47, 0.045], 0.014, 0.012, { m: 'esternocleido', k: 0.02 })),
  E([0, 1.535, 0.04], [0.01, 0.015, 0.011], [0, 0, 0], { k: 0.02 }),
  E([0, 1.53, -0.058], [0.052, 0.065, 0.03], [0, 0, 0], { m: 'trapezio', k: 0.03 }),
];

// cabeça sem rosto: crânio, mandíbula, queixo e um volume leve de sobrancelha e nariz (como um manequim)
const CABECA = [
  E([0, 1.705, -0.015], [0.084, 0.098, 0.108]),
  E([0, 1.64, 0.015], [0.07, 0.084, 0.08], [0, 0, 0], { k: 0.05 }),
  E([0, 1.6, -0.005], [0.062, 0.032, 0.056], [0, 0, 0], { m: 'queixo', k: 0.04 }),
  E([0, 1.576, 0.05], [0.028, 0.022, 0.024], [0, 0, 0], { m: 'queixo', k: 0.04 }),
  E([0, 1.69, 0.068], [0.056, 0.012, 0.02], [0, 0, 0], { k: 0.04 }),
  E([0, 1.665, 0.05], [0.045, 0.055, 0.04], [0, 0, 0], { m: 'rosto', k: 0.01 }),
  par(E([0.087, 1.655, -0.012], [0.01, 0.028, 0.019], [-10, 0, 0], { k: 0.01 })),
];

// ---- membros (descritos do lado esquerdo; o direito é espelhado) ----
const CLAV = [
  E([0.095, 1.47, -0.035], [0.085, 0.032, 0.05], [0, 0, -22], { m: 'trapezio', k: 0.045 }),
  C([0.025, 1.452, 0.05], [0.145, 1.464, 0.01], 0.009, 0.008, { k: 0.03 }),
  E([0.172, 1.46, -0.02], [0.028, 0.018, 0.032], [0, 0, 0], { k: 0.04 }),
  E([0.1, 1.45, 0.005], [0.07, 0.03, 0.04], [0, 0, 0], { k: 0.04 }),
];

const BRACO = [
  C([0.185, 1.43, -0.025], [0.212, 1.125, -0.04], 0.052, 0.04),
  E([0.198, 1.405, 0.012], [0.035, 0.068, 0.03], [0, 0, -8], { m: 'deltoide_ant', k: 0.025 }),
  E([0.226, 1.395, -0.018], [0.03, 0.075, 0.042], [0, 0, -10], { m: 'deltoide_lat', k: 0.025 }),
  E([0.203, 1.395, -0.062], [0.033, 0.068, 0.03], [0, 0, -8], { m: 'deltoide_post', k: 0.025 }),
  E([0.2, 1.255, -0.002], [0.026, 0.08, 0.028], [0, 0, 0], { m: 'biceps', k: 0.028 }),
  E([0.228, 1.19, -0.02], [0.02, 0.05, 0.024], [0, 0, 0], { m: 'braquial', k: 0.025 }),
  E([0.19, 1.28, -0.062], [0.026, 0.095, 0.026], [0, 0, 0], { m: 'triceps', k: 0.03 }),
  E([0.222, 1.3, -0.055], [0.022, 0.065, 0.024], [0, 0, 0], { m: 'triceps', k: 0.028 }),
];

const ANTEBRACO = [
  C([0.213, 1.095, -0.038], [0.226, 0.98, -0.02], 0.045, 0.036),
  E([0.212, 1.105, -0.064], [0.014, 0.018, 0.013], [0, 0, 0], { k: 0.025 }),
  E([0.19, 1.11, -0.045], [0.012, 0.013, 0.012], [0, 0, 0], { k: 0.025 }),
  E([0.234, 1.11, -0.04], [0.011, 0.012, 0.012], [0, 0, 0], { k: 0.025 }),
  E([0.24, 1.05, -0.016], [0.024, 0.07, 0.024], [0, 0, -6], { m: 'antebraco', k: 0.03 }),
  E([0.2, 1.035, -0.016], [0.026, 0.072, 0.027], [0, 0, -6], { m: 'antebraco', k: 0.03 }),
  E([0.23, 1.035, -0.054], [0.022, 0.068, 0.02], [0, 0, 0], { m: 'antebraco', k: 0.03 }),
];

const TORCAO = [
  C([0.226, 0.98, -0.02], [0.24, 0.86, -0.001], 0.036, 0.026),
  E([0.238, 0.88, -0.004], [0.02, 0.03, 0.03], [0, 0, 0], { k: 0.02 }),
];

const COXA = [
  C([0.09, 0.9, 0.0], [0.095, 0.53, 0.008], 0.085, 0.056),
  E([0.138, 0.7, 0.008], [0.042, 0.15, 0.055], [0, 0, 3], { m: 'quadriceps', k: 0.025 }),
  E([0.058, 0.585, 0.03], [0.034, 0.062, 0.036], [0, 0, -15], { m: 'quadriceps', k: 0.02 }),
  E([0.1, 0.725, 0.058], [0.036, 0.15, 0.03], [0, 0, 0], { m: 'quadriceps', k: 0.02 }),
  E([0.045, 0.77, -0.008], [0.042, 0.11, 0.05], [0, 0, -10], { m: 'adutores', k: 0.025 }),
  E([0.072, 0.7, -0.055], [0.035, 0.14, 0.035], [0, 0, 0], { m: 'posteriores', k: 0.02 }),
  E([0.125, 0.69, -0.05], [0.033, 0.14, 0.035], [0, 0, 0], { m: 'posteriores', k: 0.02 }),
  E([0.095, 0.505, -0.002], [0.052, 0.04, 0.048], [0, 0, 0], { k: 0.025 }),
  sub(C([0.125, 0.92, 0.06], [0.055, 0.56, 0.02], 0.006, 0.006), 0.012),
];

const CANELA = [
  C([0.095, 0.48, 0.0], [0.1, 0.1, -0.018], 0.048, 0.027),
  E([0.075, 0.385, -0.042], [0.036, 0.085, 0.04], [0, 0, 5], { m: 'panturrilha', k: 0.02 }),
  E([0.122, 0.4, -0.036], [0.031, 0.075, 0.034], [0, 0, -5], { m: 'panturrilha', k: 0.02 }),
  E([0.1, 0.27, -0.032], [0.044, 0.09, 0.034], [0, 0, 0], { m: 'panturrilha', k: 0.025 }),
  E([0.118, 0.36, 0.035], [0.022, 0.11, 0.02], [0, 0, 0], { m: 'tibial', k: 0.02 }),
  C([0.088, 0.465, 0.04], [0.095, 0.16, 0.004], 0.012, 0.008, { k: 0.02 }),
  C([0.1, 0.21, -0.058], [0.1, 0.065, -0.074], 0.013, 0.012, { k: 0.015 }),
  E([0.1, 0.13, -0.045], [0.022, 0.07, 0.025], [0, 0, 0], { k: 0.025 }),
  E([0.074, 0.08, -0.016], [0.015, 0.018, 0.016], [0, 0, 0], { k: 0.012 }),
  E([0.126, 0.07, -0.026], [0.014, 0.018, 0.015], [0, 0, 0], { k: 0.012 }),
  B([0.095, 0.515, 0.05], [0.023, 0.027, 0.011], 0.011, [0, 0, 0], { k: 0.015 }),
  E([0.095, 0.47, 0.01], [0.048, 0.03, 0.045], [0, 0, 0], { k: 0.025 }),
];

const PE = [
  E([0.1, 0.035, -0.055], [0.03, 0.035, 0.035], [0, 0, 0], { k: 0.02 }),
  E([0.104, 0.045, 0.02], [0.038, 0.035, 0.075], [10, 0, 0], { k: 0.03 }),
  E([0.11, 0.025, 0.105], [0.046, 0.022, 0.05], [0, 0, 0], { k: 0.03 }),
  sub(E([0.064, 0.006, 0.035], [0.016, 0.018, 0.05]), 0.015),
  P([0, -1, 0], 0.0, { k: 0.006 }),
];

const DEDOS = [
  E([0.114, 0.018, 0.162], [0.044, 0.016, 0.035], [0, 0, 0], { k: 0.015 }),
  E([0.084, 0.02, 0.172], [0.017, 0.017, 0.032], [0, 0, 0], { k: 0.012 }),
  P([0, -1, 0], 0.0, { k: 0.005 }),
];

// ---- equipamento ----
// luva de boxe no osso da mão (repouso: mão pendurada, palma para dentro (-X), polegar para a frente (+Z))
function luva() {
  const W = [0.24, 0.85, 0.0];
  const eixo = [-0.106, 0.984, -0.152]; // do punho para o cotovelo
  const ao = (s) => [W[0] + eixo[0] * s, W[1] + eixo[1] * s, W[2] + eixo[2] * s];
  const w = (dx, dy, dz) => [W[0] + dx, W[1] + dy, W[2] + dz];
  return {
    punho: [T(ao(-0.03), ao(0.12), 0.05, 0.051, 0.008, { k: 0.03 })],
    faixa: [T(ao(0.03), ao(0.085), 0.0545, 0.0545, 0.006)],
    corpo: [
      E(w(0.004, -0.105, 0.0), [0.055, 0.095, 0.064], [0, 0, 0], { k: 0.03 }),
      E(w(0.018, -0.12, 0.0), [0.042, 0.08, 0.058], [0, 0, 0], { k: 0.03 }),
      E(w(0.004, -0.163, 0.0), [0.05, 0.04, 0.06], [0, 0, 0], { k: 0.03 }),
      C(w(-0.02, -0.04, 0.052), w(-0.034, -0.13, 0.044), 0.025, 0.021, { k: 0.012 }),
    ],
  };
}

// calção de boxe: cós largo no lombar, bermuda na pelve, pernas largas nas coxas (barra no meio da coxa)
function calcao() {
  return {
    cos: [Y([0, 1.052, 0.0], [0.164, 0.147], 0.046, 0.01)],
    tronco: [
      E([0, 0.935, -0.014], [0.185, 0.115, 0.145], [0, 0, 0], { k: 0.04 }),
      E([0, 0.99, 0.0], [0.166, 0.08, 0.14], [0, 0, 0], { k: 0.04 }),
      E([0, 0.895, -0.06], [0.17, 0.095, 0.1], [0, 0, 0], { k: 0.05 }),
      E([0, 0.835, 0.008], [0.1, 0.07, 0.09], [0, 0, 0], { k: 0.05 }),
    ],
    perna: [T([0.093, 0.93, 0.0], [0.106, 0.665, 0.014], 0.104, 0.118, 0.006, { k: 0.04 })],
  };
}

// ---- montagem ----
function espelhar(pr) {
  const m = (v) => [-v[0], v[1], v[2]];
  const q = { ...pr };
  if (pr.c) q.c = m(pr.c);
  if (pr.a) q.a = m(pr.a);
  if (pr.b) q.b = m(pr.b);
  if (pr.n) q.n = m(pr.n);
  if (pr.rot) q.rot = [pr.rot[0], -pr.rot[1], -pr.rot[2]];
  return q;
}
const comPares = (lista) => lista.flatMap((pr) => (pr.par ? [pr, espelhar(pr)] : [pr]));

export function construirAnatomia({ luvas = true, calcao: comCalcao = true } = {}) {
  const segs = [];
  const seg = (nome, osso, mat, prims, k = 0.02) => segs.push({ nome, osso, mat, k, prims });
  seg('pelve', 'pelve', 'pele', comPares(PELVE), 0.035);
  seg('lombar', 'lombar', 'pele', comPares(LOMBAR), 0.035);
  seg('toracica', 'toracica', 'pele', comPares(TORACICA), 0.035);
  seg('peito', 'peito', 'pele', comPares(PEITO), 0.035);
  seg('pescoco', 'pescoco', 'pele', comPares(PESCOCO), 0.03);
  seg('cabeca', 'cabeca', 'pele', comPares(CABECA), 0.03);
  for (const [s, lado] of [['e', 1], ['d', -1]]) {
    const L = (lista) => (lado > 0 ? lista : lista.map(espelhar));
    seg(`clav_${s}`, `clav_${s}`, 'pele', L(CLAV), 0.025);
    seg(`braco_${s}`, `braco_${s}`, 'pele', L(BRACO), 0.025);
    seg(`antebraco_${s}`, `antebraco_${s}`, 'pele', L(ANTEBRACO), 0.02);
    seg(`torcao_${s}`, `torcao_${s}`, 'pele', L(TORCAO), 0.02);
    seg(`coxa_${s}`, `coxa_${s}`, 'pele', L(COXA), 0.03);
    seg(`canela_${s}`, `canela_${s}`, 'pele', L(CANELA), 0.025);
    seg(`pe_${s}`, `pe_${s}`, 'pele', L(PE), 0.02);
    seg(`dedos_${s}`, `dedos_${s}`, 'pele', L(DEDOS), 0.015);
    if (luvas) {
      const lv = luva();
      seg(`luva_${s}`, `mao_${s}`, 'luva', L([...lv.punho, ...lv.corpo]), 0.03);
      seg(`faixa_${s}`, `mao_${s}`, 'faixa', L(lv.faixa), 0.01);
    }
    if (comCalcao) seg(`short_perna_${s}`, `coxa_${s}`, 'short', L(calcao().perna), 0.04);
  }
  if (comCalcao) {
    const cc = calcao();
    seg('short_tronco', 'pelve', 'short', cc.tronco, 0.04);
    seg('short_cos', 'lombar', 'cos', cc.cos, 0.01);
  }

  // pares que se fundem perto de uma junta: [a, b, k, osso cuja junta localiza a mistura, r0, r1]
  const pares = [
    ['lombar', 'pelve', 0.06, 'lombar', 0.14, 0.24],
    ['toracica', 'lombar', 0.06, 'toracica', 0.14, 0.24],
    ['peito', 'toracica', 0.06, 'peito', 0.14, 0.24],
    ['pescoco', 'peito', 0.045, 'pescoco', 0.1, 0.17],
    ['cabeca', 'pescoco', 0.035, 'cabeca', 0.05, 0.085],
  ];
  for (const s of ['e', 'd']) {
    pares.push(
      [`clav_${s}`, 'peito', 0.045, `clav_${s}`, 0.16, 0.24],
      [`clav_${s}`, 'pescoco', 0.04, `clav_${s}`, 0.12, 0.2],
      [`braco_${s}`, `clav_${s}`, 0.03, `braco_${s}`, 0.08, 0.14],
      [`braco_${s}`, 'peito', 0.025, `braco_${s}`, 0.07, 0.13],
      [`antebraco_${s}`, `braco_${s}`, 0.025, `antebraco_${s}`, 0.06, 0.1],
      [`torcao_${s}`, `antebraco_${s}`, 0.03, `torcao_${s}`, 0.08, 0.14],
      [`coxa_${s}`, 'pelve', 0.035, `coxa_${s}`, 0.1, 0.17],
      [`canela_${s}`, `coxa_${s}`, 0.03, `canela_${s}`, 0.07, 0.12],
      [`pe_${s}`, `canela_${s}`, 0.025, `pe_${s}`, 0.06, 0.1],
      [`dedos_${s}`, `pe_${s}`, 0.015, `dedos_${s}`, 0.04, 0.07],
    );
  }
  const nomes = new Set(segs.map((s) => s.nome));
  // grupos de equipamento: fundem entre si sem localizar (tecido contínuo)
  const grupos = [];
  if (comCalcao) grupos.push({ mat: 'short', segs: ['short_tronco', 'short_perna_e', 'short_perna_d'], k: 0.085 });
  return { segmentos: segs, pares: pares.filter(([a, b]) => nomes.has(a) && nomes.has(b)), grupos };
}
