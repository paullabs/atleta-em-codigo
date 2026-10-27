// Leitura das malhas do BodyParts3D (OBJ em mm: X esquerda do corpo, Y trás (frente = -Y), Z para cima).
// Crédito exigido: "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan"
// (o README da versão 4.0 cita CC BY 4.0, mas o cabeçalho dos arquivos OBJ cita BY-SA 2.1 Japão: vale o mais rígido).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const ORIGINAL = path.resolve(AQUI, '../../modelos/bodyparts3d/original');
const OBJ = path.join(ORIGINAL, 'obj/partof_BP3D_4.0_obj_99');

let _el = null;
export function elementos(fma) {
  if (!_el) {
    _el = new Map();
    for (const l of fs.readFileSync(path.join(ORIGINAL, 'partof_element_parts.txt'), 'utf8').split('\n').slice(1)) {
      const [c, n, e] = l.split('\t');
      if (!c) continue;
      if (!_el.has(c)) _el.set(c, new Set());
      _el.get(c).add(e.trim());
    }
  }
  return [...(_el.get(fma) || [])].sort();
}

// lê um OBJ: posições (m, sistema do BodyParts3D), normais e triângulos
export function lerObj(id) {
  const p = path.join(OBJ, id + '.obj');
  if (!fs.existsSync(p)) return null;
  const v = [];
  const n = [];
  const f = [];
  for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
    if (l.charCodeAt(0) === 118 /* v */) {
      const t = l.split(/\s+/);
      if (t[0] === 'v') v.push(+t[1], +t[2], +t[3]);
      else if (t[0] === 'vn') n.push(+t[1], +t[2], +t[3]);
    } else if (l.charCodeAt(0) === 102 /* f */) {
      const t = l.trim().split(/\s+/).slice(1).map((s) => parseInt(s.split('/')[0], 10) - 1);
      for (let i = 1; i + 1 < t.length; i++) f.push(t[0], t[i], t[i + 1]);
    }
  }
  return { v: Float32Array.from(v), n: Float32Array.from(n), f: Uint32Array.from(f) };
}

// uma parte (conceito FMA): junta os elementos numa malha só
export function lerParte(fma) {
  const vs = [], ns = [], fs_ = [];
  let base = 0;
  for (const e of elementos(fma)) {
    const m = lerObj(e);
    if (!m) continue;
    vs.push(m.v);
    ns.push(m.n.length === m.v.length ? m.n : new Float32Array(m.v.length));
    fs_.push(m.f.map((i) => i + base));
    base += m.v.length / 3;
  }
  const cat = (arrs, T) => {
    const out = new T(arrs.reduce((s, a) => s + a.length, 0));
    let o = 0;
    for (const a of arrs) { out.set(a, o); o += a.length; }
    return out;
  };
  return { v: cat(vs, Float32Array), n: cat(ns, Float32Array), f: cat(fs_, Uint32Array), elementos: elementos(fma).length };
}
