# Perfil da casa

Este arquivo é seu. As skills do estúdio leem aqui, antes de cada vídeo, **quem aprova**, **o que precisa do seu sim** e **os números que dependem de gosto**. Mude o que quiser: a skill passa a seguir o que está escrito aqui. Onde este arquivo e uma skill discordarem, vale este arquivo. O canal e o crédito que entram no vídeo ficam em `estudio.config.json`.

## 1. Quem aprova

- Aprovador: **você** (escreva o seu nome aqui: ________).
- Nada é publicado, enviado nem pago por você sem o seu sim.

## 2. O que pede o seu sim, sempre

Antes de acontecer, a skill mostra o que vai fazer (e o custo, se houver) e espera a sua resposta:

1. **Gastar crédito:** voz paga, música, qualquer geração paga. Uma geração, uma variação, e o valor antes.
2. **Render inteiro.** Os testes curtos (alguns quadros, 2 a 3 segundos) não pedem.
3. **Publicar ou enviar qualquer coisa,** inclusive página privada. Padrão de visibilidade: não listado.
4. **Criar uma skill nova ou mudar uma existente.**
5. **Levar um personagem, adereço ou cenário novo** para a biblioteca do estilo.

Apague ou acrescente linhas à vontade.

## 3. Idioma

- Narração e falas: **inglês** (o Whisper local do kit só reconhece inglês).
- Conversa e documentação: português do Brasil.

## 4. Voz e música

- Enquanto o vídeo está em construção: voz provisória grátis do sistema (no macOS, o `say`).
- Voz final: ElevenLabs, na **sua** conta, com a chave em `.env` (`ELEVENLABS_API_KEY`). Voz escolhida: ________
- A voz paga entra só no fim, depois do storyboard e do render aprovados.

## Números da linha esportes, a luta (padrões; mude se o seu gosto pedir)

| O quê | Padrão | Por que esse |
|---|---|---|
| Formato | 1080×1920 a 30 qps | vertical para Shorts e Reels |
| Idioma da narração | português do Brasil, em fala natural (muda o padrão da seção 3 para esta linha) | o roteiro falado dos Reels foi escrito e gravado assim |
| O corpo | sem rosto, cor de argila; só o equipamento tem cor: canto vermelho (luva e calção) e canto azul | o olho vai para o movimento; o vermelho demonstra |
| Velocidade | o golpe em velocidade real e depois em câmera lenta com rampa (cai a 0,07 a 0,1× no impacto e volta), sem congelar | pausa no meio do vídeo faz a pessoa sair |
| Colisão | zero atravessamento medido quadro a quadro: toque até 6 mm, chão até 3 mm (`npm run conferir -- esportes-aula`) | luva dentro do rosto parecia certa no render e estava 5 cm dentro |
| Texto na tela | só a pergunta, o nome do golpe, um número e a frase final | legenda em excesso atrapalha a técnica |
| Números | só com fonte; o que é ilustração é dito (em `boxe/TECNICA.md` e `REELS_QUEIXO.md`) | técnica ensinada errada é pior que nenhuma |
| Volume final | −15 LUFS (a conferência aceita de −16 a −13) | o `npm run conferir -- video` confere |
| Anatomia (raio X) | crédito do BodyParts3D na descrição de todo vídeo que a mostrar | a licença pede (CC BY-SA 2.1 Japão) |

## 5. O que você já reprovou

Escreva aqui, uma linha por vez, o que você viu e não quis ver de novo ("câmera parada", "legenda em cima do rosto"…). A skill lê esta lista antes de planejar e evita repetir. Comece vazio.

-
