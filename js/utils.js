// Math utility functions

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Random float between min and max
 */
export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Random float with power law distribution (more small values)
 * @param min - Minimum value
 * @param max - Maximum value
 * @param power - Power exponent (higher = more small values)
 */
export function randomPowerLaw(min, max, power = 2) {
    const u = Math.random();
    return min + (max - min) * Math.pow(u, power);
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

/**
 * Normalize angle to [0, 2π)
 */
export function normalizeAngle(angle) {
    while (angle < 0) angle += 2 * Math.PI;
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
    return angle;
}

/**
 * Calculate distance between two points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate magnitude of a 2D vector
 */
export function magnitude(x, y) {
    return Math.sqrt(x * x + y * y);
}

/**
 * Normalize a 2D vector
 */
export function normalize(x, y) {
    const mag = magnitude(x, y);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: x / mag, y: y / mag };
}

/**
 * Dot product of two 2D vectors
 */
export function dot(x1, y1, x2, y2) {
    return x1 * x2 + y1 * y2;
}

/**
 * Cross product (z-component) of two 2D vectors
 */
export function cross(x1, y1, x2, y2) {
    return x1 * y2 - y1 * x2;
}

/**
 * Rotate a 2D point around origin by angle
 */
export function rotate(x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: x * cos - y * sin,
        y: x * sin + y * cos
    };
}

/**
 * Generate a color based on value (for asteroid variety)
 */
export function generateAsteroidColor(seed) {
    // Grayish-brown colors typical of asteroids
    const baseHue = 30 + (seed * 137.508) % 40; // 30-70 range (browns/grays)
    const saturation = 5 + (seed * 73.137) % 15; // Low saturation
    const lightness = 40 + (seed * 91.731) % 30; // Medium lightness
    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
}
