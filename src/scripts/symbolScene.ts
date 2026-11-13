// Cena do símbolo: extrusão 3D do SVG + uma placa com a versão 2D, as duas presas ao
// mesmo pivô (na face da frente). Assim 2D e 3D inclinam exatamente igual.
// Usada pelo laboratório (symbol3d.ts) e pela abertura com shader CRT (heroCrt.ts).
import {
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  type WebGLRenderer,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Material3DId } from '../lib/heroVariants';

const ACCENT = 0xdc0f2a;
const CREAM = 0xf7f1ea;
const WINE = 0x3a0f24;

/** Materiais (nomes em src/lib/heroVariants.ts), cada um com a intensidade
 *  da luz rosa de recorte que fica melhor nele. */
function createMaterials(depth: number): Record<Material3DId, { material: Material; rim: number }> {
  const side = DoubleSide;
  return {
    chrome: { material: new MeshStandardMaterial({ color: 0xe9e4de, metalness: 1, roughness: 0.12, side }), rim: 3 },
    'pink-plastic': { material: new MeshPhysicalMaterial({ color: ACCENT, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06, side }), rim: 0.6 },
    gold: { material: new MeshStandardMaterial({ color: 0xe6b04c, metalness: 1, roughness: 0.24, side }), rim: 1.4 },
    'wire-pink': { material: new MeshBasicMaterial({ color: ACCENT, wireframe: true, side }), rim: 0 },
    clay: { material: new MeshStandardMaterial({ color: CREAM, roughness: 0.95, side }), rim: 2.2 },
    'rose-chrome': { material: new MeshStandardMaterial({ color: 0xff8fae, metalness: 1, roughness: 0.16, side }), rim: 2 },
    glass: { material: new MeshPhysicalMaterial({ color: 0xffd9e3, roughness: 0.03, transmission: 1, thickness: depth, ior: 1.45, side }), rim: 3 },
    rubber: { material: new MeshStandardMaterial({ color: 0x141214, metalness: 0.5, roughness: 0.3, side }), rim: 6 },
    toon: { material: new MeshToonMaterial({ color: CREAM, side }), rim: 2 },
    steel: { material: new MeshStandardMaterial({ color: 0xb9bcc2, metalness: 1, roughness: 0.48, side }), rim: 1.6 },
    neon: { material: new MeshStandardMaterial({ color: WINE, emissive: ACCENT, emissiveIntensity: 0.9, roughness: 0.5, side }), rim: 0 },
    iridescent: { material: new MeshPhysicalMaterial({ color: 0x1a1a1f, metalness: 0.2, roughness: 0.18, iridescence: 1, iridescenceIOR: 1.6, side }), rim: 1 },
    ceramic: { material: new MeshPhysicalMaterial({ color: CREAM, roughness: 0.15, clearcoat: 1, side }), rim: 1.2 },
    wine: { material: new MeshStandardMaterial({ color: WINE, roughness: 0.7, side }), rim: 4 },
    'wire-cream': { material: new MeshBasicMaterial({ color: CREAM, wireframe: true, side }), rim: 0 },
  };
}

export interface SymbolScene {
  scene: Scene;
  /** Tamanho do viewBox do símbolo (unidades da cena). */
  vbW: number;
  vbH: number;
  /** Mostra o símbolo 3D com um material. */
  show3D(id: Material3DId): void;
  /** Mostra uma imagem 2D (canvas) na placa, no lugar do 3D. `margin` em unidades do viewBox. */
  show2D(image: HTMLCanvasElement, margin: number): void;
  /** Inclinação em radianos, na convenção do CSS (rotateX, rotateY). */
  setRotation(x: number, y: number): void;
  /** Compila os shaders de todos os materiais (evita travadas na primeira aparição). */
  precompile(renderer: WebGLRenderer, camera: import('three').Camera): void;
  dispose(): void;
}

export function createSymbolScene(renderer: WebGLRenderer, svgText: string): SymbolScene {
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const data = new SVGLoader().parse(svgText);
  const [, , vbW, vbH] = svgText.match(/viewBox="([\d.\s-]+)"/)?.[1].split(/\s+/).map(Number) ?? [0, 0, 684, 349];
  const depth = vbH * 0.16;
  const bevelThickness = vbH * 0.012;

  const meshes: Mesh[] = [];
  const symbol = new Group();
  for (const path of data.paths) {
    for (const shape of SVGLoader.createShapes(path)) {
      const geometry = new ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness,
        bevelSize: vbH * 0.008,
        bevelSegments: 3,
        curveSegments: 24,
      });
      const mesh = new Mesh(geometry);
      meshes.push(mesh);
      symbol.add(mesh);
    }
  }
  // SVG tem Y para baixo; inverte, centraliza e põe a face da frente (com o chanfro) em z = 0.
  symbol.scale.set(1, -1, 1);
  symbol.position.set(-vbW / 2, vbH / 2, -(depth + bevelThickness));

  // Placa da versão 2D, no plano da face da frente.
  const flatMaterial = new MeshBasicMaterial({ transparent: true, depthWrite: false, side: DoubleSide });
  const flat = new Mesh(new PlaneGeometry(1, 1), flatMaterial);
  flat.visible = false;

  const pivot = new Group();
  pivot.add(symbol, flat);
  scene.add(pivot);

  const rim = new DirectionalLight(ACCENT, 3);
  rim.position.set(-1, 0.6, -0.4);
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(0.8, 1, 1.2);
  scene.add(rim, key);

  const materials = createMaterials(depth);
  const textures = new Map<HTMLCanvasElement, CanvasTexture>();

  return {
    scene,
    vbW,
    vbH,
    show3D(id) {
      const { material, rim: rimIntensity } = materials[id];
      for (const m of meshes) m.material = material;
      rim.intensity = rimIntensity;
      symbol.visible = true;
      flat.visible = false;
    },
    show2D(image, margin) {
      let tex = textures.get(image);
      if (!tex) {
        tex = new CanvasTexture(image);
        tex.colorSpace = SRGBColorSpace;
        tex.anisotropy = 4;
        textures.set(image, tex);
      }
      flatMaterial.map = tex;
      flatMaterial.needsUpdate = true;
      flat.scale.set(vbW + margin * 2, vbH + margin * 2, 1);
      symbol.visible = false;
      flat.visible = true;
    },
    setRotation(x, y) {
      // CSS tem Y para baixo e o three.js para cima: o giro em X troca de sinal, o em Y não.
      pivot.rotation.set(-x, y, 0);
    },
    precompile(r, camera) {
      symbol.visible = true;
      for (const { material } of Object.values(materials)) {
        for (const m of meshes) m.material = material;
        r.compile(scene, camera);
      }
    },
    dispose() {
      for (const { material } of Object.values(materials)) material.dispose();
      for (const tex of textures.values()) tex.dispose();
      flatMaterial.dispose();
      pmrem.dispose();
    },
  };
}
