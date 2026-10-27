// Aula própria em JSON, sem escrever código. Valida um roteiro, mostra o resumo e é a porta de entrada do --roteiro do render.mjs e do auditar.mjs.
//   node estudio/esportes/roteiro.mjs roteiros/minha_aula.json            valida e mostra os blocos e a duração
//   node estudio/esportes/roteiro.mjs --modelo > roteiros/minha_aula.json   escreve um roteiro de partida
// O arquivo é procurado na pasta atual e, se não estiver lá, em estudio/. Formato e exemplos: esportes/ROTEIRO.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { roteiroDeJson, resumoRoteiro, ErroRoteiro, MODELO } from './boxe/roteiro_json.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); // estudio/

export function acharArquivo(arq) {
  for (const base of [process.cwd(), RAIZ]) {
    const p = path.resolve(base, arq);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

export function lerRoteiro(arq) {
  if (typeof arq !== 'string' || !arq) throw new ErroRoteiro(['faltou o arquivo: --roteiro roteiros/minha_aula.json']);
  const p = acharArquivo(arq);
  if (!p) throw new ErroRoteiro([`não achei o arquivo "${arq}" (procurei na pasta atual e em estudio/)`]);
  let json;
  try {
    json = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    throw new ErroRoteiro([`${arq}: o JSON está mal formado (${e.message}). Confira vírgulas no fim de lista, aspas e chaves.`]);
  }
  return { arquivo: p, json, ...roteiroDeJson(json) };
}

// para os comandos: erro de roteiro vira lista de mensagens e saída 1, sem pilha de erro
export function lerRoteiroOuSair(arq) {
  try {
    return lerRoteiro(arq);
  } catch (e) {
    if (!(e instanceof ErroRoteiro)) throw e;
    console.error(`Roteiro inválido${typeof arq === 'string' ? ` (${arq})` : ''}:`);
    for (const m of e.erros) console.error(`  ✗ ${m}`);
    process.exit(1);
  }
}

const direto = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (direto) {
  const args = process.argv.slice(2);
  if (args.includes('--modelo')) console.log(JSON.stringify(MODELO, null, 2));
  else if (!args.length || args.includes('--ajuda') || args.includes('--help')) {
    console.log('Uso:\n  node estudio/esportes/roteiro.mjs <roteiro.json>             valida e mostra os blocos e a duração\n  node estudio/esportes/roteiro.mjs --modelo > roteiros/minha_aula.json   escreve um roteiro de partida\nFormato e exemplos: estudio/esportes/ROTEIRO.md');
  } else {
    const r = lerRoteiroOuSair(args[0]);
    console.log(`${args[0]}: válido · ${resumoRoteiro(r.aula).join('\n')}`);
    for (const a of r.avisos) console.log(`  ⚠ ${a}`);
  }
}
