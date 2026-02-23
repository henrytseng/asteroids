import { addEntity, type GameState } from "./state";
import { EntityKind, type Quaternion } from "./types";
import type { ControlState } from "../input/controls";
import {
  computeAsteroidAsteroidManifolds,
  computeBulletAsteroidManifolds,
  computeShipAsteroidManifolds
} from "./collisions";

function clampMagnitude(value: number, maxMagnitude: number): number {
  if (value > maxMagnitude) return maxMagnitude;
  if (value < -maxMagnitude) return -maxMagnitude;
  return value;
}

function quaternionFromAngleZ(theta: number): Quaternion {
  const half = theta * 0.5;
  return { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
}

function angleZFromQuaternion(q: Quaternion): number {
  // For a pure z-rotation quaternion: q = (0,0,sin(theta/2), cos(theta/2))
  return 2 * Math.atan2(q.z, q.w);
}

function spawnDriftingAsteroid(state: GameState): void {
  const width = state.viewportWidth;
  const height = state.viewportHeight;
  if (width <= 0 || height <= 0) return;

  const margin = 100;
  const side = Math.floor(Math.random() * 4);

  let x = 0;
  let y = 0;

  if (side === 0) {
    // left
    x = -margin;
    y = Math.random() * (height + 2 * margin) - margin;
  } else if (side === 1) {
    // right
    x = width + margin;
    y = Math.random() * (height + 2 * margin) - margin;
  } else if (side === 2) {
    // top
    x = Math.random() * (width + 2 * margin) - margin;
    y = -margin;
  } else {
    // bottom
    x = Math.random() * (width + 2 * margin) - margin;
    y = height + margin;
  }

  const centerX = width * 0.5;
  const centerY = height * 0.5;
  let dirX = centerX - x;
  let dirY = centerY - y;
  const len = Math.hypot(dirX, dirY) || 1;
  dirX /= len;
  dirY /= len;

  const speed = 60 + Math.random() * 90;

  // Randomise shape and size for each spawned asteroid.
  const MESH_COUNT = 6;
  const meshVariant = Math.floor(Math.random() * MESH_COUNT);
  // Scale tiers: small (0.5), medium (0.85), large (1.3) with some jitter.
  const sizeTiers = [0.45, 0.75, 1.0, 1.3];
  const scale = sizeTiers[Math.floor(Math.random() * sizeTiers.length)] + (Math.random() * 0.15 - 0.075);

  addEntity(state, {
    kind: EntityKind.Asteroid,
    transform: {
      position: { x, y, z: 0 },
      rotation: quaternionFromAngleZ(Math.random() * Math.PI * 2)
    },
    physics: {
      linearVelocity: {
        x: dirX * speed,
        y: dirY * speed,
        z: 0
      },
      angularVelocity: { x: 0, y: 0, z: 0 }
    },
    scale,
    meshVariant
  });
}

const FRAGMENT_SCALE = 0.45; // Fragments are smaller pieces of the original asteroid.
const FRAGMENT_COLLISION_DELAY_SECONDS = 0.4;
/** Asteroids smaller than this scale do not fragment further — they just vanish. */
const MIN_FRAGMENT_SCALE = 0.18;

function spawnAsteroidExplosion(state: GameState, asteroidId: number): void {
  const asteroid = state.entities.get(asteroidId);
  if (!asteroid) return;

  const { x, y, z } = asteroid.transform.position;
  const parentScale = asteroid.scale ?? 1;
  const fragmentScale = parentScale * FRAGMENT_SCALE;
  const fragmentCount = 6;
  const minSpeed = 120;
  const maxSpeed = 260;

  for (let i = 0; i < fragmentCount; i++) {
    const angle = (Math.PI * 2 * i) / fragmentCount + Math.random() * 0.4;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    // Fragments pick a nearby mesh variant so they look related to the parent.
    const MESH_COUNT = 6;
    const parentVariant = asteroid.meshVariant ?? 0;
    const fragmentVariant = (parentVariant + Math.floor(Math.random() * 3)) % MESH_COUNT;

    addEntity(state, {
      kind: EntityKind.Asteroid,
      transform: {
        position: { x, y, z },
        rotation: quaternionFromAngleZ(Math.random() * Math.PI * 2)
      },
      physics: {
        linearVelocity: { x: vx, y: vy, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 }
      },
      scale: fragmentScale,
      collisionEnableTime: state.timeSeconds + FRAGMENT_COLLISION_DELAY_SECONDS,
      meshVariant: fragmentVariant
    });
  }
}

export function updateGameSystems(state: GameState, dtSeconds: number, control: ControlState): void {
  state.timeSeconds += dtSeconds;

  // Temporary kinematic movement until physics bodies are wired in.
  const ship = [...state.entities.values()].find((e) => e.kind === EntityKind.PlayerShip);
  if (!ship) return;

  const turnRateRadPerSec = 4.0;
  const thrustAccelPxPerSec2 = 900.0;
  const maxSpeedPxPerSec = 900.0;
  const linearDampingPerSec = 2.0;
  const asteroidSpawnIntervalSeconds = 2.5;
  const maxAsteroids = 10;

  ship.physics ??= {
    linearVelocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 }
  };

  const angle = angleZFromQuaternion(ship.transform.rotation);
  const newAngle = angle + control.rotate * turnRateRadPerSec * dtSeconds;
  ship.transform.rotation = quaternionFromAngleZ(newAngle);

  const forwardX = Math.cos(newAngle);
  const forwardY = Math.sin(newAngle);
  ship.physics.linearVelocity.x += forwardX * (control.thrust * thrustAccelPxPerSec2 * dtSeconds);
  ship.physics.linearVelocity.y += forwardY * (control.thrust * thrustAccelPxPerSec2 * dtSeconds);

  const bulletSpeedPxPerSec = 1400.0;
  const bulletCooldownSeconds = 0.2;
  const bulletLifetimeSeconds = 2.0;

  if (control.fire && state.timeSeconds >= state.nextAllowedFireTime) {
    const muzzleDistance = 25;
    const spawnX = ship.transform.position.x + forwardX * muzzleDistance;
    const spawnY = ship.transform.position.y + forwardY * muzzleDistance;

    const bullet = addEntity(state, {
      kind: EntityKind.Bullet,
      transform: {
        position: { x: spawnX, y: spawnY, z: ship.transform.position.z },
        rotation: ship.transform.rotation
      },
      physics: {
        linearVelocity: {
          x: ship.physics.linearVelocity.x + forwardX * bulletSpeedPxPerSec,
          y: ship.physics.linearVelocity.y + forwardY * bulletSpeedPxPerSec,
          z: 0
        },
        angularVelocity: { x: 0, y: 0, z: 0 }
      }
    });

    state.bulletLifetimes.set(bullet.id, bulletLifetimeSeconds);
    state.nextAllowedFireTime = state.timeSeconds + bulletCooldownSeconds;
  }

  // Exponential damping: v *= exp(-k*dt)
  const damping = Math.exp(-linearDampingPerSec * dtSeconds);
  ship.physics.linearVelocity.x *= damping;
  ship.physics.linearVelocity.y *= damping;

  ship.physics.linearVelocity.x = clampMagnitude(ship.physics.linearVelocity.x, maxSpeedPxPerSec);
  ship.physics.linearVelocity.y = clampMagnitude(ship.physics.linearVelocity.y, maxSpeedPxPerSec);

  for (const entity of state.entities.values()) {
    if (!entity.physics) continue;
    entity.transform.position.x += entity.physics.linearVelocity.x * dtSeconds;
    entity.transform.position.y += entity.physics.linearVelocity.y * dtSeconds;
  }

  // Asteroid–asteroid collision: positional correction + impulse-based velocity response.
  // slop: small tolerance to avoid micro-corrections on barely-touching circles (prevents jitter).
  const slop = 1.0;
  // Near-elastic restitution — space rocks bounce crisply and conserve most kinetic energy.
  const restitution = 0.85;
  const invMassSum = (ma: number, mb: number) => 1 / ma + 1 / mb;

  const asteroidManifolds = computeAsteroidAsteroidManifolds(state);
  for (const m of asteroidManifolds) {
    const a = state.entities.get(m.idA);
    const b = state.entities.get(m.idB);
    if (!a?.physics || !b?.physics) continue;
    const { normal, penetration } = m;
    const massA = Math.max(0.01, (a.scale ?? 1) ** 2);
    const massB = Math.max(0.01, (b.scale ?? 1) ** 2);
    // Only correct the overlap beyond the slop threshold.
    const totalSep = Math.max(0, penetration - slop);
    const moveA = (massB / (massA + massB)) * totalSep;
    const moveB = (massA / (massA + massB)) * totalSep;
    a.transform.position.x -= normal.x * moveA;
    a.transform.position.y -= normal.y * moveA;
    b.transform.position.x += normal.x * moveB;
    b.transform.position.y += normal.y * moveB;

    const vRel =
      (a.physics.linearVelocity.x - b.physics.linearVelocity.x) * normal.x +
      (a.physics.linearVelocity.y - b.physics.linearVelocity.y) * normal.y;
    // Normal points A→B, so vRel > 0 means A approaches B. Skip if already separating.
    if (vRel <= 0) continue;
    // Apply impulse for all contacts — no slow-contact shortcut that would kill momentum transfer.
    const j = (-(1 + restitution) * vRel) / invMassSum(massA, massB);
    a.physics.linearVelocity.x += (j / massA) * normal.x;
    a.physics.linearVelocity.y += (j / massA) * normal.y;
    b.physics.linearVelocity.x -= (j / massB) * normal.x;
    b.physics.linearVelocity.y -= (j / massB) * normal.y;
  }

  // Spawn asteroids outside view that drift inward.
  let asteroidCount = 0;
  for (const entity of state.entities.values()) {
    if (entity.kind === EntityKind.Asteroid) asteroidCount += 1;
  }

  state.asteroidSpawnAccumulator += dtSeconds;
  while (
    asteroidCount < maxAsteroids &&
    state.asteroidSpawnAccumulator >= asteroidSpawnIntervalSeconds
  ) {
    spawnDriftingAsteroid(state);
    state.asteroidSpawnAccumulator -= asteroidSpawnIntervalSeconds;
    asteroidCount += 1;
  }

  // Despawn asteroids that have drifted far outside the view.
  const despawnMargin = 200;
  for (const entity of [...state.entities.values()]) {
    if (entity.kind !== EntityKind.Asteroid) continue;
    const { x, y } = entity.transform.position;
    if (
      x < -despawnMargin ||
      x > state.viewportWidth + despawnMargin ||
      y < -despawnMargin ||
      y > state.viewportHeight + despawnMargin
    ) {
      state.entities.delete(entity.id);
    }
  }

  const toRemove: number[] = [];
  for (const [id, remaining] of state.bulletLifetimes.entries()) {
    const next = remaining - dtSeconds;
    if (next <= 0) {
      toRemove.push(id);
      state.bulletLifetimes.delete(id);
    } else {
      state.bulletLifetimes.set(id, next);
    }
  }
  for (const id of toRemove) {
    state.entities.delete(id);
  }

  state.bulletAsteroidManifolds = computeBulletAsteroidManifolds(state);

  for (const manifold of state.bulletAsteroidManifolds) {
    const asteroid = state.entities.get(manifold.asteroidId);
    // Only fragment if the asteroid is large enough; tiny asteroids just vanish.
    if (asteroid && (asteroid.scale ?? 1) > MIN_FRAGMENT_SCALE) {
      spawnAsteroidExplosion(state, manifold.asteroidId);
    }
    state.entities.delete(manifold.bulletId);
    state.entities.delete(manifold.asteroidId);
    state.bulletLifetimes.delete(manifold.bulletId);
  }

  // Ship–asteroid bounce: two-body impulse so both the ship and the rock react.
  const shipRestitution = 0.6;
  // Ship mass is small relative to asteroids so it gets knocked around convincingly.
  const shipMass = 0.3;
  const shipSlop = 1.0;

  for (const m of computeShipAsteroidManifolds(state)) {
    const asteroid = state.entities.get(m.asteroidId);
    if (!asteroid?.physics || !ship.physics) continue;

    const { normal, penetration } = m;
    const asteroidMass = Math.max(0.01, (asteroid.scale ?? 1) ** 2);

    // Positional correction: push the ship away from the asteroid.
    const totalSep = Math.max(0, penetration - shipSlop);
    const moveShip = (asteroidMass / (shipMass + asteroidMass)) * totalSep;
    const moveAsteroid = (shipMass / (shipMass + asteroidMass)) * totalSep;
    ship.transform.position.x -= normal.x * moveShip;
    ship.transform.position.y -= normal.y * moveShip;
    asteroid.transform.position.x += normal.x * moveAsteroid;
    asteroid.transform.position.y += normal.y * moveAsteroid;

    // Velocity impulse — normal points ship→asteroid, so vRel > 0 means approaching.
    const vRel =
      (ship.physics.linearVelocity.x - asteroid.physics.linearVelocity.x) * normal.x +
      (ship.physics.linearVelocity.y - asteroid.physics.linearVelocity.y) * normal.y;
    if (vRel <= 0) continue; // already separating

    const j = (-(1 + shipRestitution) * vRel) / (1 / shipMass + 1 / asteroidMass);
    ship.physics.linearVelocity.x += (j / shipMass) * normal.x;
    ship.physics.linearVelocity.y += (j / shipMass) * normal.y;
    asteroid.physics.linearVelocity.x -= (j / asteroidMass) * normal.x;
    asteroid.physics.linearVelocity.y -= (j / asteroidMass) * normal.y;

    // Deal damage proportional to impact speed; invincibility window prevents chip damage.
    const damageCooldown = 0.4; // seconds
    if (state.timeSeconds - state.lastDamageTime >= damageCooldown) {
      const impactSpeed = Math.abs(vRel);
      const damage = Math.min(25, Math.max(5, impactSpeed * 0.05));
      state.health = Math.max(0, state.health - damage);
      state.lastDamageTime = state.timeSeconds;
    }
  }
}

