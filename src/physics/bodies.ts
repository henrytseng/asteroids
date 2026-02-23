import type { EntityId } from "../game/types";
import type { PhysicsWorld } from "./world";

export interface PhysicsBodyRef {
  id: EntityId;
  // Underlying Ammo body instance; kept as unknown here to avoid leaking implementation details.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

export interface PhysicsBodyStore {
  byEntity: Map<EntityId, PhysicsBodyRef>;
}

export function createPhysicsBodyStore(): PhysicsBodyStore {
  return {
    byEntity: new Map()
  };
}

export function createShipBody(
  _world: PhysicsWorld,
  id: EntityId
): PhysicsBodyRef {
  // TODO: construct a dynamic rigid body for the player ship.
  const ref: PhysicsBodyRef = { id, body: null };
  return ref;
}

export function createAsteroidBody(
  _world: PhysicsWorld,
  id: EntityId
): PhysicsBodyRef {
  // TODO: construct a convex hull or compound rigid body for asteroids.
  const ref: PhysicsBodyRef = { id, body: null };
  return ref;
}

