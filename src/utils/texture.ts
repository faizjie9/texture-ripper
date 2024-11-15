import { Point } from '../types';

function getProjectiveTransform(srcPoints: Point[], dstPoints: Point[]): number[] {
  // Compute coefficients for perspective transformation
  const matrix = [];
  for (let i = 0; i < 4; i++) {
    const x = srcPoints[i].x;
    const y = srcPoints[i].y;
    const X = dstPoints[i].x;
    const Y = dstPoints[i].y;
    matrix.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
    matrix.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
  }
  const v = [];
  for (let i = 0; i < 4; i++) {
    v.push(dstPoints[i].x);
    v.push(dstPoints[i].y);
  }

  // Solve system of linear equations
  const h = solveEquation(matrix, v);
  return h;
}

function solveEquation(A: number[][], b: number[]): number[] {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    // Swap maximum row with current row
    for (let k = i; k < n + 1; k++) {
      const tmp = A[maxRow][k];
      A[maxRow][k] = A[i][k];
      A[i][k] = tmp;
    }
    const tmp = b[maxRow];
    b[maxRow] = b[i];
    b[i] = tmp;

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k][j] = 0;
        } else {
          A[k][j] += c * A[i][j];
        }
      }
      b[k] += c * b[i];
    }
  }

  // Solve equation Ax=b using back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = b[i] / A[i][i];
    for (let k = i - 1; k >= 0; k--) {
      b[k] -= A[k][i] * x[i];
    }
  }
  return x;
}

export function createPerspectivePreview(
  image: HTMLImageElement,
  points: Point[],
  previewWidth: number,
  previewHeight: number
): string {
  if (points.length !== 4) {
    throw new Error('Exactly 4 points are required for perspective preview');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate dimensions based on selected points
  const width = Math.max(
    Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
    Math.hypot(points[2].x - points[3].x, points[2].y - points[3].y)
  );
  const height = Math.max(
    Math.hypot(points[3].x - points[0].x, points[3].y - points[0].y),
    Math.hypot(points[2].x - points[1].x, points[2].y - points[1].y)
  );

  // Set canvas size maintaining aspect ratio
  const aspectRatio = width / height;
  if (aspectRatio > previewWidth / previewHeight) {
    canvas.width = previewWidth;
    canvas.height = previewWidth / aspectRatio;
  } else {
    canvas.height = previewHeight;
    canvas.width = previewHeight * aspectRatio;
  }

  // Center the preview in the available space
  const offsetX = (previewWidth - canvas.width) / 2;
  const offsetY = (previewHeight - canvas.height) / 2;

  // Define destination points for the unwrapped texture
  const dstPoints = [
    { x: 0, y: 0 },
    { x: canvas.width, y: 0 },
    { x: canvas.width, y: canvas.height },
    { x: 0, y: canvas.height }
  ];

  try {
    // Get transformation matrix
    const transform = getProjectiveTransform(points, dstPoints);

    // Apply perspective transform
    ctx.save();
    ctx.setTransform(
      transform[0], transform[3], transform[1],
      transform[4], transform[2], transform[5]
    );

    // Draw the image
    ctx.drawImage(image, 0, 0, image.width, image.height);
    ctx.restore();

    // Create a temporary canvas for the final centered output
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = previewWidth;
    finalCanvas.height = previewHeight;
    const finalCtx = finalCanvas.getContext('2d');
    
    if (!finalCtx) {
      throw new Error('Failed to get final canvas context');
    }

    // Draw the transformed texture centered in the preview
    finalCtx.drawImage(canvas, offsetX, offsetY);

    return finalCanvas.toDataURL();
  } catch (error) {
    console.error('Failed to create preview:', error);
    throw new Error('Failed to generate preview image');
  }
}

export function extractTexture(
  image: HTMLImageElement,
  points: Point[],
  width: number = 512,
  height: number = 512
): string {
  if (points.length !== 4) {
    throw new Error('Exactly 4 points are required');
  }

  // Create canvas for texture extraction
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate output dimensions based on the points
  const naturalWidth = Math.max(
    Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
    Math.hypot(points[2].x - points[3].x, points[2].y - points[3].y)
  );
  const naturalHeight = Math.max(
    Math.hypot(points[3].x - points[0].x, points[3].y - points[0].y),
    Math.hypot(points[2].x - points[1].x, points[2].y - points[1].y)
  );

  // Set reasonable output dimensions
  const maxSize = 2048;
  const scale = Math.min(1, maxSize / Math.max(naturalWidth, naturalHeight));
  canvas.width = Math.round(naturalWidth * scale);
  canvas.height = Math.round(naturalHeight * scale);

  // Define destination points (rectangle)
  const dstPoints = [
    { x: 0, y: 0 },
    { x: canvas.width, y: 0 },
    { x: canvas.width, y: canvas.height },
    { x: 0, y: canvas.height }
  ];

  try {
    // Get transformation matrix
    const transform = getProjectiveTransform(points, dstPoints);

    // Apply perspective transform
    ctx.save();
    ctx.setTransform(
      transform[0], transform[3], transform[1],
      transform[4], transform[2], transform[5]
    );

    // Draw the image
    ctx.drawImage(image, 0, 0, image.width, image.height);
    ctx.restore();

    return canvas.toDataURL();
  } catch (error) {
    console.error('Failed to extract texture:', error);
    throw new Error('Failed to generate texture image');
  }
}

export function applyTransformToCanvas(
  canvas: HTMLCanvasElement,
  transform: { rotation: number; flipX: boolean; flipY: boolean }
): HTMLCanvasElement {
  const { rotation, flipX, flipY } = transform;
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Translate to center for rotation
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // Apply rotation
  ctx.rotate((rotation * Math.PI) / 180);

  // Apply flips
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

  // Draw the image
  ctx.drawImage(
    canvas,
    -canvas.width / 2,
    -canvas.height / 2,
    canvas.width,
    canvas.height
  );

  return tempCanvas;
}
