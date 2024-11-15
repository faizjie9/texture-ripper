import { Point } from '../types';
import { TransformOptions } from '../components/Canvas';

export const extractTexture = (
  image: HTMLImageElement, 
  points: Point[], 
  targetWidth: number = 512, 
  targetHeight: number = 512
): string => {
  if (points.length !== 4) {
    throw new Error('Exactly 4 points are required for perspective transform');
  }

  // Create source canvas with original image
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = image.width;
  sourceCanvas.height = image.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) throw new Error('Failed to get source canvas context');
  sourceCtx.drawImage(image, 0, 0);

  // Create destination canvas
  const destCanvas = document.createElement('canvas');
  destCanvas.width = targetWidth;
  destCanvas.height = targetHeight;
  const destCtx = destCanvas.getContext('2d');
  if (!destCtx) throw new Error('Failed to get destination canvas context');

  try {
    // Calculate transformation matrix
    const matrix = getPerspectiveTransform(points, [
      { x: 0, y: 0 },                    // top-left
      { x: targetWidth, y: 0 },          // top-right
      { x: targetWidth, y: targetHeight },// bottom-right
      { x: 0, y: targetHeight }          // bottom-left
    ]);
    
    if (!matrix) throw new Error('Failed to calculate perspective transform');

    // Apply transformation
    destCtx.save();
    destCtx.setTransform(
      matrix[0], matrix[1],
      matrix[3], matrix[4],
      matrix[6], matrix[7]
    );
    destCtx.drawImage(sourceCanvas, 0, 0);
    destCtx.restore();

    return destCanvas.toDataURL();
  } catch (error) {
    console.error('Transform error:', error);
    throw new Error('Failed to transform image');
  }
};

export const applyTransformToCanvas = (
  canvas: HTMLCanvasElement,
  transform: TransformOptions
): HTMLCanvasElement => {
  const { rotation, flipX, flipY } = transform;
  
  // Create a new canvas for the transformed image
  const transformedCanvas = document.createElement('canvas');
  transformedCanvas.width = canvas.width;
  transformedCanvas.height = canvas.height;
  const ctx = transformedCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  try {
    // Translate to center for rotation and flips
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

    return transformedCanvas;
  } catch (error) {
    console.error('Transform error:', error);
    throw new Error('Failed to apply transforms');
  }
};

function getPerspectiveTransform(src: Point[], dst: Point[]) {
  try {
    const matrix = new Array(9).fill(0);
    
    // Create matrices for solving the equation
    const A: number[][] = [];
    const B: number[] = [];
    
    for (let i = 0; i < 4; i++) {
      const srcX = src[i].x;
      const srcY = src[i].y;
      const dstX = dst[i].x;
      const dstY = dst[i].y;
      
      A.push([
        srcX, srcY, 1, 0, 0, 0, -dstX * srcX, -dstX * srcY
      ]);
      A.push([
        0, 0, 0, srcX, srcY, 1, -dstY * srcX, -dstY * srcY
      ]);
      
      B.push(dstX);
      B.push(dstY);
    }
    
    // Solve the equation using Gaussian elimination
    const h = solve(A, B);
    if (!h) return null;
    
    // Form the transformation matrix
    for (let i = 0; i < 8; i++) {
      matrix[i] = h[i];
    }
    matrix[8] = 1;
    
    return matrix;
  } catch (error) {
    console.error('Matrix calculation error:', error);
    return null;
  }
}

function solve(A: number[][], b: number[]) {
  try {
    const n = A.length;
    const m = A[0].length;
    
    // Augment the matrix A with vector b
    const Ab = A.map((row, i) => [...row, b[i]]);
    
    // Gaussian elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxEl = Math.abs(Ab[i][i]);
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(Ab[j][i]) > maxEl) {
          maxEl = Math.abs(Ab[j][i]);
          maxRow = j;
        }
      }
      
      // Check for singular matrix
      if (maxEl === 0) {
        console.error('Matrix is singular');
        return null;
      }
      
      // Swap maximum row with current row
      if (maxRow !== i) {
        [Ab[i], Ab[maxRow]] = [Ab[maxRow], Ab[i]];
      }
      
      // Make all rows below this one 0 in current column
      for (let j = i + 1; j < n; j++) {
        const c = -Ab[j][i] / Ab[i][i];
        for (let k = i; k < m + 1; k++) {
          if (i === k) {
            Ab[j][k] = 0;
          } else {
            Ab[j][k] += c * Ab[i][k];
          }
        }
      }
    }
    
    // Back substitution
    const x = new Array(m).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      if (Ab[i][i] === 0) {
        console.error('Matrix is singular');
        return null;
      }
      x[i] = Ab[i][m] / Ab[i][i];
      for (let j = i - 1; j >= 0; j--) {
        Ab[j][m] -= Ab[j][i] * x[i];
      }
    }
    
    return x;
  } catch (error) {
    console.error('Matrix solve error:', error);
    return null;
  }
}
