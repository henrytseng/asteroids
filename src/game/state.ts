import type { Entity, EntityId } from "./types";
import type { BulletAsteroidManifold } from "./collisions";

export interface GameState {
  entities: Map<EntityId, Entity>;
  nextEntityId: EntityId;
  score: number;
  lives: number;
  health: number;
  maxHealth: number;
  /** Game time of the last damage taken — enforces a brief invincibility window. */
  lastDamageTime: number;
  timeSeconds: number;
  nextAllowedFireTime: number;
  bulletLifetimes: Map<EntityId, number>;
  /** remaining / total lifetime for each spark/debris particle. */
  debrisLifetimes: Map<EntityId, { remaining: number; total: number }>;
  bulletAsteroidManifolds: BulletAsteroidManifold[];
  viewportWidth: number;
  viewportHeight: number;
  asteroidSpawnAccumulator: number;
}

export function createInitialGameState(viewportWidth: number, viewportHeight: number): GameState {
  return {
    entities: new Map<EntityId, Entity>(),
    nextEntityId: 1,
    score: 0,
    lives: 3,
    health: 100,
    maxHealth: 100,
    lastDamageTime: -999,
    timeSeconds: 0,
    nextAllowedFireTime: 0,
    bulletLifetimes: new Map<EntityId, number>(),
    debrisLifetimes: new Map<EntityId, { remaining: number; total: number }>(),
    bulletAsteroidManifolds: [],
    viewportWidth,
    viewportHeight,
    asteroidSpawnAccumulator: 0
  };
}

export function addEntity(state: GameState, entity: Omit<Entity, "id">): Entity {
  const id = state.nextEntityId++;
  const full: Entity = { ...entity, id };
  state.entities.set(id, full);
  return full;
}

