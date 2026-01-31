// Camera system for zoom/pan and coordinate transforms

import { MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED } from './constants.js';
import { clamp } from './utils.js';

export class Camera {
    constructor(canvas) {
        this.canvas = canvas;

        // Camera position in world coordinates (center of view)
        this.x = 0;
        this.y = 0;

        // Zoom level (1 = default)
        this.zoom = 1;

        // Pan state
        this.isPanning = false;
        this.hasDragged = false; // Track if mouse has moved during pan
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Bind event handlers
        this.setupEventListeners();
    }

    /**
     * Set up mouse event listeners for zoom and pan
     */
    setupEventListeners() {
        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e);
        }, { passive: false });

        // Mouse drag for pan
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left button
                this.isPanning = true;
                this.hasDragged = false;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        window.addEventListener('mouseup', () => {
            this.isPanning = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                // Track if we've moved more than a few pixels (to distinguish click from drag)
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    this.hasDragged = true;
                }
                this.handlePan(e);
            }
        });
    }

    /**
     * Handle zoom from mouse wheel
     */
    handleZoom(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Get world position under mouse before zoom
        const worldBefore = this.screenToWorld(mouseX, mouseY);

        // Apply zoom
        const delta = -e.deltaY * ZOOM_SPEED;
        const newZoom = clamp(this.zoom * (1 + delta), MIN_ZOOM, MAX_ZOOM);
        this.zoom = newZoom;

        // Get world position under mouse after zoom
        const worldAfter = this.screenToWorld(mouseX, mouseY);

        // Adjust camera to keep mouse position fixed
        this.x += worldBefore.x - worldAfter.x;
        this.y += worldBefore.y - worldAfter.y;
    }

    /**
     * Handle pan from mouse drag
     */
    handlePan(e) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;

        // Move camera in opposite direction of drag
        this.x -= dx / this.zoom;
        this.y -= dy / this.zoom;

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        const screenX = (worldX - this.x) * this.zoom + this.canvas.width / 2;
        const screenY = (worldY - this.y) * this.zoom + this.canvas.height / 2;
        return { x: screenX, y: screenY };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        const worldX = (screenX - this.canvas.width / 2) / this.zoom + this.x;
        const worldY = (screenY - this.canvas.height / 2) / this.zoom + this.y;
        return { x: worldX, y: worldY };
    }

    /**
     * Check if a point is visible on screen
     */
    isVisible(screenX, screenY, margin = 0) {
        return screenX >= -margin &&
               screenX <= this.canvas.width + margin &&
               screenY >= -margin &&
               screenY <= this.canvas.height + margin;
    }

    /**
     * Get the visible world bounds
     */
    getVisibleBounds() {
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height);

        return {
            minX: topLeft.x,
            minY: topLeft.y,
            maxX: bottomRight.x,
            maxY: bottomRight.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    }

    /**
     * Center camera on a world position
     */
    centerOn(worldX, worldY) {
        this.x = worldX;
        this.y = worldY;
    }

    /**
     * Reset camera to default view
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
    }

    /**
     * Set zoom level directly
     */
    setZoom(zoom) {
        this.zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    }

    /**
     * Get current zoom level
     */
    getZoom() {
        return this.zoom;
    }
}
