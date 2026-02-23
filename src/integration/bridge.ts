import type { GameState } from "../game/state";
import type {
  MainToPhysicsMessage,
  PhysicsToMainMessage,
  PhysicsSnapshotMessage
} from "./physicsMessages";

export interface PhysicsBridge {
  worker: Worker;
  latestSnapshot: PhysicsSnapshotMessage | null;
}

export function createPhysicsBridge(worker: Worker): PhysicsBridge {
  const bridge: PhysicsBridge = {
    worker,
    latestSnapshot: null
  };

  worker.addEventListener("message", (event: MessageEvent<PhysicsToMainMessage>) => {
    const msg = event.data;
    if (msg.type === "Snapshot") {
      bridge.latestSnapshot = msg;
    }
  });

  return bridge;
}

export function sendToPhysics(bridge: PhysicsBridge, msg: MainToPhysicsMessage): void {
  bridge.worker.postMessage(msg);
}

export function applyLatestSnapshot(bridge: PhysicsBridge, state: GameState): void {
  const snapshot = bridge.latestSnapshot;
  if (!snapshot) return;
  for (const entityData of snapshot.entities) {
    const entity = state.entities.get(entityData.id);
    if (!entity) continue;
    entity.transform.position = entityData.position;
    entity.transform.rotation = entityData.rotation;
  }
}

