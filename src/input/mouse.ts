/**
 * Mouse input module.
 *
 * - Activates "mouse mode" whenever the mouse moves.
 * - Deactivates after MOUSE_IDLE_THRESHOLD_MS of no movement (falls back to keyboard).
 * - Tracks cursor position in canvas/pixel space.
 * - Tracks left-button held state for firing.
 */

const MOUSE_IDLE_THRESHOLD_MS = 3000;

export interface MouseState {
    /** True when the mouse has moved recently and should drive the ship. */
    active: boolean;
    /** Cursor X in canvas pixel space. */
    x: number;
    /** Cursor Y in canvas pixel space. */
    y: number;
    /** Left mouse button is currently held down. */
    firing: boolean;
}

const state: MouseState = {
    active: false,
    x: 0,
    y: 0,
    firing: false
};

let idleTimer: ReturnType<typeof setTimeout> | null = null;

function resetIdleTimer(): void {
    if (idleTimer !== null) clearTimeout(idleTimer);
    state.active = true;
    idleTimer = setTimeout(() => {
        state.active = false;
        state.firing = false;
    }, MOUSE_IDLE_THRESHOLD_MS);
}

export function installMouseControls(canvas: HTMLCanvasElement): void {
    // Use the canvas rect so coordinates are in canvas-local pixel space.
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        state.x = e.clientX - rect.left;
        state.y = e.clientY - rect.top;
        resetIdleTimer();
    });

    canvas.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
            state.firing = true;
            resetIdleTimer();
        }
    });

    canvas.addEventListener("mouseup", (e) => {
        if (e.button === 0) {
            state.firing = false;
        }
    });

    // Prevent context menu on right-click over canvas.
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Any keypress immediately returns control to keyboard.
    window.addEventListener("keydown", () => {
        if (idleTimer !== null) clearTimeout(idleTimer);
        state.active = false;
        state.firing = false;
    });
}

export function getMouseState(): MouseState {
    return { ...state };
}
