// Desenha as versões 2D do símbolo em canvas (as mesmas do CSS em styles/hero-variants.css),
// para entrarem na cena WebGL da abertura e passarem pelo shader CRT.
// Coordenadas em unidades do viewBox do símbolo (684 x 349).
import type { Variant2DId } from '../lib/heroVariants';

const ACCENT = '#dc0f2a';
const CREAM = '#f7f1ea';
const WINE = '#3a0f24';

/** Folga em volta do símbolo (contornos e o glitch passam um pouco da borda). */
export const VARIANT_MARGIN = 24;
/** Pixels por unidade do viewBox. */
const SCALE = 2;

type Ctx = CanvasRenderingContext2D;

let noise: HTMLCanvasElement | null = null;
function noiseTile(): HTMLCanvasElement {
  if (noise) return noise;
  noise = document.createElement('canvas');
  noise.width = noise.height = 160;
  const c = noise.getContext('2d')!;
  const img = c.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return noise;
}

/** Ponta inicial e final de um linear-gradient do CSS com ângulo `deg` numa caixa w x h. */
function cssGradientLine(deg: number, w: number, h: number) {
  const a = (deg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const len = Math.abs(w * dx) + Math.abs(h * dy);
  const cx = w / 2;
  const cy = h / 2;
  return [cx - (dx * len) / 2, cy - (dy * len) / 2, cx + (dx * len) / 2, cy + (dy * len) / 2] as const;
}

/** Faixas paralelas (largura `band`, período `period`) giradas em `angle` radianos. */
function bands(ctx: Ctx, w: number, h: number, angle: number, period: number, band: number, color: string) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);
  const r = Math.hypot(w, h);
  ctx.fillStyle = color;
  for (let y = -r; y < r; y += period) ctx.fillRect(-r, y, r * 2, band);
  ctx.restore();
}

export function paintVariant(id: Variant2DId, path: Path2D, vbW: number, vbH: number): HTMLCanvasElement {
  const m = VARIANT_MARGIN;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((vbW + m * 2) * SCALE);
  canvas.height = Math.round((vbH + m * 2) * SCALE);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(SCALE, 0, 0, SCALE, m * SCALE, m * SCALE);

  const w = vbW;
  const h = vbH;
  const fill = (color: string) => {
    ctx.fillStyle = color;
    ctx.fill(path, 'evenodd');
  };
  const clipped = (draw: () => void) => {
    ctx.save();
    ctx.clip(path, 'evenodd');
    draw();
    ctx.restore();
  };

  switch (id) {
    case 'flat-cream':
      fill(CREAM);
      break;
    case 'flat-pink':
      fill(ACCENT);
      break;
    case 'outline':
    case 'outline-cream':
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 4;
      ctx.lineWidth = id === 'outline' ? 4 : 9;
      ctx.strokeStyle = id === 'outline' ? ACCENT : CREAM;
      ctx.stroke(path);
      break;
    case 'stripes':
      clipped(() => {
        ctx.fillStyle = CREAM;
        ctx.fillRect(0, 0, w, h);
        bands(ctx, w, h, -Math.PI / 4, 18, 9, ACCENT);
      });
      break;
    case 'halftone':
      clipped(() => {
        ctx.fillStyle = ACCENT;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = WINE;
        for (let y = 4.5; y < h + 9; y += 9) {
          for (let x = 4.5; x < w + 9; x += 9) {
            ctx.beginPath();
            ctx.arc(x, y, 2.25, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      break;
    case 'gradient':
      clipped(() => {
        const g = ctx.createLinearGradient(...cssGradientLine(120, w, h));
        g.addColorStop(0, CREAM);
        g.addColorStop(0.45, ACCENT);
        g.addColorStop(1, WINE);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = ctx.createPattern(noiseTile(), 'repeat')!;
        ctx.fillRect(0, 0, w, h);
      });
      break;
    case 'grid':
      clipped(() => {
        ctx.fillStyle = WINE;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = ACCENT;
        for (let y = 0; y < h; y += 14) ctx.fillRect(0, y, w, 1);
        for (let x = 0; x < w; x += 14) ctx.fillRect(x, 0, 1, h);
      });
      break;
    case 'checker':
      clipped(() => {
        for (let y = 0; y < h; y += 11) {
          for (let x = 0; x < w; x += 11) {
            ctx.fillStyle = (x / 11 + y / 11) % 2 === 0 ? WINE : CREAM;
            ctx.fillRect(x, y, 11, 11);
          }
        }
      });
      break;
    case 'scanlines':
      clipped(() => {
        ctx.fillStyle = ACCENT;
        for (let y = h; y > -7; y -= 7) ctx.fillRect(0, y - 3, w, 3);
      });
      break;
    case 'split':
      clipped(() => {
        const g = ctx.createLinearGradient(...cssGradientLine(115, w, h));
        g.addColorStop(0, CREAM);
        g.addColorStop(0.5, CREAM);
        g.addColorStop(0.5, ACCENT);
        g.addColorStop(1, ACCENT);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
      break;
    case 'glitch': {
      const copy = (dx: number, dy: number, color: string) => {
        ctx.save();
        ctx.translate(dx, dy);
        fill(color);
        ctx.restore();
      };
      copy(-0.025 * w, 0.01 * h, '#ff1f3d');
      ctx.globalCompositeOperation = 'screen';
      copy(0.025 * w, -0.015 * h, '#19e6ff');
      ctx.save();
      ctx.beginPath();
      ctx.rect(-w, 0.18 * h, w * 3, 0.26 * h);
      ctx.rect(-w, 0.62 * h, w * 3, 0.12 * h);
      ctx.clip();
      copy(0.03 * w, 0, CREAM);
      ctx.restore();
      break;
    }
  }
  return canvas;
}
