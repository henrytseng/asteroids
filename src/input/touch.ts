/**
 * Touch input module.
 *
 * - touchstart / touchmove: activates touch mode and steers the ship toward
 *   the first touch point (same canvas-pixel coords as mouse mode).
 * - touchend: deactivates steering. If the touch was short (<250 ms) and
 *   covered little distance (<20 px) it counts as a tap and fires one bullet.
 * - touchcancel: deactivates steering without firing.
 */

const TAP_MAX_MS = 250;
const TAP_MAX_PX = 20;

export interface TouchState {
    /** True while at least one finger is on-screen. */
    active: boolean;
    /** Target X in canvas pixel space (latest touch point). */
    x: number;
    /** Target Y in canvas pixel space (latest touch point). */
    y: number;
    /**
     * True for exactly one frame after a tap is detected.
     * getTouchState() consumes and clears this flag.
     */
    firing: boolean;
}

const state: TouchState = {
    active: false,
    x: 0,
    y: 0,
    firing: false
};

let pendingFire = false;

// Tap gesture tracking for the primary finger.
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

function canvasCoords(canvas: HTMLCanvasElement, touch: Touch): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

export function installTouchControls(canvas: HTMLCanvasElement): void {
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;
        const { x, y } = canvasCoords(canvas, touch);
        state.active = true;
        state.x = x;
        state.y = y;
        touchStartX = x;
        touchStartY = y;
        touchStartTime = performance.now();
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;
        const { x, y } = canvasCoords(canvas, touch);
        state.x = x;
        state.y = y;
    }, { passive: false });

    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        // If all fingers lifted, deactivate steering.
        if (e.touches.length === 0) {
            state.active = false;
        }
        // Check if this was a tap (short + small movement).
        const dt = performance.now() - touchStartTime;
        const dx = state.x - touchStartX;
        const dy = state.y - touchStartY;
        const dist = Math.hypot(dx, dy);
        if (dt < TAP_MAX_MS && dist < TAP_MAX_PX) {
            pendingFire = true;
        }
    }, { passive: false });

    canvas.addEventListener("touchcancel", (e) => {
        e.preventDefault();
        state.active = false;
    }, { passive: false });
}

/** Returns the current touch state, consuming the one-shot fire flag. */
export function getTouchState(): TouchState {
    const snap: TouchState = { ...state, firing: pendingFire };
    pendingFire = false;
    return snap;
}
