#!/usr/bin/env node
// Cria um projeto do atleta-em-codigo numa pasta: copia o kit para lá, sem sobrescrever nada.
//   node estudio/novo_projeto.mjs [pasta-destino] [--simular]
// Sem pasta, usa a pasta atual. Pelo plugin do Claude Code o caminho é o da instalação do plugin:
//   node "${CLAUDE_PLUGIN_ROOT}/estudio/novo_projeto.mjs"
// Se algum arquivo do destino já existir, nada é copiado e o script lista os conflitos (código 1).
// O que entra na cópia está em kit_arquivos.mjs. Para levar uma versão nova a um projeto que já existe: atualizar_projeto.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { KIT, dentroDe, listarArquivos } from './kit_arquivos.mjs';

const args = process.argv.slice(2);
const simular = args.includes('--simular');
const destino = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());

if (dentroDe(destino, KIT)) {
  console.error(`O destino (${destino}) está dentro do próprio kit.\nAbra uma pasta nova para os seus vídeos (por exemplo ~/meus-videos-de-luta) e rode de lá.`);
  process.exit(2);
}

const arquivos = listarArquivos();
const conflitos = arquivos.filter((p) => {
  try {
    fs.lstatSync(path.join(destino, ...p));
    return true;
  } catch {
    return false;
  }
});
if (conflitos.length) {
  console.error(`Nada foi copiado: ${conflitos.length} arquivo(s) já existem em ${destino}:`);
  for (const p of conflitos.slice(0, 10)) console.error(`  ${p.join('/')}`);
  if (conflitos.length > 10) console.error(`  ... e mais ${conflitos.length - 10}`);
  console.error('Use uma pasta vazia (ou sem estes nomes). O script nunca sobrescreve. Se esta pasta já é um projeto e você quer a versão nova do kit, use atualizar_projeto.mjs.');
  process.exit(1);
}

if (!simular) {
  for (const p of arquivos) {
    const para = path.join(destino, ...p);
    fs.mkdirSync(path.dirname(para), { recursive: true });
    fs.copyFileSync(path.join(KIT, ...p), para, fs.constants.COPYFILE_EXCL);
  }
}
console.log(`${simular ? '[simulação] copiaria' : 'Copiei'} ${arquivos.length} arquivos para ${destino}`);
console.log('Próximos passos, nessa pasta:\n  npm run instalar      (uma vez: baixa o three.js e o Playwright)\n  npm run doctor        (confere o computador)\n  npm run exemplo:esportes   (2 s de vídeo de teste)\nDepois edite perfil/perfil_da_casa.md e abra o Claude Code nesta pasta para pedir o seu vídeo.');
