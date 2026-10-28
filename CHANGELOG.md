# Novidades por versão

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
