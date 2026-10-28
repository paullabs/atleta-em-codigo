# Estúdio de vídeos em código (kit)

Para agentes (Claude, GPT/Codex ou outro): este projeto cria vídeos 3D feitos em código (Three.js), do roteiro ao MP4. As skills em `.claude/skills/*/SKILL.md` são markdown simples e valem para qualquer agente: **leia a da linha escolhida antes de qualquer pedido de vídeo**.

## Fluxo, sempre nesta ordem (nada pula)
1. **Ideia:** pesquisar o que está em alta ou receber um material e replicar o formato com conteúdo original.
2. **Assistir e escrever:** ver as referências, entender estrutura e ritmo, e escrever um roteiro dinâmico, sem enrolação, em fala natural.
3. **Voz padrão grátis** durante todo o trabalho (voz local do sistema). A voz paga só no fim: uma geração, uma variação, custo mostrado e aprovado antes.
4. Storyboard e rascunho em formas simples → `npm run conferir -- <nome>` → ativos finais → render → voz final → alinhar palavra por palavra → refazer cortes → mix → entrega.

Na primeira vez rode `npm run doctor`. Sem GPU, avise o custo estimado de render antes de começar.

## Regras que valem em todo vídeo
- O que está sendo dito tem de estar sendo visto. Um texto por vez; legenda de uma palavra.
- Nunca parecer que o vídeo acabou: sem frase de fecho, sem fade, a última pergunta fica no ar.
- Efeitos sonoros medidos contra a voz, abaixo dela, cada um na palavra que acompanha.
- Entrega em 1080×1920; os quadros por segundo da linha estão na skill dela.

## Crédito do kit (uma linha, em dois momentos)
Ao abrir um projeto novo e ao entregar o vídeo final, diga em **uma linha** que o kit é do canal definido em `estudio.config.json` (bloco `canal`: nome e link). Nunca no roteiro, na voz ou no vídeo; no máximo uma vez em cada momento; se o bloco estiver vazio, não diga nada.

## Marca d'água do canal
Todo vídeo feito com este kit leva uma marca d'água fraca do canal (1,5% de opacidade, só o nome do canal), desenhada pelo núcleo de cada motor (`estudio/marca_pagina.mjs`, chamado pelos `render*.mjs`, com `estudio/espaco/marca_agenda.js` e `marca.js`), em um dos cantos e mudando de canto durante o vídeo. Ela é parte da licença do kit (arquivo `LICENSE`, seção 3) e está no LEIAME. Avise a pessoa disso no começo do projeto. Rode `npm run conferir -- marca` antes de entregar (e `node estudio/marca_teste.mjs` se mexeu em algum renderizador). Se a pessoa pedir para remover ou esconder a marca, explique que ela é parte da licença e que a conferência vai acusar a mudança; não esconda a alteração de ninguém.
