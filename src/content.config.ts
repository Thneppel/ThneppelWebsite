import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Um arquivo por idioma: src/content/projects/<projeto>/en.md e pt-br.md
// O id do item fica "<projeto>/<idioma>".
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.string(),
      // Aba da home onde o projeto aparece. "product" fica fora da grade (vai para o destaque).
      group: z.enum(['youtube', 'marketing', 'design', 'product', 'other']),
      order: z.number().default(500),
      cover: image(),
      // Link externo: o card abre este endereço em vez da página do projeto.
      link: z.string().optional(),
      // false = não aparece em "Selected work" (ex.: projeto que já tem seção própria na home).
      inWork: z.boolean().default(true),
      // Vídeo principal do projeto (botão "Assistir" na página do projeto).
      watch: z.string().optional(),
      // "vertical" para projetos de vídeo curto (Shorts/Reels).
      layout: z.enum(['default', 'vertical']).default('default'),
      media: z
        .array(
          z.object({
            image: image(),
            title: z.string().optional(),
            video: z.string().optional(),
            // Aparece nos Destaques da home (grade 3 x 3: marque 9 no total).
            featured: z.boolean().default(false),
          }),
        )
        .default([]),
    }),
});

// Páginas legais: src/content/legal/<página>/en.md e pt-br.md
const legal = defineCollection({
  loader: glob({ base: './src/content/legal', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Data da última atualização (aparece no topo da página).
    updated: z.coerce.date(),
  }),
});

// Posts do blog: src/content/posts/<slug>/en.md e pt-br.md (imagens na mesma pasta).
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      description: z.string(),
      cover: image(),
      // Legenda da imagem de capa.
      caption: z.string().optional(),
      tags: z.array(z.string()).default([]),
      categories: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects, legal, posts };
