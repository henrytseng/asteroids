let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

function ensureOverlayElement(): HTMLDivElement {
  let el = document.getElementById("debug-overlay") as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "debug-overlay";
    el.style.position = "fixed";
    el.style.left = "8px";
    el.style.top = "8px";
    el.style.padding = "4px 8px";
    el.style.background = "rgba(0,0,0,0.5)";
    el.style.color = "#0f0";
    el.style.font = "12px system-ui, sans-serif";
    document.body.appendChild(el);
  }
  return el;
}

export function updateDebugOverlay(): void {
  const now = performance.now();
  frameCount++;
  if (now - lastFrameTime >= 1000) {
    fps = (frameCount * 1000) / (now - lastFrameTime);
    frameCount = 0;
    lastFrameTime = now;
  }
  const el = ensureOverlayElement();
  el.textContent = `FPS: ${fps.toFixed(1)}`;
}

