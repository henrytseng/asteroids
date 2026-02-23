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
  color: [0, 1, 0, 1]
};

// ---------------------------------------------------------------------------
// Asteroid mesh variants – each is an irregular polygon centred at origin.
// Vertices are in NDC-scale (~0.03–0.07 units radius) so they render correctly
// with the existing u_scale uniform that converts them to screen space.
// ---------------------------------------------------------------------------
export const asteroidMeshes: Mesh[] = [
  {
    // 8-sided chunky boulder
    vertices: new Float32Array([
      0.000, 0.065, 0,
      -0.038, 0.052, 0,
      -0.060, 0.018, 0,
      -0.055, -0.030, 0,
      -0.020, -0.062, 0,
      0.030, -0.058, 0,
      0.062, -0.018, 0,
      0.048, 0.040, 0,
    ]),
    color: [0.72, 0.70, 0.68, 1]
  },
  {
    // 9-sided elongated shard
    vertices: new Float32Array([
      0.025, 0.060, 0,
      -0.010, 0.068, 0,
      -0.055, 0.035, 0,
      -0.068, 0.000, 0,
      -0.050, -0.038, 0,
      -0.010, -0.065, 0,
      0.042, -0.050, 0,
      0.065, -0.010, 0,
      0.058, 0.030, 0,
    ]),
    color: [0.65, 0.63, 0.60, 1]
  },
  {
    // 7-sided squat potato with a flat edge
    vertices: new Float32Array([
      0.040, 0.048, 0,
      -0.025, 0.062, 0,
      -0.062, 0.020, 0,
      -0.060, -0.028, 0,
      0.005, -0.065, 0,
      0.058, -0.030, 0,
      0.065, 0.010, 0,
    ]),
    color: [0.78, 0.70, 0.62, 1]
  },
  {
    // 10-sided near-round with a deep notch on one side
    vertices: new Float32Array([
      0.010, 0.065, 0,
      -0.030, 0.058, 0,
      -0.058, 0.025, 0,
      -0.030, 0.005, 0,  // notch inward
      -0.055, -0.025, 0,
      -0.030, -0.060, 0,
      0.020, -0.065, 0,
      0.055, -0.035, 0,
      0.065, 0.005, 0,
      0.042, 0.048, 0,
    ]),
    color: [0.68, 0.68, 0.72, 1]
  },
  {
    // 11-sided rough lumpy rock
    vertices: new Float32Array([
      0.020, 0.068, 0,
      -0.018, 0.055, 0,
      -0.048, 0.048, 0,
      -0.062, 0.012, 0,
      -0.058, -0.020, 0,
      -0.038, -0.055, 0,
      -0.005, -0.068, 0,
      0.030, -0.060, 0,
      0.058, -0.025, 0,
      0.062, 0.015, 0,
      0.045, 0.048, 0,
    ]),
    color: [0.75, 0.72, 0.65, 1]
  },
  {
    // 8-sided angular shard – wide and flat
    vertices: new Float32Array([
      0.055, 0.028, 0,
      0.010, 0.050, 0,
      -0.038, 0.048, 0,
      -0.068, 0.010, 0,
      -0.055, -0.025, 0,
      -0.010, -0.048, 0,
      0.045, -0.045, 0,
      0.068, -0.008, 0,
    ]),
    color: [0.60, 0.62, 0.68, 1]
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
  color: [1, 1, 1, 1] // unused by laser shader, kept for type consistency
};

export const debrisMesh: Mesh = {
  // Small shard-like triangle.
  vertices: new Float32Array([
    0.02, 0, 0,
    -0.015, 0.015, 0,
    -0.015, -0.015, 0
  ]),
  color: [1, 0.6, 0.2, 1]
};

export function positionToNdc(pos: Vector3, viewport: { width: number; height: number }): [number, number] {
  const x = (pos.x / viewport.width) * 2 - 1;
  const y = (pos.y / viewport.height) * -2 + 1;
  return [x, y];
}

