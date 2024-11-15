// Transform functions for perspective correction and texture extraction

const transform = {
    // Calculate homography matrix from source points to target points
    calculateHomography: (srcPoints, dstPoints) => {
        function normalize(points) {
            // Calculate centroid
            let cx = 0, cy = 0;
            points.forEach(p => { cx += p[0]; cy += p[1]; });
            cx /= points.length;
            cy /= points.length;
            
            // Calculate average distance from centroid
            let dist = 0;
            points.forEach(p => {
                dist += Math.sqrt((p[0] - cx) ** 2 + (p[1] - cy) ** 2);
            });
            dist /= points.length;
            
            const scale = Math.sqrt(2) / dist;
            
            // Normalize points
            return points.map(p => [
                (p[0] - cx) * scale,
                (p[1] - cy) * scale
            ]);
        }

        // Normalize points
        const srcNorm = normalize(srcPoints);
        const dstNorm = normalize(dstPoints);

        // Create matrix A
        const A = [];
        for (let i = 0; i < 4; i++) {
            const [x, y] = srcNorm[i];
            const [u, v] = dstNorm[i];
            A.push([
                -x, -y, -1, 0, 0, 0, x * u, y * u, u,
                0, 0, 0, -x, -y, -1, x * v, y * v, v
            ]);
        }

        // Solve Ah = 0 using SVD
        // For simplicity, we'll use a basic approximation
        const h = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        return h;
    },

    // Apply homography transform to a point
    transformPoint: (x, y, matrix) => {
        const w = matrix[6] * x + matrix[7] * y + matrix[8];
        const tx = (matrix[0] * x + matrix[1] * y + matrix[2]) / w;
        const ty = (matrix[3] * x + matrix[4] * y + matrix[5]) / w;
        return [tx, ty];
    },

    // Extract texture from source image using perspective transform
    extractTexture: (sourceCanvas, points, width, height) => {
        console.log('Extracting texture with dimensions:', width, 'x', height);

        // Create target canvas
        const targetCanvas = utils.createCanvas(Math.round(width), Math.round(height));
        const ctx = targetCanvas.getContext('2d');

        // Define the target rectangle (normalized coordinates)
        const targetPoints = [
            [0, 0],               // top-left
            [width, 0],           // top-right
            [width, height],      // bottom-right
            [0, height]           // bottom-left
        ];

        // Calculate the perspective transform coefficients
        const coefficients = transform.getPerspectiveTransform(points, targetPoints);

        // Get source image data
        const sourceCtx = sourceCanvas.getContext('2d');
        const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;

        // Create target image data
        const targetImageData = ctx.createImageData(width, height);
        const targetData = targetImageData.data;

        // For each pixel in the target image
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Get the source pixel coordinates using inverse mapping
                const srcPoint = transform.applyPerspectiveTransform(x, y, coefficients, true);
                const srcX = Math.round(srcPoint.x);
                const srcY = Math.round(srcPoint.y);

                // Check if the source point is within bounds
                if (srcX >= 0 && srcX < sourceCanvas.width && 
                    srcY >= 0 && srcY < sourceCanvas.height) {
                    // Copy the pixel data
                    const targetIndex = (y * width + x) * 4;
                    const sourceIndex = (srcY * sourceCanvas.width + srcX) * 4;

                    targetData[targetIndex] = sourceData[sourceIndex];
                    targetData[targetIndex + 1] = sourceData[sourceIndex + 1];
                    targetData[targetIndex + 2] = sourceData[sourceIndex + 2];
                    targetData[targetIndex + 3] = sourceData[sourceIndex + 3];
                }
            }
        }

        // Put the image data back
        ctx.putImageData(targetImageData, 0, 0);
        return targetCanvas;
    },

    // Calculate perspective transform coefficients
    getPerspectiveTransform: (sourcePoints, targetPoints) => {
        // Create the equation matrix
        const matrix = [];
        for (let i = 0; i < 4; i++) {
            const [x, y] = sourcePoints[i];
            const [u, v] = targetPoints[i];

            matrix.push([
                x, y, 1, 0, 0, 0, -u * x, -u * y,
                0, 0, 0, x, y, 1, -v * x, -v * y
            ]);
        }

        // Solve the system of equations
        const [a, b, c, d, e, f, g, h] = transform.solveEquations(matrix);
        return { a, b, c, d, e, f, g, h, i: 1 };
    },

    // Apply perspective transform to a point
    applyPerspectiveTransform: (x, y, c, inverse = false) => {
        if (inverse) {
            // Inverse transform (target to source)
            const denominator = c.g * x + c.h * y + c.i;
            return {
                x: (c.a * x + c.b * y + c.c) / denominator,
                y: (c.d * x + c.e * y + c.f) / denominator
            };
        } else {
            // Forward transform (source to target)
            const denominator = c.g * x + c.h * y + c.i;
            return {
                x: (c.a * x + c.b * y + c.c) / denominator,
                y: (c.d * x + c.e * y + c.f) / denominator
            };
        }
    },

    // Solve system of linear equations using Gaussian elimination
    solveEquations: (matrix) => {
        const n = 8; // 8 unknowns
        const augmented = matrix.map(row => {
            const result = new Array(n + 1).fill(0);
            for (let i = 0; i < n; i++) {
                result[i] = row[i];
            }
            if (row.length > n) {
                result[n] = row[n];
            }
            return result;
        });

        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            let maxVal = Math.abs(augmented[i][i]);
            for (let j = i + 1; j < n; j++) {
                const absVal = Math.abs(augmented[j][i]);
                if (absVal > maxVal) {
                    maxVal = absVal;
                    maxRow = j;
                }
            }

            // Swap maximum row with current row
            if (maxRow !== i) {
                [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            }

            // Make all rows below this one 0 in current column
            for (let j = i + 1; j < n; j++) {
                const factor = augmented[j][i] / augmented[i][i];
                for (let k = i; k <= n; k++) {
                    augmented[j][k] -= factor * augmented[i][k];
                }
            }
        }

        // Back substitution
        const solution = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += augmented[i][j] * solution[j];
            }
            solution[i] = (augmented[i][n] - sum) / augmented[i][i];
        }

        return solution;
    },

    // Check if a point is inside a quadrilateral
    pointInQuad: (x, y, quad) => {
        function sign(p1, p2, p3) {
            return (p1[0] - p3[0]) * (p2[1] - p3[1]) - 
                   (p2[0] - p3[0]) * (p1[1] - p3[1]);
        }

        const point = [x, y];
        const d1 = sign(point, quad[0], quad[1]);
        const d2 = sign(point, quad[1], quad[2]);
        const d3 = sign(point, quad[2], quad[3]);
        const d4 = sign(point, quad[3], quad[0]);

        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0) || (d4 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0) || (d4 > 0);

        return !(hasNeg && hasPos);
    },

    // Rotate canvas 90 degrees
    rotateCanvas: (canvas, clockwise = true) => {
        const width = canvas.width;
        const height = canvas.height;
        const tempCanvas = utils.createCanvas(height, width);
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.save();
        tempCtx.translate(height / 2, width / 2);
        tempCtx.rotate(clockwise ? Math.PI / 2 : -Math.PI / 2);
        tempCtx.drawImage(canvas, -width / 2, -height / 2);
        tempCtx.restore();

        return tempCanvas;
    }
};

// Export transform object
window.transform = transform;
