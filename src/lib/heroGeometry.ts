// Geometria compartilhada entre o 3D (three.js) e as versões 2D (CSS 3D),
// para os dois inclinarem exatamente igual e a troca entre eles não "pular".

/** Campo de visão vertical da câmera 3D, em graus. */
export const FOV = 28;
/** O canvas 3D é este tanto maior que o palco, para a inclinação não cortar as pontas. */
export const OVERSCAN = 1.5;

/** Inclinação máxima pelo mouse, em radianos. */
export const MAX_TILT_X = 0.3;
export const MAX_TILT_Y = 0.45;
/** Inclinação de repouso em telas sem mouse (toque). */
export const REST_TILT: [number, number] = [0.1, -0.25];

/**
 * Distância da câmera até o símbolo, em pixels do palco.
 * Usada como `perspective` do CSS para as versões 2D baterem com o 3D.
 */
export function perspectivePx(stageHeightPx: number): number {
  return (stageHeightPx * OVERSCAN) / 2 / Math.tan((FOV * Math.PI) / 360);
}
