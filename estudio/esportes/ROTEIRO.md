# Roteiro da aula em JSON (sem escrever código)

Para fazer a sua aula de boxe você escreve um arquivo JSON com a lista de blocos. O que você não disser vem da aula de teste (câmeras, títulos e dicas), então um roteiro pode ter uma linha por bloco. Com o Claude Code é só pedir a aula: a skill `video-esportes` conversa com você e escreve o JSON.

## Os comandos

Rode da pasta do projeto. O `--saida` é relativo à pasta `estudio/`.

```bash
mkdir -p roteiros
node estudio/esportes/roteiro.mjs --modelo > roteiros/minha_aula.json       # um roteiro de partida para editar
node estudio/esportes/roteiro.mjs roteiros/minha_aula.json                  # valida e mostra os blocos e a duração
node estudio/esportes/auditar.mjs --roteiro roteiros/minha_aula.json        # colisão quadro a quadro: tem de dar atravessa: 0 pares
node estudio/esportes/render.mjs --roteiro roteiros/minha_aula.json --leve --saida esportes/saida/minha_aula_rascunho.mp4
```

O `--leve` é o rascunho (540×960, rápido). Para o vídeo final tire o `--leve` e use `--am 4 --folga 0.6` (boa qualidade sem pesar o computador). O arquivo é procurado na pasta atual e, se não estiver lá, em `estudio/`.

## O menor roteiro possível

```json
{ "blocos": [ { "tipo": "guarda" }, { "tipo": "real", "golpe": "gancho", "repete": 2 }, { "tipo": "lento", "golpe": "gancho" } ] }
```

Guarda com as dicas padrão, o gancho duas vezes em velocidade real e uma vez em câmera lenta com as dicas padrão. Dura 16 s.

## Os blocos

| `tipo` | O que mostra | Campos próprios (limites; padrão) |
|---|---|---|
| `abertura` | os dois lutadores frente a frente, com o nome dos cantos | `dur` (0,5 a 30 s; 3,8) |
| `guarda` | a guarda ortodoxa, com 4 dicas padrão | `dur` (0,5 a 30 s; 5,8; com menos de 5,8 s as dicas padrão saem) |
| `real` | o golpe em velocidade real | `golpe`, `repete` (1 a 10; 1), `intervalo` (0 a 5 s; 0,6), `antes` (0 a 10 s; 0,5), `depois` (0 a 10 s; 0,5) |
| `lento` | o golpe em câmera lenta que freia e para no impacto, com as dicas | `golpe`, `v0` (0,05 a 1; 0,25, a velocidade de saída), `pausa` (0 a 8 s; 2,6, o tempo parado no impacto), `antes` (0,35), `depois` (0,45) |
| `combo` | uma sequência de golpes, com os dois lutadores | `golpes` (1 a 12), `antes` (0,4), `depois` (0,6) |

Golpes: `jab` (mão da frente), `direto` (mão de trás), `gancho` (mão da frente, na cabeça) e `upper` (uppercut de trás). A técnica de cada um, com os números e as fontes, está em `boxe/TECNICA.md`.

Campos que valem em qualquer bloco:

| Campo | Para que serve |
|---|---|
| `titulo` | o texto grande no alto (até 16 letras; o padrão é o nome do golpe ou da fase) |
| `tag` | a linha pequena embaixo do título (até 40 letras; "velocidade real", "câmera lenta"...) |
| `camera` | veja abaixo |
| `dicas` | veja abaixo |
| `dupla`, `chao`, `rotulos` | o segundo lutador, o círculo do chão e os nomes dos cantos (veja abaixo) |
| `nota` | um texto seu, para lembrar o porquê do bloco; não vai para o vídeo |

## Câmera

`camera` aceita três formas. Se você der só uma, a câmera fica parada no bloco; com `de` e `ate` ela desliza do começo ao fim do bloco.

```json
{ "camera": "lado" }
{ "camera": { "vista": "frente34", "orbita": -10 } }
{ "camera": { "de": { "vista": "lado", "orbita": -8 }, "ate": { "vista": "lado", "orbita": 12 } } }
{ "camera": { "pos": [-2.7, 1.3, 0.8], "alvo": [0, 1.1, 0.4], "mm": 35 } }
```

As vistas prontas são `frente34`, `lado`, `frente`, `cima` e `cimaEsq`. `orbita` gira a câmera em volta do lutador, em graus (de −360 a 360). À mão, `pos` e `alvo` são `[x, y, z]` em metros (o lutador vermelho fica em `[0, 0, 0]`) e `mm` é a lente (14 a 200).

## Dicas

Uma dica é um texto curto (até 60 letras fica bonito) e o ponto do corpo onde aparece o anel: `queixo`, `quadril` ou `luva`, `punho`, `cotovelo`, `ombro`, `calcanhar`, `pe`, `joelho` seguidos de `_e` (esquerdo) ou `_d` (direito), como `cotovelo_e`.

Nos blocos `guarda`, `real` e `combo`, `dicas` é uma lista com a janela de tempo em segundos desde o começo do bloco:

```json
{ "tipo": "guarda", "dicas": [
  { "de": 0.5, "ate": 2.0, "texto": "queixo baixo, luvas no rosto", "ponto": "queixo" },
  { "de": 2.0, "ate": 3.5, "texto": "cotovelos fechados", "ponto": "cotovelo_d" } ] }
```

No bloco `lento`, `dicas` tem uma dica na `ida`, uma ou mais na `pausa` (até 4) e uma na `volta`:

```json
{ "tipo": "lento", "golpe": "jab", "dicas": {
  "ida": { "texto": "sai reto, sem armar", "ponto": "luva_e" },
  "pausa": [ { "texto": "o punho gira", "ponto": "punho_e" }, { "texto": "o ombro protege o queixo", "ponto": "ombro_e" } ],
  "volta": { "texto": "volta pela mesma linha", "ponto": "luva_e" } } }
```

`"dicas": false` tira as dicas padrão do bloco; `"dicas": "padrao"` é o mesmo que não escrever nada.

## Dois lutadores

`abertura` e `combo` já trazem o canto azul. Para pôr o azul em outro bloco, ou mudar o lugar dele:

```json
{ "dupla": { "pos": [0, 0, 1.65], "yaw": 180, "atraso": 0.27 } }
```

`pos` é onde o azul fica, `yaw` é para onde ele olha (180 é de frente para o vermelho) e `atraso` é quanto o movimento dele vem depois do vermelho, em segundos. `"dupla": false` tira o azul. A câmera padrão de `real` e `lento` enquadra um lutador só: com dois, dê uma `camera` própria. `chao` (`{ "centro": [x, y, z], "raio": 2.4 }`) move o círculo do chão para baixo dos dois, e `rotulos` (`[{ "texto": "CANTO AZUL", "lutador": 1 }]`) escreve os nomes.

## Erros e avisos

O `roteiro.mjs`, o `auditar.mjs` e o `render.mjs` leem o roteiro do mesmo jeito. **Erro** (campo com nome errado, golpe que não existe, número fora do limite, JSON mal formado) para tudo e diz em qual bloco está, com sugestão quando parece erro de digitação. **Aviso** (título longo, dica que passa do fim do bloco, aula com mais de 2 minutos) não para nada, só avisa.

## Exemplos prontos

- `roteiros/exemplo_gancho.json`: uma aula curta só de gancho (13 s).
- `roteiros/aula_completa.json`: a aula de teste inteira (53 s), escrita com os padrões; o vídeo sai igual ao da aula padrão.

## Programando (avançado)

Quem prefere código ainda pode escrever o roteiro em JavaScript (uma lista de blocos como `AULA_TESTE`, em `boxe/aula.js`): `auditar.mjs --roteiro arquivo.js` aceita o módulo, e o render usa uma cópia de `video.html` com `montarAula(MEU_ROTEIRO)`. O JSON cobre o que a aula de teste usa.
