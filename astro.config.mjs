// @ts-check
import { defineConfig } from 'astro/config';
import heroLab from './integrations/hero-lab.mjs';
import publicIndex from './integrations/public-index.mjs';
import { satteri } from '@astrojs/markdown-satteri';
import markdownFigure from './integrations/markdown-figure.mjs';
import siteFiles from './integrations/site-files.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://thneppel.com.br',
  // Os endereços atuais (Hugo) terminam todos com barra: /about/, /blog/...
  trailingSlash: 'always',
  integrations: [heroLab(), publicIndex(), siteFiles()],
  markdown: {
    // ![alt](foto.jpg "Legenda") vira <figure> com <figcaption>.
    processor: satteri({ hastPlugins: [markdownFigure] }),
  },
  // Endereços antigos do blog em Hugo. O blog em português foi de /blog/pt-br/ para
  // /pt-br/blog/ (igual ao resto do site); as listas /posts/ e a categoria única
  // viraram a página do blog.
  redirects: {
    '/blog/posts/': '/blog/',
    '/blog/categories/personal/': '/blog/',
    '/blog/pt-br/': '/pt-br/blog/',
    '/blog/pt-br/posts/': '/pt-br/blog/',
    '/blog/pt-br/categories/personal/': '/pt-br/blog/',
    '/blog/pt-br/posts/[year]/[slug]': '/pt-br/blog/posts/[year]/[slug]',
    '/blog/pt-br/tags/[tag]': '/pt-br/blog/tags/[tag]',
    // Restos do Hugo: páginas que deixaram de existir no site novo.
    '/about/': '/#about',
    '/pt-br/about/': '/pt-br/#about',
    '/blog/about/': '/#about',
    '/blog/pt-br/about/': '/pt-br/#about',
    '/mysoundlib/': 'https://mysoundlib.com/',
    '/pt-br/mysoundlib/': 'https://mysoundlib.com/',
    '/midia-imobiliaria/': '/midiaimobiliariapoa/',
    '/pt-br/midia-imobiliaria/': '/midiaimobiliariapoa/',
    '/en/': '/',
    '/blog/en/': '/blog/',
    '/blog/page/1/': '/blog/',
    '/blog/posts/page/1/': '/blog/',
    '/blog/pt-br/page/1/': '/pt-br/blog/',
    '/blog/pt-br/posts/page/1/': '/pt-br/blog/',
  },
  i18n: {
    locales: ['en', 'pt-br'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
