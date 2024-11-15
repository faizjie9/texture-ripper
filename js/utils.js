// Utility functions for the Texture Ripper application

const utils = {
    // Calculate distance between two points
    distance: (x1, y1, x2, y2) => {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    // Check if a point is near another point
    isNearPoint: (x1, y1, x2, y2, threshold = 5) => {
        return utils.distance(x1, y1, x2, y2) < threshold;
    },

    // Get canvas relative coordinates
    getCanvasCoordinates: (canvas, event) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    },

    // Create a new canvas with the same dimensions as input
    createCanvas: (width, height) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    },

    // Draw a point on the canvas
    drawPoint: (ctx, x, y, color = '#00ff00', size = 5) => {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    },

    // Draw a line between two points
    drawLine: (ctx, x1, y1, x2, y2, color = '#ffffff', width = 2) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    },

    // Draw a grid in perspective
    drawPerspectiveGrid: (ctx, points, rows = 10, cols = 10) => {
        // Implementation will be added in transform.js
    },

    // Convert canvas to data URL
    canvasToDataURL: (canvas) => {
        return canvas.toDataURL('image/png');
    },

    // Create an image from a data URL
    createImageFromDataURL: (dataURL) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataURL;
        });
    },

    // Copy image data to clipboard
    copyToClipboard: async (canvas) => {
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            const data = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([data]);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }
};

// Export utils object
window.utils = utils;
