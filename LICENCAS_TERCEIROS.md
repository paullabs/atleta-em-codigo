# Licenças de terceiros

O próprio kit (o código e os textos do atleta-em-codigo) segue a licença do arquivo `LICENSE`, na raiz.

O kit usa as peças abaixo. Cada uma segue a licença do seu autor; isto aqui é um aviso, não um parecer jurídico.

## Vão dentro do kit (todas as linhas)

| Peça | Autor e licença | Onde |
|---|---|---|
| Three.js 0.160.0 | © 2010-2023 three.js authors, licença MIT | instalada por `npm run preparar` (o texto da licença vem junto, em `estudio/motor3d/node_modules/three/LICENSE`) |
| Playwright (playwright-core 1.49.1) | © Microsoft Corporation, licença Apache 2.0 (contém código derivado do Puppeteer, também Apache 2.0) | instalada por `npm run preparar` (`LICENSE` e `NOTICE` vêm junto) |
| Fonte Outfit (marca d'água do canal) | © 2021 The Outfit Project Authors (https://github.com/Outfitio/Outfit-Fonts), SIL Open Font License 1.1 | `estudio/espaco/fontes/Outfit.ttf` |

O texto integral da SIL Open Font License 1.1, com os avisos de direitos das fontes, está em `licencas/OFL-1.1.txt` (a licença pede que cada cópia da fonte leve o aviso de direitos e o texto). O mesmo texto está em https://scripts.sil.org/OFL.

## Linha esportes (a luta)

| Peça | Observação |
|---|---|
| BodyParts3D (raio X) | © The Database Center for Life Science, licensed under CC Attribution-Share Alike 2.1 Japan. Os dados NÃO vêm no kit: você baixa e roda `estudio/esportes/anatomia_interna/preparar.mjs`. O pacote traz dois avisos (o README diz CC BY 4.0 e os arquivos OBJ dizem CC BY-SA 2.1 Japão); vale o mais rígido. **Crédito obrigatório na descrição de todo vídeo que mostrar a anatomia:** "Anatomia: BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution-Share Alike 2.1 Japan". Se você distribuir dados derivados, eles seguem a mesma licença. |

## Outras linhas (só se o seu kit as incluir)

| Peça | Autor e licença | Onde |
|---|---|---|
| Fonte Space Grotesk (linha espaço) | © 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk), SIL Open Font License 1.1 | `estudio/espaco/fontes/SpaceGrotesk-*.otf` |
| Bebas Neue, IBM Plex Mono e IBM Plex Sans (linha dramática) | carregadas do Google Fonts na hora do render (precisa de internet); não vão no kit. Confira a licença de cada uma em fonts.google.com | legenda e cartões |
| Modelo do Whisper (linha leve) | baixado por você; confira a licença no site de onde baixar | `estudio/modelos/` |

## Não vão dentro do kit (você instala ou baixa)

| Peça | Observação |
|---|---|
| Google Chrome (ou Chromium) e ffmpeg | instalados por você; cada um tem a sua licença |
| Voz e música (ElevenLabs) | geradas na conta e sob os termos do plano de quem usa; o kit não traz voz nem música |

## Baixados no seu computador só se faltarem (pelo `npm run preparar`)

O kit **não leva** estas peças: só o `package.json` que manda o `npm` ou o Playwright baixá-las, direto das fontes deles, para dentro da pasta do projeto. Nada disto é redistribuído por nós.

| Peça | Autor e licença | Onde |
|---|---|---|
| @ffmpeg-installer/ffmpeg 1.1.0 e @ffprobe-installer/ffprobe 2.1.2 | pacotes de kribblo e dos autores, licença LGPL-2.1, que trazem builds do FFmpeg 4.4 (© os autores do FFmpeg; esse build é GPL, com libx264 e componentes "nonfree", por isso só pode ser usado na sua máquina, nunca redistribuído) | `estudio/ferramentas_locais/node_modules`, só se o computador não tiver ffmpeg com libx264 |
| Chromium (build do Playwright 1.49.1) | © The Chromium Authors, licença BSD-3-Clause e as de terceiros listadas no próprio navegador (chrome://credits) | `estudio/ferramentas_locais/navegador`, só se não houver Chrome, Chromium nem Edge |
