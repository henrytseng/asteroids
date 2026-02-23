import type { GameState } from "../game/state";
import { EntityKind, type Quaternion } from "../game/types";
import { createGLContext, type GLContext } from "./gl/context";
import { createProgram } from "./gl/shaders";
import { asteroidMesh, bulletMesh, debrisMesh, playerShipMesh } from "./mesh";

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

export interface Renderer {
  glCtx: GLContext;
  program: WebGLProgram;
  attribPosition: number;
  uniformOffset: WebGLUniformLocation | null;
  uniformAngle: WebGLUniformLocation | null;
  uniformScale: WebGLUniformLocation | null;
  uniformColor: WebGLUniformLocation | null;
  buffer: WebGLBuffer;
}

function angleZFromQuaternion(q: Quaternion): number {
  return 2 * Math.atan2(q.z, q.w);
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const glCtx = createGLContext(canvas);
  if (!glCtx) return null;
  const { gl } = glCtx;

  const program = createProgram(gl, VERT_SRC, FRAG_SRC);
  gl.useProgram(program);

  const attribPosition = gl.getAttribLocation(program, "a_position");
  const uniformOffset = gl.getUniformLocation(program, "u_offset");
  const uniformAngle = gl.getUniformLocation(program, "u_angle");
  const uniformScale = gl.getUniformLocation(program, "u_scale");
  const uniformColor = gl.getUniformLocation(program, "u_color");
  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error("Failed to create buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(attribPosition);
  gl.vertexAttribPointer(attribPosition, 3, gl.FLOAT, false, 0, 0);

  return { glCtx, program, attribPosition, uniformOffset, uniformAngle, uniformScale, uniformColor, buffer };
}

export function renderScene(renderer: Renderer, state: GameState): void {
  const { glCtx, uniformOffset, uniformAngle, uniformScale, uniformColor, buffer } = renderer;
  const { gl, canvas } = glCtx;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (const entity of state.entities.values()) {
    let mesh = null;
    if (entity.kind === EntityKind.PlayerShip) {
      mesh = playerShipMesh;
    } else if (entity.kind === EntityKind.Asteroid) {
      mesh = asteroidMesh;
    } else if (entity.kind === EntityKind.Bullet) {
      mesh = bulletMesh;
    } else if (entity.kind === EntityKind.Debris) {
      mesh = debrisMesh;
    }

    if (!mesh) continue;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);

    const ndcX = (entity.transform.position.x / canvas.width) * 2 - 1;
    const ndcY = (entity.transform.position.y / canvas.height) * -2 + 1;
    gl.uniform2f(uniformOffset, ndcX, ndcY);
    if (uniformAngle) {
      const angle = angleZFromQuaternion(entity.transform.rotation);
      gl.uniform1f(uniformAngle, -angle);
    }
    if (uniformScale) {
      gl.uniform1f(uniformScale, entity.scale ?? 1);
    }
    gl.uniform4fv(uniformColor, mesh.color);

    const vertexCount = mesh.vertices.length / 3;
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexCount);
  }
}

