// Links do YouTube: extrai o código do vídeo e monta os endereços de incorporação.
// Aceita os formatos que aparecem no conteúdo: youtu.be/ID, youtube.com/watch?v=ID,
// youtube.com/shorts/ID e youtube.com/embed/ID (com ou sem parâmetros extras).

export interface YouTubeVideo {
  id: string;
  /** Shorts são verticais: abrem em pé. */
  short: boolean;
}

export function parseYouTube(url: string | undefined): YouTubeVideo | null {
  if (!url) return null;
  const m =
    url.match(/youtu\.be\/([\w-]{11})/) ??
    url.match(/youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? { id: m[1], short: /\/shorts\//.test(url) } : null;
}

/** Player para assistir (janela do site): com som, controles e início automático. */
export function watchEmbed(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
}

/**
 * Prévia ao passar o mouse: sem som, sem controles, em loop.
 * `enablejsapi` deixa o player avisar a página quando começa a tocar
 * (a prévia só aparece nesse momento, sem nenhum controle do YouTube à vista).
 */
export function previewEmbed(id: string, origin: string): string {
  return (
    `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}` +
    '&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0' +
    `&enablejsapi=1&origin=${encodeURIComponent(origin)}`
  );
}
