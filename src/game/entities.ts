import { addEntity, type GameState } from "./state";
import {
  EntityKind,
  type Entity,
  type Quaternion,
  type Vector3
} from "./types";

const IDENTITY_ROTATION: Quaternion = { x: 0, y: 0, z: 0, w: 1 };

export function spawnPlayer(state: GameState, position: Vector3): Entity {
  return addEntity(state, {
    kind: EntityKind.PlayerShip,
    transform: {
      position,
      rotation: IDENTITY_ROTATION
    }
  });
}

export function spawnAsteroid(state: GameState, position: Vector3): Entity {
  return addEntity(state, {
    kind: EntityKind.Asteroid,
    transform: {
      position,
      rotation: IDENTITY_ROTATION
    }
  });
}

