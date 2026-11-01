import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { sectionIds } from './data/sections';

// One markdown file per Entry: frontmatter is the metadata, the body is its text.
const entries = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/entries' }),
  schema: z.object({
    section: z.enum(sectionIds),
    // Position on the Home page: Entries are listed by ascending order within their heading.
    order: z.number().int().positive(),
    title: z.string(),
    // An address elsewhere, or a path on this site such as a Hosted page.
    link: z.union([z.url(), z.string().regex(/^\/(?![/\\])\S*$/, 'a URL, or a path starting with one slash')]).optional(),
  }),
});

export const collections = { entries };
