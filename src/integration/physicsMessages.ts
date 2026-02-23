import type { EntityId, Vector3, Quaternion } from "../game/types";
import type { ControlState } from "../input/controls";

export interface InitPhysicsMessage {
  type: "Init";
}

export interface ControlUpdateMessage {
  type: "ControlUpdate";
  control: ControlState;
}

export interface PhysicsSnapshotEntity {
  id: EntityId;
  position: Vector3;
  rotation: Quaternion;
}

export interface PhysicsSnapshotMessage {
  type: "Snapshot";
  entities: PhysicsSnapshotEntity[];
}

export type PhysicsToMainMessage = PhysicsSnapshotMessage;
export type MainToPhysicsMessage = InitPhysicsMessage | ControlUpdateMessage;

