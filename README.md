# Thneppel Site

Site único de thneppel.com.br (portfólio, blog, páginas institucionais e landing pages), em Astro.
Substitui os repositórios HugoPortfolio, HugoBlog e ThneppelWebsite.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm install` | Instala as dependências |
| `npx astro dev --background` | Sobe o servidor local em http://localhost:4321 (`npx astro dev stop` para parar) |
| `npm run build` | Gera o site final em `dist/` |
| `npm run preview` | Serve a versão gerada para conferir antes de publicar |

## Estrutura

```
src/
  layouts/Base.astro      layout único (head, SEO, menu, rodapé)
  components/             Header, Footer e componentes compartilhados
  i18n/ui.ts              textos fixos da interface em EN e PT-BR
  styles/global.css       tokens de cor, fonte e espaçamento
  pages/                  páginas em inglês na raiz, português em pages/pt-br/
public/                   arquivos servidos como estão (favicons, imagens, landing pages)
```

## Endereços a preservar

O site atual está indexado com estes caminhos. O novo deve responder nos mesmos,
ou redirecionar para o novo endereço.

| Página | EN | PT-BR |
| --- | --- | --- |
| Portfólio (home) | `/` | `/pt-br/` |
| Projeto | `/<projeto>/` | `/pt-br/<projeto>/` |
| Sobre | `/about/` | `/pt-br/about/` |
| Privacidade | `/privacy-and-policy/` | `/pt-br/privacy-and-policy/` |
| Termos | `/terms-of-use/` | `/pt-br/terms-of-use/` |
| Blog | `/blog/` | `/pt-br/blog/` (antes `/blog/pt-br/`, redireciona) |
| Post | `/blog/posts/2026/<slug>/` | `/pt-br/blog/posts/2026/<slug>/` (antes `/blog/pt-br/posts/...`, redireciona) |
| Tags do blog | `/blog/tags/<tag>/` | `/pt-br/blog/tags/<tag>/` (antes `/blog/pt-br/tags/...`, redireciona) |
| RSS do blog | `/blog/index.xml` | `/pt-br/blog/index.xml` (o antigo `/blog/pt-br/index.xml` continua servindo o feed) |
| LP mídia imobiliária | `/midiaimobiliariapoa/` | só PT |
| Redirecionamentos antigos | `/blog/about/` -> `/about/` | `/blog/pt-br/about/` -> `/pt-br/about/` |

Projetos atuais: artdirection, cronicdigital, depthloot, jimmykimtv, lixocarmesim,
matkastudios, midia-imobiliaria, mondo, mysoundlib, nicenraw.

Decidido: o blog em português foi padronizado para `/pt-br/blog/` (igual ao resto do site).
Os endereços antigos em `/blog/pt-br/...` redirecionam para os novos (ver `redirects` em
`astro.config.mjs`). Posts novos: crie `src/content/posts/<slug>/en.md` e `pt-br.md`, com as
imagens na mesma pasta.

## Publicação

O código fica no repositório **Thneppel/ThneppelWebsite**, que também publica o site
(GitHub Pages, branch `pages`, domínio thneppel.com.br). Cada push na `main` roda
`.github/workflows/deploy.yml`: `npm ci && npm run build` e publica a pasta `dist/` com o
`CNAME`. Também dá para rodar à mão em Actions > Deploy > Run workflow.

No fim do build, `integrations/site-files.mjs` gera `sitemap.xml`, `robots.txt` e os
endereços antigos de sitemap e RSS do Hugo. Os redirecionamentos de páginas antigas
ficam em `redirects` no `astro.config.mjs`.
