// Roteiro da aula em JSON → o roteiro que montarAula() (boxe/aula.js) entende.
// Para quem não escreve código: a pessoa (ou a skill, na conversa) escreve uma lista de blocos em JSON; aqui cada campo é validado,
// o que faltar é preenchido com os padrões da aula de teste (câmeras, títulos, dicas) e erro de digitação vira mensagem em português.
// Formato e exemplos: esportes/ROTEIRO.md. Roda no Node (render.mjs, auditar.mjs) e no navegador (video.html).
import { AULA_TESTE, CAMERAS, orbitar, PONTOS, montarAula } from './aula.js';
import { GOLPES } from './golpes.js';

export class ErroRoteiro extends Error {
  constructor(erros) {
    super(erros.join('\n'));
    this.name = 'ErroRoteiro';
    this.erros = erros;
  }
}

const TIPOS = ['abertura', 'guarda', 'real', 'lento', 'combo'];
const COMUNS = ['tipo', 'titulo', 'tag', 'camera', 'dupla', 'chao', 'rotulos', 'dicas', 'nota'];
const POR_TIPO = {
  abertura: ['dur'],
  guarda: ['dur'],
  real: ['golpe', 'repete', 'intervalo', 'antes', 'depois'],
  lento: ['golpe', 'v0', 'pausa', 'antes', 'depois'],
  combo: ['golpes', 'antes', 'depois'],
};
const VISTAS = Object.keys(CAMERAS);
const NOMES_GOLPES = Object.keys(GOLPES);
const SEM_LADO = ['queixo', 'quadril'];
const COM_LADO = ['luva', 'punho', 'cotovelo', 'ombro', 'calcanhar', 'pe', 'joelho'];
export const PONTOS_DO_CORPO = [...SEM_LADO, ...COM_LADO.flatMap((n) => [`${n}_e`, `${n}_d`])];
const CODIGO_DO_GOLPE = { jab: 1, direto: 2, gancho: 3, upper: 6 }; // a numeração do boxe: 1 jab, 2 direto, 3 gancho da frente, 6 uppercut de trás

// os padrões vêm da própria aula de teste: o que a pessoa não disser fica igual ao vídeo-aula oficial
const OFICIAL = {
  abertura: AULA_TESTE.find((b) => b.tipo === 'guarda' && b.dupla),
  guarda: AULA_TESTE.find((b) => b.tipo === 'guarda' && !b.dupla),
  combo: AULA_TESTE.find((b) => b.tipo === 'combo'),
};
const doGolpe = (tipo, g) => AULA_TESTE.find((b) => b.tipo === tipo && b.golpe === g);

export const MODELO = {
  titulo: 'Minha aula',
  nota: 'Todos os campos e exemplos: estudio/esportes/ROTEIRO.md',
  blocos: [{ tipo: 'abertura' }, { tipo: 'guarda' }, { tipo: 'real', golpe: 'jab', repete: 2 }, { tipo: 'lento', golpe: 'jab' }, { tipo: 'combo', golpes: ['jab', 'direto'] }],
};

function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function sugere(x, lista) {
  let melhor = null;
  let m = 3;
  for (const o of lista) {
    const d = distancia(String(x).toLowerCase(), o.toLowerCase());
    if (d < m) {
      m = d;
      melhor = o;
    }
  }
  return melhor ? ` (você quis dizer "${melhor}"?)` : '';
}
const ehObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function roteiroDeJson(json) {
  const erros = [];
  const avisos = [];
  const E = (c, m) => erros.push(`${c}: ${m}`);
  const A = (c, m) => avisos.push(`${c}: ${m}`);

  function numero(v, c, { min, max, padrao, inteiro } = {}) {
    if (v === undefined) return padrao;
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      E(c, `precisa ser um número (veio ${JSON.stringify(v)})`);
      return padrao;
    }
    if (inteiro && !Number.isInteger(v)) E(c, `precisa ser um número inteiro (veio ${v})`);
    if ((min !== undefined && v < min) || (max !== undefined && v > max)) E(c, `fora do limite, de ${min} a ${max} (veio ${v})`);
    return v;
  }
  function texto(v, c, { max, aviso } = {}) {
    if (typeof v !== 'string' || !v.trim()) {
      E(c, 'precisa ser um texto não vazio');
      return undefined;
    }
    if (max && v.length > max) E(c, `texto longo demais (${v.length} letras; no máximo ${max})`);
    else if (aviso && v.length > aviso) A(c, `texto com ${v.length} letras pode passar da borda da tela (o ideal é até ${aviso})`);
    return v;
  }
  function vet3(v, c) {
    if (!Array.isArray(v) || v.length !== 3 || v.some((x) => typeof x !== 'number' || !Number.isFinite(x))) {
      E(c, 'precisa ser uma lista de 3 números, [x, y, z] em metros');
      return null;
    }
    return v;
  }
  function chavesDesconhecidas(o, validos, c, o_que) {
    for (const k of Object.keys(o)) if (!validos.includes(k)) E(`${c}.${k}`, `campo desconhecido ${o_que}${sugere(k, validos)}; use ${validos.join(', ')}`);
  }

  // ---- câmeras: uma vista pelo nome, uma vista girada, ou posição/alvo/lente à mão
  function pontoDeCamera(p, c) {
    if (typeof p === 'string') {
      if (!CAMERAS[p]) {
        E(c, `a vista "${p}" não existe${sugere(p, VISTAS)}; use ${VISTAS.join(', ')}`);
        return null;
      }
      return CAMERAS[p];
    }
    if (ehObjeto(p)) {
      chavesDesconhecidas(p, ['vista', 'orbita', 'pos', 'alvo', 'mm'], c, 'na câmera');
      let base = null;
      if (p.vista !== undefined) {
        if (p.pos !== undefined || p.alvo !== undefined || p.mm !== undefined) E(c, 'use "vista" OU "pos", "alvo" e "mm", não os dois juntos');
        if (!CAMERAS[p.vista]) E(`${c}.vista`, `a vista "${p.vista}" não existe${sugere(p.vista, VISTAS)}; use ${VISTAS.join(', ')}`);
        else base = CAMERAS[p.vista];
      } else {
        const pos = vet3(p.pos, `${c}.pos`);
        const alvo = vet3(p.alvo, `${c}.alvo`);
        const mm = numero(p.mm ?? 35, `${c}.mm`, { min: 14, max: 200 });
        if (pos && alvo) base = { pos, alvo, mm };
      }
      const graus = numero(p.orbita, `${c}.orbita`, { min: -360, max: 360, padrao: 0 });
      return base ? (graus ? orbitar(base, graus) : base) : null;
    }
    E(c, 'a câmera é o nome de uma vista ("lado"), { "vista": "lado", "orbita": 10 } ou { "pos": [x, y, z], "alvo": [x, y, z], "mm": 35 }');
    return null;
  }
  function camera(spec, c) {
    if (ehObjeto(spec) && ('de' in spec || 'ate' in spec)) {
      chavesDesconhecidas(spec, ['de', 'ate'], c, 'na câmera');
      if (!('de' in spec && 'ate' in spec)) {
        E(c, 'use "de" e "ate" juntos (onde a câmera começa e onde termina o bloco)');
        return null;
      }
      const de = pontoDeCamera(spec.de, `${c}.de`);
      const ate = pontoDeCamera(spec.ate, `${c}.ate`);
      return de && ate ? { de, ate } : null;
    }
    const p = pontoDeCamera(spec, c);
    return p ? { de: p, ate: p } : null; // uma câmera só: fica parada no bloco
  }

  // ---- dicas: um texto curto e o ponto do corpo onde o anel aparece
  function pontoDoCorpo(nome, c) {
    if (typeof nome !== 'string') {
      E(c, 'precisa ser um texto, por exemplo "cotovelo_e"');
      return null;
    }
    if (SEM_LADO.includes(nome)) return PONTOS[nome];
    const m = /^([a-z]+)_(e|d)$/.exec(nome);
    if (m && COM_LADO.includes(m[1])) return PONTOS[m[1]](m[2]);
    E(c, `o ponto "${nome}" não existe${sugere(nome, PONTOS_DO_CORPO)}; use ${PONTOS_DO_CORPO.join(', ')} (e = esquerdo, d = direito)`);
    return null;
  }
  function dica(d, c, janela) {
    if (!ehObjeto(d)) {
      E(c, 'cada dica é um objeto { "texto": "...", "ponto": "cotovelo_e" }');
      return null;
    }
    chavesDesconhecidas(d, janela ? ['de', 'ate', 'texto', 'ponto'] : ['texto', 'ponto'], c, 'na dica');
    const t = texto(d.texto, `${c}.texto`, { max: 120, aviso: 60 });
    const ponto = pontoDoCorpo(d.ponto, `${c}.ponto`);
    const out = { texto: t, ponto };
    if (janela) {
      out.de = numero(d.de, `${c}.de`, { min: 0, max: 120 });
      out.ate = numero(d.ate, `${c}.ate`, { min: 0, max: 120 });
      if (out.de !== undefined && out.ate !== undefined && out.ate <= out.de) E(c, '"ate" precisa ser maior que "de"');
      if (out.de === undefined || out.ate === undefined) E(c, 'a dica precisa de "de" e "ate" (segundos desde o começo do bloco)');
    }
    return t && ponto ? out : null;
  }
  function dicas(spec, tipo, c) {
    if (spec === false || spec === null) return false; // sem dicas
    if (tipo === 'lento') {
      if (!ehObjeto(spec)) {
        E(c, 'na câmera lenta, "dicas" é { "ida": {...}, "pausa": {...} ou [ {...}, ... ], "volta": {...} }, ou "padrao", ou false');
        return undefined;
      }
      chavesDesconhecidas(spec, ['ida', 'pausa', 'volta'], c, 'nas dicas da câmera lenta');
      for (const k of ['ida', 'pausa', 'volta']) if (spec[k] === undefined) E(`${c}.${k}`, 'faltou: a câmera lenta tem uma dica na ida, uma ou mais na pausa e uma na volta');
      const ida = spec.ida === undefined ? null : dica(spec.ida, `${c}.ida`, false);
      const volta = spec.volta === undefined ? null : dica(spec.volta, `${c}.volta`, false);
      const lista = spec.pausa === undefined ? [] : Array.isArray(spec.pausa) ? spec.pausa : [spec.pausa];
      if (Array.isArray(spec.pausa) && (lista.length < 1 || lista.length > 4)) E(`${c}.pausa`, 'use de 1 a 4 dicas na pausa');
      const pausa = lista.map((d, i) => dica(d, `${c}.pausa[${i}]`, false));
      return ida && volta && pausa.length && pausa.every(Boolean) ? { ida, pausa: pausa.length === 1 ? pausa[0] : pausa, volta } : undefined;
    }
    if (!Array.isArray(spec)) {
      E(c, 'neste tipo de bloco, "dicas" é uma lista de { "de": 0.5, "ate": 1.8, "texto": "...", "ponto": "queixo" }, ou "padrao", ou false');
      return undefined;
    }
    if (spec.length > 8) E(c, 'no máximo 8 dicas por bloco (uma por vez na tela)');
    const lista = spec.map((d, i) => dica(d, `${c}[${i}]`, true));
    return lista.every(Boolean) ? lista : undefined;
  }

  // ---- um bloco
  function bloco(b, c) {
    if (!ehObjeto(b)) {
      E(c, 'cada bloco é um objeto, por exemplo { "tipo": "real", "golpe": "jab" }');
      return null;
    }
    const tipo = b.tipo;
    if (!TIPOS.includes(tipo)) {
      E(`${c}.tipo`, `${tipo === undefined ? 'faltou o tipo' : `o tipo "${tipo}" não existe${sugere(tipo, TIPOS)}`}; use ${TIPOS.join(', ')}`);
      return null;
    }
    chavesDesconhecidas(b, [...COMUNS, ...POR_TIPO[tipo]], c, `no bloco "${tipo}"`);

    let out;
    if (tipo === 'abertura' || tipo === 'guarda') {
      const base = OFICIAL[tipo];
      const dur = numero(b.dur, `${c}.dur`, { min: 0.5, max: 30, padrao: base.dur });
      out = { ...base, tipo: 'guarda', dur };
      if (tipo === 'guarda' && dur < base.dur) delete out.dicas; // as dicas padrão da guarda precisam dos 5,8 s inteiros
    } else if (tipo === 'real' || tipo === 'lento') {
      const g = b.golpe;
      if (!NOMES_GOLPES.includes(g)) {
        E(`${c}.golpe`, `${g === undefined ? 'faltou o golpe' : `o golpe "${g}" não existe${sugere(g, NOMES_GOLPES)}`}; use ${NOMES_GOLPES.join(', ')}`);
        return null;
      }
      const base = doGolpe(tipo, g);
      out = { tipo, golpe: g, cam: base.cam, titulo: base.titulo, tag: base.tag };
      if (base.dicas) out.dicas = base.dicas;
      if (tipo === 'real') {
        out.repete = numero(b.repete, `${c}.repete`, { min: 1, max: 10, padrao: 1, inteiro: true });
        const intervalo = numero(b.intervalo, `${c}.intervalo`, { min: 0, max: 5 });
        if (intervalo !== undefined) out.intervalo = intervalo;
      } else {
        const v0 = numero(b.v0, `${c}.v0`, { min: 0.05, max: 1 });
        const pausa = numero(b.pausa, `${c}.pausa`, { min: 0, max: 8 });
        if (v0 !== undefined) out.v0 = v0;
        if (pausa !== undefined) out.pausa = pausa;
      }
    } else {
      const lista = b.golpes;
      if (!Array.isArray(lista) || lista.length < 1 || lista.length > 12) {
        E(`${c}.golpes`, 'precisa ser uma lista de 1 a 12 golpes, por exemplo ["jab", "direto"]');
        return null;
      }
      let ruim = false;
      lista.forEach((g, i) => {
        if (!NOMES_GOLPES.includes(g)) {
          E(`${c}.golpes[${i}]`, `o golpe "${g}" não existe${sugere(g, NOMES_GOLPES)}; use ${NOMES_GOLPES.join(', ')}`);
          ruim = true;
        }
      });
      if (ruim) return null;
      const base = OFICIAL.combo;
      out = { tipo: 'combo', golpes: lista, cam: base.cam, dupla: base.dupla, chao: base.chao, titulo: lista.map((g) => CODIGO_DO_GOLPE[g]).join(' · '), tag: lista.join(', ') };
    }
    if (tipo === 'real' || tipo === 'lento' || tipo === 'combo') {
      for (const k of ['antes', 'depois']) {
        const v = numero(b[k], `${c}.${k}`, { min: 0, max: 10 });
        if (v !== undefined) out[k] = v;
      }
    }

    // o que a pessoa disse vale mais que o padrão
    if (b.titulo !== undefined) out.titulo = texto(b.titulo, `${c}.titulo`, { max: 40, aviso: 16 });
    if (b.tag !== undefined) out.tag = texto(b.tag, `${c}.tag`, { max: 60, aviso: 40 });
    if (b.camera !== undefined) out.cam = camera(b.camera, `${c}.camera`);
    if (b.dupla !== undefined) {
      if (b.dupla === false) {
        delete out.dupla;
        if (b.chao === undefined) delete out.chao;
      } else if (b.dupla === true) {
        if (!out.dupla) E(`${c}.dupla`, 'true só vale em "abertura" e "combo"; nos outros blocos dê { "pos": [x, y, z], "yaw": 180, "atraso": 0.2 }');
      } else if (ehObjeto(b.dupla)) {
        chavesDesconhecidas(b.dupla, ['pos', 'yaw', 'atraso'], `${c}.dupla`, 'na dupla');
        const pos = vet3(b.dupla.pos, `${c}.dupla.pos`);
        const yaw = numero(b.dupla.yaw, `${c}.dupla.yaw`, { min: -360, max: 360, padrao: 0 });
        const atraso = numero(b.dupla.atraso, `${c}.dupla.atraso`, { min: 0, max: 2, padrao: 0 });
        if (pos) out.dupla = { pos, yaw, atraso };
        if (!b.camera && tipo !== 'abertura' && tipo !== 'combo') A(`${c}.dupla`, 'a câmera padrão deste bloco não enquadra dois lutadores; dê uma "camera" própria');
      } else E(`${c}.dupla`, 'use false (sem o segundo lutador), true (o padrão) ou { "pos": [x, y, z], "yaw": 180, "atraso": 0.2 }');
    }
    if (b.chao !== undefined) {
      if (ehObjeto(b.chao)) {
        chavesDesconhecidas(b.chao, ['centro', 'raio'], `${c}.chao`, 'no chão');
        const centro = vet3(b.chao.centro, `${c}.chao.centro`);
        const raio = numero(b.chao.raio, `${c}.chao.raio`, { min: 0.5, max: 10, padrao: 1.8 });
        if (centro) out.chao = { centro, raio };
      } else E(`${c}.chao`, 'use { "centro": [x, y, z], "raio": 2.4 }');
    }
    if (b.rotulos !== undefined) {
      if (b.rotulos === false) delete out.rotulos;
      else if (Array.isArray(b.rotulos) && b.rotulos.length <= 2) {
        out.rotulos = b.rotulos.map((r, i) => {
          if (!ehObjeto(r)) return (E(`${c}.rotulos[${i}]`, 'use { "texto": "CANTO VERMELHO", "lutador": 0 }'), null);
          chavesDesconhecidas(r, ['texto', 'lutador'], `${c}.rotulos[${i}]`, 'no rótulo');
          const t = texto(r.texto, `${c}.rotulos[${i}].texto`, { max: 30 });
          const l = numero(r.lutador, `${c}.rotulos[${i}].lutador`, { min: 0, max: 1, inteiro: true });
          return t && l !== undefined ? { texto: t, lutador: l } : null;
        });
        if (!out.dupla && tipo !== 'abertura') A(`${c}.rotulos`, 'o segundo rótulo (lutador 1) só aparece onde há "dupla"');
      } else E(`${c}.rotulos`, 'use uma lista de até 2 rótulos { "texto": "CANTO AZUL", "lutador": 1 }, ou false');
    }
    if (b.dicas !== undefined && b.dicas !== 'padrao') {
      const d = dicas(b.dicas, tipo === 'lento' ? 'lento' : 'lista', `${c}.dicas`);
      if (d === false) delete out.dicas;
      else if (d !== undefined) out.dicas = d;
    }
    if (b.nota !== undefined && typeof b.nota !== 'string') E(`${c}.nota`, 'a nota é só um texto livre para você; ela não vai para o vídeo');
    return out;
  }

  // ---- o roteiro inteiro
  const lista = Array.isArray(json) ? json : ehObjeto(json) ? json.blocos : null;
  if (!Array.isArray(lista)) {
    const chave = ehObjeto(json) ? Object.keys(json).find((k) => k !== 'blocos' && sugere(k, ['blocos'])) : null;
    throw new ErroRoteiro([`o roteiro precisa ser { "blocos": [ ... ] } (ou uma lista de blocos)${chave ? `; achei o campo "${chave}", você quis dizer "blocos"?` : ''}`]);
  }
  if (ehObjeto(json)) chavesDesconhecidas(json, ['titulo', 'autor', 'nota', 'blocos'], 'roteiro', 'no topo do roteiro');
  if (!lista.length) E('blocos', 'a lista está vazia; ponha pelo menos um bloco');
  if (lista.length > 40) E('blocos', `${lista.length} blocos é demais; no máximo 40 (divida em dois vídeos)`);
  const roteiro = lista.map((b, i) => bloco(b, `blocos[${i}]`));
  if (erros.length) throw new ErroRoteiro(erros);

  const aula = montarAula(roteiro);
  if (aula.duracao > 120) A('roteiro', `a aula dura ${aula.duracao.toFixed(0)} s; o render de um vídeo longo pode levar mais de meia hora`);
  aula.blocos.forEach((b, i) => {
    if (Array.isArray(b.dicas)) for (const d of b.dicas) if (d.ate > b.dur + 1e-6) A(`blocos[${i}].dicas`, `a dica "${d.texto}" termina em ${d.ate} s, depois do fim do bloco (${b.dur.toFixed(1)} s)`);
  });
  return { roteiro, avisos, aula };
}

// linhas de resumo: o que a pessoa confere antes de renderizar
export function resumoRoteiro(aula) {
  const s = (n) => n.toFixed(1).replace('.', ',').padStart(5);
  const linhas = aula.blocos.map((b) => `  ${s(b.T0)} s  ${s(b.dur)} s  ${b.tipo.padEnd(7)} ${b.titulo}${b.golpe ? ` (${b.golpe}${b.repete > 1 ? ` ×${b.repete}` : ''})` : b.golpes ? ` (${b.golpes.join(', ')})` : ''}`);
  return [`${aula.blocos.length} blocos · ${aula.duracao.toFixed(1).replace('.', ',')} s · ${Math.round(aula.duracao * 30)} quadros a 30 qps`, '  início    duração  bloco', ...linhas];
}
