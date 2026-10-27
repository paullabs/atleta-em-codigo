---
name: atualizar-projeto
description: Leva a versão nova do atleta-em-codigo (a do plugin) para um projeto que a pessoa já criou, sem tocar no perfil, nos roteiros e no .env e guardando cópia de tudo o que substitui. Use quando a pessoa disser "atualizar o projeto", "pegar a versão nova do kit", "atualizei o plugin e o meu projeto não tem a novidade", ou depois de rodar `claude plugin update atleta-em-codigo`.
---

# Atualizar um projeto atleta-em-codigo

O plugin instala uma **cópia** do motor na pasta da pessoa. Quando o plugin atualiza, projetos que já existem continuam com o motor antigo até alguém rodar isto. Aqui você leva o motor novo sem estragar o que é dela.

## Passos

1. **Confirme que está num projeto.** `pwd` e `ls -A`: tem de haver `estudio/` e um `package.json` com `"name": "atleta-em-codigo"`. Se não houver, esta não é a skill (use `novo-projeto`, numa pasta vazia).
2. **Compare as versões.**
   ```bash
   node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version"
   node -p "JSON.parse(require('fs').readFileSync('${CLAUDE_PLUGIN_ROOT}/package.json','utf8')).version"
   ```
   A primeira é a do projeto, a segunda é a do plugin. Se a do projeto for maior, o plugin está velho: diga para rodar `claude plugin update atleta-em-codigo@atleta-em-codigo` e reiniciar o Claude Code. Se forem iguais, não há o que atualizar.
3. **Simule e conte o plano em palavras simples:**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/estudio/atualizar_projeto.mjs" --simular
   ```
   Diga quantos arquivos são novos e quantos mudam, e o que o `CHANGELOG.md` do plugin (`${CLAUDE_PLUGIN_ROOT}/CHANGELOG.md`) conta de novo nas versões entre a do projeto e a do plugin. Os arquivos que a pessoa não deve perder (perfil, roteiros, `.env`, `.gitignore`, `estudio.config.json`) nunca são tocados.
4. **Peça o ok e rode:**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/estudio/atualizar_projeto.mjs"
   ```
   O script guarda a cópia de tudo o que substitui em `.atualizacao/<de>-para-<para>/arquivos-antigos/`. Se a pessoa tinha mexido num arquivo do motor, é lá que ele está.
5. **Confira:** `npm run instalar` só se o script disser que as dependências mudaram; depois `npm run doctor` e `npm run conferir -- marca`. Se a pessoa já tem roteiros em `roteiros/`, valide um: `node estudio/esportes/roteiro.mjs roteiros/<nome>.json`.
6. **Termine dizendo:** o que ficou novo (em uma ou duas frases, do CHANGELOG), que a cópia de segurança está em `.atualizacao/`, e que o Claude Code deve ser fechado e aberto de novo nesta pasta para ler a skill `video-esportes` atualizada.

## Regras

- Nunca apague nada, nem a pasta `.atualizacao/`: é a rede de segurança da pessoa.
- Se o script avisar de "Seus arquivos que eu NÃO toco" (o modelo novo é diferente do dela), diga que o modelo novo está em `.atualizacao/<de>-para-<para>/modelos-novos/` e ofereça comparar os dois, sem sobrescrever o dela.
- Não rode `--forcar` sem a pessoa pedir.
