// Mini-map rendering and navigation

import { MINIMAP_SIZE, COLORS, AU_TO_PIXELS, BELT_OUTER_RADIUS } from './constants.js';

export class Minimap {
    constructor(canvas, mainCamera) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mainCamera = mainCamera;

        // Mini-map shows the entire asteroid belt
        this.worldRadius = BELT_OUTER_RADIUS * AU_TO_PIXELS * 1.2;
        this.scale = MINIMAP_SIZE / (this.worldRadius * 2);

        this.centerX = MINIMAP_SIZE / 2;
        this.centerY = MINIMAP_SIZE / 2;

        // Interaction state
        this.isDragging = false;

        this.setupEventListeners();
    }

    /**
     * Set up click/drag event listeners
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.isDragging = true;
            this.handleClick(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                e.stopPropagation();
                this.handleClick(e);
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    /**
     * Handle click on minimap - navigate main camera
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert minimap coords to world coords
        const worldX = (x - this.centerX) / this.scale;
        const worldY = (y - this.centerY) / this.scale;

        this.mainCamera.centerOn(worldX, worldY);
    }

    /**
     * Convert world coordinates to minimap coordinates
     */
    worldToMinimap(worldX, worldY) {
        return {
            x: this.centerX + worldX * this.scale,
            y: this.centerY + worldY * this.scale
        };
    }

    /**
     * Render the minimap
     * @param asteroids - Array of asteroids
     * @param sun - Sun object
     * @param selectedAsteroid - Currently selected asteroid
     */
    render(asteroids, sun, selectedAsteroid) {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = COLORS.minimapBackground;
        ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // Border
        ctx.strokeStyle = COLORS.minimapBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // Sun
        sun.renderMinimap(ctx, this.scale, this.centerX, this.centerY);

        // Asteroids
        for (const asteroid of asteroids) {
            asteroid.renderMinimap(
                ctx,
                this.scale,
                this.centerX,
                this.centerY,
                asteroid === selectedAsteroid
            );
        }

        // Viewport rectangle
        this.renderViewport();
    }

    /**
     * Render the viewport indicator rectangle
     */
    renderViewport() {
        const ctx = this.ctx;
        const bounds = this.mainCamera.getVisibleBounds();

        const topLeft = this.worldToMinimap(bounds.minX, bounds.minY);
        const bottomRight = this.worldToMinimap(bounds.maxX, bounds.maxY);

        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;

        // Clamp to minimap bounds
        const x = Math.max(0, Math.min(MINIMAP_SIZE - 2, topLeft.x));
        const y = Math.max(0, Math.min(MINIMAP_SIZE - 2, topLeft.y));
        const w = Math.min(MINIMAP_SIZE - x, Math.max(4, width));
        const h = Math.min(MINIMAP_SIZE - y, Math.max(4, height));

        ctx.strokeStyle = COLORS.minimapViewport;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
    }
}
