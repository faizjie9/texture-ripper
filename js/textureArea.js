// TextureArea class for handling texture selection and manipulation

class TextureArea {
    constructor(points) {
        this.points = points;
        this.selected = false;
        this.hovering = false;
        this.dragging = false;
        this.activePoint = null;
        this.localTransform = false;
    }

    // Check if a point is inside the texture area
    containsPoint(x, y) {
        let inside = false;
        for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
            const xi = this.points[i][0], yi = this.points[i][1];
            const xj = this.points[j][0], yj = this.points[j][1];
            
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // Get the nearest point index and distance
    getNearestPoint(x, y) {
        let minDist = Infinity;
        let index = -1;
        
        this.points.forEach((point, i) => {
            const dist = utils.distance(x, y, point[0], point[1]);
            if (dist < minDist) {
                minDist = dist;
                index = i;
            }
        });

        return { index, distance: minDist };
    }

    // Move a point
    movePoint(index, x, y) {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = [x, y];
        }
    }

    // Move the entire area
    moveArea(dx, dy) {
        this.points = this.points.map(([x, y]) => [x + dx, y + dy]);
    }

    // Draw the texture area
    draw(ctx) {
        // Draw lines between points
        ctx.beginPath();
        ctx.moveTo(this.points[0][0], this.points[0][1]);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i][0], this.points[i][1]);
        }
        ctx.closePath();
        
        // Style based on state
        ctx.strokeStyle = this.selected ? '#00ff00' : (this.hovering ? '#ffff00' : '#ffffff');
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw points
        this.points.forEach((point, i) => {
            const color = this.activePoint === i ? '#ff0000' : '#00ff00';
            utils.drawPoint(ctx, point[0], point[1], color);
        });

        // Draw grid if hovering
        if (this.hovering) {
            utils.drawPerspectiveGrid(ctx, this.points);
        }
    }

    // Extract texture from source canvas
    extractTexture(sourceCanvas) {
        // Calculate dimensions based on the longest edges
        const width = Math.max(
            utils.distance(this.points[0][0], this.points[0][1], this.points[1][0], this.points[1][1]),
            utils.distance(this.points[2][0], this.points[2][1], this.points[3][0], this.points[3][1])
        );
        const height = Math.max(
            utils.distance(this.points[1][0], this.points[1][1], this.points[2][0], this.points[2][1]),
            utils.distance(this.points[3][0], this.points[3][1], this.points[0][0], this.points[0][1])
        );

        return transform.extractTexture(sourceCanvas, this.points, width, height);
    }

    // Draw preview of the extracted texture
    drawPreview(ctx) {
        const canvas = this.extractTexture(document.getElementById('sourceCanvas'));
        ctx.canvas.width = canvas.width;
        ctx.canvas.height = canvas.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvas, 0, 0);
    }

    // Create a clone of this texture area
    clone() {
        return new TextureArea(this.points.map(point => [...point]));
    }
}

// Export TextureArea class
window.TextureArea = TextureArea;
