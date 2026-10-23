import type { APIRoute } from 'astro';
import { localeSitemap } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) => localeSitemap('en', site);
