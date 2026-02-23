import type { GameState } from "./state";
import type { Entity, EntityId, Vector2 } from "./types";
import { EntityKind } from "./types";

export interface ShipAsteroidManifold {
  asteroidId: EntityId;
  normal: Vector2;    // points from ship toward asteroid
  penetration: number;
}

export interface Aabb {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface BulletAsteroidManifold {
  bulletId: EntityId;
  asteroidId: EntityId;
  normal: Vector2;
  penetration: number;
}

export interface AsteroidAsteroidManifold {
  idA: EntityId;
  idB: EntityId;
  normal: Vector2;
  penetration: number;
}

function makeAabbForEntity(entity: Entity): Aabb | null {
  const { x, y } = entity.transform.position;

  let halfWidth = 0;
  let halfHeight = 0;

  const asteroidRadius = 40;

  switch (entity.kind) {
    case EntityKind.Bullet:
      halfWidth = 8;
      halfHeight = 8;
      break;
    case EntityKind.Asteroid:
      halfWidth = asteroidRadius * (entity.scale ?? 1);
      halfHeight = asteroidRadius * (entity.scale ?? 1);
      break;
    default:
      return null;
  }

  return {
    minX: x - halfWidth,
    maxX: x + halfWidth,
    minY: y - halfHeight,
    maxY: y + halfHeight
  };
}

function intersectAabbs(a: Aabb, b: Aabb): { normal: Vector2; penetration: number } | null {
  const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);

  if (overlapX <= 0 || overlapY <= 0) return null;

  const centerAx = (a.minX + a.maxX) * 0.5;
  const centerAy = (a.minY + a.maxY) * 0.5;
  const centerBx = (b.minX + b.maxX) * 0.5;
  const centerBy = (b.minY + b.maxY) * 0.5;

  if (overlapX < overlapY) {
    const nx = centerAx < centerBx ? -1 : 1;
    return {
      normal: { x: nx, y: 0 },
      penetration: overlapX
    };
  } else {
    const ny = centerAy < centerBy ? -1 : 1;
    return {
      normal: { x: 0, y: ny },
      penetration: overlapY
    };
  }
}

export function computeBulletAsteroidManifolds(state: GameState): BulletAsteroidManifold[] {
  const bullets: Entity[] = [];
  const asteroids: Entity[] = [];

  for (const entity of state.entities.values()) {
    if (entity.kind === EntityKind.Bullet) bullets.push(entity);
    else if (entity.kind === EntityKind.Asteroid) asteroids.push(entity);
  }

  const manifolds: BulletAsteroidManifold[] = [];

  for (const bullet of bullets) {
    const bulletAabb = makeAabbForEntity(bullet);
    if (!bulletAabb) continue;

    for (const asteroid of asteroids) {
      const asteroidAabb = makeAabbForEntity(asteroid);
      if (!asteroidAabb) continue;

      const hit = intersectAabbs(bulletAabb, asteroidAabb);
      if (!hit) continue;

      manifolds.push({
        bulletId: bullet.id,
        asteroidId: asteroid.id,
        normal: hit.normal,
        penetration: hit.penetration
      });
    }
  }

  return manifolds;
}

const ASTEROID_BASE_RADIUS = 40;

export function computeAsteroidAsteroidManifolds(state: GameState): AsteroidAsteroidManifold[] {
  const asteroids: Entity[] = [];
  for (const entity of state.entities.values()) {
    if (entity.kind !== EntityKind.Asteroid) continue;
    const enableTime = entity.collisionEnableTime ?? 0;
    if (state.timeSeconds < enableTime) continue;
    asteroids.push(entity);
  }

  const manifolds: AsteroidAsteroidManifold[] = [];
  for (let i = 0; i < asteroids.length; i++) {
    const a = asteroids[i];
    const rA = ASTEROID_BASE_RADIUS * (a.scale ?? 1);
    for (let j = i + 1; j < asteroids.length; j++) {
      const b = asteroids[j];
      const rB = ASTEROID_BASE_RADIUS * (b.scale ?? 1);

      const dx = b.transform.position.x - a.transform.position.x;
      const dy = b.transform.position.y - a.transform.position.y;
      const distSq = dx * dx + dy * dy;
      const minDist = rA + rB;

      if (distSq >= minDist * minDist) continue;

      const dist = Math.sqrt(distSq) || 0.001; // guard against exact zero
      manifolds.push({
        idA: a.id,
        idB: b.id,
        // Normal points from A toward B — stable because it tracks the actual center direction.
        normal: { x: dx / dist, y: dy / dist },
        penetration: minDist - dist
      });
    }
  }
  return manifolds;
}

const SHIP_RADIUS = 18;

/** Circle–circle test between the player ship and each asteroid. */
export function computeShipAsteroidManifolds(state: GameState): ShipAsteroidManifold[] {
  const ship = [...state.entities.values()].find((e) => e.kind === EntityKind.PlayerShip);
  if (!ship) return [];

  const manifolds: ShipAsteroidManifold[] = [];
  for (const entity of state.entities.values()) {
    if (entity.kind !== EntityKind.Asteroid) continue;
    const rA = ASTEROID_BASE_RADIUS * (entity.scale ?? 1);

    const dx = entity.transform.position.x - ship.transform.position.x;
    const dy = entity.transform.position.y - ship.transform.position.y;
    const distSq = dx * dx + dy * dy;
    const minDist = SHIP_RADIUS + rA;
    if (distSq >= minDist * minDist) continue;

    const dist = Math.sqrt(distSq) || 0.001;
    manifolds.push({
      asteroidId: entity.id,
      // Normal points from ship toward asteroid.
      normal: { x: dx / dist, y: dy / dist },
      penetration: minDist - dist
    });
  }
  return manifolds;
}
