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

export const asteroidMesh: Mesh = {
  // Rough hexagon asteroid.
  vertices: new Float32Array([
    0.0, 0.06, 0,
    -0.05, 0.03, 0,
    -0.05, -0.03, 0,
    0.0, -0.06, 0,
    0.05, -0.03, 0,
    0.05, 0.03, 0
  ]),
  color: [0.7, 0.7, 0.7, 1]
};

export const bulletMesh: Mesh = {
  vertices: new Float32Array([
    -0.01, -0.01, 0,
    0.01, -0.01, 0,
    0.01, 0.01, 0,
    -0.01, 0.01, 0
  ]),
  color: [1, 1, 0, 1]
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

