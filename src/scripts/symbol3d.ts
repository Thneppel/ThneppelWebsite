// Render 3D do símbolo num canvas próprio (usado pelo laboratório: prévia e miniaturas).
// A abertura da home usa heroCrt.ts, que desenha tudo e aplica o shader CRT.
import { ACESFilmicToneMapping, PerspectiveCamera, SRGBColorSpace, WebGLRenderer } from 'three';
import type { Material3DId } from '../lib/heroVariants';
import { FOV, OVERSCAN } from '../lib/heroGeometry';
import { createSymbolScene } from './symbolScene';

export interface Symbol3D {
  /** Desenha o próximo material da lista ativa. */
  next(): void;
  /** Inclinação em radianos, na convenção do CSS (rotateX, rotateY). Redesenha. */
  setRotation(x: number, y: number): void;
  /** Troca a lista de materiais ativos (ordem de exibição). */
  setMaterials(ids: readonly Material3DId[]): void;
  /** Desenha um material específico e devolve a imagem (PNG em data URL). */
  snapshot(id: Material3DId): string;
  dispose(): void;
}

export function createSymbol3D(
  canvas: HTMLCanvasElement,
  svgText: string,
  initial: readonly Material3DId[],
): Symbol3D {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;

  const sym = createSymbolScene(renderer, svgText);
  const camera = new PerspectiveCamera(FOV, sym.vbW / sym.vbH, 1, 10000);
  // Mesma distância usada como `perspective` no CSS (ver lib/heroGeometry.ts).
  camera.position.set(0, 0, (sym.vbH * OVERSCAN) / 2 / Math.tan((FOV * Math.PI) / 360));

  const render = () => renderer.render(sym.scene, camera);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  sym.precompile(renderer, camera);
  resize();

  let active = [...initial];
  let count = 0;

  return {
    next() {
      if (!active.length) return;
      sym.show3D(active[count % active.length]);
      render();
      count++;
    },
    setRotation(x, y) {
      sym.setRotation(x, y);
      render();
    },
    setMaterials(ids) {
      active = [...ids];
      count = 0;
    },
    snapshot(id) {
      sym.show3D(id);
      render();
      return canvas.toDataURL('image/png');
    },
    dispose() {
      ro.disconnect();
      sym.dispose();
      renderer.dispose();
    },
  };
}
