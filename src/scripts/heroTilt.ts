// Inclinação do símbolo pelo mouse, igual para todos os visuais:
// - versões 2D: CSS 3D (variáveis --tilt-x / --tilt-y e perspectiva no palco)
// - render 3D: mesma rotação aplicada ao objeto (onTilt)
import { MAX_TILT_X, MAX_TILT_Y, REST_TILT, perspectivePx } from '../lib/heroGeometry';

export interface HeroTilt {
  /** Inclinação atual [x, y] em radianos (convenção do CSS). */
  current(): [number, number];
  dispose(): void;
}

export function attachTilt(stage: HTMLElement, onTilt: (x: number, y: number) => void): HeroTilt {
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  let [targetX, targetY] = finePointer ? [0, 0] : REST_TILT;
  let x = targetX;
  let y = targetY;
  let raf = 0;

  const apply = () => {
    stage.style.setProperty('--tilt-x', `${x}rad`);
    stage.style.setProperty('--tilt-y', `${y}rad`);
    onTilt(x, y);
  };

  // Perspectiva do CSS calculada a partir da câmera 3D.
  const ro = new ResizeObserver(() => {
    stage.style.setProperty('--perspective', `${perspectivePx(stage.clientHeight)}px`);
  });
  ro.observe(stage);

  const loop = () => {
    // Suaviza em direção ao alvo; para quando chega perto.
    x += (targetX - x) * 0.1;
    y += (targetY - y) * 0.1;
    apply();
    if (Math.abs(targetX - x) > 0.0005 || Math.abs(targetY - y) > 0.0005) raf = requestAnimationFrame(loop);
    else raf = 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect();
    // -1..1 relativo ao centro do símbolo, normalizado pela metade da janela.
    const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
    const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
    // O símbolo "olha" para o cursor: mouse à direita, a frente vira para a direita
    // (lado direito vai para trás); mouse em cima, a frente vira para cima.
    targetY = nx * MAX_TILT_Y;
    targetX = -ny * MAX_TILT_X;
    kick();
  };
  const onLeave = () => {
    targetX = 0;
    targetY = 0;
    kick();
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  apply();

  return {
    current: () => [x, y],
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    },
  };
}
