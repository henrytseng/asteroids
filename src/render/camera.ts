import type { Vector3 } from "../game/types";

export interface Camera {
  position: Vector3;
}

export function createCamera(): Camera {
  return {
    position: { x: 0, y: 0, z: 0 }
  };
}

