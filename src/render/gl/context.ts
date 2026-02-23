export interface GLContext {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
}

export function createGLContext(canvas: HTMLCanvasElement): GLContext | null {
  const gl =
    canvas.getContext("webgl") ||
    (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

  if (!gl) {
    console.warn("WebGL not supported");
    return null;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(1, 1, 1, 1);

  return { canvas, gl };
}

