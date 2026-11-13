// TV da seção Sobre: a foto da TV fica parada e só a tela "liga".
// Um único shader desenha a foto inteira e, dentro do vidro, as thumbs dos Destaques
// em perspectiva (homografia a partir dos 4 cantos da tela na foto), com linhas de
// varredura, curvatura, troca de canal com chiado e os reflexos do vidro da foto por cima.
// A luz da tela também "vaza" na moldura em volta.
//
// Tempo posterizado a 12 fps, como a abertura (scripts/heroCrt.ts).
import {
  CanvasTexture,
  LinearFilter,
  Matrix3,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
  type Texture,
} from 'three';

export interface TvPhotoOptions {
  /** Caixa que define o tamanho (o canvas ocupa ela inteira, na proporção da foto). */
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Endereço da foto da TV. */
  photo: string;
  /** Cantos do vidro na foto, em frações (0..1, y para baixo): sup. esq., sup. dir., inf. dir., inf. esq. */
  corners: [number, number][];
  /** Contorno do vidro na foto (frações, y para baixo), com as bordas curvas do tubo. */
  outline: [number, number][];
  /** Endereços das thumbs, na ordem do ciclo. */
  images: string[];
  /** false = sem animação (prefers-reduced-motion): um quadro parado, sem chiado. */
  animate: boolean;
}

export interface TvPhoto {
  /** Muda para a thumb `index`, com a transição de canal. */
  show(index: number): void;
  /** Liga/desliga o loop (seção fora da tela = parado). */
  setActive(active: boolean): void;
  dispose(): void;
}

const FPS = 12;
/** Duração da troca de canal (chiado + rolagem). */
const SWITCH_MS = 420;
/** Proporção da imagem na tela da TV (4:3). */
const SCREEN_ASPECT = 4 / 3;
/** Escala dos cantos medidos em volta do centro (1 = exatamente os cantos do vidro). */
const OVERSCAN = 1.0;

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `
uniform sampler2D photo;
uniform sampler2D thumb;
uniform sampler2D mask; // r: vidro (borda suave), g: vidro bem desfocado

// Área acesa do tubo (onde a imagem aparece), em coordenadas da tela (0..1):
// recuada da borda do vidro, com cantos arredondados, como num CRT de verdade.
#define RASTER_MARGIN 0.036
#define RASTER_RADIUS 0.075
// Vidro é mais alto que largo na foto: corrige para os cantos ficarem redondos.
#define RASTER_Y 1.19

uniform mat3 toScreen;
uniform vec2 uvScale;
uniform vec2 uvOffset;
uniform float time;
uniform float noiseAmt;
uniform float roll;
uniform float hasThumb;
varying vec2 vUv;

float rand(vec2 c) {
  return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
}

float roundRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Amostra da thumb em coordenadas da tela (0..1, y para baixo), recortada em 4:3.
vec3 thumbAt(vec2 uv) {
  vec2 t = uv * uvScale + uvOffset;
  return texture2D(thumb, vec2(t.x, 1.0 - t.y)).rgb;
}

void main() {
  vec3 photoCol = texture2D(photo, vUv).rgb;

  // Pixel da foto -> coordenada dentro do vidro (homografia).
  vec2 p = vec2(vUv.x, 1.0 - vUv.y);
  vec3 s = toScreen * vec3(p, 1.0);
  vec2 suv = s.xy / s.z;
  vec2 m = texture2D(mask, vUv).rg;
  float inside = m.r;
  // Perto da borda do vidro o desfocado fica em ~0.5; no meio, 1.
  float depth = smoothstep(0.42, 0.9, m.g);
  // Contorno da área acesa, levemente abaulado para fora como o vidro.
  vec2 rc = suv - 0.5;
  vec2 rv = rc * (1.0 - 0.08 * dot(rc, rc)) * vec2(1.0, RASTER_Y);
  float redge = roundRect(rv, vec2(0.5 - RASTER_MARGIN, (0.5 - RASTER_MARGIN) * RASTER_Y), RASTER_RADIUS);
  float raster = smoothstep(0.005, -0.005, redge);

  // Cor média da tela (para a luz que vaza na moldura).
  vec3 avg = (thumbAt(vec2(0.25, 0.25)) + thumbAt(vec2(0.75, 0.25)) + thumbAt(vec2(0.5, 0.5)) +
              thumbAt(vec2(0.25, 0.75)) + thumbAt(vec2(0.75, 0.75))) / 5.0;
  avg = mix(avg * hasThumb, vec3(0.45), noiseAmt);

  vec3 col = photoCol;

  if (inside > 0.0) {
    // Curvatura do tubo (barril).
    vec2 cc = suv - 0.5;
    float d = dot(cc, cc);
    vec2 uv = 0.5 + cc * (1.0 + 0.1 * d);

    // Na troca de canal a imagem rola e as linhas tremem.
    vec2 ruv = uv;
    ruv.y = fract(ruv.y + roll);
    ruv.x += (rand(vec2(floor(uv.y * 90.0), time)) - 0.5) * 0.04 * noiseAmt;

    vec3 c;
    c.r = thumbAt(ruv + vec2(0.0018, 0.0)).r;
    c.g = thumbAt(ruv).g;
    c.b = thumbAt(ruv - vec2(0.0018, 0.0)).b;
    c *= hasThumb;

    // Chiado.
    float n = rand(floor(suv * vec2(240.0, 180.0)) + fract(time) * 17.0);
    c = mix(c, vec3(n * 0.85), noiseAmt);

    // Linhas de varredura, máscara de sombra, vinheta do tubo e granulado.
    c *= 0.78 + 0.22 * sin(uv.y * 220.0 * 3.14159);
    c *= 0.93 + 0.07 * sin(suv.x * 560.0 * 3.14159);
    c *= 1.0 - d * 1.2;
    c += (rand(suv * 731.0 + fract(time)) - 0.5) * 0.045;
    // A imagem só existe na área acesa; perto da borda dela o fósforo perde força.
    c = max(c, 0.0) * raster * mix(0.5, 1.0, smoothstep(0.0, -0.07, redge));
    // Tubo escurece nas bordas do vidro.
    c *= mix(0.6, 1.0, depth);
    // Na margem entre a imagem e a borracha, só um brilho fraco do tubo ligado.
    c += avg * 0.035 * (1.0 - raster) * depth;

    // Os reflexos e a poeira do vidro da foto continuam por cima da imagem.
    // Reflexos fortes são comprimidos, para não lavarem a imagem.
    vec3 glass = photoCol / (1.0 + photoCol * 2.5);
    vec3 screenCol = c * 0.95 + glass * 0.6;
    col = mix(photoCol, screenCol, inside);
  }

  // Luz da tela batendo só na moldura logo em volta do vidro.
  float spill = (1.0 - inside) * m.g * m.g;
  col += avg * spill * 0.16;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

/**
 * Homografia que leva o quadrado unitário (u, v) aos 4 cantos (sup. esq., sup. dir.,
 * inf. dir., inf. esq.), devolvida já invertida: ponto da foto -> (u, v) da tela.
 */
function screenHomography(corners: [number, number][]): Matrix3 {
  // Afasta os cantos do centro (OVERSCAN), para a imagem cobrir as bordas curvas.
  const cx = corners.reduce((n, [x]) => n + x, 0) / 4;
  const cy = corners.reduce((n, [, y]) => n + y, 0) / 4;
  const q = corners.map(([x, y]) => [cx + (x - cx) * OVERSCAN, cy + (y - cy) * OVERSCAN]);
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  const m = new Matrix3().set(
    x1 - x0 + g * x1, x3 - x0 + h * x3, x0,
    y1 - y0 + g * y1, y3 - y0 + h * y3, y0,
    g, h, 1,
  );
  return m.invert();
}

/**
 * Máscara do vidro desenhada a partir do contorno: canal vermelho com a borda suave
 * (recorte da imagem) e verde bem desfocado (sombra do tubo e luz na moldura).
 */
function glassMask(outline: [number, number][], aspect: number): CanvasTexture {
  const W = 1024;
  const H = Math.round(W / aspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const path = new Path2D();
  outline.forEach(([x, y], i) => (i ? path.lineTo(x * W, y * H) : path.moveTo(x * W, y * H)));
  path.closePath();
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(1.4px)';
  ctx.fillStyle = '#f00';
  ctx.fill(path);
  ctx.filter = `blur(${Math.round(W * 0.022)}px)`;
  ctx.fillStyle = '#0f0';
  ctx.fill(path);
  const t = new CanvasTexture(c);
  t.minFilter = LinearFilter;
  t.generateMipmaps = false;
  return t;
}

export async function createTvPhoto(opts: TvPhotoOptions): Promise<TvPhoto> {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);

  const renderer = new WebGLRenderer({ canvas: opts.canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(dpr);

  const loader = new TextureLoader();
  const prep = (t: Texture) => {
    t.colorSpace = SRGBColorSpace;
    t.minFilter = LinearFilter;
    t.generateMipmaps = false;
    return t;
  };

  const material = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      photo: { value: null },
      thumb: { value: null },
      mask: { value: null },
      toScreen: { value: screenHomography(opts.corners) },
      uvScale: { value: [1, 1] },
      uvOffset: { value: [0, 0] },
      time: { value: 0 },
      noiseAmt: { value: opts.animate ? 1 : 0 },
      roll: { value: 0 },
      hasThumb: { value: 0 },
    },
  });
  const geometry = new PlaneGeometry(2, 2);
  const scene = new Scene();
  const quad = new Mesh(geometry, material);
  quad.frustumCulled = false;
  scene.add(quad);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const render = () => renderer.render(scene, camera);

  // --- Thumbs: carregadas sob demanda, recortadas em 4:3 ---
  const thumbs = new Map<number, Promise<Texture>>();
  const load = (i: number) => {
    if (!thumbs.has(i)) thumbs.set(i, loader.loadAsync(opts.images[i]).then(prep));
    return thumbs.get(i)!;
  };
  const setThumb = (t: Texture) => {
    const img = t.image as { width: number; height: number };
    const aspect = img.width / img.height;
    const u = material.uniforms;
    if (aspect > SCREEN_ASPECT) {
      const k = SCREEN_ASPECT / aspect;
      u.uvScale.value = [k, 1];
      u.uvOffset.value = [(1 - k) / 2, 0];
    } else {
      const k = aspect / SCREEN_ASPECT;
      u.uvScale.value = [1, k];
      u.uvOffset.value = [0, (1 - k) / 2];
    }
    u.thumb.value = t;
    u.hasThumb.value = 1;
  };

  // --- Tamanho ---
  const layout = () => {
    const w = opts.host.clientWidth;
    const h = opts.host.clientHeight;
    if (w && h) renderer.setSize(w, h, false);
  };
  layout();
  const ro = new ResizeObserver(() => {
    layout();
    render();
  });
  ro.observe(opts.host);

  // --- Troca de canal ---
  let switchStart = -1;
  let pending: Texture | null = null;
  let swapped = false;
  const show = (index: number) => {
    load((index + 1) % opts.images.length); // já adianta a próxima
    load(index).then((t) => {
      if (!opts.animate) {
        setThumb(t);
        render();
        return;
      }
      pending = t;
      swapped = false;
      switchStart = performance.now();
    });
  };

  const t0 = performance.now();
  const step = (now: number) => {
    const u = material.uniforms;
    u.time.value = (now - t0) / 1000;
    if (switchStart >= 0) {
      const p = Math.min(1, (now - switchStart) / SWITCH_MS);
      // Chiado sobe e desce; no meio, a imagem nova entra.
      u.noiseAmt.value = Math.sin(p * Math.PI) * 0.95;
      u.roll.value = (1 - p) * 0.35;
      if (p >= 0.5 && !swapped && pending) {
        setThumb(pending);
        swapped = true;
      }
      if (p >= 1) {
        switchStart = -1;
        u.noiseAmt.value = 0;
        u.roll.value = 0;
      }
    }
    render();
  };

  // Loop posterizado a 12 fps.
  const frameMs = 1000 / FPS;
  let last = 0;
  let raf = 0;
  let active = false;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (now - last < frameMs - 1) return;
    last = now - ((now - last) % frameMs);
    step(now);
  };

  // Foto e primeira thumb antes de aparecer.
  const [photo, first] = await Promise.all([loader.loadAsync(opts.photo).then(prep), load(0)]);
  material.uniforms.photo.value = photo;
  const photoImg = photo.image as { width: number; height: number };
  const mask = glassMask(opts.outline, photoImg.width / photoImg.height);
  material.uniforms.mask.value = mask;
  if (!opts.animate) {
    setThumb(first);
    render();
  } else {
    step(performance.now());
    // "Liga" com chiado e cai na primeira thumb.
    pending = first;
    swapped = false;
    switchStart = performance.now();
  }

  return {
    show,
    setActive(next) {
      if (!opts.animate || next === active) return;
      active = next;
      last = 0;
      if (active) raf = requestAnimationFrame(loop);
      else cancelAnimationFrame(raf);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      photo.dispose();
      mask.dispose();
      thumbs.forEach((p) => p.then((t) => t.dispose()));
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    },
  };
}
