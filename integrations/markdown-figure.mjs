// Plugin do processador de Markdown do Astro (Sätteri): imagem sozinha num parágrafo e
// com título vira <figure> com legenda.
//   ![texto alternativo](./foto.jpg "Legenda da foto")
// ->
//   <figure><img alt="texto alternativo" ...><figcaption>Legenda da foto</figcaption></figure>
// Roda antes do passo do Astro que otimiza as imagens, então elas continuam otimizadas.

/** @type {import('satteri').HastPluginDefinition} */
const figurePlugin = {
  name: 'figure-caption',
  element: {
    filter: ['p'],
    visit(node, ctx) {
      const kids = (node.children ?? []).filter((c) => !(c.type === 'text' && !String(c.value).trim()));
      if (kids.length !== 1) return;
      const img = kids[0];
      if (img.type !== 'element' || img.tagName !== 'img') return;
      const caption = img.properties?.title;
      if (typeof caption !== 'string' || !caption) return;
      ctx.setProperty(img, 'title', null);
      ctx.setField(node, 'tagName', 'figure');
      ctx.appendChild(node, {
        type: 'element',
        tagName: 'figcaption',
        properties: {},
        children: [{ type: 'text', value: caption }],
      });
    },
  },
};

export default figurePlugin;
