const clamp01 = value => Math.max(0, Math.min(1, value));

const solveLinearSystem = (A, b) => {
  const size = b.length;
  const matrix = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < size; i += 1) {
    let maxRow = i;
    for (let k = i + 1; k < size; k += 1) {
      if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) {
        maxRow = k;
      }
    }
    if (maxRow !== i) {
      const temp = matrix[i];
      matrix[i] = matrix[maxRow];
      matrix[maxRow] = temp;
    }

    const pivot = matrix[i][i];
    if (Math.abs(pivot) < 1e-12) {
      return null;
    }

    for (let j = i; j <= size; j += 1) {
      matrix[i][j] /= pivot;
    }

    for (let k = 0; k < size; k += 1) {
      if (k === i) continue;
      const factor = matrix[k][i];
      for (let j = i; j <= size; j += 1) {
        matrix[k][j] -= factor * matrix[i][j];
      }
    }
  }

  return matrix.map(row => row[size]);
};

export const homographyFromPoints = (src, dst) => {
  const A = [];
  const b = [];

  for (let i = 0; i < 4; i += 1) {
    const { x, y } = src[i];
    const { x: X, y: Y } = dst[i];

    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    b.push(X);

    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    b.push(Y);
  }

  const h = solveLinearSystem(A, b);
  if (!h) {
    return null;
  }

  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];
};

export const homographyToCssMatrix3d = h => {
  if (!h) {
    return null;
  }

  const [[h11, h12, h13], [h21, h22, h23], [h31, h32, h33]] = h;

  const m11 = h11 / h33;
  const m12 = h21 / h33;
  const m13 = 0;
  const m14 = h31 / h33;

  const m21 = h12 / h33;
  const m22 = h22 / h33;
  const m23 = 0;
  const m24 = h32 / h33;

  const m31 = 0;
  const m32 = 0;
  const m33 = 1;
  const m34 = 0;

  const m41 = h13 / h33;
  const m42 = h23 / h33;
  const m43 = 0;
  const m44 = 1;

  return [
    m11,
    m12,
    m13,
    m14,
    m21,
    m22,
    m23,
    m24,
    m31,
    m32,
    m33,
    m34,
    m41,
    m42,
    m43,
    m44,
  ];
};

export const toDisplayPoint = (point, size) => ({
  x: point.x * size.width,
  y: point.y * size.height,
});

export const toNormalizedPoint = (point, size) => ({
  x: clamp01(point.x / size.width),
  y: clamp01(point.y / size.height),
});

export const computeHomography = (overlaySize, corners, outputSize) => {
  const src = [
    { x: 0, y: 0 },
    { x: overlaySize.width, y: 0 },
    { x: overlaySize.width, y: overlaySize.height },
    { x: 0, y: overlaySize.height },
  ];

  const dst = [
    toDisplayPoint(corners.tl, outputSize),
    toDisplayPoint(corners.tr, outputSize),
    toDisplayPoint(corners.br, outputSize),
    toDisplayPoint(corners.bl, outputSize),
  ];

  return homographyFromPoints(src, dst);
};

const invertHomography = h => {
  const a = h[0][0];
  const b = h[0][1];
  const c = h[0][2];
  const d = h[1][0];
  const e = h[1][1];
  const f = h[1][2];
  const g = h[2][0];
  const h2 = h[2][1];
  const i = h[2][2];

  const A = e * i - f * h2;
  const B = f * g - d * i;
  const C = d * h2 - e * g;
  const D = c * h2 - b * i;
  const E = a * i - c * g;
  const F = b * g - a * h2;
  const G = b * f - c * e;
  const H = c * d - a * f;
  const I = a * e - b * d;

  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) {
    return null;
  }

  const invDet = 1 / det;
  return [
    [A * invDet, D * invDet, G * invDet],
    [B * invDet, E * invDet, H * invDet],
    [C * invDet, F * invDet, I * invDet],
  ];
};

const createShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info || 'Shader compile failed');
  }
  return shader;
};

const createProgram = (gl, vertexSource, fragmentSource) => {
  const program = gl.createProgram();
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(info || 'Program link failed');
  }
  return program;
};

const createTexture = (gl, image) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return texture;
};

const getWebGLContext = canvas => {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    throw new Error('WebGL not supported');
  }
  return gl;
};

export const renderMockupToCanvas = ({
  baseImage,
  overlayImage,
  corners,
  overlays,
  outputSize,
  overlaySize,
  overlayOpacity,
}) => {
  // Note: Canvas export will fail if any image is loaded without CORS headers.
  const canvas = document.createElement('canvas');
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  const gl = getWebGLContext(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = (a_position + 1.0) * 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentBaseSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_image;
    void main() {
      gl_FragColor = texture2D(u_image, vec2(v_uv.x, 1.0 - v_uv.y));
    }
  `;

  const fragmentOverlaySource = `
    precision mediump float;
    uniform sampler2D u_overlay;
    uniform mat3 u_hinv;
    uniform vec2 u_overlaySize;
    uniform vec2 u_canvasSize;
    uniform float u_opacity;
    void main() {
      vec2 fragPos = gl_FragCoord.xy;
      float x = fragPos.x;
      float y = u_canvasSize.y - fragPos.y;
      vec3 mapped = u_hinv * vec3(x, y, 1.0);
      if (mapped.z == 0.0) {
        discard;
      }
      vec2 src = mapped.xy / mapped.z;
      vec2 uv = src / u_overlaySize;
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        discard;
      }
      vec4 color = texture2D(u_overlay, uv);
      color.a *= u_opacity;
      gl_FragColor = color;
    }
  `;

  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );

  // Draw base image
  const baseProgram = createProgram(gl, vertexSource, fragmentBaseSource);
  gl.useProgram(baseProgram);
  const basePosition = gl.getAttribLocation(baseProgram, 'a_position');
  gl.enableVertexAttribArray(basePosition);
  gl.vertexAttribPointer(basePosition, 2, gl.FLOAT, false, 0, 0);
  const baseTexture = createTexture(gl, baseImage);
  const baseSampler = gl.getUniformLocation(baseProgram, 'u_image');
  gl.uniform1i(baseSampler, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, baseTexture);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  const overlayList =
    overlays && overlays.length
      ? overlays
      : overlayImage && corners
        ? [
            {
              image: overlayImage,
              corners,
              size: overlaySize,
              hidden: false,
            },
          ]
        : [];

  if (overlayList.length) {
    const overlayProgram = createProgram(gl, vertexSource, fragmentOverlaySource);
    gl.useProgram(overlayProgram);
    const overlayPosition = gl.getAttribLocation(overlayProgram, 'a_position');
    gl.enableVertexAttribArray(overlayPosition);
    gl.vertexAttribPointer(overlayPosition, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const overlaySampler = gl.getUniformLocation(overlayProgram, 'u_overlay');
    gl.uniform1i(overlaySampler, 0);
    gl.activeTexture(gl.TEXTURE0);

    const overlaySizeLocation = gl.getUniformLocation(overlayProgram, 'u_overlaySize');
    const canvasSizeLocation = gl.getUniformLocation(overlayProgram, 'u_canvasSize');
    gl.uniform2f(canvasSizeLocation, canvas.width, canvas.height);
    const opacityLocation = gl.getUniformLocation(overlayProgram, 'u_opacity');
    const safeOpacity =
      typeof overlayOpacity === 'number' ? Math.max(0, Math.min(1, overlayOpacity)) : 1;
    gl.uniform1f(opacityLocation, safeOpacity);

    overlayList.forEach(overlay => {
      if (!overlay || overlay.hidden) return;
      const image = overlay.image;
      if (!image) return;

      const overlayWidth =
        overlay.size?.width || image.naturalWidth || image.width || 0;
      const overlayHeight =
        overlay.size?.height || image.naturalHeight || image.height || 0;
      if (!overlayWidth || !overlayHeight) {
        return;
      }

      const h = computeHomography(
        { width: overlayWidth, height: overlayHeight },
        overlay.corners,
        outputSize
      );
      const hinv = invertHomography(h);
      if (!hinv) {
        return;
      }

      const overlayTexture = createTexture(gl, image);
      gl.bindTexture(gl.TEXTURE_2D, overlayTexture);

      const hinvLocation = gl.getUniformLocation(overlayProgram, 'u_hinv');
      gl.uniformMatrix3fv(
        hinvLocation,
        false,
        new Float32Array([
          // Column-major order for GLSL mat3
          hinv[0][0],
          hinv[1][0],
          hinv[2][0],
          hinv[0][1],
          hinv[1][1],
          hinv[2][1],
          hinv[0][2],
          hinv[1][2],
          hinv[2][2],
        ])
      );
      gl.uniform2f(overlaySizeLocation, overlayWidth, overlayHeight);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
  }

  return canvas;
};
