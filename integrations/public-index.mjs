// Landing pages estáticas em public/ (ex.: public/midiaimobiliariapoa/index.html).
// Na build e na hospedagem, /pasta/ já entrega o index.html da pasta. O servidor de
// desenvolvimento do Astro não faz isso, então esta integração cobre só o modo dev:
//   /pasta  -> redireciona para /pasta/
//   /pasta/ -> serve public/pasta/index.html
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @returns {import('astro').AstroIntegration} */
export default function publicIndex() {
  let publicDir = '';
  return {
    name: 'public-index',
    hooks: {
      'astro:config:done': ({ config }) => {
        publicDir = fileURLToPath(config.publicDir);
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') return next();
          const [path, query = ''] = (req.url ?? '').split('?');
          let decoded;
          try {
            decoded = decodeURIComponent(path);
          } catch {
            return next();
          }
          // Só pastas: nada de extensão, nada de "..".
          if (decoded === '/' || decoded.includes('..') || /\.[a-z0-9]+$/i.test(decoded)) return next();

          const dir = join(publicDir, decoded);
          const index = join(dir, 'index.html');
          if (!existsSync(index) || !statSync(dir).isDirectory()) return next();

          if (!path.endsWith('/')) {
            res.statusCode = 301;
            res.setHeader('location', `${path}/${query ? `?${query}` : ''}`);
            return res.end();
          }
          req.url = `${path}index.html${query ? `?${query}` : ''}`;
          next();
        });
      },
    },
  };
}
