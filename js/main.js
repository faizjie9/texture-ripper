// Main application logic

class TextureRipper {
    constructor() {
        this.sourceCanvas = document.getElementById('sourceCanvas');
        this.previewCanvas = document.getElementById('previewCanvas');
        
        // Set initial canvas size
        this.sourceCanvas.width = 800;
        this.sourceCanvas.height = 600;
        this.previewCanvas.width = 400;
        this.previewCanvas.height = 300;
        
        this.sourceCtx = this.sourceCanvas.getContext('2d', { willReadFrequently: true });
        this.previewCtx = this.previewCanvas.getContext('2d', { willReadFrequently: true });
        
        this.textureAreas = [];
        this.selectedArea = null;
        this.currentPoints = [];
        this.isDrawing = false;
        this.loadedImage = null;  // Store the loaded image
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // File upload handling
        const uploadBtn = document.getElementById('uploadBtn');
        const imageInput = document.getElementById('imageInput');
        
        uploadBtn.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', this.handleImageUpload.bind(this));

        // Canvas interaction
        this.sourceCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.sourceCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.sourceCanvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                console.log('Image loaded:', img.width, 'x', img.height);
                
                // Store the loaded image
                this.loadedImage = img;
                
                // Adjust canvas size to match image
                this.sourceCanvas.width = img.width;
                this.sourceCanvas.height = img.height;
                
                // Clear and draw
                this.sourceCtx.clearRect(0, 0, img.width, img.height);
                this.sourceCtx.drawImage(img, 0, 0);
                
                console.log('Image drawn to canvas');
                
                // Reset state
                this.textureAreas = [];
                this.selectedArea = null;
                this.currentPoints = [];
                this.isDrawing = false;
                
                // Enable buttons
                document.getElementById('copyBtn').disabled = false;
                document.getElementById('duplicateBtn').disabled = false;
                document.getElementById('deleteBtn').disabled = false;

                // Add a small delay to check if image remains
                setTimeout(() => {
                    if (this.sourceCtx.getImageData(0, 0, 1, 1).data[3] === 0) {
                        console.log('Image disappeared, redrawing...');
                        this.redrawImage();
                    }
                }, 100);
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }

    redrawImage() {
        if (this.loadedImage) {
            console.log('Redrawing image');
            this.sourceCtx.clearRect(0, 0, this.sourceCanvas.width, this.sourceCanvas.height);
            this.sourceCtx.drawImage(this.loadedImage, 0, 0);
        }
    }

    handleMouseDown(event) {
        const coords = utils.getCanvasCoordinates(this.sourceCanvas, event);
        
        if (this.currentPoints.length < 4) {
            // Adding points for new texture area
            this.currentPoints.push([coords.x, coords.y]);
            this.isDrawing = true;
            
            // If we've collected 4 points, create a new texture area
            if (this.currentPoints.length === 4) {
                const area = new TextureArea(this.currentPoints);
                this.textureAreas.push(area);
                this.selectedArea = area;
                
                // Clear current points
                this.currentPoints = [];
                
                // Update preview
                this.updatePreview();
            }
        } else {
            // Check for interaction with existing areas
            for (const area of this.textureAreas) {
                const nearest = area.getNearestPoint(coords.x, coords.y);
                if (nearest.distance < 10) {
                    this.selectedArea = area;
                    area.activePoint = nearest.index;
                    area.dragging = true;
                    this.updatePreview();
                    return;
                }
            }
        }
        this.redraw();
    }

    handleMouseMove(event) {
        const coords = utils.getCanvasCoordinates(this.sourceCanvas, event);

        if (this.selectedArea && this.selectedArea.dragging) {
            if (event.shiftKey) {
                this.selectedArea.localTransform = true;
            }
            if (this.selectedArea.activePoint !== null) {
                this.selectedArea.movePoint(this.selectedArea.activePoint, coords.x, coords.y);
                this.updatePreview();
            }
        }

        this.redraw();
    }

    handleMouseUp() {
        if (this.selectedArea) {
            this.selectedArea.dragging = false;
            this.selectedArea.activePoint = null;
            this.selectedArea.localTransform = false;
            this.updatePreview();
        }
    }

    updatePreview() {
        // Clear preview canvas
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        if (this.selectedArea) {
            // Extract and draw the texture
            const extractedTexture = this.selectedArea.extractTexture(this.sourceCanvas);
            
            // Resize preview canvas to match extracted texture
            this.previewCanvas.width = extractedTexture.width;
            this.previewCanvas.height = extractedTexture.height;
            
            // Draw the extracted texture
            this.previewCtx.drawImage(extractedTexture, 0, 0);
            
            console.log('Preview updated:', 
                'Texture size:', extractedTexture.width, 'x', extractedTexture.height,
                'Preview size:', this.previewCanvas.width, 'x', this.previewCanvas.height);
        }
    }

    handleKeyPress(event) {
        if (!this.selectedArea) return;

        switch (event.key) {
            case 'c':
                this.copySelectedTexture();
                break;
            case 'd':
                this.duplicateSelectedTexture();
                break;
            case 'Delete':
                this.deleteSelectedTexture();
                break;
            case 'ArrowLeft':
                this.rotateSelectedTexture(false);
                break;
            case 'ArrowRight':
                this.rotateSelectedTexture(true);
                break;
        }
    }

    async copySelectedTexture() {
        if (!this.selectedArea) return;
        const textureCanvas = this.selectedArea.extractTexture(this.sourceCanvas);
        await utils.copyToClipboard(textureCanvas);
    }

    duplicateSelectedTexture() {
        if (!this.selectedArea) return;
        const newArea = this.selectedArea.clone();
        // Offset the duplicated area slightly
        newArea.moveArea(20, 20);
        this.textureAreas.push(newArea);
        this.selectedArea = newArea;
        this.redraw();
    }

    deleteSelectedTexture() {
        if (!this.selectedArea) return;
        const index = this.textureAreas.indexOf(this.selectedArea);
        if (index > -1) {
            this.textureAreas.splice(index, 1);
            this.selectedArea = null;
            this.redraw();
        }
    }

    rotateSelectedTexture(clockwise) {
        if (!this.selectedArea) return;
        const textureCanvas = this.selectedArea.extractTexture(this.sourceCanvas);
        const rotatedCanvas = transform.rotateCanvas(textureCanvas, clockwise);
        // Update preview
        this.previewCanvas.width = rotatedCanvas.width;
        this.previewCanvas.height = rotatedCanvas.height;
        this.previewCtx.drawImage(rotatedCanvas, 0, 0);
    }

    redraw() {
        // Preserve the background image
        if (this.loadedImage) {
            this.sourceCtx.clearRect(0, 0, this.sourceCanvas.width, this.sourceCanvas.height);
            this.sourceCtx.drawImage(this.loadedImage, 0, 0);
        }

        // Draw texture areas
        for (const area of this.textureAreas) {
            area.draw(this.sourceCtx);
        }

        // Draw current points
        for (const [x, y] of this.currentPoints) {
            utils.drawPoint(this.sourceCtx, x, y);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TextureRipper();
});
