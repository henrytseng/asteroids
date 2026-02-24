import type { GameState } from "../game/state";
import { EntityKind, type Quaternion } from "../game/types";
import { createGLContext, type GLContext } from "./gl/context";
import { createProgram } from "./gl/shaders";
import { asteroidMeshes, bulletMesh, debrisMesh, sparkMesh, playerShipMesh } from "./mesh";

const VERT_SRC = `
attribute vec3 a_position;
uniform vec2 u_offset;
uniform float u_angle;
uniform float u_scale;
uniform float u_aspect;
uniform float u_pointSize;
void main() {
  float c = cos(u_angle);
  float s = sin(u_angle);
  vec2 rotated = vec2(
    a_position.x * c - a_position.y * s,
    a_position.x * s + a_position.y * c
  );
  vec2 scaled = rotated * u_scale;
  scaled.x /= u_aspect;
  vec3 pos = vec3(scaled, a_position.z) + vec3(u_offset, 0.0);
  gl_Position = vec4(pos, 1.0);
  gl_PointSize = u_pointSize;
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
uniform float u_aspect;
varying vec2 v_localPos;
void main() {
  v_localPos = a_position.xy;
  float c = cos(u_angle);
  float s = sin(u_angle);
  vec2 rotated = vec2(
    a_position.x * c - a_position.y * s,
    a_position.x * s + a_position.y * c
  );
  vec2 scaled = rotated * u_scale;
  scaled.x /= u_aspect;
  vec3 pos = vec3(scaled, a_position.z) + vec3(u_offset, 0.0);
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
  // Deep red core + crimson glow.
  vec3 coreColor = vec3(0.55, 0.0, 0.0);
  vec3 glowColor = vec3(0.80, 0.05, 0.05);
  vec3 col = coreColor * core + glowColor * glow * (1.0 - core);
  float alpha = (core + glow * 0.6) * xFade;
  gl_FragColor = vec4(col, alpha);
}
`;

export interface Renderer {
  glCtx: GLContext;
  program: WebGLProgram;
  attribPosition: number;
  uniformOffset: WebGLUniformLocation | null;
  uniformAngle: WebGLUniformLocation | null;
  uniformScale: WebGLUniformLocation | null;
  uniformAspect: WebGLUniformLocation | null;
  uniformColor: WebGLUniformLocation | null;
  uniformPointSize: WebGLUniformLocation | null;
  laserProgram: WebGLProgram;
  laserAttribPosition: number;
  laserUniformOffset: WebGLUniformLocation | null;
  laserUniformAngle: WebGLUniformLocation | null;
  laserUniformScale: WebGLUniformLocation | null;
  laserUniformAspect: WebGLUniformLocation | null;
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
  const uniformAspect = gl.getUniformLocation(program, "u_aspect");
  const uniformColor = gl.getUniformLocation(program, "u_color");
  const uniformPointSize = gl.getUniformLocation(program, "u_pointSize");

  // --- Laser program (bullets) ---
  const laserProgram = createProgram(gl, LASER_VERT_SRC, LASER_FRAG_SRC);
  gl.useProgram(laserProgram);
  const laserAttribPosition = gl.getAttribLocation(laserProgram, "a_position");
  const laserUniformOffset = gl.getUniformLocation(laserProgram, "u_offset");
  const laserUniformAngle = gl.getUniformLocation(laserProgram, "u_angle");
  const laserUniformScale = gl.getUniformLocation(laserProgram, "u_scale");
  const laserUniformAspect = gl.getUniformLocation(laserProgram, "u_aspect");

  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("Failed to create buffer");

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return {
    glCtx, program, attribPosition, uniformOffset, uniformAngle, uniformScale, uniformAspect, uniformColor, uniformPointSize,
    laserProgram, laserAttribPosition, laserUniformOffset, laserUniformAngle, laserUniformScale, laserUniformAspect,
    buffer
  };
}

export function clearScene(renderer: Renderer): void {
  const { glCtx } = renderer;
  const { gl, canvas } = glCtx;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

export function renderScene(renderer: Renderer, state: GameState): void {
  const { glCtx, buffer } = renderer;
  const { gl, canvas } = glCtx;
  const aspect = state.viewportWidth / state.viewportHeight;
  const dpr = canvas.width / state.viewportWidth;

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
    } else if (entity.kind === EntityKind.Spark) {
      mesh = sparkMesh;
    }
    if (!mesh) continue;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);

    if (isBullet) {
      // Switch to laser program + normal alpha blending on white bg.
      gl.useProgram(renderer.laserProgram);
      gl.enableVertexAttribArray(renderer.laserAttribPosition);
      gl.vertexAttribPointer(renderer.laserAttribPosition, 3, gl.FLOAT, false, 0, 0);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const ndcX = (entity.transform.position.x / state.viewportWidth) * 2 - 1;
      const ndcY = (entity.transform.position.y / state.viewportHeight) * -2 + 1;
      gl.uniform2f(renderer.laserUniformOffset, ndcX, ndcY);
      if (renderer.laserUniformAngle) {
        gl.uniform1f(renderer.laserUniformAngle, -angleZFromQuaternion(entity.transform.rotation));
      }
      if (renderer.laserUniformScale) {
        gl.uniform1f(renderer.laserUniformScale, entity.scale ?? 1);
      }
      if (renderer.laserUniformAspect) {
        gl.uniform1f(renderer.laserUniformAspect, aspect);
      }
    } else {
      // Standard program + normal alpha blending.
      gl.useProgram(renderer.program);
      gl.enableVertexAttribArray(renderer.attribPosition);
      gl.vertexAttribPointer(renderer.attribPosition, 3, gl.FLOAT, false, 0, 0);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const ndcX = (entity.transform.position.x / state.viewportWidth) * 2 - 1;
      const ndcY = (entity.transform.position.y / state.viewportHeight) * -2 + 1;
      gl.uniform2f(renderer.uniformOffset, ndcX, ndcY);
      if (renderer.uniformAngle) {
        gl.uniform1f(renderer.uniformAngle, -angleZFromQuaternion(entity.transform.rotation));
      }
      if (renderer.uniformScale) {
        gl.uniform1f(renderer.uniformScale, entity.scale ?? 1);
      }
      if (renderer.uniformAspect) {
        gl.uniform1f(renderer.uniformAspect, aspect);
      }
      // Respect per-entity opacity (used for fading spark/debris particles).
      const opacity = entity.opacity ?? 1.0;
      const color = opacity === 1.0 ? mesh.color : new Float32Array([
        mesh.color[0], mesh.color[1], mesh.color[2], mesh.color[3] * opacity
      ]);
      gl.uniform4fv(renderer.uniformColor, color);
      // Sparks are bigger points; everything else uses 1px default.
      if (renderer.uniformPointSize) {
        const pSize = entity.kind === EntityKind.Spark ? 3.0 : 1.0;
        gl.uniform1f(renderer.uniformPointSize, pSize * dpr);
      }
    }

    const vertexCount = mesh.vertices.length / 3;
    gl.drawArrays(entity.kind === EntityKind.Spark ? gl.POINTS : gl.TRIANGLE_FAN, 0, vertexCount);
  }
}

