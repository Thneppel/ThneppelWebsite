import type { APIRoute } from 'astro';
import { blogFeed } from '../../../lib/rss';

// Endereço do feed em português no blog em Hugo; leitores de RSS antigos seguem funcionando.
export const GET: APIRoute = ({ site }) => blogFeed('pt-br', site!);
