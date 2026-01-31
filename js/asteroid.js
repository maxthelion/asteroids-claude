// Asteroid class with Keplerian orbit

import {
    AU_TO_PIXELS,
    BELT_INNER_RADIUS,
    BELT_OUTER_RADIUS,
    MIN_ASTEROID_RADIUS,
    MAX_ASTEROID_RADIUS,
    MIN_ECCENTRICITY,
    MAX_ECCENTRICITY,
    COLORS
} from './constants.js';

import { randomRange, randomPowerLaw, generateAsteroidColor } from './utils.js';
import { getPositionAtTime, getVelocityAtTime, generateOrbitPath, orbitalPeriod, computeOrbitFromStateVectors } from './orbital.js';

export class Asteroid {
    /**
     * Create an asteroid with random orbital parameters
     * @param id - Unique identifier
     */
    constructor(id) {
        this.id = id;

        // Generate random orbital elements
        // Semi-major axis in AU, converted to pixels
        const aAU = randomRange(BELT_INNER_RADIUS, BELT_OUTER_RADIUS);
        this.orbit = {
            a: aAU * AU_TO_PIXELS,
            e: randomRange(MIN_ECCENTRICITY, MAX_ECCENTRICITY),
            omega: randomRange(0, 2 * Math.PI), // Argument of periapsis
            M0: randomRange(0, 2 * Math.PI)     // Mean anomaly at epoch
        };

        // Visual properties
        // Power law distribution: many small, few large
        this.radius = randomPowerLaw(MIN_ASTEROID_RADIUS, MAX_ASTEROID_RADIUS, 3);
        this.color = generateAsteroidColor(id);

        // Pre-compute orbit path for rendering
        this.orbitPath = generateOrbitPath(this.orbit);

        // Current state (updated each frame)
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;

        // Calculate orbital period for info display
        this.period = orbitalPeriod(this.orbit.a);
    }

    /**
     * Create an asteroid with specific orbital parameters
     * @param id - Unique identifier
     * @param orbit - Orbital elements { a, e, omega, M0 }
     * @param radius - Visual radius
     * @param color - Color string
     */
    static fromOrbit(id, orbit, radius, color) {
        const asteroid = new Asteroid(id);
        asteroid.orbit = { ...orbit };
        asteroid.radius = radius;
        asteroid.color = color;
        asteroid.orbitPath = generateOrbitPath(asteroid.orbit);
        asteroid.period = orbitalPeriod(asteroid.orbit.a);
        return asteroid;
    }

    /**
     * Update position and velocity for current time
     * @param t - Current simulation time
     */
    update(t) {
        const pos = getPositionAtTime(this.orbit, t);
        const vel = getVelocityAtTime(this.orbit, t);

        this.x = pos.x;
        this.y = pos.y;
        this.vx = vel.vx;
        this.vy = vel.vy;
    }

    /**
     * Apply a delta-v change and recalculate orbit
     * @param dvx - Delta-v x component
     * @param dvy - Delta-v y component
     * @param t - Current time (to recalculate M0)
     */
    applyDeltaV(dvx, dvy, t) {
        const newVx = this.vx + dvx;
        const newVy = this.vy + dvy;

        const newOrbit = computeOrbitFromStateVectors(
            { x: this.x, y: this.y },
            { vx: newVx, vy: newVy }
        );

        if (newOrbit) {
            this.orbit = newOrbit;
            this.orbitPath = generateOrbitPath(this.orbit);
            this.period = orbitalPeriod(this.orbit.a);
            this.vx = newVx;
            this.vy = newVy;
        }

        return newOrbit !== null;
    }

    /**
     * Set orbit directly (used when applying projected orbit)
     * @param orbit - New orbital elements
     */
    setOrbit(orbit) {
        this.orbit = { ...orbit };
        this.orbitPath = generateOrbitPath(this.orbit);
        this.period = orbitalPeriod(this.orbit.a);
    }

    /**
     * Check if point is within asteroid (for selection)
     * @param wx - World x coordinate
     * @param wy - World y coordinate
     * @param tolerance - Extra hit area
     */
    containsPoint(wx, wy, tolerance = 0) {
        const dx = wx - this.x;
        const dy = wy - this.y;
        const hitRadius = this.radius + tolerance;
        return dx * dx + dy * dy <= hitRadius * hitRadius;
    }

    /**
     * Render the asteroid
     * @param ctx - Canvas context
     * @param camera - Camera for coordinate transformation
     * @param isSelected - Whether this asteroid is selected
     */
    render(ctx, camera, isSelected = false) {
        const screen = camera.worldToScreen(this.x, this.y);

        // Frustum culling
        if (!camera.isVisible(screen.x, screen.y, this.radius * camera.zoom + 20)) {
            return;
        }

        const screenRadius = Math.max(1, this.radius * camera.zoom);

        // Selection highlight
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, screenRadius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.selectionRing;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Velocity indicator
            const velScale = 50;
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y);
            ctx.lineTo(
                screen.x + this.vx * velScale * camera.zoom,
                screen.y + this.vy * velScale * camera.zoom
            );
            ctx.strokeStyle = 'rgba(100, 255, 100, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // LOD: Simple dot for small/distant asteroids
        if (screenRadius < 3) {
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, screenRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            // Detailed rendering for larger asteroids
            const gradient = ctx.createRadialGradient(
                screen.x - screenRadius * 0.3,
                screen.y - screenRadius * 0.3,
                0,
                screen.x, screen.y, screenRadius
            );
            gradient.addColorStop(0, this.lightenColor(this.color, 30));
            gradient.addColorStop(1, this.darkenColor(this.color, 20));

            ctx.beginPath();
            ctx.arc(screen.x, screen.y, screenRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    /**
     * Render orbit path
     * @param ctx - Canvas context
     * @param camera - Camera for coordinate transformation
     * @param color - Path color (optional)
     * @param dashed - Whether to use dashed line
     */
    renderOrbitPath(ctx, camera, color = COLORS.orbitPath, dashed = false) {
        if (this.orbitPath.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        if (dashed) {
            ctx.setLineDash([5, 5]);
        }

        const first = camera.worldToScreen(this.orbitPath[0].x, this.orbitPath[0].y);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < this.orbitPath.length; i++) {
            const point = camera.worldToScreen(this.orbitPath[i].x, this.orbitPath[i].y);
            ctx.lineTo(point.x, point.y);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Render on mini-map
     * @param ctx - Canvas context
     * @param scale - Mini-map scale
     * @param centerX - Mini-map center X
     * @param centerY - Mini-map center Y
     * @param isSelected - Whether selected
     */
    renderMinimap(ctx, scale, centerX, centerY, isSelected = false) {
        const x = centerX + this.x * scale;
        const y = centerY + this.y * scale;

        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 3 : 1, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? COLORS.selectionRing : COLORS.asteroid;
        ctx.fill();
    }

    // Color utility methods
    lightenColor(color, amount) {
        // Simple lightening for HSL colors
        if (color.startsWith('hsl')) {
            const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (match) {
                const h = parseInt(match[1]);
                const s = parseInt(match[2]);
                const l = Math.min(100, parseInt(match[3]) + amount);
                return `hsl(${h}, ${s}%, ${l}%)`;
            }
        }
        return color;
    }

    darkenColor(color, amount) {
        if (color.startsWith('hsl')) {
            const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (match) {
                const h = parseInt(match[1]);
                const s = parseInt(match[2]);
                const l = Math.max(0, parseInt(match[3]) - amount);
                return `hsl(${h}, ${s}%, ${l}%)`;
            }
        }
        return color;
    }

    /**
     * Get orbital info for display
     */
    getInfo() {
        return {
            id: this.id,
            semiMajorAxis: (this.orbit.a / AU_TO_PIXELS).toFixed(2),
            eccentricity: this.orbit.e.toFixed(3),
            period: this.period.toFixed(1),
            radius: this.radius.toFixed(1)
        };
    }
}
