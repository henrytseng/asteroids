export interface ControlState {
  thrust: number;
  rotate: number;
  fire: boolean;
}

const defaultControlState: ControlState = {
  thrust: 0,
  rotate: 0,
  fire: false
};

const current: ControlState = { ...defaultControlState };
const pressed = new Set<string>();

function recomputeFromPressed(): void {
  const forward = pressed.has("KeyW") || pressed.has("ArrowUp");
  const back = pressed.has("KeyS") || pressed.has("ArrowDown");
  current.thrust = (forward ? 1 : 0) + (back ? -1 : 0);

  const left = pressed.has("KeyA") || pressed.has("ArrowLeft");
  const right = pressed.has("KeyD") || pressed.has("ArrowRight");
  current.rotate = (right ? 1 : 0) + (left ? -1 : 0);

  current.fire = pressed.has("Space");
}

export function getControlState(): ControlState {
  return { ...current };
}

export function installKeyboardControls(target: Window = window): void {
  target.addEventListener("keydown", (e) => {
    pressed.add(e.code);
    recomputeFromPressed();
  });

  target.addEventListener("keyup", (e) => {
    pressed.delete(e.code);
    recomputeFromPressed();
  });
}

