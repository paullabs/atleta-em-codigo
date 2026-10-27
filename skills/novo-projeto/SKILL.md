---
name: novo-projeto
description: Cria, na pasta atual, um projeto do atleta-em-codigo (estúdio de vídeos de luta em código) a partir deste plugin. Copia o kit sem sobrescrever nada, instala as dependências, confere o computador e deixa o perfil para preencher. Use quando a pessoa disser "começar", "criar meu projeto", "instalar o atleta-em-codigo" ou abrir o Claude Code numa pasta vazia depois de instalar o plugin.
---

# Novo projeto atleta-em-codigo

Este plugin só instala o projeto. Os vídeos são feitos **dentro do projeto**, na pasta da pessoa, com a skill `video-esportes` que vai junto na cópia (a versão certa para o motor copiado).

## Passos

1. **Veja onde está.** Rode `pwd` e `ls -A`.
   - Se já existem `estudio/` e um `package.json` com `"name": "atleta-em-codigo"`, a pasta **já é um projeto**: não copie nada; siga para a skill `video-esportes`.
   - Se a pasta tem outras coisas e não é claramente a que a pessoa quer, **pergunte antes** e sugira criar uma pasta nova (por exemplo `meus-videos-de-luta`) e abrir o Claude Code nela. O script não sobrescreve nada: se houver conflito, ele para sem copiar.
2. **Confira o básico.** `node --version` (precisa de 18 ou mais) e `ffmpeg -version`. Se faltar um deles, diga o comando de instalação (no Mac: `brew install node ffmpeg`) e **espere o sim** da pessoa antes de instalar. O Chrome e a placa de vídeo são conferidos pelo `doctor`.
3. **Copie o kit** para a pasta atual:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/estudio/novo_projeto.mjs"
   ```
   Para só ver o que seria copiado, acrescente `--simular`.
4. **Instale e confira:** `npm run instalar`, depois `npm run doctor`. Explique cada `[FALTA]` e `[AVISO]` em palavras simples (swap cheio, sem chave da ElevenLabs etc.); só `[FALTA]` impede de renderizar.
5. **Ofereça o exemplo:** `npm run exemplo:esportes` renderiza 2 s de vídeo de teste (540×960, sem som, uns 10 s). Rode só se a pessoa quiser; use a placa de vídeo, então avise se o computador estiver pesado.
6. **Perfil da casa:** `perfil/perfil_da_casa.md` diz quem aprova, o que precisa do sim da pessoa (gastar crédito, render inteiro, publicar), idioma e gostos. Ofereça preenchê-lo conversando.
7. **Diga as duas condições, em uma frase:** o kit tem uma licença própria (`LICENSE`) e **todo vídeo publicado leva a marca d'água do canal do Titular**; não é permitido vender o kit. Detalhes no `LEIAME.md`.
8. **Próximo passo:** a pessoa deve abrir o Claude Code **dentro desta pasta** (se a skill `video-esportes` não aparecer, fechar e abrir de novo) e pedir o vídeo.

## Regras

- Nunca copie para dentro de uma pasta do próprio plugin nem sobrescreva arquivos.
- Não gaste crédito de voz ou de qualquer serviço pago, nem publique nada, sem o sim da pessoa.
- O computador pode estar pesado: use `--leve` nos renders e confira o `doctor` antes.
