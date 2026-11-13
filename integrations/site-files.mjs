// Arquivos gerados no fim do build (só na publicação, não no modo dev):
// - sitemap.xml com todas as páginas reais (redirecionamentos e 404 ficam de fora);
// - endereços antigos de sitemap do Hugo apontando para o novo (sitemap index);
// - cópias do feed RSS do blog nos endereços antigos do Hugo;
// - robots.txt apontando para o sitemap.
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Sitemaps que o Hugo publicava: agora apontam para o /sitemap.xml novo. */
const LEGACY_SITEMAPS = ['pt-br/sitemap.xml', 'en/sitemap.xml', 'blog/sitemap.xml', 'blog/en/sitemap.xml', 'blog/pt-br/sitemap.xml'];

/** Feeds que o Hugo publicava -> feed novo equivalente. */
const LEGACY_FEEDS = {
  'index.xml': 'blog/index.xml',
  'pt-br/index.xml': 'pt-br/blog/index.xml',
  'blog/posts/index.xml': 'blog/index.xml',
  'blog/pt-br/posts/index.xml': 'pt-br/blog/index.xml',
};

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** @returns {import('astro').AstroIntegration} */
export default function siteFiles() {
  let site = '';
  return {
    name: 'site-files',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = String(config.site).replace(/\/$/, '');
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);

        // Páginas reais: index.html que não sejam redirecionamento, fora da LP estática.
        const urls = [];
        for await (const file of walk(root)) {
          if (!file.endsWith(`${sep}index.html`) && file !== join(root, 'index.html')) continue;
          const html = await readFile(file, 'utf-8');
          if (/http-equiv="refresh"/i.test(html) || /name="robots" content="noindex/i.test(html)) continue;
          const path = '/' + relative(root, dirname(file)).split(sep).join('/');
          urls.push(path === '/' || path === '/.' ? '/' : `${path}/`);
        }
        urls.sort();
        const sitemap =
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          urls.map((u) => `  <url><loc>${xmlEscape(site + u)}</loc></url>`).join('\n') +
          '\n</urlset>\n';
        await writeFile(join(root, 'sitemap.xml'), sitemap);

        const index =
          '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          `  <sitemap><loc>${site}/sitemap.xml</loc></sitemap>\n</sitemapindex>\n`;
        for (const path of LEGACY_SITEMAPS) {
          await mkdir(dirname(join(root, path)), { recursive: true });
          await writeFile(join(root, path), index);
        }

        for (const [from, to] of Object.entries(LEGACY_FEEDS)) {
          await mkdir(dirname(join(root, from)), { recursive: true });
          await copyFile(join(root, to), join(root, from));
        }

        await writeFile(join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
        logger.info(`sitemap.xml com ${urls.length} páginas, robots.txt e endereços antigos de sitemap/RSS`);
      },
    },
  };
}
