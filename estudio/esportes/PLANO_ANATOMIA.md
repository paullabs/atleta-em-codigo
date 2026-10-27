# Plano: kit de anatomia (raio X) e canal educativo de impactos

Escrito em 20/10/2026, depois do retorno do autor sobre o Reels do queixo v2. **M1 feito em 20/10/2026** (ver LEIAME, seção Raio X): o autor escolheu as malhas reais (opção A). Falta o M2 em diante.

## O que o autor apontou (e o que eu achei no vídeo)

| Retorno | O que está errado no v2 |
|---|---|
| Muitas pausas | Quase todo plano roda a 0,1 a 0,3× e eu congelo cerca de 0,3 s no impacto, 5 vezes. A voz tem silêncios de 1 a 3 s entre as falas porque cada fala fica presa ao seu plano. |
| Repete a mesma cena | O mesmo gancho aparece em 5 dos 6 planos (abertura, gancho, alavanca, cérebro, final). Só muda a câmera. |
| Não mostra o cérebro direito | O cérebro é um desenho 2D no canto da tela, desligado do corpo. |
| Falta a caveira dentro do corpo | O corpo só tem pele. Não há osso nem órgão. |

## O que construir

### 1. Kit de camadas do corpo (reaproveitável)

Hoje o atleta é só pele e músculos nomeados. O kit passa a ter camadas que ligam e desligam: **pele → músculos → esqueleto → órgãos**, cada uma presa aos mesmos 24 ossos do esqueleto. Modos de imagem: **opaco**, **raio X** (pele quase transparente, com contorno de luz, e o interior aparece) e **corte** (um plano que abre o corpo).

Peças: crânio com mandíbula, coluna, caixa torácica, bacia, ossos dos membros, **cérebro**, **estômago**, pulmões, coração, fígado. Cada peça é registrada com nome, osso a que está presa e tamanho real, como os músculos já são. Depois "mostrar o estômago" vira uma linha de código. É o que serve a outros vídeos do canal.

### 2. De onde vem o realismo (a decisão principal)

Para não ficar "fake", o crânio e o cérebro não podem ser formas inventadas por mim.

- **A. Malhas anatômicas reais abertas (recomendado).** BodyParts3D (extraído de ressonância de corpo inteiro; licença CC BY-SA 2.1 Japão, formato OBJ) e o Z-Anatomy (derivado dele; CC BY-SA 4.0; nomes padrão Terminologia Anatomica). Eu ajusto cada peça ao tamanho do nosso atleta por pontos de referência e prendo no osso certo. As peças internas são desenhadas como malha comum (barato para o computador, ao contrário de calcular tudo como distância) e combinadas com a pele em raio X. Custos: baixar e achar os arquivos de crânio e cérebro no pacote (não confirmei os nomes), e **ler a licença**: exige crédito e, ao redistribuir os dados adaptados, a mesma licença. O vídeo em si deve ficar de fora disso, mas o crédito vai na descrição e eu não dou parecer jurídico. **Conferido em 20/10:** o README do pacote 4.0 diz CC BY 4.0, mas os arquivos OBJ trazem no cabeçalho CC BY-SA 2.1 Japão; vale o mais rígido.
- **B. Tudo desenhado no código.** Totalmente nosso, sem licença, mas com formas simplificadas. Fica "boneco de aula" e não "anatomia".

### 3. Física que dirija a animação (em vez de animar à mão)

- **Cabeça:** pulso de aceleração (linear e de giro) vindo de estudos publicados, integrado no tempo. Hoje a rotação de 88° do gancho é número meu. Dados já confirmados: soco reto de boxeador olímpico, 58 g e 6.343 rad/s² (Walilko et al., 2005).
- **Cérebro dentro do crânio:** modelo simples de mola e amortecedor (o cérebro fica para trás e volta), com mapa de calor de "esticamento" no cérebro. Sempre rotulado "modelo simplificado". Não substitui simulação de elementos finitos.
- **Tempo real na tela:** em vez de câmera lenta fixa, relógio em milissegundos e rampa de velocidade (rápido, desacelera no impacto, acelera), sem congelar.

### 4. Episódio da barra de aço (figurativo, educativo)

Ideia que já vira roteiro: **a mesma pancada com áreas diferentes**. Testes em cadáveres (SAE 912907) deram fratura do osso temporoparietal a cerca de 5 kN com impactador de 5 cm² e cerca de 12,5 kN com 52 cm². Por isso o **capacete e a área de contato** importam. Resposta visual: barra de aço cai (energia = massa × g × altura, velocidade = raiz de 2gh, contas exibidas), mostra o crânio por dentro, depois o mesmo impacto com capacete espalhando a força.

Regras: boneco sem rosto, sem sangue, fratura em estilo de mapa de trincas, mensagem de segurança no fim (use EPI, não fique sob carga suspensa). Números só com fonte (o limiar de fratura varia muito com área, velocidade e região; o valor de "3 kN a mais no osso da testa" vem de um modelo estatístico, não de medição direta). **Antes de publicar, uma pessoa da área da saúde deve revisar** (fisioterapeuta, médico ou engenheiro biomédico).

## Marcos e ordem

| Marco | Entrega | Como saber que ficou bom |
|---|---|---|
| **M1** Camadas e raio X na cabeça e no tronco | Crânio, mandíbula, cérebro e estômago presos ao corpo; modos opaco, raio X e corte; folha do kit | O crânio acompanha a cabeça em todos os ângulos, sem atravessar a pele fora do raio X; tamanho do cérebro e do estômago bate com o real (a conferir com fonte) |
| **M2** Motor de impacto | Cabeça dirigida por pulso publicado; cérebro com mola e mapa de esticamento | Os números na tela saem da conta, não da animação; auditoria de colisão com osso e pele |
| **M3** Reels do queixo v3 | 14 a 18 planos distintos em 33 s, nenhum congelado, voz sem silêncio morto | Nenhum plano repete outro; o cérebro aparece dentro da cabeça girando; só 2 ou 3 textos na tela |
| **M4** Episódio da barra de aço | Roteiro, cena, trincas do crânio, comparação com capacete | Revisão de especialista e fontes na descrição |

A voz do v2 serve ao v3 se o texto continuar igual (sem crédito novo, só novo corte). Se o roteiro ganhar falas, aí é crédito novo e eu peço o sim.

## Esboço dos planos do Reels v3 (a firmar no M3)

1. Gancho em raio X: o soco bate e o crânio aparece por dentro girando. Sem título parado.
2. Pergunta curta na tela, câmera de cima, soco reto no meio do rosto (cabeça recua, crânio e cérebro andam juntos).
3. Corte seco para o gancho no queixo, de baixo para cima, mostrando a mandíbula como alavanca.
4. Câmera entra dentro da cabeça: cérebro solto, atrasa e estica (mapa de calor).
5. Vista de cima do giro do pescoço com o número da alavanca.
6. Corpo cede e cai; frase final.

## Peso na máquina

Raio X e malhas custam mais que a pele. Regras: página ao vivo com a qualidade "leve" e 30 qps; vídeo final renderizado uma vez, sozinho, só quando quem aprova mandar; nada em segundo plano enquanto a pessoa usa o computador.

## Fontes consultadas

- BodyParts3D: README do DBCLS (licença CC BY-SA 2.1 Japão, dados em OBJ extraídos da ressonância do conjunto TARO).
- Z-Anatomy: repositório no GitHub (licença CC BY-SA 4.0; inclui modelos derivados do BodyParts3D).
- Fratura de crânio: SAE 912907 (região temporoparietal, 31 cabeças de cadáver) e a meta-análise de 2016 sobre fratura do crânio (diferença entre testa e região lateral), ambas pelos resumos; ler os textos completos antes de usar os números.
- Walilko, Viano e Bir (2005), Br J Sports Med 39:710.
