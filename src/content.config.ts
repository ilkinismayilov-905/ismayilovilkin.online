import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Month precision, e.g. "2025-12". Formatted per locale with Intl at render time.
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const site = defineCollection({
  loader: glob({ base: './src/content/site', pattern: '*.yaml' }),
  schema: ({ image }) =>
    z.object({
      meta: z.object({ title: z.string(), description: z.string() }),
      person: z.object({
        name: z.string(),
        nameLines: z.tuple([z.string(), z.string()]),
        jobTitle: z.string(),
        location: z.string(),
        description: z.string(),
      }),
      hero: z.object({
        intro: z.string(),
        portrait: image(),
        portraitAlt: z.string(),
        tag: z.object({ strong: z.string(), text: z.string() }),
      }),
      status: z.object({ now: z.string(), focus: z.string(), next: z.string(), easterEgg: z.string() }),
      work: z.object({ note: z.string() }),
      contact: z.object({
        note: z.string(),
        photo: image(),
        email: z.email(),
        github: z.url(),
        linkedin: z.url(),
      }),
    }),
});

const about = defineCollection({
  loader: glob({ base: './src/content/about', pattern: '*.md' }),
  schema: ({ image }) =>
    z.object({
      chapters: z
        .array(z.object({ title: z.string(), text: z.array(z.string()).min(1), photo: image(), alt: z.string(), caption: z.string() }))
        .length(3),
      principles: z.array(z.object({ title: z.string(), text: z.string() })).min(1),
    }),
});

const experience = defineCollection({
  loader: glob({ base: './src/content/experience', pattern: '*.yaml' }),
  schema: z.object({
    items: z.array(
      z.object({
        role: z.string(),
        org: z.string(),
        start: yearMonth.optional(),
        end: yearMonth.optional(),
        current: z.boolean().default(false),
        text: z.string(),
      }),
    ),
  }),
});

const awards = defineCollection({
  loader: glob({ base: './src/content/awards', pattern: '*.yaml' }),
  schema: z.object({
    items: z.array(
      z.object({
        year: z.number().int().optional(),
        title: z.string(),
        text: z.string(),
        result: z.string(),
        project: z.string().optional(),
      }),
    ),
  }),
});

const projects = defineCollection({
  // ids are "en/milly", "az/milly"; never set a frontmatter `slug` (it would collide across locales)
  loader: glob({ base: './src/content/projects', pattern: '{en,az}/*.md' }),
  schema: z.object({
    title: z.string(),
    order: z.number().int(),
    year: z.number().int().optional(),
    category: z.enum(['backend', 'hackathon', 'frontend']),
    stack: z.array(z.string()).optional(),
    summary: z.string(),
    lede: z.string().optional(),
    motif: z.enum(['lines', 'blocks', 'rings', 'grid', 'wave']),
    caseStudy: z.boolean(),
    facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    live: z.object({ url: z.url(), coldStart: z.boolean().default(false) }).optional(),
    // Case studies only. Headings come from ui.ts so their level fits the page (h2 standalone, h4 in the home page).
    sections: z.object({ problem: z.string(), did: z.string(), decision: z.string(), result: z.string() }).optional(),
  }),
});

export const collections = { site, about, experience, awards, projects };
