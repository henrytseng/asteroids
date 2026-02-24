import { createInitialGameState } from "./game/state";
import { spawnPlayer } from "./game/entities";
import { updateGameSystems } from "./game/systems";
import { installKeyboardControls, getControlState } from "./input/controls";
import { installMouseControls, getMouseState } from "./input/mouse";
import { installTouchControls, getTouchState } from "./input/touch";
import { createRenderer, renderScene, clearScene } from "./render/renderer";
import { createPhysicsBridge, sendToPhysics, applyLatestSnapshot } from "./integration/bridge";
import type { MainToPhysicsMessage } from "./integration/physicsMessages";
import { updateDebugOverlay } from "./debug/overlay";
import { ensureHud, updateHud } from "./render/hud";
import { initStarfield, renderStarfield } from "./render/starfield";

const canvasId = "game-canvas";

function ensureCanvas(): HTMLCanvasElement {
  let canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = canvasId;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.style.margin = "0";
    document.body.appendChild(canvas);
  }

  window.addEventListener("resize", () => {
    canvas!.width = window.innerWidth;
    canvas!.height = window.innerHeight;
  });

  return canvas;
}

function createPhysicsWorker(): Worker {
  // Vite will transform this into a proper worker URL.
  const worker = new Worker(new URL("./physics/worker.ts", import.meta.url), {
    type: "module"
  });
  return worker;
}

function main() {
  const canvas = ensureCanvas();
  installKeyboardControls();
  installMouseControls(canvas);
  installTouchControls(canvas);

  const createdRenderer = createRenderer(canvas);
  if (!createdRenderer) return;
  const renderer = createdRenderer;

  const state = createInitialGameState(canvas.width, canvas.height);
  spawnPlayer(state, { x: canvas.width / 2, y: canvas.height / 2, z: 0 });

  ensureHud();
  initStarfield();

  const worker = createPhysicsWorker();
  const bridge = createPhysicsBridge(worker);

  const initMsg: MainToPhysicsMessage = { type: "Init" };
  sendToPhysics(bridge, initMsg);

  let lastTime = performance.now();

  function loop(now: number) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const control = getControlState();
    const mouse = getMouseState();
    const touch = getTouchState();

    // Touch takes priority; falls back to mouse; falls back to keyboard.
    if (touch.active || touch.firing) {
      control.mouseModeActive = true;
      control.mouseTarget = { x: touch.x, y: touch.y };
      control.fire = touch.firing;
    } else if (mouse.active) {
      control.mouseModeActive = true;
      control.mouseTarget = { x: mouse.x, y: mouse.y };
      control.fire = control.fire || mouse.firing;
    }

    updateGameSystems(state, dt, control);
    const controlMsg: MainToPhysicsMessage = {
      type: "ControlUpdate",
      control
    };
    sendToPhysics(bridge, controlMsg);

    applyLatestSnapshot(bridge, state);
    clearScene(renderer);
    renderStarfield(renderer, state);
    renderScene(renderer, state);
    updateDebugOverlay(state.entities.size);
    updateHud(state);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

window.addEventListener("load", () => {
  main();
});


