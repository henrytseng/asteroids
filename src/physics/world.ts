// Minimal Bullet world wrapper; implementation will be expanded later.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AmmoType = any;

export interface PhysicsWorld {
  ammo: AmmoType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  world: any;
}

export async function createPhysicsWorld(): Promise<PhysicsWorld> {
  // Dynamic import of Ammo.js; bundler will handle the WASM asset.
  const AmmoModule = (await import("../../lib/ammo.js/ammo.wasm.js")).default as unknown as () => Promise<AmmoType>;
  const ammo = await AmmoModule();

  const collisionConfiguration = new ammo.btDefaultCollisionConfiguration();
  const dispatcher = new ammo.btCollisionDispatcher(collisionConfiguration);
  const overlappingPairCache = new ammo.btDbvtBroadphase();
  const solver = new ammo.btSequentialImpulseConstraintSolver();
  const world = new ammo.btDiscreteDynamicsWorld(
    dispatcher,
    overlappingPairCache,
    solver,
    collisionConfiguration
  );
  world.setGravity(new ammo.btVector3(0, 0, 0));

  return {
    ammo,
    world
  };
}


