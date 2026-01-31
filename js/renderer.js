// Canvas rendering with LOD and performance optimizations

import { COLORS, AU_TO_PIXELS, BELT_INNER_RADIUS, BELT_OUTER_RADIUS } from './constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Handle high DPI displays
        this.setupHighDPI();

        // Handle window resize
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    /**
     * Set up high DPI canvas rendering
     */
    setupHighDPI() {
        const dpr = window.devicePixelRatio || 1;
        this.dpr = dpr;
    }

    /**
     * Handle canvas resize
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);

        // Store logical dimensions
        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = COLORS.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Render the asteroid belt boundaries (visual guide)
     */
    renderBeltBoundaries(camera) {
        const ctx = this.ctx;

        // Inner boundary
        const innerRadius = BELT_INNER_RADIUS * AU_TO_PIXELS;
        const outerRadius = BELT_OUTER_RADIUS * AU_TO_PIXELS;

        ctx.strokeStyle = 'rgba(100, 100, 150, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 10]);

        // Inner circle
        const innerScreen = camera.worldToScreen(0, 0);
        ctx.beginPath();
        ctx.arc(innerScreen.x, innerScreen.y, innerRadius * camera.zoom, 0, Math.PI * 2);
        ctx.stroke();

        // Outer circle
        ctx.beginPath();
        ctx.arc(innerScreen.x, innerScreen.y, outerRadius * camera.zoom, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    /**
     * Render all asteroids with LOD
     * @param asteroids - Array of asteroids
     * @param camera - Camera for transforms
     * @param selectedAsteroid - Currently selected asteroid (or null)
     */
    renderAsteroids(asteroids, camera, selectedAsteroid) {
        const ctx = this.ctx;
        const bounds = camera.getVisibleBounds();

        // Sort by size for better layering (smaller first)
        const visible = asteroids.filter(a => {
            const margin = a.radius + 20;
            return a.x >= bounds.minX - margin &&
                   a.x <= bounds.maxX + margin &&
                   a.y >= bounds.minY - margin &&
                   a.y <= bounds.maxY + margin;
        });

        visible.sort((a, b) => a.radius - b.radius);

        // Render non-selected asteroids
        for (const asteroid of visible) {
            if (asteroid !== selectedAsteroid) {
                asteroid.render(ctx, camera, false);
            }
        }

        // Render selected asteroid last (on top)
        if (selectedAsteroid) {
            selectedAsteroid.render(ctx, camera, true);
        }
    }

    /**
     * Render an orbit path
     * @param path - Array of { x, y } points
     * @param camera - Camera
     * @param color - Path color
     * @param dashed - Whether to use dashed line
     */
    renderOrbitPath(path, camera, color, dashed = false) {
        if (!path || path.length < 2) return;

        const ctx = this.ctx;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = dashed ? 2 : 1;

        if (dashed) {
            ctx.setLineDash([8, 4]);
        }

        const first = camera.worldToScreen(path[0].x, path[0].y);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < path.length; i++) {
            const point = camera.worldToScreen(path[i].x, path[i].y);
            ctx.lineTo(point.x, point.y);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Render delta-v direction indicator on selected asteroid
     * @param asteroid - Selected asteroid
     * @param angle - Direction angle in radians
     * @param magnitude - Delta-v magnitude
     * @param camera - Camera
     */
    renderDeltaVIndicator(asteroid, angle, magnitude, camera) {
        if (!asteroid || magnitude <= 0) return;

        const ctx = this.ctx;
        const screen = camera.worldToScreen(asteroid.x, asteroid.y);

        const arrowLength = 30 + magnitude * 20;
        const endX = screen.x + Math.cos(angle) * arrowLength;
        const endY = screen.y + Math.sin(angle) * arrowLength;

        // Arrow line
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = COLORS.projectedOrbit;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Arrow head
        const headLength = 10;
        const headAngle = 0.5;

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headLength * Math.cos(angle - headAngle),
            endY - headLength * Math.sin(angle - headAngle)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headLength * Math.cos(angle + headAngle),
            endY - headLength * Math.sin(angle + headAngle)
        );
        ctx.stroke();
    }

    /**
     * Render help text
     */
    renderHelp() {
        const ctx = this.ctx;
        const helpText = [
            'Controls:',
            '  Scroll: Zoom',
            '  Drag: Pan',
            '  Click: Select asteroid',
            '  R: Reset view',
            '  Esc: Deselect'
        ];

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px monospace';

        const x = 10;
        let y = this.height - 10 - (helpText.length - 1) * 16;

        for (const line of helpText) {
            ctx.fillText(line, x, y);
            y += 16;
        }
    }

    /**
     * Render simulation info
     */
    renderInfo(asteroidCount, fps) {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px monospace';
        ctx.fillText(`Asteroids: ${asteroidCount}`, 10, 20);
        ctx.fillText(`FPS: ${fps.toFixed(0)}`, 10, 38);
    }

    /**
     * Get canvas context (for components that need direct access)
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Get canvas dimensions
     */
    getDimensions() {
        return { width: this.width, height: this.height };
    }
}
