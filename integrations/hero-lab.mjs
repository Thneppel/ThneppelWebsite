// Laboratório da abertura: só existe no modo dev (npx astro dev).
// - Registra a página /lab/hero/ (nunca entra na build publicada).
// - Recebe o "Salvar" da página e grava src/data/hero.json.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const CONFIG_FILE = fileURLToPath(new URL('../src/data/hero.json', import.meta.url));

const isIdList = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && /^[a-z0-9-]+$/.test(x));

/** @returns {import('astro').AstroIntegration} */
export default function heroLab() {
  return {
    name: 'hero-lab',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;
        injectRoute({ pattern: '/lab/hero', entrypoint: './src/lab/HeroLab.astro' });
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use('/__lab/hero', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end();
          }
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const frameMsFast = Math.round(Number(data.frameMsFast));
              const frameMsSlow = Math.round(Number(data.frameMsSlow));
              const wavePeriodMs = Math.round(Number(data.wavePeriodMs));
              const okMs = (v) => v >= 50 && v <= 2000;
              if (
                !okMs(frameMsFast) ||
                !okMs(frameMsSlow) ||
                !(wavePeriodMs >= 500 && wavePeriodMs <= 60000) ||
                !isIdList(data.variants2d) ||
                !isIdList(data.materials3d)
              ) {
                throw new Error('dados inválidos');
              }
              const config = {
                frameMsFast,
                frameMsSlow,
                wavePeriodMs,
                variants2d: data.variants2d,
                materials3d: data.materials3d,
              };
              await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: String(err.message || err) }));
            }
          });
        });
      },
    },
  };
}
