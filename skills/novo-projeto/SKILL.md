---
name: novo-projeto
description: Cria, na pasta atual, um projeto do atleta-em-codigo (estúdio de vídeos de luta em código) a partir deste plugin, no Mac ou no Windows. Copia o kit sem sobrescrever nada, confere o computador e baixa só o que faltar (ffmpeg, navegador, pacotes) e deixa o perfil para preencher. Use quando a pessoa disser "começar", "criar meu projeto", "instalar o atleta-em-codigo" ou abrir o Claude Code numa pasta vazia depois de instalar o plugin.
---

# Novo projeto atleta-em-codigo

Este plugin só instala o projeto. Os vídeos são feitos **dentro do projeto**, na pasta da pessoa, com a skill `video-esportes` que vai junto na cópia (a versão certa para o motor copiado).

Os comandos `node ...` abaixo são iguais no Mac e no Windows. Use o terminal que o Claude Code já usa (no Windows, PowerShell ou Git Bash). No PowerShell do Windows, se `npm` der o erro "a execução de scripts está desabilitada neste sistema", troque `npm` por `npm.cmd` (por exemplo `npm.cmd run exemplo:esportes`); os comandos `node ...` não têm esse problema.

> **Raiz do plugin (Claude Code e Codex).** Os comandos abaixo precisam da pasta do plugin, que o Claude Code chama de CLAUDE_PLUGIN_ROOT. O Claude Code troca a variável pelo caminho antes de você ler este texto. O Codex e outros agentes não trocam: lá a variável sai vazia, e o comando falha com "Cannot find module" ou "No such file". Se os comandos abaixo ainda mostram a variável escrita com cifrão e chaves, em vez de um caminho de pasta, **pare antes de rodar qualquer um**: a raiz do plugin é a pasta duas acima da pasta desta skill, a que tem o arquivo `.claude-plugin/plugin.json`. Confirme que o arquivo existe lá e use esse caminho absoluto no lugar da variável em todos os comandos. Nunca rode um comando com a raiz vazia.

## Antes de começar: o plugin está instalado para todas as pastas?

Se a pessoa instalou o plugin só para uma pasta, ele some quando ela abre o Claude Code em outra. Confira isto antes de copiar qualquer coisa, sem instalar nada ainda:

1. **Claude Code:** rode `claude plugin list --json` e procure o item `atleta-em-codigo@atleta-em-codigo`.
   - Existe um item com `"scope": "user"` e `"enabled": true`: está **global**. Siga.
   - Só existe com `"scope": "project"` ou `"local"` (vem junto o `projectPath`): **não está global**, vale só para aquela pasta. Diga isso numa frase e ofereça `claude plugin install atleta-em-codigo@atleta-em-codigo --scope user`. Só rode com o sim da pessoa.
   - Não aparece: o plugin foi carregado de uma pasta avulsa, ou o `claude` do terminal não é o da pessoa. Diga que **não está instalado**, mostre os comandos de instalação do `README.md` e siga só se ela quiser.
2. **Codex:** rode `codex plugin list` e procure `atleta-em-codigo@atleta-em-codigo`: tem de dizer `installed, enabled`. Se não disser, ofereça `codex plugin add atleta-em-codigo@atleta-em-codigo`.
3. Se o comando `claude` ou `codex` não existir, ignore aquele item: a pessoa pode usar só um dos dois.

## Passos

1. **Veja onde está.** Liste a pasta atual (com as suas ferramentas de arquivo, ou `ls -A` no Mac e `dir -Force` no PowerShell).
   - Se já existem `estudio/` e um `package.json` com `"name": "atleta-em-codigo"`, a pasta **já é um projeto**: não copie nada. Se o plugin tem versão mais nova que a do projeto (compare os `package.json`), use a skill `atualizar-projeto`; se não, siga para a skill `video-esportes`.
   - Se a pasta tem outras coisas e não é claramente a que a pessoa quer, **pergunte antes** e sugira criar uma pasta nova (por exemplo `meus-videos-de-luta`) e abrir o Claude Code nela. O script não sobrescreve nada: se houver conflito, ele para sem copiar.
2. **Node.** Rode `node --version`: precisa de 18 ou mais. É a **única peça que o projeto não instala sozinho**, porque é ele que roda tudo o mais.
   - Se o comando não existir ou for antigo, diga isso em palavras simples, mostre o comando e **espere o sim**:
     - Windows: `winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements` (o instalador do Node pode abrir um pedido de permissão de administrador do Windows, o UAC, que só a pessoa consegue aceitar: avise antes)
     - Mac: `brew install node`; sem Homebrew, o instalador de nodejs.org.
   - Depois de instalar, a pessoa precisa **fechar e abrir o Claude Code** (um terminal que já estava aberto não enxerga o programa novo) e pedir de novo.
3. **Copie o kit** para a pasta atual:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/estudio/novo_projeto.mjs"
   ```
   Para só ver o que seria copiado, acrescente `--simular`.
4. **Prepare o computador, na pasta do projeto.** Primeiro só confira:
   ```bash
   node estudio/preparar.mjs --simular
   ```
   Ele olha o Node, os pacotes do estúdio, o ffmpeg (com o ffprobe) e o navegador. **O que a pessoa já tem é usado e não é baixado de novo**: serve ffmpeg do sistema, Chrome, Chromium ou Edge (o Windows já vem com o Edge). Conte em palavras simples o que já está pronto (✔) e o que falta, com os tamanhos. Se faltar algo, peça **um único sim** para baixar tudo (vai para a pasta do projeto, não pede senha de administrador e não mexe no resto do computador) e rode:
   ```bash
   node estudio/preparar.mjs --sim
   ```
   Esse comando **pode levar vários minutos** (baixa até uns 400 MB, e no Windows o antivírus ainda confere tudo): rode-o em segundo plano, ou com o tempo limite máximo da ferramenta, e espere ele terminar. Se for interrompido, é seguro rodar de novo: ele confere tudo outra vez e refaz o que ficou pela metade.
   No fim ele roda o `doctor` sozinho (placa de vídeo, WebGL2, estimativa de tempo). Explique cada `[FALTA]` e `[AVISO]` em palavras simples (swap cheio, sem chave da ElevenLabs etc.); só `[FALTA]` impede de renderizar. Se um download falhar (rede fechada, por exemplo), o `preparar` imprime o comando manual de cada item (`brew` no Mac, `winget` no Windows): mostre e rode o `preparar` de novo depois.
5. **Ofereça o exemplo:** `npm run exemplo:esportes` renderiza 2 s de vídeo de teste (540×960, sem som, uns 10 s). Rode só se a pessoa quiser; use a placa de vídeo, então avise se o computador estiver pesado.
6. **Perfil da casa:** `perfil/perfil_da_casa.md` diz quem aprova, o que precisa do sim da pessoa (gastar crédito, render inteiro, publicar), idioma e gostos. Ofereça preenchê-lo conversando.
7. **Diga as duas condições, em uma frase:** o kit tem uma licença própria (`LICENSE`) e **todo vídeo publicado leva a marca d'água do canal do Titular**; não é permitido vender o kit. Detalhes no `LEIAME.md`.
8. **Próximo passo:** a pessoa deve abrir o Claude Code **dentro desta pasta** (se a skill `video-esportes` não aparecer, fechar e abrir de novo) e pedir o vídeo.

## Regras

- Nunca copie para dentro de uma pasta do próprio plugin nem sobrescreva arquivos.
- Nunca instale nada fora da pasta do projeto sem o sim da pessoa. O `preparar` só baixa para dentro do projeto; Node, `brew` e `winget` só com o sim dela.
- Não gaste crédito de voz ou de qualquer serviço pago, nem publique nada, sem o sim da pessoa.
- O computador pode estar pesado: use `--leve` nos renders e confira o `doctor` antes.
- Só o Mac com chip Apple foi rodado de verdade. No Windows a busca de programas e o plano de instalação foram testados por simulação, mas o download e o render em si ainda não foram rodados num Windows de verdade: se algo falhar, mostre a saída do `preparar` e do `doctor` e diga isso à pessoa.
