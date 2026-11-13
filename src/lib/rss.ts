// Feed RSS do blog (mesmo endereço do blog em Hugo: /blog/index.xml e, em português,
// /pt-br/blog/index.xml; o antigo /blog/pt-br/index.xml continua servindo o feed em PT).
import { localePath, t, type Locale } from '../i18n/ui';
import { getPosts, postHref } from './posts';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function blogFeed(locale: Locale, site: URL): Promise<Response> {
  const posts = await getPosts(locale);
  const home = new URL(localePath(locale, '/blog/'), site).href;
  const self = new URL(localePath(locale, '/blog/index.xml'), site).href;

  const items = posts
    .map((post) => {
      const link = new URL(postHref(post, locale), site).href;
      return `    <item>
      <title>${escape(post.data.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <description>${escape(post.data.description)}</description>
${post.data.tags.map((tag) => `      <category>${escape(tag)}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Thneppel Blog</title>
    <link>${home}</link>
    <description>${escape(t(locale, 'blog.description'))}</description>
    <language>${locale === 'pt-br' ? 'pt-BR' : 'en-US'}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${posts[0] ? `    <lastBuildDate>${posts[0].data.date.toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
