// Carrega os dados do raio X (anatomia_interna/dados/interno.json e interno.bin), entrega ao renderizador e devolve o manifesto
// (a lista de peças e o crédito), que algumas páginas usam depois.
// Os dados não vêm no kit (BodyParts3D tem licença própria): sem eles, o erro diz o que fazer, em vez de "Unexpected end of JSON input".
const BASE = '/esportes/anatomia_interna/dados/';

export async function carregarRaioX(R) {
  const [json, bin] = await Promise.all([fetch(BASE + 'interno.json'), fetch(BASE + 'interno.bin')]);
  if (!json.ok || !bin.ok) {
    throw new Error(
      'Faltam os dados do raio X (estudio/esportes/anatomia_interna/dados/interno.json e interno.bin). ' +
        'Eles não vêm no kit: baixe o BodyParts3D 4.0, descompacte em estudio/modelos/bodyparts3d/original/ e rode, ' +
        'dentro de estudio/esportes/: node anatomia_interna/preparar.mjs (passo a passo no LEIAME.md, seção "Raio X").'
    );
  }
  const manifesto = await json.json();
  R.carregarInterno(await bin.arrayBuffer(), manifesto);
  return manifesto;
}
