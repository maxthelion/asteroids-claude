// Delta-V control panel and orbit projection

import { COLORS, AU_TO_PIXELS, MAX_DELTA_V, DELTA_V_SCALE } from './constants.js';
import { computeOrbitFromStateVectors, generateOrbitPath, orbitalPeriod } from './orbital.js';
import { degToRad, radToDeg, magnitude } from './utils.js';

export class DeltaVPanel {
    constructor(panelElement, onProjectionChange, onApply) {
        this.panel = panelElement;
        this.onProjectionChange = onProjectionChange;
        this.onApply = onApply;

        // Delta-V state
        this.magnitude = 0;
        this.direction = 0; // radians
        this.projectedOrbit = null;
        this.projectedPath = null;

        // Selected asteroid reference
        this.asteroid = null;

        // Get control elements
        this.magnitudeSlider = document.getElementById('deltav-magnitude');
        this.magnitudeValue = document.getElementById('deltav-magnitude-value');
        this.directionSlider = document.getElementById('deltav-direction');
        this.directionValue = document.getElementById('deltav-direction-value');
        this.applyButton = document.getElementById('deltav-apply');

        // Quick direction buttons
        this.progradeBtn = document.getElementById('btn-prograde');
        this.retrogradeBtn = document.getElementById('btn-retrograde');
        this.radialInBtn = document.getElementById('btn-radial-in');
        this.radialOutBtn = document.getElementById('btn-radial-out');

        // Info display elements
        this.infoSection = document.getElementById('orbital-info');
        this.projectedInfoSection = document.getElementById('projected-info');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Magnitude slider
        this.magnitudeSlider.addEventListener('input', () => {
            this.magnitude = parseFloat(this.magnitudeSlider.value);
            this.magnitudeValue.textContent = this.magnitude.toFixed(2);
            this.updateProjection();
        });

        // Direction slider
        this.directionSlider.addEventListener('input', () => {
            this.direction = degToRad(parseFloat(this.directionSlider.value));
            this.directionValue.textContent = Math.round(radToDeg(this.direction)) + '°';
            this.updateProjection();
        });

        // Quick direction buttons
        this.progradeBtn.addEventListener('click', () => this.setPrograde());
        this.retrogradeBtn.addEventListener('click', () => this.setRetrograde());
        this.radialInBtn.addEventListener('click', () => this.setRadialIn());
        this.radialOutBtn.addEventListener('click', () => this.setRadialOut());

        // Apply button
        this.applyButton.addEventListener('click', () => {
            if (this.asteroid && this.projectedOrbit && this.onApply) {
                this.onApply(this.asteroid, this.projectedOrbit);
                this.reset();
            }
        });
    }

    /**
     * Set direction to prograde (along velocity vector)
     */
    setPrograde() {
        if (!this.asteroid) return;
        this.direction = Math.atan2(this.asteroid.vy, this.asteroid.vx);
        this.updateDirectionDisplay();
        this.updateProjection();
    }

    /**
     * Set direction to retrograde (opposite velocity)
     */
    setRetrograde() {
        if (!this.asteroid) return;
        this.direction = Math.atan2(-this.asteroid.vy, -this.asteroid.vx);
        this.updateDirectionDisplay();
        this.updateProjection();
    }

    /**
     * Set direction radially inward (toward sun)
     */
    setRadialIn() {
        if (!this.asteroid) return;
        this.direction = Math.atan2(-this.asteroid.y, -this.asteroid.x);
        this.updateDirectionDisplay();
        this.updateProjection();
    }

    /**
     * Set direction radially outward (away from sun)
     */
    setRadialOut() {
        if (!this.asteroid) return;
        this.direction = Math.atan2(this.asteroid.y, this.asteroid.x);
        this.updateDirectionDisplay();
        this.updateProjection();
    }

    /**
     * Update direction slider to match current direction
     */
    updateDirectionDisplay() {
        const degrees = radToDeg(this.direction);
        const normalizedDegrees = ((degrees % 360) + 360) % 360;
        this.directionSlider.value = normalizedDegrees;
        this.directionValue.textContent = Math.round(normalizedDegrees) + '°';
    }

    /**
     * Update the projected orbit based on current delta-v
     */
    updateProjection() {
        if (!this.asteroid || this.magnitude === 0) {
            this.projectedOrbit = null;
            this.projectedPath = null;
            this.updateProjectedInfo(null);
            if (this.onProjectionChange) {
                this.onProjectionChange(null);
            }
            return;
        }

        // Calculate delta-v components
        const dvMagnitude = this.magnitude * DELTA_V_SCALE;
        const dvx = dvMagnitude * Math.cos(this.direction);
        const dvy = dvMagnitude * Math.sin(this.direction);

        // Calculate new velocity
        const newVx = this.asteroid.vx + dvx;
        const newVy = this.asteroid.vy + dvy;

        // Compute new orbit from state vectors
        const newOrbit = computeOrbitFromStateVectors(
            { x: this.asteroid.x, y: this.asteroid.y },
            { vx: newVx, vy: newVy }
        );

        if (newOrbit && newOrbit.a > 0 && newOrbit.e < 1) {
            this.projectedOrbit = newOrbit;
            this.projectedPath = generateOrbitPath(newOrbit);
            this.updateProjectedInfo(newOrbit);
        } else {
            // Escape trajectory or invalid orbit
            this.projectedOrbit = null;
            this.projectedPath = null;
            this.updateProjectedInfo(null, true);
        }

        if (this.onProjectionChange) {
            this.onProjectionChange(this.projectedPath);
        }
    }

    /**
     * Show panel with asteroid info
     */
    show(asteroid) {
        this.asteroid = asteroid;
        this.panel.classList.remove('hidden');
        this.reset();
        this.updateAsteroidInfo();

        // Default to prograde direction
        this.setPrograde();
    }

    /**
     * Hide panel
     */
    hide() {
        this.asteroid = null;
        this.panel.classList.add('hidden');
        this.reset();
    }

    /**
     * Reset delta-v controls
     */
    reset() {
        this.magnitude = 0;
        this.magnitudeSlider.value = 0;
        this.magnitudeValue.textContent = '0.00';
        this.projectedOrbit = null;
        this.projectedPath = null;
        this.updateProjectedInfo(null);

        if (this.onProjectionChange) {
            this.onProjectionChange(null);
        }
    }

    /**
     * Update current asteroid orbital info display
     */
    updateAsteroidInfo() {
        if (!this.asteroid) {
            this.infoSection.innerHTML = '';
            return;
        }

        const info = this.asteroid.getInfo();
        const velocity = magnitude(this.asteroid.vx, this.asteroid.vy);

        this.infoSection.innerHTML = `
            <div class="info-row">
                <span class="info-label">Semi-major axis:</span>
                <span class="info-value">${info.semiMajorAxis} AU</span>
            </div>
            <div class="info-row">
                <span class="info-label">Eccentricity:</span>
                <span class="info-value">${info.eccentricity}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Period:</span>
                <span class="info-value">${(info.period / 1000).toFixed(1)} units</span>
            </div>
            <div class="info-row">
                <span class="info-label">Velocity:</span>
                <span class="info-value">${velocity.toFixed(3)}</span>
            </div>
        `;
    }

    /**
     * Update projected orbit info display
     */
    updateProjectedInfo(orbit, escape = false) {
        if (!orbit) {
            if (escape) {
                this.projectedInfoSection.innerHTML = `
                    <div class="info-row escape">
                        <span class="info-value">Escape trajectory!</span>
                    </div>
                `;
            } else {
                this.projectedInfoSection.innerHTML = '';
            }
            this.applyButton.disabled = true;
            return;
        }

        const semiMajorAU = (orbit.a / AU_TO_PIXELS).toFixed(2);
        const period = orbitalPeriod(orbit.a);

        this.projectedInfoSection.innerHTML = `
            <div class="info-row projected">
                <span class="info-label">New semi-major axis:</span>
                <span class="info-value">${semiMajorAU} AU</span>
            </div>
            <div class="info-row projected">
                <span class="info-label">New eccentricity:</span>
                <span class="info-value">${orbit.e.toFixed(3)}</span>
            </div>
            <div class="info-row projected">
                <span class="info-label">New period:</span>
                <span class="info-value">${(period / 1000).toFixed(1)} units</span>
            </div>
        `;

        this.applyButton.disabled = false;
    }

    /**
     * Get current delta-v direction for rendering indicator
     */
    getDirection() {
        return this.direction;
    }

    /**
     * Get current delta-v magnitude
     */
    getMagnitude() {
        return this.magnitude;
    }

    /**
     * Get projected orbit path for rendering
     */
    getProjectedPath() {
        return this.projectedPath;
    }
}
