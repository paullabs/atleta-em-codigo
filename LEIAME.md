# atleta-em-codigo

**Estúdio de vídeos de luta em código.**

Um atleta humano **sem rosto**, feito em código, para ensinar movimento com exatidão: boxe com dois lutadores (canto vermelho e canto azul, só as luvas e o calção têm cor), golpes calibrados por medida, aula, Reels de curiosidade (por que um soco no queixo apaga) e raio X com anatomia real. Tudo é 3D desenhado por código e renderizado quadro a quadro; nenhuma imagem ou vídeo de terceiros entra.

O jeito pensado de usar é com um agente de código (Claude Code): você pede o vídeo e ele segue as regras e os portões que estão neste projeto. Sem agente, os comandos abaixo e os de `estudio/esportes/LEIAME.md` renderizam tudo à mão.

## Duas formas de começar

**1. Pelo plugin do Claude Code (não precisa clonar).** Num terminal:

```bash
claude plugin marketplace add paullabs/atleta-em-codigo
claude plugin install atleta-em-codigo@atleta-em-codigo
```

Crie uma pasta nova para os seus vídeos, abra o Claude Code nela e peça `/atleta-em-codigo:novo-projeto`. O plugin copia o kit para a pasta (sem sobrescrever nada), instala as dependências e confere o computador. Os vídeos saem dessa pasta; o plugin só instala o projeto. Para receber uma versão nova do plugin: `claude plugin update atleta-em-codigo@atleta-em-codigo` (a pasta que você já criou continua como está).

Enquanto o repositório for privado, você precisa de acesso a ele e de uma credencial do GitHub guardada no git: `gh auth login` e depois `gh auth setup-git`. Sem chave SSH no GitHub, defina `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1`.

**2. Clonando o repositório.** `git clone`, entre na pasta e siga "Primeiro uso" abaixo; o Claude Code carrega sozinho a skill `video-esportes` desta pasta.

## O que você precisa

| Peça | Observação |
|---|---|
| Computador com placa de vídeo | Os autores só testaram em **Mac com chip Apple**. Windows e Linux têm o caminho do Chrome e o backend da GPU detectados, mas nunca foram testados. Sem GPU o render roda por software, dezenas de vezes mais lento. |
| Node 18 ou mais novo | nodejs.org |
| Google Chrome (ou Chromium) | o estúdio o acha sozinho; se não achar, ponha o caminho em `CHROME_PATH` no `.env` |
| ffmpeg com libx264 | no macOS: `brew install ffmpeg` |
| Internet na instalação | o `npm` baixa o three.js e o Playwright |
| Uns 10 GB livres | um vídeo gera milhares de quadros temporários |

## Primeiro uso (uns 5 minutos)

```bash
npm run instalar          # uma vez: baixa o three.js e o Playwright e cria o atalho estudio/node_modules
npm run doctor            # confere o computador e estima o tempo de render; o que faltar aparece como [FALTA]
npm run exemplo:esportes  # renderiza 2 s da aula (o jab) em estudio/esportes/saida/exemplo_esportes.mp4
```

O exemplo é pequeno de propósito (540×960, modo leve). Se ele rodou, o seu computador renderiza o estilo. Depois, confira as colisões do vídeo-aula completo (tem de dar 0):

```bash
npm run conferir -- esportes-aula
```

## Fazer o seu vídeo

1. **Com o Claude Code:** abra esta pasta, peça o vídeo ("faça um Reels sobre o que acontece quando um gancho acerta o queixo") e deixe ele trabalhar. O Claude Code carrega sozinho a skill `.claude/skills/video-esportes/SKILL.md`, que traz o método passo a passo e manda ler o seu perfil (`perfil/perfil_da_casa.md`). Outros agentes: peça que leiam `AGENTS.md` e essa skill primeiro.
2. **Antes de começar, edite `perfil/perfil_da_casa.md`:** quem aprova, o que precisa do seu sim (gastar crédito, render inteiro, publicar), idioma e os números de gosto. As regras do agente seguem esse arquivo.
3. **Sem agente:** os comandos de render, foto e auditoria estão em `estudio/esportes/LEIAME.md`. Para a aula completa (53 s):

```bash
node estudio/esportes/render.mjs --saida esportes/saida/minha_aula.mp4 --am 4 --folga 0.6
```

4. **Confira o arquivo final:** `npm run conferir -- video estudio/esportes/saida/minha_aula.mp4` (formato, volume, silêncio).

Um vídeo de 1 minuto custa em geral de 10 a 25 minutos de render num Apple M5 Pro; o `npm run doctor` mostra a estimativa para o seu computador.

## Computador travando?

- O render já roda em **prioridade baixa**. Para desligar: `ESTUDIO_PRIORIDADE=normal` no `.env`.
- Acrescente `--leve` ao `render.mjs` (540×960, desfoque simples e uma pausa entre os quadros) ou `--folga 0.6` (espera 60% do tempo de cada quadro; o render fica mais lento e o computador, mais livre).
- O `npm run doctor` avisa quando o swap está quase cheio e quando há Chromes sem janela esquecidos de renders antigos.

## Raio X (anatomia interna)

Os dados de anatomia **não vêm no kit**. Baixe o pacote BodyParts3D (versão 4.0) no site oficial do DBCLS (The Database Center for Life Science), descompacte em `estudio/modelos/bodyparts3d/original/` e rode, dentro de `estudio/esportes/`:

```bash
node anatomia_interna/preparar.mjs
```

Só depois disso funcionam os Reels com raio X. **Todo vídeo que mostrar a anatomia leva na descrição:** "Anatomia: BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution-Share Alike 2.1 Japan".

## O que não vem no kit

- Voz e música. Para voz paga (ElevenLabs), copie `.env.example` para `.env` e ponha a chave da **sua** conta; o agente mostra o custo e espera o seu sim antes de gastar.
- Academia (o mesmo corpo com os músculos acesos), mãos com dedos e ossos dos braços e das pernas: ainda não existem.

## Para saber mais

- `estudio/esportes/LEIAME.md`: como o corpo é feito, os arquivos, os comandos e o peso na máquina.
- `estudio/esportes/boxe/TECNICA.md`: a técnica de cada golpe, com os números medidos e as fontes.
- `estudio/esportes/REELS_QUEIXO.md`: o roteiro de um Reels modelo e o que é medido ou ilustrado.
- `LICENCAS_TERCEIROS.md` e `licencas/`: licenças das peças que o kit usa.

## Licença

O kit tem uma licença própria (arquivo `LICENSE`): uso livre, inclusive comercial, **com uma condição: todo vídeo publicado leva a marca d'água do canal LABS** (um selo fraco, a 4%, que muda de canto). Também não é permitido vender o kit como produto, curso ou template. `npm run conferir -- marca` confere que a marca continua nos motores do kit; quem a tirar perde a licença. Leia o `LICENSE` inteiro antes de usar ou repassar.
