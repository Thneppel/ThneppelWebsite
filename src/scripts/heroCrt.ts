// Abertura com o shader newpixie-crt (o mesmo do ShaderGlass) aplicado em tudo.
//
// 1. Cena-fonte: fundo + "THIAGO NEPPEL" (canvas 2D) e, por cima,
//    o símbolo (3D ou placa 2D) na mesma posição e perspectiva do HTML.
// 2. newpixie-crt, portado de libretro/slang-shaders (crt/newpixie-crt.slangp):
//    accumulate (persistência) -> blur horizontal -> blur vertical -> newpixie-crt.
//    newpixie CRT por Mattias Gustavsson (MIT / domínio público), adaptado por hunterk.
import {
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  CanvasTexture,
  MeshBasicMaterial,
  WebGLRenderer,
  WebGLRenderTarget,
  LinearFilter,
  type Texture,
} from 'three';
import { FOV, OVERSCAN } from '../lib/heroGeometry';
import type { Material3DId, Variant2DId } from '../lib/heroVariants';
import { createSymbolScene } from './symbolScene';
import { paintVariant, VARIANT_MARGIN } from './paintVariant';

export interface HeroCrtOptions {
  /** Seção da abertura (o shader cobre ela inteira). */
  hero: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Elementos do HTML usados como referência de posição (ficam invisíveis). */
  stage: HTMLElement;
  backname: HTMLElement | null;
  svgText: string;
  variants2d: readonly Variant2DId[];
  materials3d: readonly Material3DId[];
}

export interface HeroCrt {
  /** Mostra um quadro: '3d' (próximo material) ou o id de uma versão 2D. */
  show(id: string): void;
  /** Inclinação pelo mouse, em radianos (convenção do CSS). */
  setRotation(x: number, y: number): void;
  /** Liga/desliga a animação (abertura fora da tela = parado). */
  setActive(active: boolean): void;
  dispose(): void;
}

/**
 * "Pixel size" do ShaderGlass: a imagem de entrada é capturada com 1/PIXEL_SIZE da
 * resolução da tela (cada pixel vira um bloco PIXEL_SIZE x PIXEL_SIZE). A etapa final
 * do shader continua na resolução da tela.
 */
const PIXEL_SIZE = 2;

/**
 * Tempo posterizado (como "Posterize Time" do After Effects): a abertura só desenha
 * FPS quadros por segundo. O tempo do shader (scanlines, ruído, ghosting) e a
 * persistência de fósforo continuam medidos em quadros de 60 fps, então a velocidade
 * do efeito não muda; só fica "picotada".
 */
const FPS = 12;
const BASE_FPS = 60;

// Parâmetros do newpixie-crt (valores padrão do preset).
const PARAMS = {
  acc_modulate: 0.65,
  blur_x: 1.0,
  blur_y: 1.0,
  curvature: 2.0,
  scanroll: 1.0,
  vignette: 1.0,
  ghosting: 1.0,
};

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// Pass 0: persistência de fósforo. A cena-fonte é guardada em sRGB (como a tela que
// o ShaderGlass captura), então converte de volta antes de acumular.
const ACCUMULATE = /* glsl */ `
uniform sampler2D tex0; // quadro anterior deste pass (PassFeedback1)
uniform sampler2D tex1; // cena-fonte
uniform float modulate;
varying vec2 vUv;
void main() {
  vec4 a = texture2D(tex0, vUv) * vec4(modulate);
  vec3 src = pow(clamp(texture2D(tex1, vUv).rgb, 0.0, 1.0), vec3(1.0 / 2.2));
  vec4 b = vec4(src, 1.0);
  gl_FragColor = max(a, b * 0.96);
}`;

// Passes 1 e 2: blur gaussiano de 9 amostras (horizontal e vertical).
const BLUR = /* glsl */ `
uniform sampler2D Source;
uniform vec2 blur;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  vec4 sum = texture2D(Source, uv) * 0.2270270270;
  sum += texture2D(Source, uv - 4.0 * blur) * 0.0162162162;
  sum += texture2D(Source, uv - 3.0 * blur) * 0.0540540541;
  sum += texture2D(Source, uv - 2.0 * blur) * 0.1216216216;
  sum += texture2D(Source, uv - 1.0 * blur) * 0.1945945946;
  sum += texture2D(Source, uv + 1.0 * blur) * 0.1945945946;
  sum += texture2D(Source, uv + 2.0 * blur) * 0.1216216216;
  sum += texture2D(Source, uv + 3.0 * blur) * 0.0540540541;
  sum += texture2D(Source, uv + 4.0 * blur) * 0.0162162162;
  gl_FragColor = sum;
}`;

// Pass 3: newpixie-crt. Mesmo código do original; só as coordenadas foram adaptadas
// (no WebGL as texturas já têm a origem embaixo, então a inversão de Y sai).
const NEWPIXIE = /* glsl */ `
precision highp float;
uniform sampler2D backbuffer;
uniform sampler2D blurbuffer;
uniform vec2 resolution;
uniform float frameCount;
uniform float curvature;
uniform float scanroll;
uniform float vignette;
uniform float ghosting;
varying vec2 vUv;

vec3 tsample(sampler2D samp, vec2 tc) {
  tc = tc * vec2(1.025, 0.92) + vec2(-0.0125, 0.04);
  vec3 s = pow(abs(texture2D(samp, tc).rgb), vec3(2.2));
  return s * vec3(1.25);
}

vec3 filmic(vec3 LinearColor) {
  vec3 x = max(vec3(0.0), LinearColor - vec3(0.004));
  return (x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06);
}

vec2 curve(vec2 uv) {
  uv = (uv - 0.5);
  uv *= vec2(0.925, 1.095);
  uv *= curvature;
  uv.x *= 1.0 + pow((abs(uv.y) / 4.0), 2.0);
  uv.y *= 1.0 + pow((abs(uv.x) / 3.0), 2.0);
  uv /= curvature;
  uv += 0.5;
  uv = uv * 0.92 + 0.04;
  return uv;
}

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 fragCoord = vUv * resolution;
  float time;
  vec2 uv = vUv;

  /* Curve */
  vec2 curved_uv = mix(curve(uv), uv, 0.4);
  float scale = -0.101;
  vec2 scuv = curved_uv * (1.0 - scale) + scale / 2.0 + vec2(0.003, -0.001);
  uv = scuv;

  /* Main color, Bleed (interferência desligada, como no preset) */
  vec3 col;
  float x = 0.0;
  float o = sin(fragCoord.y * 1.5) / resolution.x;
  x += o * 0.25;
  time = mod(frameCount, 640.0);
  col.r = tsample(backbuffer, vec2(x + scuv.x + 0.0009, scuv.y + 0.0009)).x + 0.02;
  col.g = tsample(backbuffer, vec2(x + scuv.x + 0.0000, scuv.y - 0.0011)).y + 0.02;
  col.b = tsample(backbuffer, vec2(x + scuv.x - 0.0015, scuv.y + 0.0000)).z + 0.02;
  float i = clamp(col.r * 0.299 + col.g * 0.587 + col.b * 0.114, 0.0, 1.0);
  i = pow(1.0 - pow(i, 2.0), 1.0);
  i = (1.0 - i) * 0.85 + 0.15;

  /* Ghosting */
  float ghs = 0.15 * ghosting;
  vec3 r = tsample(blurbuffer, vec2(x - 0.014 * 1.0, -0.027) * 0.85 + 0.007 * vec2(0.35 * sin(1.0 / 7.0 + 15.0 * curved_uv.y + 0.9 * time),
      0.35 * sin(2.0 / 7.0 + 10.0 * curved_uv.y + 1.37 * time)) + vec2(scuv.x + 0.001, scuv.y + 0.001)).xyz * vec3(0.5, 0.25, 0.25);
  vec3 g = tsample(blurbuffer, vec2(x - 0.019 * 1.0, -0.020) * 0.85 + 0.007 * vec2(0.35 * cos(1.0 / 9.0 + 15.0 * curved_uv.y + 0.5 * time),
      0.35 * sin(2.0 / 9.0 + 10.0 * curved_uv.y + 1.50 * time)) + vec2(scuv.x + 0.000, scuv.y - 0.002)).xyz * vec3(0.25, 0.5, 0.25);
  vec3 b = tsample(blurbuffer, vec2(x - 0.017 * 1.0, -0.003) * 0.85 + 0.007 * vec2(0.35 * sin(2.0 / 3.0 + 15.0 * curved_uv.y + 0.7 * time),
      0.35 * cos(2.0 / 3.0 + 10.0 * curved_uv.y + 1.63 * time)) + vec2(scuv.x - 0.002, scuv.y + 0.000)).xyz * vec3(0.25, 0.25, 0.5);

  col += vec3(ghs * (1.0 - 0.299)) * pow(clamp(vec3(3.0) * r, vec3(0.0), vec3(1.0)), vec3(2.0)) * vec3(i);
  col += vec3(ghs * (1.0 - 0.587)) * pow(clamp(vec3(3.0) * g, vec3(0.0), vec3(1.0)), vec3(2.0)) * vec3(i);
  col += vec3(ghs * (1.0 - 0.114)) * pow(clamp(vec3(3.0) * b, vec3(0.0), vec3(1.0)), vec3(2.0)) * vec3(i);

  /* Level adjustment (curves) */
  col *= vec3(0.95, 1.05, 0.95);
  col = clamp(col * 1.3 + 0.75 * col * col + 1.25 * col * col * col * col * col, vec3(0.0), vec3(10.0));

  /* Vignette */
  float vig = ((1.0 - 0.99 * vignette) + 1.0 * 16.0 * curved_uv.x * curved_uv.y * (1.0 - curved_uv.x) * (1.0 - curved_uv.y));
  vig = 1.3 * pow(vig, 0.5);
  col *= vig;

  time *= scanroll;

  /* Scanlines */
  float scans = clamp(0.35 + 0.18 * sin(6.0 * time - curved_uv.y * resolution.y * 1.5), 0.0, 1.0);
  float s = pow(scans, 0.9);
  col = col * vec3(s);

  /* Vertical lines (shadow mask) */
  col *= 1.0 - 0.23 * (clamp((mod(fragCoord.x, 3.0)) / 2.0, 0.0, 1.0));

  /* Tone map */
  col = filmic(col);

  /* Noise */
  vec2 seed = curved_uv * resolution.xy;
  col -= 0.015 * pow(vec3(rand(seed + time), rand(seed + time * 2.0), rand(seed + time * 3.0)), vec3(1.5));

  /* Flicker */
  col *= (1.0 - 0.004 * (sin(50.0 * time + curved_uv.y * 2.0) * 0.5 + 0.5));

  gl_FragColor = vec4(col, 1.0);
}`;

/**
 * Textura ASCII do nome: caracteres monoespaçados numa grade, escolhidos pela parte da
 * célula que a letra cobre. Miolo com caracteres densos (variando, para dar textura);
 * bordas com caracteres leves, que suavizam o contorno.
 *
 * Animação ("terminal vivo"), redesenhada a cada quadro do CRT:
 * - cintilação: a cada quadro, alguns caracteres do miolo trocam por outros;
 * - varredura: de tempos em tempos uma faixa desce pelo nome, embaralhando e
 *   acendendo os caracteres por onde passa.
 */
const ASCII_EDGE = '.:-=+*';
const ASCII_FILL = '#%@&$8#%@';
const ASCII_SCRAMBLE = '#%@&$8*+=!?/<>01';
/** Opacidade dos caracteres (o texto liso usava 0.16; a grade cobre menos área). */
const ASCII_ALPHA = 0.5;
const ASCII_FONT = `ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace`;
/** Fração dos caracteres do miolo que trocam a cada quadro. */
const ASCII_FLICKER = 0.025;
/** Varredura: intervalo entre passagens, duração da descida e altura da faixa (px). */
const SCAN_EVERY_MS = 5200;
const SCAN_MS = 1500;
const SCAN_BAND = 90;

/** Número pseudoaleatório fixo por célula (a textura base não muda a cada redesenho). */
const cellNoise = (x: number, y: number, k = 0) => {
  const v = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;
  return v - Math.floor(v);
};

interface AsciiCell {
  x: number;
  y: number;
  /** Parte da célula coberta pela letra (0..1). */
  cov: number;
  char: string;
  alpha: number;
}

interface AsciiGrid {
  cells: AsciiCell[];
  cellW: number;
  cellH: number;
  color: string;
  /** Faixa vertical ocupada pelo nome (para a varredura). */
  top: number;
  bottom: number;
}

/** Calcula a grade (só quando o tamanho muda): máscara do nome -> células com caractere base. */
function buildAsciiGrid(backname: HTMLElement, heroRect: DOMRect, W: number, H: number): AsciiGrid {
  // 1. Nome numa máscara, com a mesma fonte, tamanho e posição do HTML.
  const mask = document.createElement('canvas');
  mask.width = Math.max(1, Math.ceil(W));
  mask.height = Math.max(1, Math.ceil(H));
  const mctx = mask.getContext('2d', { willReadFrequently: true })!;
  mctx.fillStyle = '#fff';
  let fontPx = 100;
  for (const span of backname.querySelectorAll<HTMLElement>('span')) {
    const r = span.getBoundingClientRect();
    const s = getComputedStyle(span);
    fontPx = parseFloat(s.fontSize) || fontPx;
    mctx.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    if ('letterSpacing' in mctx) (mctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = s.letterSpacing;
    mctx.textAlign = 'center';
    mctx.textBaseline = 'alphabetic';
    const text = s.textTransform === 'uppercase' ? span.textContent!.toUpperCase() : span.textContent!;
    const m = mctx.measureText(text);
    const cx = r.left - heroRect.left + r.width / 2;
    const cy = r.top - heroRect.top + r.height / 2;
    mctx.fillText(text, cx, cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  }
  const data = mctx.getImageData(0, 0, mask.width, mask.height).data;

  // 2. Grade proporcional ao tamanho do nome, grande o bastante para os caracteres
  //    continuarem legíveis depois do CRT (meia resolução).
  const cellH = Math.max(10, Math.min(20, Math.round(fontPx / 14)));
  const cellW = Math.round(cellH * 0.66);
  const coverage = (x: number, y: number) => {
    let sum = 0;
    for (let sy = 0; sy < 3; sy++) {
      for (let sx = 0; sx < 3; sx++) {
        const px = Math.min(mask.width - 1, Math.floor(x + ((sx + 0.5) * cellW) / 3));
        const py = Math.min(mask.height - 1, Math.floor(y + ((sy + 0.5) * cellH) / 3));
        sum += data[(py * mask.width + px) * 4 + 3];
      }
    }
    return sum / (9 * 255);
  };
  const cells: AsciiCell[] = [];
  let top = H;
  let bottom = 0;
  for (let y = 0; y < H; y += cellH) {
    for (let x = 0; x < W; x += cellW) {
      const cov = coverage(x, y);
      if (cov < 0.1) continue;
      const fill = cov > 0.9;
      cells.push({
        x: x + cellW / 2,
        y: y + cellH / 2,
        cov,
        char: fill
          ? ASCII_FILL[Math.floor(cellNoise(x, y) * ASCII_FILL.length)]
          : ASCII_EDGE[Math.min(ASCII_EDGE.length - 1, Math.floor(cov * ASCII_EDGE.length))],
        alpha: fill ? 0.7 + 0.3 * cellNoise(x, y, 1) : 0.45 + 0.55 * cov,
      });
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + cellH);
    }
  }
  return { cells, cellW, cellH, color: getComputedStyle(backname).color, top, bottom };
}

/**
 * Desenha fundo e nome (ASCII animado) num canvas do tamanho da abertura.
 * `scale`: pixels do canvas por px CSS (a cena-fonte do CRT já é de meia resolução).
 */
function paintBackground(
  canvas: HTMLCanvasElement,
  W: number,
  H: number,
  scale: number,
  grid: AsciiGrid | null,
  now: number,
): void {
  const cw = Math.max(1, Math.round(W * scale));
  const ch = Math.max(1, Math.round(H * scale));
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // Fundo: radial-gradient(50% 45% at 50% 48%, rgba(220,15,42,.1), transparent 70%) sobre #0b0a0d
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0b0a0d';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W * 0.5, H * 0.48);
  ctx.scale(W * 0.5, H * 0.45);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, 'rgba(220,15,42,0.10)');
  g.addColorStop(0.7, 'rgba(220,15,42,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-2, -2, 4, 4);
  ctx.restore();

  if (!grid) return;

  // Posição da faixa de varredura (fora do nome enquanto não está passando).
  const phase = now % SCAN_EVERY_MS;
  const travel = grid.bottom - grid.top + SCAN_BAND * 2;
  const scanY = phase < SCAN_MS ? grid.top - SCAN_BAND + (phase / SCAN_MS) * travel : -1e9;

  ctx.save();
  ctx.fillStyle = grid.color;
  ctx.font = `700 ${grid.cellH}px ${ASCII_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tick = Math.floor(now / 83); // muda a cada quadro de 12 fps
  for (const c of grid.cells) {
    let char = c.char;
    let alpha = c.alpha;
    // Faixa de varredura: embaralha e acende, mais forte no centro da faixa.
    const d = Math.abs(c.y - scanY) / SCAN_BAND;
    if (d < 1) {
      const k = 1 - d;
      if (cellNoise(c.x, c.y, tick) < 0.85 * k) {
        char = ASCII_SCRAMBLE[Math.floor(cellNoise(c.x, c.y, tick + 7) * ASCII_SCRAMBLE.length)];
      }
      alpha = Math.min(1 / ASCII_ALPHA, alpha + k * 1.1);
    } else if (c.cov > 0.9 && cellNoise(c.x, c.y, tick) < ASCII_FLICKER) {
      // Cintilação: troca o caractere do miolo neste quadro.
      char = ASCII_FILL[Math.floor(cellNoise(c.x, c.y, tick + 3) * ASCII_FILL.length)];
      alpha *= 1.35;
    }
    ctx.globalAlpha = Math.min(1, ASCII_ALPHA * alpha);
    ctx.fillText(char, c.x, c.y);
  }
  ctx.restore();
}

export async function createHeroCrt(opts: HeroCrtOptions): Promise<HeroCrt> {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 2);

  const renderer = new WebGLRenderer({ canvas: opts.canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(dpr);
  renderer.autoClear = false;

  // --- Cena-fonte ---
  const sym = createSymbolScene(renderer, opts.svgText);
  const pathD = opts.svgText.match(/ d="([^"]+)"/)?.[1] ?? '';
  const symbolPath = new Path2D(pathD);
  const flats = new Map<string, HTMLCanvasElement>();
  for (const id of opts.variants2d) flats.set(id, paintVariant(id, symbolPath, sym.vbW, sym.vbH));

  const bgCanvas = document.createElement('canvas');
  const bgTexture = new CanvasTexture(bgCanvas);
  bgTexture.colorSpace = SRGBColorSpace;
  const bgScene = new Scene();
  const bgMesh = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial({ map: bgTexture, depthTest: false, depthWrite: false }));
  bgScene.add(bgMesh);
  const flatCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const camera = new PerspectiveCamera(FOV, 1, 1, 100000);
  // Mesma distância usada como `perspective` no CSS (lib/heroGeometry.ts).
  const distance = (sym.vbH * OVERSCAN) / 2 / Math.tan((FOV * Math.PI) / 360);
  camera.position.set(0, 0, distance);

  // --- Alvos dos passes ---
  const rt = (srgb = false) => {
    // A cena-fonte é desenhada sem suavização entre pixels, como a captura do ShaderGlass;
    // os passes seguintes leem com filtro linear (filter_linear = true no preset).
    const t = new WebGLRenderTarget(1, 1, { minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: srgb });
    if (srgb) t.texture.colorSpace = SRGBColorSpace;
    return t;
  };
  const source = rt(true); // cena-fonte, guardada em sRGB
  let accRead = rt();
  let accWrite = rt();
  const blurH = rt();
  const blurV = rt();

  // --- Passes do shader ---
  const quadScene = new Scene();
  const quad = new Mesh(new PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  quadScene.add(quad);

  const accumulate = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: ACCUMULATE,
    uniforms: { tex0: { value: null }, tex1: { value: null }, modulate: { value: PARAMS.acc_modulate } },
  });
  const blurMat = () =>
    new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: BLUR,
      uniforms: { Source: { value: null }, blur: { value: [0, 0] } },
    });
  const blurHMat = blurMat();
  const blurVMat = blurMat();
  const newpixie = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: NEWPIXIE,
    uniforms: {
      backbuffer: { value: null },
      blurbuffer: { value: null },
      resolution: { value: [1, 1] },
      frameCount: { value: 0 },
      curvature: { value: PARAMS.curvature },
      scanroll: { value: PARAMS.scanroll },
      vignette: { value: PARAMS.vignette },
      ghosting: { value: PARAMS.ghosting },
    },
  });

  const pass = (material: ShaderMaterial, target: WebGLRenderTarget | null) => {
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(quadScene, flatCam);
  };

  // --- Layout: tamanho e câmera a partir do HTML ---
  let pw = 1;
  let ph = 1;
  // Fundo desenhado na resolução da cena-fonte (a entrada do CRT é de meia resolução).
  const bgScale = dpr / PIXEL_SIZE;
  let asciiGrid: AsciiGrid | null = null;
  let bgSize: [number, number] = [1, 1];
  const layout = () => {
    const heroRect = opts.hero.getBoundingClientRect();
    const stageRect = opts.stage.getBoundingClientRect();
    const W = heroRect.width;
    const H = heroRect.height;
    if (!W || !H || !stageRect.height) return;
    renderer.setSize(W, H, false);
    pw = Math.round(W * dpr);
    ph = Math.round(H * dpr);
    // Entrada e passes intermediários (scale_type "source") em resolução reduzida.
    const sw = Math.max(1, Math.round(pw / PIXEL_SIZE));
    const sh = Math.max(1, Math.round(ph / PIXEL_SIZE));
    for (const t of [source, accRead, accWrite, blurH, blurV]) t.setSize(sw, sh);

    // Câmera centrada no palco do símbolo, com o recorte da abertura inteira
    // (mesma perspectiva do CSS, que tem origem no centro do palco).
    const k = sym.vbH / stageRect.height; // unidades da cena por pixel
    const sx = stageRect.left - heroRect.left + stageRect.width / 2;
    const sy = stageRect.top - heroRect.top + stageRect.height / 2;
    const Wv = 2 * Math.max(sx, W - sx);
    const Hv = 2 * Math.max(sy, H - sy);
    camera.fov = (2 * Math.atan((Hv * k) / 2 / distance) * 180) / Math.PI;
    camera.aspect = Wv / Hv;
    camera.setViewOffset(Wv, Hv, Wv / 2 - sx, Hv / 2 - sy, W, H);
    camera.updateProjectionMatrix();

    asciiGrid = opts.backname ? buildAsciiGrid(opts.backname, heroRect, W, H) : null;
    bgSize = [W, H];
    paintBackground(bgCanvas, W, H, bgScale, asciiGrid, performance.now());
    bgTexture.needsUpdate = true;

    blurHMat.uniforms.blur.value = [PARAMS.blur_x / sw, 0];
    blurVMat.uniforms.blur.value = [0, PARAMS.blur_y / sh];
    newpixie.uniforms.resolution.value = [pw, ph];
  };

  await document.fonts.ready;
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(opts.hero);
  document.fonts.addEventListener('loadingdone', layout);

  sym.precompile(renderer, camera);

  let frame = 0;
  /** `ticks`: quantos quadros de 60 fps este quadro representa. */
  const renderFrame = (ticks = 1) => {
    // 0. Fundo com o ASCII animado (redesenhado a cada quadro)
    if (asciiGrid) {
      paintBackground(bgCanvas, bgSize[0], bgSize[1], bgScale, asciiGrid, performance.now());
      bgTexture.needsUpdate = true;
    }
    // 1. Cena-fonte
    renderer.setRenderTarget(source);
    renderer.clear();
    renderer.render(bgScene, flatCam);
    renderer.clearDepth();
    renderer.render(sym.scene, camera);

    // 2. Accumulate (com o quadro anterior), 3. blur H, 4. blur V
    accumulate.uniforms.tex0.value = accRead.texture as Texture;
    accumulate.uniforms.tex1.value = source.texture;
    // O fósforo apaga o equivalente a `ticks` quadros de uma vez.
    accumulate.uniforms.modulate.value = Math.pow(PARAMS.acc_modulate, ticks);
    pass(accumulate, accWrite);
    blurHMat.uniforms.Source.value = accWrite.texture;
    pass(blurHMat, blurH);
    blurVMat.uniforms.Source.value = blurH.texture;
    pass(blurVMat, blurV);

    // 5. newpixie-crt na tela
    newpixie.uniforms.backbuffer.value = accWrite.texture;
    newpixie.uniforms.blurbuffer.value = blurV.texture;
    newpixie.uniforms.frameCount.value = frame % 6400;
    pass(newpixie, null);

    [accRead, accWrite] = [accWrite, accRead];
    frame += ticks;
  };

  let active = false;
  let raf = 0;
  const frameMs = 1000 / FPS;
  let last = 0;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (!last) last = now - frameMs;
    const elapsed = now - last;
    // Tolerância de 1 ms para não pular quadros por arredondamento do relógio da tela.
    if (elapsed < frameMs - 1) return;
    // Mantém o ritmo fixo de 1/FPS s, sem acumular atraso.
    last = elapsed >= frameMs ? now - (elapsed % frameMs) : now;
    renderFrame(Math.min(Math.round((elapsed / 1000) * BASE_FPS), BASE_FPS));
  };

  const materials = [...opts.materials3d];
  let count3d = 0;
  // Primeiro quadro: primeira versão 2D (ou o 3D, se não houver 2D).
  if (opts.variants2d.length) sym.show2D(flats.get(opts.variants2d[0])!, VARIANT_MARGIN);
  else if (materials.length) sym.show3D(materials[0]);
  renderFrame();

  return {
    show(id) {
      if (id === '3d') {
        if (!materials.length) return;
        sym.show3D(materials[count3d++ % materials.length]);
      } else {
        const img = flats.get(id);
        if (img) sym.show2D(img, VARIANT_MARGIN);
      }
    },
    setRotation(x, y) {
      sym.setRotation(x, y);
    },
    setActive(next) {
      if (next === active) return;
      active = next;
      last = 0;
      if (active) raf = requestAnimationFrame(loop);
      else cancelAnimationFrame(raf);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.fonts.removeEventListener('loadingdone', layout);
      for (const t of [source, accRead, accWrite, blurH, blurV]) t.dispose();
      for (const m of [accumulate, blurHMat, blurVMat, newpixie]) m.dispose();
      bgTexture.dispose();
      sym.dispose();
      renderer.dispose();
    },
  };
}
