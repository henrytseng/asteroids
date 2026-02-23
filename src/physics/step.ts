import type { PhysicsWorld } from "./world";
import type { PhysicsToMainMessage } from "../integration/physicsMessages";
import { PHYSICS_TIMESTEP_SECONDS } from "../config";

export function startPhysicsLoop(
  world: PhysicsWorld,
  send: (msg: PhysicsToMainMessage) => void
): void {
  const stepMs = PHYSICS_TIMESTEP_SECONDS * 1000;

  function tick() {
    // A real implementation would call Bullet's stepSimulation here:
    // world.world.stepSimulation(PHYSICS_TIMESTEP_SECONDS, 1);

    const snapshot: PhysicsToMainMessage = {
      type: "Snapshot",
      entities: []
    };

    send(snapshot);
    setTimeout(tick, stepMs);
  }

  void world; // Suppress unused variable until bodies are wired in.
  tick();
}

