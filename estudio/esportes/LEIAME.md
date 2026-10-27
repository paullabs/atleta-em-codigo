# Esportes · o atleta e as aulas de movimento

Linha nova do estúdio (20/10/2026): um corpo humano atlético, sem rosto, feito em código, para ensinar movimento de esporte com exatidão. Começa pelo boxe; depois vem a academia, com os músculos trabalhados acesos.

**O visual:** corpo em cinza de argila; só o equipamento tem cor. No boxe são **dois lutadores** (decisão do autor, 20/10/2026): o **canto vermelho**, de luva e calção vermelhos, e o **canto azul**, de luva e calção azuis. O corpo é o mesmo; as cores ficam em `CANTOS`, no `corpo/renderizador.js`. O vermelho é o padrão e demonstra os golpes.

## Como o corpo é feito

- O corpo não é uma malha: é uma **distância com sinal** (SDF) desenhada por raymarching num shader de tela cheia (WebGL2).
- São cerca de 110 formas (elipsoides, cones arredondados, caixas). Cada músculo é uma forma com nome, presa a um dos 24 ossos.
- Dentro de cada parte, as formas se fundem com mistura suave. Partes vizinhas só se fundem perto da junta que as liga; o resto encosta sem derreter. Assim o cotovelo na costela e a luva no rosto fazem dobra, não massa.
- **Músculos com nome:** 24 grupos (`MUSCULOS` em `corpo/anatomia.js`). O renderizador acende qualquer grupo com qualquer cor (`musculos: { peitoral: { cor } }`). É a base da academia.
- **Pose como o treinador descreve:** pelve, giro e inclinação do tronco, para onde a cabeça olha e quanto o queixo desce, onde cada luva vai (cotovelo apontando para onde, palma virada para onde), onde cada pé pisa (bola do pé, ângulo, calcanhar levantado). Braços e pernas saem de cinemática inversa com dobradiça de verdade (`corpo/pose.js`).
- **Dois na mesma cena:** o shader desenha até 2 corpos (`criarRenderizador(..., { lutadores: 2 })`), cada um com os seus ossos e as suas cores (`desenhar({ lutadores: [{ estados, cores }, ...] })`). `posicionar(E, pos, yaw)` leva a pose de um lutador para o lugar dele (de frente para o outro ou ao lado).
- **Golpes calibrados por medida:** o jab e o direto acertam o mesmo queixo com o cotovelo em 168° e 171°; o gancho e o uppercut têm a forma do braço no impacto fixada (direção do braço e do antebraço). Ver `boxe/TECNICA.md`.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `corpo/esqueleto.js` | 24 ossos, juntas em repouso (1,80 m), cinemática direta, matrizes mundo → repouso para o shader |
| `corpo/anatomia.js` | as formas do corpo, das luvas e do calção; pares que se fundem; os 24 músculos |
| `corpo/sdf.js` | gera o GLSL a partir da anatomia e avalia a mesma distância em JS (auditoria) |
| `corpo/renderizador.js` | raymarching, luz de estúdio com sombra suave, oclusão, materiais, destaque de músculos, desfoque de movimento por subquadros |
| `corpo/pose.js` | postura → ossos (cinemática inversa de braço e perna, palma, pé com calcanhar) |
| `boxe/golpes.js` | guarda e os quatro golpes, curvas de tempo, calibração dos impactos |
| `boxe/aula.js` | a aula em blocos: os dois frente a frente na abertura, velocidade real, câmera lenta que para no impacto, câmeras, dicas, e a combinação final com os dois lado a lado |
| `boxe/TECNICA.md` | a técnica de cada golpe com os números medidos e as fontes |
| `laboratorio.html` | fotos de teste de qualquer pose e ângulo |
| `video.html`, `render.mjs` | o vídeo-aula quadro a quadro (1080×1920, 30 qps) |
| `folha.html` | as 4 folhas do personagem |
| `auditar.mjs` | auditoria de colisões quadro a quadro, com profundidade (`--roteiro` audita a aula da pessoa) |
| `roteiro.mjs`, `boxe/roteiro_json.js`, `ROTEIRO.md` | a aula própria em JSON: validação e resumo, o conversor para o roteiro da aula e o formato com exemplos |
| `foto.mjs` | tira o PNG de qualquer página (Chrome sem janela, GPU) |
| `ao_vivo.html` | página ao vivo (abre no navegador, veja "Página ao vivo"): o vermelho, o azul ou os dois lado a lado; golpes em qualquer velocidade e ângulo, rastro da luva e músculos de cada golpe |

`node_modules` é um atalho para `../motor3d/node_modules` (three.js e playwright do motor).

## Como rodar (da pasta `estudio/`)

Vídeo-aula de teste, 53 s (cerca de 8 min no M5 Pro; com `--folga 0.6`, uns 13 min sem pesar o computador):

```bash
node esportes/render.mjs --saida esportes/saida/boxe_aula_teste_v2.mp4 --am 4 --folga 0.6
```

Quadros soltos ou uma folha de quadros:

```bash
node esportes/render.mjs --quadros 9.9,19.3 --png esportes/saida/q/q_{t}.png
```

```bash
node esportes/render.mjs --folha esportes/saida/folha_aula.jpg --cada 1.5 --colunas 11 --am 2
```

As folhas do personagem (1 atleta, 2 guarda, 3 golpes, 4 músculos):

```bash
node esportes/foto.mjs --url "/esportes/folha.html?folha=2" --saida esportes/saida/folhas/folha_2.png
```

Foto de teste de uma pose (`pose` = neutra, guarda, jab, direto, gancho, upper; `t` em segundos ou `impacto`):

```bash
node esportes/foto.mjs --url "/esportes/laboratorio.html?vistas=-90,-30,30&pose=gancho&t=impacto" --saida esportes/saida/lab/teste.png
```

Colisões (rodar antes de todo render longo; tem de dar `atravessa: 0 pares`):

```bash
node esportes/auditar.mjs --passo 0.0333 --pontos 700 --saida esportes/saida/colisoes.json
```

### Aula própria (sem escrever código)

A aula é uma lista de blocos (`abertura`, `guarda`, `real`, `lento`, `combo`) escrita em JSON, e o que você não disser vem da aula de teste. Formato, campos e exemplos: [`ROTEIRO.md`](ROTEIRO.md). Da pasta do projeto:

```bash
mkdir -p roteiros
node estudio/esportes/roteiro.mjs --modelo > roteiros/minha_aula.json      # um roteiro de partida
node estudio/esportes/roteiro.mjs roteiros/minha_aula.json                 # valida e mostra os blocos e a duração
node estudio/esportes/auditar.mjs --roteiro roteiros/minha_aula.json       # tem de dar atravessa: 0 pares
node estudio/esportes/render.mjs --roteiro roteiros/minha_aula.json --leve --saida esportes/saida/minha_aula_rascunho.mp4
```

Com o Claude Code, é só pedir a aula: a skill `video-esportes` pergunta o que você quer ensinar, escreve o JSON, valida, audita e renderiza um rascunho. Exemplos prontos em `roteiros/`: `exemplo_gancho.json` e `aula_completa.json` (a aula de 53 s).

Quem prefere código ainda pode escrever o roteiro em JavaScript (uma lista como `AULA_TESTE`, em `boxe/aula.js`): `auditar.mjs --roteiro arquivo.js` aceita o módulo, e o render usa uma cópia de `video.html` com `montarAula(MEU_ROTEIRO)`.

## Raio X: anatomia interna (marco 1 do plano, 20/10/2026)

O corpo ganhou camadas: pele, e por baixo **32 peças reais** do BodyParts3D (cérebro, olhos, crânio, mandíbula, coluna, medula, costelas, esterno, pelve, diafragma, estômago, esôfago, traqueia, pulmões, coração, aorta, veias cavas, fígado, vesícula, pâncreas, duodeno, intestinos delgado e grosso, rins, adrenais, bexiga e timo), presas ao mesmo esqueleto de 24 ossos (cada vértice mistura até 4 ossos por altura: a malha gira, dobra e cede com o corpo). Plano completo: `PLANO_ANATOMIA.md`. Folha do kit: `saida/folhas/folha_5.png`.

- **Ligar:** `criarRenderizador(...)`, depois `R.carregarInterno(bin, manifesto)` e, em `R.desenhar({... raioX: { lutador: 0|1, base, borda, ganho, camadas } })`. `camadas: true` mostra tudo; ou um objeto por peça: `{ cranio: { alfa: 0.2 }, cerebro: {} }`. Páginas de teste: `laboratorio.html?raiox=1&camadas=cranio:0.2+cerebro`, `impacto_lab.html?rx=1`.
- **Sem os dados:** as páginas com raio X (`reels_queixo_v3.html`, `laboratorio.html?raiox=1`, `impacto_lab.html?rx=1`, `folha.html`, `tempo.html?rx=1`) carregam tudo por `anatomia_interna/carregar.js`; se `interno.json` ou `interno.bin` não existirem, o erro diz para baixar o BodyParts3D e rodar `preparar.mjs`.
- **Dados:** `anatomia_interna/preparar.mjs` lê o pacote em `estudio/modelos/bodyparts3d/original/` (versão 4.0, 62 MB, baixado do arquivo oficial do DBCLS) e grava `anatomia_interna/dados/interno.bin` (46 MB) e `interno.json`. `analisar.mjs` mede o encaixe das peças na pele.
- **Como encaixa:** tamanho real (mm para m); a cabeça do atleta cresceu 10% e o tórax ficou 12% mais fundo para caberem crânio e costelas de tamanho real (cós e calção acompanharam); o que ainda passava da pele foi empurrado para dentro, no máximo 1 cm.
- **Custo:** +1 ms por quadro na qualidade leve e +7 ms em 1080×1920; o arquivo de 46 MB é o que pesa. Para a página ao vivo falta reduzir (cérebro e crânio têm 180 mil vértices cada).
- **Ainda não tem:** baço (só vem no pacote IS-A de 136 MB, ainda não baixado), ossos dos braços e das pernas, mãos e pés, músculos em 3D por dentro; corte (abrir o corpo por um plano); o raio X ainda não está no Reels.
- **Licença e crédito:** o README do pacote diz CC BY 4.0, mas o cabeçalho de cada arquivo OBJ diz **CC BY-SA 2.1 Japão**. Vale o mais rígido: crédito obrigatório na descrição de todo vídeo que mostre as peças, "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan", e os dados adaptados (`dados/`) não se redistribuem fora dessa licença (por isso a pasta fica fora do git).

## Reels: por que o soco no queixo apaga

Primeiro Reels da linha (20/10/2026, 32,7 s, sem voz ainda). Roteiro falado, o que é medido e o que é ilustração: `REELS_QUEIXO.md`. Página `reels_queixo.html`; o alvo que leva o soco, a reação e a conta da alavanca ficam em `boxe/impacto.js`; as regiões `queixo` e `rosto` acendem como os músculos (`REGIOES` em `corpo/anatomia.js`). Auditoria própria (`auditar_reels.mjs`, 0 cruzamentos; entrada máxima da luva na cabeça: 3 mm de folga).

```bash
node esportes/render.mjs --pagina reels_queixo.html --saida esportes/saida/reels/reels_queixo_v1.mp4 --am 3 --folga 0.5
```

## Peso na máquina

- **Duas qualidades** (`QUALIDADES` em `corpo/renderizador.js`): `alta` para vídeo e folhas, `leve` para a página ao vivo (sombra com 24 passos, oclusão com 3, busca com 120). O corpo é dividido em 5 blocos (tronco, cada braço, cada perna): longe de um bloco, nenhuma parte dele é calculada.
- **Página ao vivo:** no máximo 30 quadros por segundo, ~0,42 megapixel enquanto mexe (~12 ms por quadro no M5 Pro, cerca de 35% da placa de vídeo), um quadro caprichado quando pausa e nada enquanto pausada ou com a aba escondida. A tela só é recriada quando o tamanho muda.
- **Render de vídeo:** `--am 4` já dá desfoque de movimento bom; `--folga 0.6` espera 60% do tempo de cada quadro antes do próximo, para o computador continuar leve enquanto o vídeo sai (fica ~60% mais lento).
- **Computador travando:** `--leve` no `render.mjs` (540×960, `--am 1`, `--folga 0.5`; o que você passar à mão vence). O render já roda em prioridade baixa (`ESTUDIO_PRIORIDADE=normal` desliga). `npm run doctor` avisa de swap cheio e de Chrome sem janela esquecido.
- Medir: `node esportes/foto.mjs --url "/esportes/tempo.html?q=leve&w=780&h=540"` imprime o tempo de um quadro.

## Página ao vivo

Abre no navegador, por um servidor local: dentro de `estudio/` rode `python3 -m http.server 8000` e abra http://localhost:8000/esportes/ao_vivo.html. A página usa `corpo/esqueleto.js`, `corpo/anatomia.js`, `corpo/sdf.js`, `corpo/renderizador.js`, `corpo/pose.js` e `boxe/golpes.js`; o three.js vem do jsDelivr (versão 0.160.0), então precisa de internet. Para publicá-la em outro lugar, leve esses arquivos junto, com a pasta `esportes` como raiz.

## Estado em 20/10/2026

- Pronto para aprovação: os dois lutadores (canto vermelho e canto azul), a guarda, o jab, o direto, o gancho de frente e o uppercut de trás, as 4 folhas e a aula de teste de 53 s.
- Auditoria: 0 cruzamentos em 1.595 quadros; os dois lutadores nunca passam de 51,7 cm de distância um do outro.
- O vídeo não tem som ainda (voz e efeitos só depois do sim).
- Próximo: academia. O mesmo corpo com mãos (os dedos ainda não existem: hoje a mão fica dentro da luva), roupa de academia e os exercícios com os músculos acesos.
