import type { GameState } from "../game/state";
import { EntityKind, type Quaternion } from "../game/types";
import { createGLContext, type GLContext } from "./gl/context";
import { createProgram } from "./gl/shaders";
import { asteroidMeshes, bulletMesh, debrisMesh, playerShipMesh } from "./mesh";

const VERT_SRC = `
attribute vec3 a_position;
uniform vec2 u_offset;
uniform float u_angle;
uniform float u_scale;
void main() {
  float c = cos(u_angle);
  float s = sin(u_angle);
  vec2 rotated = vec2(
    a_position.x * c - a_position.y * s,
    a_position.x * s + a_position.y * c
  );
  vec3 pos = vec3(rotated * u_scale, a_position.z) + vec3(u_offset, 0.0);
  gl_Position = vec4(pos, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
`;

// ---------------------------------------------------------------------------
// Laser beam shader – used exclusively for bullets.
// The vertex shader passes the raw local-space XY to the fragment shader;
// the fragment shader applies a Gaussian falloff along the Y axis so the
// beam has a crisp white core with a soft cyan glow around it.
// ---------------------------------------------------------------------------
const LASER_VERT_SRC = `
attribute vec3 a_position;
uniform vec2 u_offset;
uniform float u_angle;
uniform float u_scale;
varying vec2 v_localPos;
void main() {
  v_localPos = a_position.xy;
  float c = cos(u_angle);
  float s = sin(u_angle);
  vec2 rotated = vec2(
    a_position.x * c - a_position.y * s,
    a_position.x * s + a_position.y * c
  );
  vec3 pos = vec3(rotated * u_scale, a_position.z) + vec3(u_offset, 0.0);
  gl_Position = vec4(pos, 1.0);
}
`;

// Half-height of the bullet quad in local NDC units — controls glow radius.
const LASER_HALF_H = 0.009;

const LASER_FRAG_SRC = `
precision mediump float;
varying vec2 v_localPos;
void main() {
  // t = 0 at beam axis, 1 at quad edge.
  float t = abs(v_localPos.y) / ${LASER_HALF_H.toFixed(4)};
  // Sharp bright core.
  float core  = exp(-t * t * 18.0);
  // Wide soft glow.
  float glow  = exp(-t * t *  3.5);
  // Fade tips of the beam along X so ends don't look sharp.
  float xHalf = 0.028;
  float xFade = 1.0 - smoothstep(xHalf * 0.55, xHalf, abs(v_localPos.x));
  vec3 coreColor = vec3(1.0, 1.0, 1.0);
  vec3 glowColor = vec3(0.2, 0.85, 1.0);
  vec3 col = coreColor * core + glowColor * glow * (1.0 - core);
  float alpha = (core + glow * 0.6) * xFade;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

export interface Renderer {
  glCtx: GLContext;
  program: WebGLProgram;
  attribPosition: number;
  uniformOffset: WebGLUniformLocation | null;
  uniformAngle: WebGLUniformLocation | null;
  uniformScale: WebGLUniformLocation | null;
  uniformColor: WebGLUniformLocation | null;
  laserProgram: WebGLProgram;
  laserAttribPosition: number;
  laserUniformOffset: WebGLUniformLocation | null;
  laserUniformAngle: WebGLUniformLocation | null;
  laserUniformScale: WebGLUniformLocation | null;
  buffer: WebGLBuffer;
}

function angleZFromQuaternion(q: Quaternion): number {
  return 2 * Math.atan2(q.z, q.w);
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const glCtx = createGLContext(canvas);
  if (!glCtx) return null;
  const { gl } = glCtx;

  // --- Standard program (asteroids, ship, debris) ---
  const program = createProgram(gl, VERT_SRC, FRAG_SRC);
  gl.useProgram(program);
  const attribPosition = gl.getAttribLocation(program, "a_position");
  const uniformOffset = gl.getUniformLocation(program, "u_offset");
  const uniformAngle = gl.getUniformLocation(program, "u_angle");
  const uniformScale = gl.getUniformLocation(program, "u_scale");
  const uniformColor = gl.getUniformLocation(program, "u_color");

  // --- Laser program (bullets) ---
  const laserProgram = createProgram(gl, LASER_VERT_SRC, LASER_FRAG_SRC);
  gl.useProgram(laserProgram);
  const laserAttribPosition = gl.getAttribLocation(laserProgram, "a_position");
  const laserUniformOffset = gl.getUniformLocation(laserProgram, "u_offset");
  const laserUniformAngle = gl.getUniformLocation(laserProgram, "u_angle");
  const laserUniformScale = gl.getUniformLocation(laserProgram, "u_scale");

  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("Failed to create buffer");

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return {
    glCtx, program, attribPosition, uniformOffset, uniformAngle, uniformScale, uniformColor,
    laserProgram, laserAttribPosition, laserUniformOffset, laserUniformAngle, laserUniformScale,
    buffer
  };
}

export function renderScene(renderer: Renderer, state: GameState): void {
  const { glCtx, buffer } = renderer;
  const { gl, canvas } = glCtx;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (const entity of state.entities.values()) {
    const isBullet = entity.kind === EntityKind.Bullet;

    let mesh = null;
    if (entity.kind === EntityKind.PlayerShip) {
      mesh = playerShipMesh;
    } else if (entity.kind === EntityKind.Asteroid) {
      mesh = asteroidMeshes[entity.meshVariant ?? 0] ?? asteroidMeshes[0];
    } else if (isBullet) {
      mesh = bulletMesh;
    } else if (entity.kind === EntityKind.Debris) {
      mesh = debrisMesh;
    }
    if (!mesh) continue;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);

    if (isBullet) {
      // Switch to laser program + additive blending so beams bloom.
      gl.useProgram(renderer.laserProgram);
      gl.enableVertexAttribArray(renderer.laserAttribPosition);
      gl.vertexAttribPointer(renderer.laserAttribPosition, 3, gl.FLOAT, false, 0, 0);
      gl.blendFunc(gl.ONE, gl.ONE);

      const ndcX = (entity.transform.position.x / canvas.width) * 2 - 1;
      const ndcY = (entity.transform.position.y / canvas.height) * -2 + 1;
      gl.uniform2f(renderer.laserUniformOffset, ndcX, ndcY);
      if (renderer.laserUniformAngle) {
        gl.uniform1f(renderer.laserUniformAngle, -angleZFromQuaternion(entity.transform.rotation));
      }
      if (renderer.laserUniformScale) {
        gl.uniform1f(renderer.laserUniformScale, entity.scale ?? 1);
      }
    } else {
      // Standard program + normal alpha blending.
      gl.useProgram(renderer.program);
      gl.enableVertexAttribArray(renderer.attribPosition);
      gl.vertexAttribPointer(renderer.attribPosition, 3, gl.FLOAT, false, 0, 0);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const ndcX = (entity.transform.position.x / canvas.width) * 2 - 1;
      const ndcY = (entity.transform.position.y / canvas.height) * -2 + 1;
      gl.uniform2f(renderer.uniformOffset, ndcX, ndcY);
      if (renderer.uniformAngle) {
        gl.uniform1f(renderer.uniformAngle, -angleZFromQuaternion(entity.transform.rotation));
      }
      if (renderer.uniformScale) {
        gl.uniform1f(renderer.uniformScale, entity.scale ?? 1);
      }
      gl.uniform4fv(renderer.uniformColor, mesh.color);
    }

    const vertexCount = mesh.vertices.length / 3;
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexCount);
  }
}

