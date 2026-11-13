// Cadastro de todas as versões do símbolo na abertura.
// A escolha do que entra no site fica em src/data/hero.json (editável pela página /lab/hero/ no modo dev).

export const VARIANTS_2D = [
  { id: 'flat-cream', label: 'Creme liso' },
  { id: 'flat-pink', label: 'Rosa liso' },
  { id: 'outline', label: 'Contorno rosa' },
  { id: 'outline-cream', label: 'Contorno creme' },
  { id: 'stripes', label: 'Listras' },
  { id: 'halftone', label: 'Retícula' },
  { id: 'gradient', label: 'Degradê granulado' },
  { id: 'glitch', label: 'Glitch RGB' },
  { id: 'grid', label: 'Grade' },
  { id: 'checker', label: 'Xadrez' },
  { id: 'scanlines', label: 'Linhas de varredura' },
  { id: 'split', label: 'Meio a meio' },
] as const;

export const MATERIALS_3D = [
  { id: 'chrome', label: 'Cromado' },
  { id: 'pink-plastic', label: 'Plástico rosa' },
  { id: 'gold', label: 'Dourado' },
  { id: 'wire-pink', label: 'Wireframe rosa' },
  { id: 'clay', label: 'Argila' },
  { id: 'rose-chrome', label: 'Cromado rosado' },
  { id: 'glass', label: 'Vidro' },
  { id: 'rubber', label: 'Borracha preta' },
  { id: 'toon', label: 'Desenho (toon)' },
  { id: 'steel', label: 'Aço escovado' },
  { id: 'neon', label: 'Neon' },
  { id: 'iridescent', label: 'Iridescente' },
  { id: 'ceramic', label: 'Cerâmica' },
  { id: 'wine', label: 'Vinho fosco' },
  { id: 'wire-cream', label: 'Wireframe creme' },
] as const;

export type Variant2DId = (typeof VARIANTS_2D)[number]['id'];
export type Material3DId = (typeof MATERIALS_3D)[number]['id'];

export interface HeroConfig {
  /** Duração de cada visual no pico de velocidade da onda (mais rápido). */
  frameMsFast: number;
  /** Duração no vale da onda (mais lento). */
  frameMsSlow: number;
  /** Duração de uma onda completa: rápido → lento → rápido. */
  wavePeriodMs: number;
  variants2d: Variant2DId[];
  materials3d: Material3DId[];
}

export type HeroTiming = Pick<HeroConfig, 'frameMsFast' | 'frameMsSlow' | 'wavePeriodMs'>;

/**
 * Duração do próximo visual: oscila numa onda seno entre o mais lento e o mais rápido,
 * em loop. `elapsedMs` é o tempo desde o início da montagem.
 */
export function frameDelay(timing: HeroTiming, elapsedMs: number): number {
  const speed = 0.5 + 0.5 * Math.sin((2 * Math.PI * elapsedMs) / timing.wavePeriodMs); // 0 = lento, 1 = rápido
  return Math.round(timing.frameMsSlow + (timing.frameMsFast - timing.frameMsSlow) * speed);
}

/** Monta a ordem de exibição: alterna 3D e 2D enquanto houver dos dois. */
export function buildSequence(config: HeroConfig): string[] {
  const twoD = config.variants2d;
  const has3d = config.materials3d.length > 0;
  if (!has3d) return [...twoD];
  if (!twoD.length) return ['3d'];
  return twoD.flatMap((id) => ['3d', id]);
}
