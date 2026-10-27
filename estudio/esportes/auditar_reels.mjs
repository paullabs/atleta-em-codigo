// Auditoria de colisões do Reels do queixo, quadro a quadro, nas duas cenas (reto e gancho).
// Confere cada lutador sozinho (inclui o joelho dobrado e o tombo do alvo) e o vermelho contra o azul
// (a luva encosta na pele; entrar mais que a folga é erro). Uso (da pasta estudio/):
//   node esportes/auditar_reels.mjs [--passo 0.0333] [--pontos 500] [--saida esportes/saida/colisoes_reels.json]
import fs from 'node:fs';
import path from 'node:path';
import { THREE, A, PASSO, TOQUE, CHAO, segs, nomes, amostras, ossoDe, livre, par, paraMundo } from './auditoria_base.js';
import { criarCenas } from './boxe/impacto.js';

const cenas = criarCenas();
const pior = {};
let chao = { afunda: 0, t: 0, seg: '', quem: '' };
let cruzado = { d: Infinity, t: 0, par: '', cena: '' };
const marcar = (k, d, info) => { if (!pior[k] || d < pior[k].d) pior[k] = { d, ...info }; };

for (const [nomeCena, cena] of Object.entries(cenas)) {
  const dur = cena.impacto + 1.6;
  for (let tau = 0; tau <= dur; tau += PASSO) {
    const Es = { vermelho: cena.vermelho(tau), azul: cena.azul(tau) };
    const pos = {};
    for (const [quem, E] of Object.entries(Es)) {
      pos[quem] = segs.map((s, i) => {
        const pts = amostras[i].map((p) => paraMundo(E, ossoDe[i], p));
        return { pts, box: new THREE.Box3().setFromPoints(pts) };
      });
    }
    // cada lutador contra si mesmo e contra o chão
    for (const [quem, E] of Object.entries(Es)) {
      const esf = pos[quem];
      for (let i = 0; i < segs.length; i++) {
        if (/^(pe|dedos)_/.test(segs[i].nome)) for (const p of esf[i].pts) if (-p.y > chao.afunda) chao = { afunda: -p.y, t: tau, seg: segs[i].nome, quem, cena: nomeCena };
        for (let j = 0; j < segs.length; j++) {
          if (i === j || livre.has(par(nomes[i], nomes[j]))) continue;
          if (!esf[i].box.clone().expandByScalar(0.02).intersectsBox(esf[j].box)) continue;
          let min = Infinity;
          for (const p of esf[i].pts) {
            if (!esf[j].box.clone().expandByScalar(0.01).containsPoint(p)) continue;
            const d = segs[j].fn(E, p);
            if (d < min) min = d;
          }
          if (min < -TOQUE) marcar(`${nomeCena}:${quem}:${par(nomes[i], nomes[j])}`, min, { t: tau });
        }
      }
    }
    // vermelho contra azul (todos os pares, nos dois sentidos)
    for (const [de, para] of [['vermelho', 'azul'], ['azul', 'vermelho']]) {
      for (let i = 0; i < segs.length; i++) {
        for (let j = 0; j < segs.length; j++) {
          if (!pos[de][i].box.clone().expandByScalar(0.02).intersectsBox(pos[para][j].box)) continue;
          let min = Infinity;
          for (const p of pos[de][i].pts) {
            if (!pos[para][j].box.clone().expandByScalar(0.01).containsPoint(p)) continue;
            const d = segs[j].fn(Es[para], p);
            if (d < min) min = d;
          }
          if (min < cruzado.d) cruzado = { d: min, t: tau, par: `${de}.${nomes[i]} -> ${para}.${nomes[j]}`, cena: nomeCena };
          if (min < -TOQUE) marcar(`${nomeCena}:${de}>${para}:${nomes[i]}|${nomes[j]}`, min, { t: tau });
        }
      }
    }
  }
}
const lista = Object.entries(pior).map(([k, v]) => ({ par: k, profundidade_cm: +(-v.d * 100).toFixed(2), t: +v.t.toFixed(3) })).sort((a, b) => b.profundidade_cm - a.profundidade_cm);
console.log(`atravessa: ${lista.length} pares · chão: ${(chao.afunda * 100).toFixed(2)} cm (${chao.afunda <= CHAO ? 'ok' : 'afunda'} ${chao.quem} ${chao.seg} ${chao.cena} t=${chao.t.toFixed(2)})`);
console.log(`maior entrada entre os dois lutadores: ${(-cruzado.d * 100).toFixed(2)} cm (${cruzado.par}, ${cruzado.cena}, t=${cruzado.t.toFixed(3)})`);
for (const p of lista.slice(0, 25)) console.log(`  ${p.par.padEnd(60)} ${String(p.profundidade_cm).padStart(5)} cm  t=${p.t}`);
if (A.saida) {
  fs.mkdirSync(path.dirname(path.resolve(A.saida)), { recursive: true });
  fs.writeFileSync(A.saida, JSON.stringify({ atravessa: lista.length, pares: lista, chao, cruzado }, null, 1));
}
