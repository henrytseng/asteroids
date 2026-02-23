// Core shared game types.

export type EntityId = number;

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export enum EntityKind {
  PlayerShip = "PlayerShip",
  Asteroid = "Asteroid",
  Debris = "Debris",
  Bullet = "Bullet",
  AmmoPickup = "AmmoPickup"
}

export interface Transform {
  position: Vector3;
  rotation: Quaternion;
}

export interface PhysicsState {
  linearVelocity: Vector3;
  angularVelocity: Vector3;
}

export interface Entity {
  id: EntityId;
  kind: EntityKind;
  transform: Transform;
  physics?: PhysicsState;
  /** Scale for rendering and collision; default 1. Fragments use a smaller value. */
  scale?: number;
  /** Game time (seconds) when this entity starts participating in asteroid-asteroid collisions. */
  collisionEnableTime?: number;
}

