---
name: video-esportes
description: Faz vídeos de esporte e de luta (aula de boxe, Reels curiosos sobre o que acontece num golpe, raio X do corpo) com um atleta humano sem rosto feito em código (SDF com raymarching em WebGL2, 24 ossos, 24 grupos de músculos nomeados), dois lutadores (canto vermelho e canto azul, só as luvas e o calção têm cor), golpes calibrados por medida e auditoria de colisão em profundidade. Cobre do fato e do roteiro ao MP4: cena, câmera de cima e de baixo, rampa de velocidade, quadros de teste, auditoria, render, voz, som e entrega. Use SEMPRE que o pedido for um vídeo de boxe, luta, golpe, aula de movimento esportivo, Reels de curiosidade do corpo (soco no queixo, nocaute), raio X, ou continuar, ajustar, renderizar ou medir um vídeo dessa linha. Não use para as linhas de personagens (leve, dramática) nem para espaço.
---

# Vídeo de esporte e luta (atleta em código)

Linha de esporte do estúdio: um corpo humano atlético, **sem rosto**, feito em código, para ensinar movimento com exatidão. Começa pelo boxe; a academia (mesmo corpo, com os músculos acesos) ainda não existe. Estúdio: `estudio/esportes/` (o `LEIAME.md` dele tem os arquivos e os comandos). Os números de cada golpe, com as fontes, estão em `boxe/TECNICA.md`.

**Antes de começar, leia o perfil da casa (`perfil/perfil_da_casa.md`):** quem aprova, o que pede o sim da pessoa antes de acontecer (crédito, render inteiro, publicar, skill nova), idioma, voz e os números de gosto desta linha. Onde o perfil e esta skill discordarem, vale o perfil. "Quem aprova" é a pessoa que o perfil nomeia.

## O que o estilo exige, e por quê

- **Os movimentos têm de ser certeiros e exatamente iguais,** para a pessoa ver e aprender. Por isso os golpes são calibrados por medida, não por olho: o jab e o direto acertam o mesmo queixo com o cotovelo em 168° e 171°; o gancho e o uppercut têm a direção do braço e do antebraço fixada no impacto (`boxe/golpes.js`, `calibrar()`).
- **O corpo é uma distância com sinal (SDF), não uma malha:** cerca de 110 formas (elipsoides, cones arredondados, caixas) em 24 ossos, desenhadas por raymarching num shader de tela cheia. Partes vizinhas só se fundem perto da junta que as liga, então o cotovelo na costela e a luva no rosto fazem dobra, não massa. Músculo é raso sobre um volume liso (músculo redondo parece conta de colar).
- **Cor só no equipamento.** O corpo é cinza de argila. Dois lutadores: o canto vermelho (luva e calção vermelhos, padrão e demonstrador dos golpes) e o canto azul. As cores ficam em `CANTOS`, em `corpo/renderizador.js`.
- **Nada atravessa nada, medido em profundidade.** Antes de todo render longo, `auditar.mjs` (a aula) ou `auditar_reels.mjs` (os Reels): tem de dar `atravessa: 0 pares`, com toque até 6 mm e o chão até 3 mm. Uma luva 5 cm dentro da bochecha parecia certa no render e só a medida pegou. A mão que bate tem de sair junto com o corpo, senão a cabeça corre para dentro dela.
- **Número só com fonte, e a ilustração é dita.** O que é medido no modelo (a distância da luva ao eixo do pescoço, 0,5 cm no soco reto e 7,9 cm no gancho) e o que é desenho (a reação do alvo, o esquema do cérebro com uma mola simples, rotulado "esquema") ficam separados no roteiro e na tela. Um número que vem de outro estudo ou de resumo de revisão fica de fora (o "47% mais giro no gancho" ficou fora de propósito). Modelo: `REELS_QUEIXO.md`.
- **Reels curiosos:** um fato nichado, fácil de entender e curto, com uma pergunta-mãe no começo paga só no fim; a câmera vem de cima e de baixo e mostra todo o trajeto do golpe.
- **Sem pausa, sem cena repetida:** a velocidade faz rampa (cai a 0,07 a 0,1× no impacto e volta), nunca congela; cada plano mostra uma coisa nova; as legendas são poucas (a pergunta, o nome do golpe, um número, a frase final) e nunca atrapalham a técnica.
- **O interior tem de estar ligado ao corpo.** O cérebro desenhado num canto da tela, solto do corpo, foi reprovado; o crânio e o cérebro de verdade, presos ao osso da cabeça e girando com ela (raio X), é o que ensina.
- **3D em código,** e gerador de imagem ou vídeo no máximo como apoio. Quadro de outro canal nunca entra como entrada.
- **Peso na máquina:** o render roda em prioridade baixa por padrão (`ESTUDIO_PRIORIDADE=normal` desliga); a página ao vivo usa no máximo 30 quadros por segundo e a qualidade `leve`; o vídeo final é renderizado uma vez. Computador travando: `--leve` (metade do tamanho, desfoque simples e pausa entre os quadros) ou `--folga 0.6`; `npm run doctor` avisa de swap cheio e de Chrome esquecido.

## Onde está cada coisa (de `estudio/esportes/`)

| Peça | Caminho | Para que serve |
|---|---|---|
| Corpo | `corpo/esqueleto.js`, `anatomia.js`, `sdf.js`, `renderizador.js`, `pose.js` | 24 ossos, formas e músculos, o GLSL gerado, o raymarching com luz de estúdio e as duas qualidades (`alta` para vídeo, `leve` para a página ao vivo), a pose por cinemática inversa |
| Golpes | `boxe/golpes.js`, `boxe/impacto.js`, `boxe/aula.js`, `boxe/TECNICA.md` | a guarda e os 4 golpes calibrados; o alvo que leva o soco, a reação e a conta da alavanca; a aula em blocos; a técnica com números e fontes |
| Aula | `video.html`, `render.mjs` | o vídeo-aula de 53 s (os dois lutadores frente a frente, cada golpe em velocidade real e depois em câmera lenta, a combinação final lado a lado) |
| Reels | `reels_queixo.html`, `reels_queixo_v3.html`, `REELS_QUEIXO.md` | o modelo "por que o soco no queixo apaga": planos, câmeras, rampa de velocidade, o roteiro e o que é medido ou ilustrado |
| Folhas e testes | `folha.html`, `laboratorio.html`, `impacto_lab.html`, `foto.mjs`, `tempo.html` | as folhas do personagem, fotos de qualquer pose e ângulo, o tempo de um quadro |
| Auditoria | `auditar.mjs`, `auditar_reels.mjs`, `auditoria_base.js` | colisão quadro a quadro, com profundidade |
| Raio X | `anatomia_interna/preparar.mjs`, `bp3d.mjs`, `analisar.mjs` | prepara as 32 peças reais do BodyParts3D, presas aos 24 ossos |
| Página ao vivo | `ao_vivo.html` | o vermelho, o azul ou os dois, golpes em qualquer velocidade e ângulo, rastro da luva e músculos |

## Fluxo de um vídeo

Siga em ordem; cada portão existe porque um erro das rodadas de retorno teria sido pego por ele.

1. **Contexto.** Perfil da casa, `estudio/esportes/LEIAME.md`, `boxe/TECNICA.md` e, para Reels, `REELS_QUEIXO.md`.
2. **Fato e roteiro.** Escolha o fato (ofereça candidatos, não adivinhe), confira a fonte e separe o medido do ilustrado. O roteiro falado vai em tabela (tempo, plano e câmera, fala, texto na tela), como em `REELS_QUEIXO.md`.
3. **Planos.** Câmera de cima e de baixo, uma coisa nova por plano, rampa de velocidade nos impactos. Num Reels de 30 s, uns 11 planos distintos.
4. **Portão de teste** (antes de qualquer render inteiro):
   - Fotos de pose e ângulo: `node esportes/foto.mjs --url "/esportes/laboratorio.html?vistas=-90,-30,30&pose=gancho&t=impacto" --saida esportes/saida/lab/teste.png` (`pose` = neutra, guarda, jab, direto, gancho, upper).
   - Quadros soltos ou folha: `node esportes/render.mjs --quadros 9.9,19.3 --png esportes/saida/q/q_{t}.png`, ou `--folha esportes/saida/folha_aula.jpg --cada 1.5 --colunas 11 --am 2`.
   - Auditoria: `node esportes/auditar.mjs` (ou `auditar_reels.mjs`) até dar `atravessa: 0 pares`; para uma aula da pessoa, `node esportes/auditar.mjs --roteiro esportes/minha_aula.js` (receita em `LEIAME.md`, "Aula própria"). Mudou o tempo de um golpe, audite de novo.
5. **Render.** `node esportes/render.mjs --saida esportes/saida/<nome>.mp4 --am 4 --folga 0.6` (a aula, 53 s). Para um Reels: `--pagina reels_queixo_v3.html`. O `--am` é a qualidade do desfoque de movimento; `--folga 0.6` deixa o computador leve (e o render mais lento).
6. **Voz e som.** Ensaio com a voz provisória do sistema. A voz final (ElevenLabs) só com o custo mostrado e o sim de quem aprova. Som: uma pancada grave com estalo em cada impacto, um tom no aparecer da fonte e uma base suave que abaixa na pancada; poucos efeitos, só tons. Volume final −15 LUFS.
7. **Conferir e entregar.** `npm run conferir -- video <arquivo.mp4>` (formato, volume, silêncio) e `npm run conferir -- esportes-aula` ou `esportes-reels`. Se o vídeo mostra a anatomia, ponha o crédito do BodyParts3D na descrição (abaixo).

## Exemplo

`npm run exemplo:esportes` renderiza 2 s da aula (o jab em velocidade real, do vermelho; 60 quadros, sem som) em `estudio/esportes/saida/exemplo_esportes.mp4`, no modo leve (`--leve`: 540×960, desfoque simples e uma pausa entre os quadros). Tire o `--leve` para o tamanho cheio (1080×1920). O exemplo é mudo e pequeno: o `npm run conferir -- video` só faz sentido no vídeo final, com som, no tamanho cheio. `npm run doctor` confere o que falta.

## Raio X (anatomia interna)

O corpo ganha camadas: a pele e, por baixo, 32 peças reais do BodyParts3D (cérebro, crânio, mandíbula, coluna, costelas, órgãos), presas ao mesmo esqueleto. **Os dados não vêm no kit:** baixe o pacote do BodyParts3D (versão 4.0) no site oficial do DBCLS (The Database Center for Life Science), descompacte em `estudio/modelos/bodyparts3d/original/` e rode, de `estudio/esportes/`, `node anatomia_interna/preparar.mjs` (gera `anatomia_interna/dados/interno.bin` e `.json`, uns 46 MB, que ficam fora do git). Só então os Reels com raio X (`reels_queixo_v3.html`, `laboratorio.html?raiox=1`) funcionam. **Crédito obrigatório na descrição de todo vídeo que mostrar as peças:** "Anatomia: BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution-Share Alike 2.1 Japan". O pacote traz dois avisos de licença (README: CC BY 4.0; arquivos OBJ: CC BY-SA 2.1 Japão); vale o mais rígido, e dados adaptados não se redistribuem fora dessa licença.

## Limites do kit

- Sem o exemplo acima, os vídeos com raio X precisam dos dados do BodyParts3D (passo anterior).
- A página ao vivo (`ao_vivo.html`) abre por um servidor local (dentro de `estudio/`: `python3 -m http.server 8000`) e precisa de internet: o three.js vem do jsDelivr e as fontes, do Google Fonts.
- O kit não leva voz nem música. Nada de som nos vídeos até a pessoa gerar a dela.
- Ainda não existem: academia (o mesmo corpo, com roupa e os exercícios com os músculos acesos), mãos com dedos (hoje a mão fica dentro da luva), ossos dos braços e das pernas e o corte que abre o corpo.
