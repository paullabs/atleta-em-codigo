# Boxe: a técnica que o atleta segue

Base ortodoxa: pé esquerdo na frente, adversário à frente. Os números abaixo saem do próprio esqueleto (`node` com `boxe/golpes.js`) e são os mesmos que aparecem nas folhas 2 e 3.

## Guarda

| O que conferir | Valor no atleta | Referência |
|---|---|---|
| Pé da frente | 12° para dentro | levemente para dentro (Sting Sports) |
| Pé de trás | 48° para fora | ~45° (Ringsport, Warrior Punch) |
| Calcanhar de trás | 4,1 cm do chão | 3 a 4 cm (Ringsport) |
| Distância entre os pés | 45 cm (39 à frente, 22 de lado) | dois trilhos, não uma linha só |
| Joelhos | 27° (frente) e 22° (trás) dobrados | levemente dobrados, nunca travados |
| Quadril e ombros | 38° e 44° de lado para o alvo | ombro da frente à frente, o de trás 30–40° atrás (Ringsport) |
| Mão de trás | encostada na bochecha (3 mm de folga) | ao lado do queixo |
| Mão da frente | à frente do rosto, na altura dos olhos | sem tapar a visão |
| Cotovelos | 123° e 119° dobrados, baixos e fechados | protegendo a costela |
| Queixo | 14° para baixo, olhos no adversário | queixo baixo |

## Golpes

Tempos do acionamento até o impacto: o estudo de Piorkowski, Lees e Barton (2011) mediu cerca de 0,36 s nos golpes retos e 0,48 s nos ganchos, do início do movimento ao contato. O atleta faz os golpes um pouco mais rápido, como golpe de treino, sem contra-movimento.

### Jab (mão da frente)
- Impacto aos 150 ms; volta completa aos 380 ms.
- A mão sai reta da guarda e volta pela mesma linha (o rastro na câmera lenta mostra a reta).
- Cotovelo em 168° no impacto: quase reto, sem travar.
- O punho gira no último terço: palma para baixo no impacto.
- O ombro da frente sobe (12°) e protege o queixo; a mão de trás não sai do rosto.
- O peso vai 3 cm para a frente, o quadril gira 5°.

### Direto (mão de trás)
- Impacto aos 220 ms; volta completa aos 520 ms.
- O pé de trás gira na ponta (calcanhar para fora) e o calcanhar sobe; o joelho de trás vira para dentro.
- Quadril gira 40° para o alvo e os ombros acompanham (ficam de frente); o peso passa para a perna da frente.
- A mão começa junto com o corpo e segue reta até o queixo; cotovelo em 171° no impacto, palma para baixo.
- A mão da frente volta para o rosto e só sai de lá depois que a de trás voltou.
- O jab e o direto acertam o mesmo queixo (a calibração ajusta o avanço do corpo para isso).

### Gancho de frente (cabeça)
- Impacto aos 220 ms; volta completa aos 520 ms.
- O cotovelo sobe até a altura do ombro (5 cm acima) e o braço fica em 89°, travado; antebraço deitado, palma para baixo.
- Quem leva o soco é o giro: pé da frente gira (calcanhar para fora), quadril gira 22° e os ombros chegam a 70° para a direita.
- A luva faz um arco e bate do lado do queixo do adversário, um pouco à esquerda da linha do rosto.
- Distância curta: o queixo do adversário fica 70 cm à frente da cabeça (no jab são ~90 cm).

### Uppercut de trás
- Impacto aos 260 ms; volta completa aos 560 ms.
- Primeiro dobra os joelhos (3,5 cm) e a mão desce só um palmo, sem armar.
- As pernas empurram para cima, o quadril gira 30° para o alvo e o pé de trás gira.
- O punho sobe pelo centro com a palma virada para o próprio rosto; cotovelo em 81°, embaixo do punho.
- A mão da frente protege o rosto. Distância curta: a luva bate 45 cm à frente da cabeça.

## Conferência

- Colisões: `node esportes/auditar.mjs` mede quadro a quadro (30 por segundo, 700 pontos por parte do corpo), nos dois sentidos, com profundidade. Encostar vale até 6 mm; o pé não pode afundar no chão. Na aula de teste deu 0 cruzamentos e 0 cm de afundamento. Antes da correção ele achou 8 (luva entrando 5,7 cm no rosto, luvas se cruzando, calção na outra coxa).
- Técnica: os números deste arquivo são medidos pelo mesmo código que gera o vídeo.

## Fontes

- Ringsport, guia de base: pé de trás a ~45°, calcanhar de trás 3–4 cm, peso dividido, punhos na altura das maçãs do rosto, cotovelo aberto como erro comum.
- Warrior Punch e Sting Sports: ângulos dos pés, joelhos dobrados, cotovelos fechados.
- ExpertBoxing, golpes básicos: jab com o braço todo esticado e volta rápida; direto sem armar e sem laçar; gancho "gira o corpo, não balança o braço", palma para baixo no alto; uppercut com joelhos levemente dobrados e mão descendo pouco.
- Piorkowski, Lees e Barton (2011), *Single maximal versus combination punch kinematics*: trajetória reta no jab e no direto, curva no gancho, sequência quadril–ombro–cotovelo–punho no direto, tempos dos golpes.
