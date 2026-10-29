#!/usr/bin/env node
// Leva a versão do kit que está rodando este script (a do plugin) para um projeto atleta-em-codigo que você já criou.
//   node "${CLAUDE_PLUGIN_ROOT}/estudio/atualizar_projeto.mjs" [pasta-do-projeto] [--simular] [--forcar]
// Sem pasta, usa a pasta atual. --simular só mostra o plano. --forcar reaplica a mesma versão (para consertar um arquivo estragado).
//
// O que faz, e o que nunca faz:
//   - arquivos novos do kit são acrescentados;
//   - arquivos do kit que mudaram são substituídos, e a cópia do que estava lá vai para .atualizacao/<de>-para-<para>/arquivos-antigos/
//     (se você tinha mexido num arquivo do motor, ele não se perde: compare com a cópia);
//   - NÃO toca no que é seu: perfil/, roteiros/, .env, .gitignore e estudio.config.json. Se o modelo novo de um deles é diferente do seu,
//     o modelo vai para .atualizacao/<de>-para-<para>/modelos-novos/ para você comparar;
//   - não apaga nada, e não mexe em saida/, nos dados de anatomia nem em node_modules.
import fs from 'node:fs';
import path from 'node:path';
import { KIT, dentroDe, listarArquivos } from './kit_arquivos.mjs';

const args = process.argv.slice(2);
const simular = args.includes('--simular');
const forcar = args.includes('--forcar');
const destino = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());

const DO_USUARIO = [/^perfil\//, /^roteiros\//, /^\.env$/, /^\.gitignore$/, /^estudio\.config\.json$/];
const lerJson = (p) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};
const numeros = (v) => String(v).split('.').map((x) => parseInt(x, 10) || 0);
const comparar = (a, b) => {
  const x = numeros(a);
  const y = numeros(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
};

if (dentroDe(destino, KIT)) {
  console.error('Rode de dentro da pasta do seu projeto (ou passe o caminho dela): este script é o do kit, não o do projeto.');
  process.exit(2);
}
const novo = lerJson(path.join(KIT, 'package.json'));
const atual = lerJson(path.join(destino, 'package.json'));
if (!atual || atual.name !== 'atleta-em-codigo' || !fs.existsSync(path.join(destino, 'estudio'))) {
  console.error(`A pasta ${destino} não parece um projeto atleta-em-codigo (falta o package.json do kit ou a pasta estudio/).\nPara começar um projeto novo use novo_projeto.mjs, numa pasta vazia.`);
  process.exit(2);
}
const de = atual.version || '0.0.0';
const para = novo.version;
if (comparar(de, para) > 0 && !forcar) {
  console.error(`O projeto (${de}) é mais novo que o kit do plugin (${para}). Atualize o plugin antes: claude plugin update atleta-em-codigo@atleta-em-codigo`);
  process.exit(2);
}
if (comparar(de, para) === 0 && !forcar) {
  console.log(`O projeto já está na versão ${para}. Nada a fazer (use --forcar para reaplicar os arquivos do kit).`);
  process.exit(0);
}

// ---- o plano
const plano = { novos: [], iguais: [], substituidos: [], mantidos: [] };
for (const p of listarArquivos()) {
  const rel = p.join('/');
  const origem = path.join(KIT, ...p);
  const alvo = path.join(destino, ...p);
  let existe = true;
  try {
    fs.lstatSync(alvo);
  } catch {
    existe = false;
  }
  if (!existe) plano.novos.push(rel);
  else if (fs.readFileSync(origem).equals(fs.readFileSync(alvo))) plano.iguais.push(rel);
  else if (DO_USUARIO.some((r) => r.test(rel))) plano.mantidos.push(rel);
  else plano.substituidos.push(rel);
}

const lista = (titulo, itens, max = 12) => {
  if (!itens.length) return;
  console.log(`${titulo} (${itens.length}):`);
  for (const r of itens.slice(0, max)) console.log(`  ${r}`);
  if (itens.length > max) console.log(`  ... e mais ${itens.length - max}`);
};
console.log(`${simular ? '[simulação] ' : ''}Projeto ${de} → kit ${para}, em ${destino}`);
lista('Arquivos novos', plano.novos);
lista('Arquivos do kit que mudam (a cópia do antigo fica em .atualizacao/)', plano.substituidos, 30);
lista('Seus arquivos que eu NÃO toco (o modelo novo deles é diferente)', plano.mantidos);
console.log(`Já iguais: ${plano.iguais.length}`);

if (!simular) {
  let pasta = path.join(destino, '.atualizacao', `${de}-para-${para}`);
  if (fs.existsSync(pasta)) pasta += `-${Date.now()}`;
  const copiar = (origem, alvo) => {
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.copyFileSync(origem, alvo);
  };
  for (const rel of plano.substituidos) copiar(path.join(destino, rel), path.join(pasta, 'arquivos-antigos', rel)); // primeiro as cópias de segurança
  for (const rel of plano.mantidos) copiar(path.join(KIT, rel), path.join(pasta, 'modelos-novos', rel));
  for (const rel of [...plano.novos, ...plano.substituidos]) copiar(path.join(KIT, rel), path.join(destino, rel));
  console.log(`Pronto: ${plano.novos.length} arquivos novos e ${plano.substituidos.length} atualizados.`);
  if (plano.substituidos.length || plano.mantidos.length) console.log(`Cópias de segurança e modelos novos: ${path.relative(destino, pasta)}/`);
}
const deps = [...plano.novos, ...plano.substituidos].some((r) => /^estudio\/(motor3d|ferramentas_locais)\/package(-lock)?\.json$/.test(r));
console.log(`Próximos passos: ${deps ? 'npm run preparar (as dependências mudaram), ' : 'npm run preparar (confere o computador e baixa só o que falta), '}npm run conferir -- marca. O que mudou: CHANGELOG.md. Se o Claude Code estiver aberto nesta pasta, feche e abra de novo para ele ler a skill atualizada.`);
