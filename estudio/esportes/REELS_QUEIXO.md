# Reels · Por que um soco no queixo apaga?

Vertical 1080×1920, 32,7 s, 30 qps. Fato escolhido pelo autor em 20/10/2026 entre três candidatos. Página: `reels_queixo.html`; cenas e geometria: `boxe/impacto.js`; auditoria: `auditar_reels.mjs`.

**Pergunta-mãe (abre e só fecha no fim):** por que um soco no queixo apaga uma pessoa?
**Resposta:** não é a força, é o giro. O queixo fica longe do eixo do pescoço e vira alavanca; o crânio gira e o cérebro, solto, fica para trás e estica.

## Roteiro falado (PT-BR, para gravar)

| Tempo | Plano e câmera | Fala | Texto na tela |
|---|---|---|---|
| 0,0–3,4 | Gancho do vermelho no queixo do azul, câmera baixa de lado, câmera lenta, anel amarelo no queixo | "Por que um soco no queixo apaga uma pessoa?" | POR QUE UM SOCO / NO QUEIXO APAGA? |
| 3,4–9,4 | Soco reto no meio do rosto, câmera de cima, rastro da luva, rastro do nariz, eixo do pescoço | "Um soco reto, no meio do rosto, só empurra a cabeça pra trás." | SOCO RETO NO MEIO DO ROSTO → A CABEÇA SÓ RECUA · DO SOCO ATÉ O EIXO: 0,5 cm |
| 9,4–16,2 | Gancho de lado no queixo, mesma câmera de cima | "Já o gancho, de lado no queixo, passa longe do eixo. A cabeça não recua: gira." | SOCO DE LADO NO QUEIXO → A CABEÇA GIRA · DO SOCO ATÉ O EIXO: 7,9 cm |
| 16,2–21,4 | Câmera de baixo olhando para cima, eixo vertical e braço de alavanca desenhados | "O queixo fica longe do eixo. Vira alavanca: quanto mais longe, mais giro." | O QUEIXO FICA LONGE DO EIXO DO PESCOÇO → VIRA UMA ALAVANCA |
| 21,4–27,2 | De cima, cabeça do azul e esquema do crânio e do cérebro | "E o cérebro está solto lá dentro. Quando o crânio gira, ele fica pra trás e estica." | O CÉREBRO FICA SOLTO LÁ DENTRO → NO GIRO, ELE FICA PARA TRÁS E ESTICA |
| 27,2–32,7 | Câmera orbitando, o azul cede e cai de joelhos | "Não é a força. É o giro." | NÃO É A FORÇA. É O GIRO. + placa da fonte |

## O que é medido e o que é ilustração

- **0,5 cm e 7,9 cm:** medidos no modelo 3D. É a distância, no plano do chão, entre o eixo do pescoço (junta da cabeça) e a linha do soco (direção do antebraço no ponto de contato). O contato é calculado com a luva inteira: a luva encosta na pele (2 mm) no primeiro instante possível e para ali 40 ms.
- **Reação do azul:** animada à mão (a cabeça só recua no reto; gira cerca de 88° no gancho e depois o corpo cede). É ilustração, sem número na tela.
- **Esquema do cérebro:** mola amortecida simples seguindo o giro da cabeça. Está rotulado "esquema" na tela. Só mostra a ideia do atraso.
- **58 g e 6.343 rad/s²:** Walilko, Viano e Bir (2005), *Br J Sports Med* 39:710, sete boxeadores olímpicos, 18 socos retos num boneco Hybrid III (média; desvio de 13 g e 1.789 rad/s²).
- **Fica de fora de propósito:** "47% mais giro no gancho" (9.306 rad/s²). Vem de outro estudo (Viano e colegas, 2005, *Neurosurgery*), só consegui o número em resumo de revisão e os protocolos são diferentes. Se o autor quiser a comparação, conferir no artigo original antes.

## Ressalvas para o texto de apoio

- A explicação "giro estica o tecido" é a mais aceita, mas uma revisão sobre nocautes em boxe diz que o local exato do efeito no cérebro (tronco cerebral ou córtex) ainda é debatido. O vídeo diz só "estica", sem apontar a região.
- A mesma revisão aponta que o "queixo de vidro" muitas vezes vem de pescoço que não segura a cabeça ou de soco que não se viu chegar. Dá um segundo Reels.

## Descrição sugerida

Por que um soco no queixo apaga uma pessoa? Não é só a força. O queixo fica longe do eixo do pescoço e vira uma alavanca: a cabeça gira e o cérebro, solto lá dentro, fica pra trás e estica. Simulação 3D feita em código; o giro de reação é ilustrativo. Fonte: Walilko, Viano e Bir, Br J Sports Med, 2005.

## Som da v1

- Voz provisória do macOS (Luciana, grátis), cada fala dentro do seu plano. A voz final (ElevenLabs) só com o sim de quem aprova para o crédito.
- Uma pancada grave com estalo em cada impacto (5), um tom no aparecer da fonte e uma base suave. Mix a −15 LUFS com a voz por cima.

## v2 (20/10/2026, depois do pedido de "mais dramático, menos legenda")

- Voz final: ElevenLabs (voz masculina, Eleven v4). Uma geração gerou **duas versões** (372 créditos no total, as duas cobradas). Usei a segunda; as duas ficam em `saida/reels/voz_eleven_take1.mp3` e `voz_eleven_take2.mp3`.
- Visual: luz escura e dura, câmera que fecha no impacto e congela por ~0,3 s, tremor e inclinação, clarão e pulso vermelho. Legendas só: pergunta, "SOCO RETO NO MEIO DO ROSTO", "SOCO DE LADO NO QUEIXO", número da alavanca e a frase final.
- Arquivos: `saida/reels/reels_queixo_v2.mp4` (16 MB) e `reels_queixo_v2_drive.mp4` (4 MB, cópia leve; a v1 está em `reels_queixo_v1.mp4`).

## Falta
- Legendas queimadas seguindo a fala (hoje há legendas por plano, sem tempo de palavra).


## v3 (20/10/2026): raio X, sem pausa, sem repetir

Página `reels_queixo_v3.html`; 28,8 s; 11 planos; voz do Eleven (a mesma tomada, recortada) correndo sem silêncio no meio (só o rabo de 1,4 s no fim). Nada congela: a velocidade faz rampa (cai a 0,07–0,1× no impacto e volta).

| Tempo | Plano | Mostra |
|---|---|---|
| 0,0 | Apagão | o azul cede em raio X (câmera baixa); pergunta na tela |
| 2,9 | Reto, de cima | caveira e cérebro vistos de cima; rastro do soco; 0,5 cm até o eixo |
| 5,0 | Reto, de lado | cabeça e coluna recuam juntas (corte na ação) |
| 7,1 | Gancho, de cima | 7,9 cm até o eixo |
| 9,0 | Gancho, cérebro | o crânio gira e o cérebro fica para trás e fica vermelho (câmera por cima do ombro do vermelho) |
| 11,6 | Comparação | tela dividida: nariz do reto faz linha reta, o do gancho faz arco |
| 13,7 | Alavanca de baixo | câmera de baixo, mandíbula amarela, eixo e braço de alavanca |
| 16,1 | Alavanca de cima | crânio visto de cima girando; arco do nariz |
| 18,9 | Cérebro de cima | o cérebro atrasa em relação ao crânio |
| 21,9 | Cérebro, órbita | câmera dando a volta atrás da cabeça (segue a cabeça quando o corpo cede) |
| 25,1 | Final | raio X do corpo todo; "Não é a força. É o giro."; placa com a fonte |

- **O cérebro solto:** o crânio gira com o osso da cabeça; o cérebro é a malha real com uma mola amortecida (modelo simplificado, só giro de cabeça) e fica mais vermelho quanto mais atrasa. Os números do atraso não aparecem na tela.
- **Crédito obrigatório na descrição:** "Anatomia: BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution-Share Alike 2.1 Japan". Simplificação: o modelo do cérebro é ilustrativo.
- **Efeitos:** pancada grave e estalo nos 3 impactos (4,45; 9,1; 15,2 s) com um tom subindo antes; base suave que abaixa na pancada; tom na placa final.
