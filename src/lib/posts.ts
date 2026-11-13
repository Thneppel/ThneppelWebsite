// Posts do blog: um arquivo por idioma em src/content/posts/<slug>/en.md e pt-br.md.
// Endereços (iguais aos do blog em Hugo, em português com o prefixo do resto do site):
//   /blog/posts/<ano>/<slug>/        /pt-br/blog/posts/<ano>/<slug>/
import { getCollection, type CollectionEntry } from 'astro:content';
import { localePath, type Locale } from '../i18n/ui';

export type Post = CollectionEntry<'posts'>;

export function postSlug(post: Post): string {
  return post.id.slice(0, post.id.lastIndexOf('/'));
}

export function postYear(post: Post): string {
  return String(post.data.date.getFullYear());
}

/** Posts publicados de um idioma, do mais novo para o mais antigo. */
export async function getPosts(locale: Locale): Promise<Post[]> {
  const all = await getCollection('posts', (p) => p.id.endsWith(`/${locale}`) && !p.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function postHref(post: Post, locale: Locale): string {
  return localePath(locale, `/blog/posts/${postYear(post)}/${postSlug(post)}/`);
}

/** Tags no formato de endereço (igual ao Hugo): "video editing" -> "video-editing". */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function tagHref(tag: string, locale: Locale): string {
  return localePath(locale, `/blog/tags/${tagSlug(tag)}/`);
}

/** Todas as tags usadas, mais frequentes primeiro. */
export function allTags(posts: Post[]): string[] {
  const count = new Map<string, number>();
  for (const p of posts) for (const tag of p.data.tags) count.set(tag, (count.get(tag) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
}

/** Minutos de leitura (~220 palavras por minuto). */
export function readingMinutes(post: Post): number {
  const words = (post.body ?? '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'pt-br' ? 'pt-BR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}
