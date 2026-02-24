let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

function ensureOverlayElement(i: number = 0): HTMLDivElement {
  const target_id = `debug-overlay-${i}`;
  let el = document.getElementById(target_id) as HTMLDivElement | null;
  if (!el) {
    const y = 8 + i * 24;
    el = document.createElement("div");
    el.id = target_id;
    el.style.position = "fixed";
    el.style.left = "8px";
    el.style.top = `${y}px`;
    el.style.padding = "4px 8px";
    el.style.background = "rgba(0,0,0,0.5)";
    el.style.color = "#0f0";
    el.style.font = "12px system-ui, sans-serif";
    document.body.appendChild(el);
  }
  return el;
}

export interface InputDebugInfo {
  mouseActive: boolean;
  mouseX: number;
  mouseY: number;
  touchActive: boolean;
  touchX: number;
  touchY: number;
  touchPoints: number;
  firing: boolean;
}

export function updateDebugOverlay(num_entities: Number = 0, input?: InputDebugInfo): void {
  const now = performance.now();
  frameCount++;
  if (now - lastFrameTime >= 1000) {
    fps = (frameCount * 1000) / (now - lastFrameTime);
    frameCount = 0;
    lastFrameTime = now;
  }

  ensureOverlayElement(0).textContent = `FPS: ${fps.toFixed(1)}`;
  ensureOverlayElement(1).textContent = `entities: ${num_entities}`;

  if (input) {
    const mouseMode = input.mouseActive ? "active" : "idle";
    ensureOverlayElement(2).textContent =
      `mouse [${mouseMode}]  x:${input.mouseX.toFixed(0)}  y:${input.mouseY.toFixed(0)}`;

    const touchMode = input.touchActive ? "active" : "idle";
    ensureOverlayElement(3).textContent =
      `touch [${touchMode}]  fingers:${input.touchPoints}  x:${input.touchX.toFixed(0)}  y:${input.touchY.toFixed(0)}`;

    ensureOverlayElement(4).textContent =
      `fire: ${input.firing ? "🔥 FIRING" : "—"}`;
  }
}
