import type { Vector3 } from "../game/types";

export interface Mesh {
  vertices: Float32Array;
  color: [number, number, number, number];
}

export const playerShipMesh: Mesh = {
  // Simple triangle ship in NDC-like space, pointing along +X.
  vertices: new Float32Array([
    0.05, 0, 0, //
    -0.03, 0.03, 0, //
    -0.03, -0.03, 0
  ]),
  color: [1.0, 0.45, 0.0, 1]   // orange ship
};

// ---------------------------------------------------------------------------
// Asteroid mesh variants – each is an irregular polygon centred at origin.
// Vertices are in NDC-scale (~0.03–0.07 units radius) so they render correctly
// with the existing u_scale uniform that converts them to screen space.
// ---------------------------------------------------------------------------
export const asteroidMeshes: Mesh[] = [
  {
    // 8-gon: chunky, lopsided — big protrusion upper-right
    vertices: new Float32Array([
      0.010, 0.065, 0,
      -0.048, 0.052, 0,
      -0.068, 0.005, 0,
      -0.055, -0.038, 0,
      -0.018, -0.062, 0,
      0.038, -0.058, 0,
      0.068, -0.018, 0,
      0.050, 0.040, 0,
    ]),
    color: [0.12, 0.10, 0.10, 1]
  },
  {
    // 9-gon: irregular with a tucked-in notch on upper-left
    vertices: new Float32Array([
      0.025, 0.062, 0,
      -0.018, 0.068, 0,
      -0.058, 0.030, 0,
      -0.065, -0.012, 0,
      -0.045, -0.052, 0,
      0.008, -0.065, 0,
      0.048, -0.042, 0,
      0.065, 0.005, 0,
      0.045, 0.050, 0,
    ]),
    color: [0.10, 0.10, 0.13, 1]
  },
  {
    // 10-gon: craggy, radii swing from 0.042 to 0.070 — very uneven
    vertices: new Float32Array([
      0.012, 0.070, 0,
      -0.035, 0.058, 0,
      -0.060, 0.025, 0,
      -0.068, -0.015, 0,
      -0.042, -0.055, 0,
      -0.005, -0.068, 0,
      0.040, -0.055, 0,
      0.065, -0.020, 0,
      0.060, 0.028, 0,
      0.032, 0.060, 0,
    ]),
    color: [0.14, 0.10, 0.08, 1]
  },
  {
    // 8-gon: chunk bitten out of lower-left, bulge upper-right
    vertices: new Float32Array([
      0.045, 0.050, 0,
      -0.012, 0.065, 0,
      -0.062, 0.022, 0,
      -0.058, -0.032, 0,
      -0.025, -0.062, 0,
      0.030, -0.060, 0,
      0.068, -0.015, 0,
      0.062, 0.032, 0,
    ]),
    color: [0.08, 0.08, 0.14, 1]
  },
  {
    // 11-gon: highly irregular, no two edges the same length
    vertices: new Float32Array([
      0.018, 0.068, 0,
      -0.025, 0.060, 0,
      -0.055, 0.038, 0,
      -0.065, 0.005, 0,
      -0.060, -0.030, 0,
      -0.035, -0.058, 0,
      0.005, -0.065, 0,
      0.040, -0.052, 0,
      0.062, -0.018, 0,
      0.065, 0.022, 0,
      0.040, 0.055, 0,
    ]),
    color: [0.13, 0.11, 0.08, 1]
  },
  {
    // 9-gon: tall with deep left-side gouge
    vertices: new Float32Array([
      0.030, 0.070, 0,
      -0.020, 0.065, 0,
      -0.060, 0.030, 0,
      -0.065, -0.020, 0,
      -0.038, -0.060, 0,
      0.010, -0.068, 0,
      0.050, -0.040, 0,
      0.065, 0.005, 0,
      0.050, 0.052, 0,
    ]),
    color: [0.10, 0.12, 0.10, 1]
  },
  {
    // 9-gon: right-side bulge, irregular top and bottom
    vertices: new Float32Array([
      0.008, 0.060, 0,
      -0.045, 0.055, 0,
      -0.068, 0.008, 0,
      -0.062, -0.035, 0,
      -0.022, -0.065, 0,
      0.025, -0.062, 0,
      0.060, -0.030, 0,
      0.070, 0.010, 0,
      0.038, 0.055, 0,
    ]),
    color: [0.10, 0.08, 0.12, 1]
  },
  {
    // 10-gon: large irregular boulder, strongly asymmetric
    vertices: new Float32Array([
      0.020, 0.072, 0,
      -0.028, 0.062, 0,
      -0.058, 0.032, 0,
      -0.070, -0.010, 0,
      -0.050, -0.050, 0,
      -0.010, -0.065, 0,
      0.032, -0.060, 0,
      0.060, -0.028, 0,
      0.068, 0.018, 0,
      0.042, 0.058, 0,
    ]),
    color: [0.11, 0.11, 0.10, 1]
  },
  {
    // 8-gon: short stubby rock, rough and compact
    vertices: new Float32Array([
      0.015, 0.058, 0,
      -0.050, 0.052, 0,
      -0.065, 0.000, 0,
      -0.055, -0.042, 0,
      -0.010, -0.060, 0,
      0.042, -0.052, 0,
      0.065, -0.008, 0,
      0.052, 0.042, 0,
    ]),
    color: [0.14, 0.09, 0.09, 1]
  },
  {
    // 10-gon: classic lumpy boulder feel, uneven radii
    vertices: new Float32Array([
      0.022, 0.068, 0,
      -0.030, 0.065, 0,
      -0.062, 0.030, 0,
      -0.068, -0.015, 0,
      -0.048, -0.052, 0,
      -0.008, -0.068, 0,
      0.035, -0.062, 0,
      0.065, -0.025, 0,
      0.068, 0.018, 0,
      0.040, 0.058, 0,
    ]),
    color: [0.09, 0.10, 0.13, 1]
  },
  {
    // 9-gon: bottom-heavy, protrudes lower-right, dented upper-left
    vertices: new Float32Array([
      0.028, 0.062, 0,
      -0.022, 0.070, 0,
      -0.060, 0.028, 0,
      -0.065, -0.018, 0,
      -0.040, -0.058, 0,
      0.008, -0.070, 0,
      0.052, -0.038, 0,
      0.068, 0.008, 0,
      0.048, 0.048, 0,
    ]),
    color: [0.08, 0.09, 0.14, 1]
  },
  {
    // 10-gon: deeply irregular, one side much flatter than the other
    vertices: new Float32Array([
      0.010, 0.068, 0,
      -0.035, 0.062, 0,
      -0.065, 0.020, 0,
      -0.060, -0.028, 0,
      -0.032, -0.062, 0,
      0.012, -0.068, 0,
      0.048, -0.048, 0,
      0.068, -0.005, 0,
      0.060, 0.038, 0,
      0.032, 0.062, 0,
    ]),
    color: [0.13, 0.10, 0.08, 1]
  },
];

/** Legacy single-mesh export — used by anything that hasn't been updated. */
export const asteroidMesh: Mesh = asteroidMeshes[0];

export const bulletMesh: Mesh = {
  // Elongated quad aligned along +X with enough Y extent for the glow to fade.
  // X range matches laser shader xHalf (0.028); Y range matches LASER_HALF_H (0.009).
  vertices: new Float32Array([
    -0.028, -0.009, 0,
    0.028, -0.009, 0,
    0.028, 0.009, 0,
    -0.028, 0.009, 0
  ]),
  color: [0, 0, 0, 1] // unused by laser shader
};

export const debrisMesh: Mesh = {
  // Small shard-like triangle.
  vertices: new Float32Array([
    0.02, 0, 0,
    -0.015, 0.015, 0,
    -0.015, -0.015, 0
  ]),
  color: [0.20, 0.10, 0.05, 1]  // dark burnt-orange debris
};

export function positionToNdc(pos: Vector3, viewport: { width: number; height: number }): [number, number] {
  const x = (pos.x / viewport.width) * 2 - 1;
  const y = (pos.y / viewport.height) * -2 + 1;
  return [x, y];
}

/** Single-vertex mesh drawn with gl.POINTS — the GPU renders a screen-space square. */
export const sparkMesh: Mesh = {
  vertices: new Float32Array([0, 0, 0]),
  color: [0.15, 0.10, 0.02, 1] // dark amber spark
};

