// Selection system with quadtree for efficient click detection

import { CLICK_TOLERANCE } from './constants.js';

/**
 * Simple quadtree for spatial partitioning
 */
class QuadTree {
    constructor(bounds, capacity = 4) {
        this.bounds = bounds; // { x, y, width, height }
        this.capacity = capacity;
        this.objects = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }

    /**
     * Check if a point is within bounds
     */
    containsPoint(x, y) {
        return x >= this.bounds.x &&
               x < this.bounds.x + this.bounds.width &&
               y >= this.bounds.y &&
               y < this.bounds.y + this.bounds.height;
    }

    /**
     * Check if bounds intersect with a circle
     */
    intersectsCircle(cx, cy, radius) {
        // Find closest point on rectangle to circle center
        const closestX = Math.max(this.bounds.x, Math.min(cx, this.bounds.x + this.bounds.width));
        const closestY = Math.max(this.bounds.y, Math.min(cy, this.bounds.y + this.bounds.height));

        const dx = cx - closestX;
        const dy = cy - closestY;

        return dx * dx + dy * dy <= radius * radius;
    }

    /**
     * Subdivide this node into 4 children
     */
    subdivide() {
        const x = this.bounds.x;
        const y = this.bounds.y;
        const w = this.bounds.width / 2;
        const h = this.bounds.height / 2;

        this.northeast = new QuadTree({ x: x + w, y: y, width: w, height: h }, this.capacity);
        this.northwest = new QuadTree({ x: x, y: y, width: w, height: h }, this.capacity);
        this.southeast = new QuadTree({ x: x + w, y: y + h, width: w, height: h }, this.capacity);
        this.southwest = new QuadTree({ x: x, y: y + h, width: w, height: h }, this.capacity);

        this.divided = true;
    }

    /**
     * Insert an object into the quadtree
     * @param obj - Object with x, y, radius properties
     */
    insert(obj) {
        if (!this.containsPoint(obj.x, obj.y)) {
            return false;
        }

        if (this.objects.length < this.capacity && !this.divided) {
            this.objects.push(obj);
            return true;
        }

        if (!this.divided) {
            this.subdivide();

            // Move existing objects to children
            for (const existing of this.objects) {
                this.northeast.insert(existing) ||
                this.northwest.insert(existing) ||
                this.southeast.insert(existing) ||
                this.southwest.insert(existing);
            }
            this.objects = [];
        }

        return this.northeast.insert(obj) ||
               this.northwest.insert(obj) ||
               this.southeast.insert(obj) ||
               this.southwest.insert(obj);
    }

    /**
     * Query all objects within a circular range
     */
    queryCircle(cx, cy, radius, found = []) {
        if (!this.intersectsCircle(cx, cy, radius)) {
            return found;
        }

        for (const obj of this.objects) {
            const dx = obj.x - cx;
            const dy = obj.y - cy;
            if (dx * dx + dy * dy <= radius * radius) {
                found.push(obj);
            }
        }

        if (this.divided) {
            this.northeast.queryCircle(cx, cy, radius, found);
            this.northwest.queryCircle(cx, cy, radius, found);
            this.southeast.queryCircle(cx, cy, radius, found);
            this.southwest.queryCircle(cx, cy, radius, found);
        }

        return found;
    }
}

/**
 * Selection manager for handling asteroid selection
 */
export class SelectionManager {
    constructor() {
        this.quadtree = null;
        this.selectedAsteroid = null;
        this.onSelectionChange = null; // Callback
    }

    /**
     * Rebuild the quadtree with current asteroid positions
     * @param asteroids - Array of asteroids
     * @param bounds - World bounds { minX, minY, width, height }
     */
    rebuildQuadtree(asteroids, bounds) {
        this.quadtree = new QuadTree({
            x: bounds.minX,
            y: bounds.minY,
            width: bounds.width,
            height: bounds.height
        }, 8);

        for (const asteroid of asteroids) {
            this.quadtree.insert(asteroid);
        }
    }

    /**
     * Find asteroid at world coordinates
     * @param worldX - World X coordinate
     * @param worldY - World Y coordinate
     * @param tolerance - Click tolerance in world units
     */
    findAsteroidAt(worldX, worldY, tolerance) {
        if (!this.quadtree) return null;

        // Query nearby objects
        const candidates = this.quadtree.queryCircle(worldX, worldY, tolerance + 50);

        // Find the closest one that contains the point
        let closest = null;
        let closestDist = Infinity;

        for (const asteroid of candidates) {
            const dx = worldX - asteroid.x;
            const dy = worldY - asteroid.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const hitRadius = asteroid.radius + tolerance;

            if (dist <= hitRadius && dist < closestDist) {
                closest = asteroid;
                closestDist = dist;
            }
        }

        return closest;
    }

    /**
     * Handle click at screen coordinates
     * @param screenX - Screen X coordinate
     * @param screenY - Screen Y coordinate
     * @param camera - Camera for coordinate transformation
     */
    handleClick(screenX, screenY, camera) {
        const world = camera.screenToWorld(screenX, screenY);
        const tolerance = CLICK_TOLERANCE / camera.zoom;

        const asteroid = this.findAsteroidAt(world.x, world.y, tolerance);

        this.select(asteroid);
    }

    /**
     * Select an asteroid
     * @param asteroid - Asteroid to select, or null to deselect
     */
    select(asteroid) {
        const changed = this.selectedAsteroid !== asteroid;
        this.selectedAsteroid = asteroid;

        if (changed && this.onSelectionChange) {
            this.onSelectionChange(asteroid);
        }
    }

    /**
     * Deselect current selection
     */
    deselect() {
        this.select(null);
    }

    /**
     * Get currently selected asteroid
     */
    getSelected() {
        return this.selectedAsteroid;
    }

    /**
     * Check if an asteroid is selected
     */
    isSelected(asteroid) {
        return this.selectedAsteroid === asteroid;
    }
}
