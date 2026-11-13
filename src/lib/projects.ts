import { getCollection, type CollectionEntry } from 'astro:content';
import { localePath, type Locale } from '../i18n/ui';
import { parseYouTube, type YouTubeVideo } from './youtube';

export type Project = CollectionEntry<'projects'>;

/** Pasta do projeto, que também é o endereço: "jimmykimtv/pt-br" -> "jimmykimtv" */
export function projectSlug(entry: Project): string {
  return entry.id.split('/')[0];
}

/** Projetos de um idioma, na ordem definida em "order". */
export async function getProjects(locale: Locale): Promise<Project[]> {
  const all = await getCollection('projects', (p) => p.id.endsWith(`/${locale}`));
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Uma peça individual do portfólio (um vídeo, uma arte), com o cliente de origem. */
export interface Piece {
  key: string;
  image: Project['data']['cover'];
  title: string;
  client: string;
  /** Vídeo no YouTube etc. Sem vídeo, a peça abre a página do projeto. */
  href: string;
  external: boolean;
  isVideo: boolean;
  vertical: boolean;
  /** Vídeo do YouTube: abre na janela do site e tem prévia ao passar o mouse. */
  youtube: YouTubeVideo | null;
  /** Marcado com `featured: true` no conteúdo: entra nos Destaques da home. */
  featured: boolean;
}

/**
 * Todas as peças dos projetos, misturadas: uma de cada cliente por vez, para nunca
 * aparecerem várias seguidas do mesmo.
 * - `perProject`: quantas peças cada cliente cede no total.
 * - `maxStills`: quantas imagens sem vídeo cada cliente cede (evita que os 29 quadros
 *   de stop motion dominem a grade). Vídeos não entram nesse limite.
 */
export async function getPieces(locale: Locale, perProject = Infinity, maxStills = 8): Promise<Piece[]> {
  const projects = (await getProjects(locale)).filter((p) => p.data.group !== 'product' && p.data.media.length);
  const queues = projects.map((p) => {
    const slug = projectSlug(p);
    const page = localePath(locale, `/${slug}/`);
    // Vídeos primeiro; imagens soltas (artes, quadros) depois, até `maxStills`.
    const videos = p.data.media.filter((m) => m.video);
    const stills = p.data.media.filter((m) => !m.video).slice(0, maxStills);
    const media = [...videos, ...stills];
    return media.slice(0, perProject).map((m, i) => ({
      key: `${slug}-${i}`,
      image: m.image,
      title: m.title ?? p.data.title,
      client: p.data.title,
      href: m.video ?? page,
      external: !!m.video,
      isVideo: !!m.video,
      vertical: p.data.layout === 'vertical',
      youtube: parseYouTube(m.video),
      featured: m.featured,
    }));
  });

  const mixed: Piece[] = [];
  for (let round = 0; queues.some((q) => q.length > round); round++) {
    for (const q of queues) if (q[round]) mixed.push(q[round]);
  }
  return mixed;
}

/** Destino do card: link externo quando houver, senão a página do projeto. */
export function projectHref(entry: Project, locale: Locale): { href: string; external: boolean } {
  const link = entry.data.link;
  if (link && /^https?:\/\//.test(link)) return { href: link, external: true };
  if (link) return { href: link, external: false };
  return { href: localePath(locale, `/${projectSlug(entry)}/`), external: false };
}
