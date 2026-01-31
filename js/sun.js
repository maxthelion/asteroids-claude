// Sun object at the center of the solar system

import { COLORS } from './constants.js';

export class Sun {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 30; // Visual radius in world units
    }

    /**
     * Render the sun
     * @param ctx - Canvas context
     * @param camera - Camera for coordinate transformation
     */
    render(ctx, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        const screenRadius = this.radius * camera.zoom;

        // Outer glow
        const gradient = ctx.createRadialGradient(
            screen.x, screen.y, screenRadius * 0.5,
            screen.x, screen.y, screenRadius * 3
        );
        gradient.addColorStop(0, COLORS.sunGlow);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(screen.x, screen.y, screenRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Main sun body
        const bodyGradient = ctx.createRadialGradient(
            screen.x - screenRadius * 0.3,
            screen.y - screenRadius * 0.3,
            0,
            screen.x, screen.y, screenRadius
        );
        bodyGradient.addColorStop(0, '#ffffcc');
        bodyGradient.addColorStop(0.5, COLORS.sun);
        bodyGradient.addColorStop(1, '#cc9900');

        ctx.beginPath();
        ctx.arc(screen.x, screen.y, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = bodyGradient;
        ctx.fill();
    }

    /**
     * Render on mini-map
     * @param ctx - Canvas context
     * @param scale - Mini-map scale factor
     * @param centerX - Mini-map center X
     * @param centerY - Mini-map center Y
     */
    renderMinimap(ctx, scale, centerX, centerY) {
        const x = centerX + this.x * scale;
        const y = centerY + this.y * scale;
        const radius = Math.max(3, this.radius * scale * 0.5);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.sun;
        ctx.fill();
    }
}
