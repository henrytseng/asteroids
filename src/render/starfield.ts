import type { Renderer } from "./renderer";
import type { GameState } from "../game/state";
import { EntityKind } from "../game/types";

// ---------------------------------------------------------------------------
// Starfield
// Pre-generate star positions in a virtual tile that matches the viewport.
// Each frame we shift positions by a fraction of the ship's world offset so
// stars appear to drift opposite to the ship's motion (parallax).
// Stars are rendered as gl.POINTS in two layers:
//   - Far layer  (dim, 1 px):  parallax 0.06 — barely moves
//   - Near layer (bright, 2 px): parallax 0.18 — noticeable motion
// ---------------------------------------------------------------------------

interface Star {
    /** Fractional position in [0, 1) within a viewport-sized tile */
    tx: number;
    ty: number;
    parallax: number;
    size: number;
    alpha: number;
}

const FAR_COUNT = 2000;
const NEAR_COUNT = 55;

const stars: Star[] = [];

export function initStarfield(): void {
    stars.length = 0;

    for (let i = 0; i < FAR_COUNT; i++) {
        stars.push({
            tx: Math.random(),
            ty: Math.random(),
            parallax: 0.04 + Math.random() * 0.06,
            size: 1.0,
            alpha: 0.3 + Math.random() * 0.4
        });
    }
    for (let i = 0; i < NEAR_COUNT; i++) {
        stars.push({
            tx: Math.random(),
            ty: Math.random(),
            parallax: 0.12 + Math.random() * 0.10,
            size: 2.0,
            alpha: 0.55 + Math.random() * 0.35
        });
    }
}

/**
 * Render all stars before game entities.
 * Uses the standard WebGL program with u_angle=0, u_scale=1, u_offset=NDC position.
 * Stars are black dots on the white background.
 */
export function renderStarfield(renderer: Renderer, state: GameState): void {
    const { glCtx, program, attribPosition, uniformOffset, uniformAngle,
        uniformScale, uniformColor, uniformPointSize, buffer } = renderer;
    const { gl, canvas } = glCtx;
    const W = canvas.width;
    const H = canvas.height;

    // Get ship world position for pan offset.
    const ship = [...state.entities.values()].find(e => e.kind === EntityKind.PlayerShip);
    const shipX = ship?.transform.position.x ?? 0;
    const shipY = ship?.transform.position.y ?? 0;

    gl.useProgram(program);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Single origin vertex — position is set entirely by u_offset.
    const origin = new Float32Array([0, 0, 0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, origin, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(attribPosition);
    gl.vertexAttribPointer(attribPosition, 3, gl.FLOAT, false, 0, 0);

    if (uniformAngle) gl.uniform1f(uniformAngle, 0);
    if (uniformScale) gl.uniform1f(uniformScale, 1);

    let lastSize = -1;

    for (const star of stars) {
        // Tile-wrapped screen position shifted by ship world offset × parallax.
        const sx = ((star.tx * W - shipX * star.parallax) % W + W) % W;
        const sy = ((star.ty * H - shipY * star.parallax) % H + H) % H;

        const ndcX = (sx / W) * 2 - 1;
        const ndcY = -(sy / H) * 2 + 1;

        gl.uniform2f(uniformOffset, ndcX, ndcY);

        // Only change the point-size uniform when the size actually changes.
        if (uniformPointSize && star.size !== lastSize) {
            gl.uniform1f(uniformPointSize, star.size);
            lastSize = star.size;
        }

        gl.uniform4f(uniformColor, 0, 0, 0, star.alpha);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}
