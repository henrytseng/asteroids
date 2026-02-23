import type { EntityId } from "../game/types";

export interface FracturedPiece {
  parentId: EntityId;
  // Placeholder for shape/mesh reference and initial velocity.
}

export interface FractureResult {
  removedAsteroidId: EntityId;
  pieces: FracturedPiece[];
}

export function fractureAsteroid(_asteroidId: EntityId): FractureResult {
  // Stubbed fracture implementation; will be filled in when integrating Bullet shapes.
  return {
    removedAsteroidId: _asteroidId,
    pieces: []
  };
}

