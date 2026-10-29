# Novidades por versão

## 0.5.0

- **Mac e Windows, com instalação sozinha do que faltar.** `npm run preparar` confere o Node, os pacotes do estúdio, o ffmpeg (com o ffprobe) e o navegador, mostra o que falta com o tamanho e, com o seu sim, baixa só isso para dentro do projeto, sem senha de administrador. **Quem já tem ffmpeg, Chrome, Chromium ou Edge instalados não baixa nada** (o Windows já vem com o Edge). Sem o seu sim ele não instala nada.
- O estúdio acha o ffmpeg e o navegador também fora do PATH: Homebrew, MacPorts, winget, Chocolatey, Scoop, Edge. `ESTUDIO_IGNORAR=ffmpeg,chrome` faz usar só as cópias do projeto.
- `npm run doctor` diz de onde vem cada programa (do computador ou cópia do projeto) e aponta o `preparar` quando algo falta.
- As skills `novo-projeto` e `atualizar-projeto` usam o `preparar` e não dependem mais de comandos só do Mac (`pwd`, `ls`); o `~` vale no Windows.
- **O que foi testado:** o Mac com chip Apple, de ponta a ponta, e a busca de programas e o plano de instalação por simulação do Windows e do Linux. O download e o render num Windows de verdade ainda não foram rodados.
- Quem já tem um projeto e usa git: o `.gitignore` do projeto é seu e não é tocado. Acrescente nele a linha `estudio/ferramentas_locais/navegador/` (o navegador baixado tem uns 300 MB). Projetos novos já vêm com ela.
- **Instala igual no Claude Code e no Codex.** O README traz os comandos do Codex (`codex plugin marketplace add` e `codex plugin add`) e o `--scope user`, que instala para todas as suas pastas. As skills explicam como achar a pasta do plugin quando o agente não preenche a variável CLAUDE_PLUGIN_ROOT (o Codex não preenche), e `novo-projeto` confere se o plugin está instalado para todas as pastas (`scope: user`) e avisa se está só em uma. **O que foi testado:** instalar nos dois com configuração limpa e ver as skills carregadas; um agente do Codex seguindo o texto de ponta a ponta ainda não foi rodado.

## 0.4.2

- **Marca d'água mais discreta**: 1,5% de opacidade (era 4%), só o nome do canal (sem a barra dourada), metade do tamanho e mais perto das pontas dos cantos. Continua mudando de canto e continua em todos os motores. `npm run conferir -- marca` passa a aceitar de 1% a 3%. Quem já criou um projeto leva a mudança com `/atleta-em-codigo:atualizar-projeto`.

## 0.4.1

- `LEIAME.md`: tira a frase que dizia que o repositório era privado e pedia credencial do GitHub. A instalação do plugin não precisa de conta; a credencial só vale para fork ou espelho privado. Nenhuma mudança no motor.

## 0.4.0

- **`/atleta-em-codigo:atualizar-projeto`**: leva o motor novo para um projeto que você já criou, sem tocar no seu perfil, nos seus roteiros e no `.env`, e guarda cópia de tudo o que substitui em `.atualizacao/`.
- Este `CHANGELOG.md`.

## 0.3.0

- **Aula própria em JSON, sem escrever código**: `render.mjs --roteiro` e `auditar.mjs --roteiro`; `roteiro.mjs` valida, resume e escreve um modelo (`--modelo`); formato e exemplos em `estudio/esportes/ROTEIRO.md`. A skill `video-esportes` monta o roteiro na conversa.

## 0.2.0

- **Plugin do Claude Code**: o repositório é marketplace e plugin. `/atleta-em-codigo:novo-projeto` copia o kit para a pasta da pessoa sem sobrescrever nada.
- `README.md`, erro claro quando faltam os dados do raio X, `auditar.mjs --roteiro` com módulo JavaScript e `conferir -- marca` que confere só os motores do kit.

## 0.1.0

- Primeira versão: o atleta sem rosto, a aula de boxe, o Reels do queixo, o raio X (os dados de anatomia a pessoa baixa) e as conferências de colisão, marca d'água e vídeo.
