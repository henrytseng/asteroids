import type { GameState } from "../game/state";

let hudEl: HTMLDivElement | null = null;
let fillEl: HTMLDivElement | null = null;
let textEl: HTMLSpanElement | null = null;

export function ensureHud(): void {
    if (hudEl) return;

    // Wrapper: fixed to bottom-center
    hudEl = document.createElement("div");
    hudEl.id = "hud-health";
    Object.assign(hudEl.style, {
        position: "fixed",
        bottom: "28px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "260px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "5px",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: "100"
    });

    // Label
    const label = document.createElement("span");
    label.textContent = "HULL";
    Object.assign(label.style, {
        color: "#aaa",
        fontSize: "10px",
        letterSpacing: "3px",
        fontFamily: "system-ui, monospace",
        fontWeight: "600"
    });

    // Track (the bar background)
    const track = document.createElement("div");
    Object.assign(track.style, {
        width: "100%",
        height: "10px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "5px",
        border: "1px solid rgba(255,255,255,0.15)",
        overflow: "hidden",
        position: "relative"
    });

    // Fill (health level)
    fillEl = document.createElement("div");
    Object.assign(fillEl.style, {
        height: "100%",
        width: "100%",
        borderRadius: "5px",
        background: "linear-gradient(90deg, #00e676, #69f0ae)",
        transition: "width 0.12s ease, background 0.4s ease",
        transformOrigin: "left center"
    });
    track.appendChild(fillEl);

    // HP text just under the bar
    textEl = document.createElement("span");
    Object.assign(textEl.style, {
        color: "rgba(255,255,255,0.45)",
        fontSize: "9px",
        fontFamily: "system-ui, monospace",
        letterSpacing: "1px"
    });

    hudEl.appendChild(label);
    hudEl.appendChild(track);
    hudEl.appendChild(textEl);
    document.body.appendChild(hudEl);
}

export function updateHud(state: GameState): void {
    if (!fillEl || !textEl) return;

    const pct = Math.max(0, Math.min(1, state.health / state.maxHealth));
    fillEl.style.width = `${(pct * 100).toFixed(1)}%`;
    textEl.textContent = `${Math.ceil(state.health)} / ${state.maxHealth}`;

    // Colour shifts: green → yellow → red as health drops.
    if (pct > 0.5) {
        fillEl.style.background = "linear-gradient(90deg, #00e676, #69f0ae)";
    } else if (pct > 0.25) {
        fillEl.style.background = "linear-gradient(90deg, #ffd600, #ffff00)";
    } else {
        fillEl.style.background = "linear-gradient(90deg, #d50000, #ff5252)";
    }
}
