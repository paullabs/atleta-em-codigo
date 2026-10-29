# atleta-em-codigo

Estúdio de vídeos de luta em código: um atleta 3D **sem rosto**, desenhado por código (Three.js e WebGL2), para ensinar boxe com exatidão. Faz a aula completa, Reels de curiosidade (por que um soco no queixo apaga) e raio X com anatomia real. Nenhuma imagem ou vídeo de terceiros entra: é tudo geometria renderizada quadro a quadro no seu computador.

## Comece

Pelo plugin (não precisa clonar). No **Claude Code**:

```bash
claude plugin marketplace add paullabs/atleta-em-codigo
claude plugin install atleta-em-codigo@atleta-em-codigo --scope user
```

No **Codex**:

```bash
codex plugin marketplace add paullabs/atleta-em-codigo
codex plugin add atleta-em-codigo@atleta-em-codigo
```

`--scope user` instala para todas as suas pastas (é o padrão do Claude Code). Para conferir, `claude plugin list` tem de mostrar `Scope: user` e `codex plugin list` tem de mostrar `installed, enabled`. Se o Claude mostrar `project` ou `local`, o plugin só vale naquela pasta: rode o `install` de novo com `--scope user`.

Numa pasta nova, abra o Claude Code e peça `/atleta-em-codigo:novo-projeto` (no Codex, peça em palavras: "criar meu projeto do atleta-em-codigo"). Ele copia o projeto para a pasta, instala as dependências e confere o computador.

Ou clone o repositório e siga o [LEIAME.md](LEIAME.md): requisitos, primeiro uso, raio X, o que não vem no kit e como fazer o seu vídeo.

## Licença

Licença própria (arquivo [LICENSE](LICENSE)): uso livre, inclusive comercial, com uma condição: todo vídeo publicado leva a marca d'água do canal do Titular. Não é permitido vender o kit como produto, curso ou template. Os componentes de terceiros seguem as licenças deles ([LICENCAS_TERCEIROS.md](LICENCAS_TERCEIROS.md)).
