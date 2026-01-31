// Main entry point and game loop

import { ASTEROID_COUNT, TIME_SCALE, COLORS, AU_TO_PIXELS, BELT_OUTER_RADIUS } from './constants.js';
import { Asteroid } from './asteroid.js';
import { Sun } from './sun.js';
import { Camera } from './camera.js';
import { Renderer } from './renderer.js';
import { Minimap } from './minimap.js';
import { SelectionManager } from './selection.js';
import { DeltaVPanel } from './deltav-panel.js';

class Simulation {
    constructor() {
        // Get canvas elements
        this.mainCanvas = document.getElementById('main-canvas');
        this.minimapCanvas = document.getElementById('minimap-canvas');

        // Initialize components
        this.camera = new Camera(this.mainCanvas);
        this.renderer = new Renderer(this.mainCanvas);
        this.sun = new Sun();
        this.minimap = new Minimap(this.minimapCanvas, this.camera);
        this.selectionManager = new SelectionManager();

        // Delta-V panel
        this.projectedOrbitPath = null;
        this.deltaVPanel = new DeltaVPanel(
            document.getElementById('deltav-panel'),
            (path) => { this.projectedOrbitPath = path; },
            (asteroid, orbit) => this.applyOrbitChange(asteroid, orbit)
        );

        // Generate asteroids
        this.asteroids = this.generateAsteroids();

        // Time tracking
        this.time = 0;
        this.lastFrameTime = 0;
        this.fps = 60;

        // Set up event handlers
        this.setupEventListeners();

        // Selection change handler
        this.selectionManager.onSelectionChange = (asteroid) => {
            if (asteroid) {
                this.deltaVPanel.show(asteroid);
            } else {
                this.deltaVPanel.hide();
            }
        };

        // Start the simulation
        this.start();
    }

    /**
     * Generate the asteroid belt
     */
    generateAsteroids() {
        const asteroids = [];

        for (let i = 0; i < ASTEROID_COUNT; i++) {
            asteroids.push(new Asteroid(i));
        }

        return asteroids;
    }

    /**
     * Set up keyboard and mouse event listeners
     */
    setupEventListeners() {
        // Click on main canvas for selection
        this.mainCanvas.addEventListener('click', (e) => {
            // Only handle if not dragging (to distinguish click from pan)
            if (!this.camera.hasDragged) {
                const rect = this.mainCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.selectionManager.handleClick(x, y, this.camera);
            }
        });

        // Double-click to center on asteroid
        this.mainCanvas.addEventListener('dblclick', (e) => {
            const rect = this.mainCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Find asteroid at click position
            const world = this.camera.screenToWorld(x, y);
            const asteroid = this.selectionManager.findAsteroidAt(world.x, world.y, 10 / this.camera.zoom);

            if (asteroid) {
                this.camera.centerOn(asteroid.x, asteroid.y);
                this.selectionManager.select(asteroid);
            }
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'r':
                case 'R':
                    this.camera.reset();
                    break;
                case 'Escape':
                    this.selectionManager.deselect();
                    break;
                case ' ':
                    // Toggle time pause (optional feature)
                    this.paused = !this.paused;
                    break;
            }
        });
    }

    /**
     * Apply an orbit change to an asteroid
     */
    applyOrbitChange(asteroid, newOrbit) {
        asteroid.setOrbit(newOrbit);
        this.deltaVPanel.updateAsteroidInfo();
    }

    /**
     * Start the game loop
     */
    start() {
        this.lastFrameTime = performance.now();
        this.paused = false;
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /**
     * Main game loop
     */
    gameLoop(timestamp) {
        // Calculate delta time and FPS
        const deltaTime = timestamp - this.lastFrameTime;
        this.fps = 1000 / deltaTime;
        this.lastFrameTime = timestamp;

        // Update simulation time
        if (!this.paused) {
            this.time += deltaTime * TIME_SCALE;
        }

        // Update
        this.update();

        // Render
        this.render();

        // Continue loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /**
     * Update simulation state
     */
    update() {
        // Update all asteroid positions
        for (const asteroid of this.asteroids) {
            asteroid.update(this.time);
        }

        // Update quadtree for selection
        const worldRadius = BELT_OUTER_RADIUS * AU_TO_PIXELS * 2;
        this.selectionManager.rebuildQuadtree(this.asteroids, {
            minX: -worldRadius,
            minY: -worldRadius,
            width: worldRadius * 2,
            height: worldRadius * 2
        });

        // Update delta-v panel info if asteroid selected
        if (this.selectionManager.getSelected()) {
            this.deltaVPanel.updateAsteroidInfo();
        }
    }

    /**
     * Render the simulation
     */
    render() {
        const selectedAsteroid = this.selectionManager.getSelected();

        // Clear main canvas
        this.renderer.clear();

        // Render belt boundaries
        this.renderer.renderBeltBoundaries(this.camera);

        // Render selected asteroid's orbit
        if (selectedAsteroid) {
            this.renderer.renderOrbitPath(
                selectedAsteroid.orbitPath,
                this.camera,
                COLORS.orbitPath,
                false
            );
        }

        // Render projected orbit (if any)
        if (this.projectedOrbitPath) {
            this.renderer.renderOrbitPath(
                this.projectedOrbitPath,
                this.camera,
                COLORS.projectedOrbit,
                true
            );
        }

        // Render sun
        this.sun.render(this.renderer.getContext(), this.camera);

        // Render asteroids
        this.renderer.renderAsteroids(this.asteroids, this.camera, selectedAsteroid);

        // Render delta-v direction indicator
        if (selectedAsteroid && this.deltaVPanel.getMagnitude() > 0) {
            this.renderer.renderDeltaVIndicator(
                selectedAsteroid,
                this.deltaVPanel.getDirection(),
                this.deltaVPanel.getMagnitude(),
                this.camera
            );
        }

        // Render UI elements
        this.renderer.renderInfo(this.asteroids.length, this.fps);
        this.renderer.renderHelp();

        // Render minimap
        this.minimap.render(this.asteroids, this.sun, selectedAsteroid);
    }
}

// Initialize simulation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Simulation();
});
