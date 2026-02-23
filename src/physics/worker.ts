/// <reference lib="webworker" />

import { createPhysicsWorld, type PhysicsWorld } from "./world";
import { startPhysicsLoop } from "./step";
import type { MainToPhysicsMessage } from "../integration/physicsMessages";

let ready = false;
let initPromise: Promise<void> | null = null;
let physicsWorld: PhysicsWorld | null = null;

function ensureInitialized(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    physicsWorld = await createPhysicsWorld();
    startPhysicsLoop(physicsWorld, (msg) => {
      (self as unknown as Worker).postMessage(msg);
    });
    ready = true;
  })();
  return initPromise;
}

self.addEventListener("message", (event: MessageEvent<MainToPhysicsMessage>) => {
  const msg = event.data;
  switch (msg.type) {
    case "Init":
      void ensureInitialized();
      break;
    case "ControlUpdate":
      // Control updates will be applied to bodies when they are wired in.
      if (!ready) {
        void ensureInitialized();
      }
      void msg;
      break;
  }
});

