// Keplerian orbital mechanics calculations

import { MU, KEPLER_MAX_ITERATIONS, KEPLER_TOLERANCE, ORBIT_PATH_POINTS } from './constants.js';
import { normalizeAngle, magnitude, cross, dot } from './utils.js';

/**
 * Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E
 * Uses Newton-Raphson iteration
 * @param M - Mean anomaly (radians)
 * @param e - Eccentricity
 * @returns Eccentric anomaly E (radians)
 */
export function solveKeplerEquation(M, e) {
    // Normalize M to [0, 2π)
    M = normalizeAngle(M);

    // Initial guess
    let E = M;
    if (e > 0.8) {
        E = Math.PI; // Better initial guess for high eccentricity
    }

    // Newton-Raphson iteration
    for (let i = 0; i < KEPLER_MAX_ITERATIONS; i++) {
        const sinE = Math.sin(E);
        const cosE = Math.cos(E);
        const f = E - e * sinE - M;
        const fPrime = 1 - e * cosE;

        const deltaE = f / fPrime;
        E -= deltaE;

        if (Math.abs(deltaE) < KEPLER_TOLERANCE) {
            break;
        }
    }

    return E;
}

/**
 * Calculate true anomaly from eccentric anomaly
 * @param E - Eccentric anomaly (radians)
 * @param e - Eccentricity
 * @returns True anomaly θ (radians)
 */
export function trueAnomalyFromEccentric(E, e) {
    const sinHalfE = Math.sin(E / 2);
    const cosHalfE = Math.cos(E / 2);
    const sqrtOnePlusE = Math.sqrt(1 + e);
    const sqrtOneMinusE = Math.sqrt(1 - e);

    return 2 * Math.atan2(sqrtOnePlusE * sinHalfE, sqrtOneMinusE * cosHalfE);
}

/**
 * Calculate mean anomaly at a given time
 * @param orbit - Orbital elements object
 * @param t - Time
 * @returns Mean anomaly M (radians)
 */
export function meanAnomalyAtTime(orbit, t) {
    const n = Math.sqrt(MU / Math.pow(orbit.a, 3)); // Mean motion
    return normalizeAngle(orbit.M0 + n * t);
}

/**
 * Calculate orbital period
 * @param a - Semi-major axis
 * @returns Orbital period
 */
export function orbitalPeriod(a) {
    return 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / MU);
}

/**
 * Get position in orbital plane at given true anomaly
 * @param orbit - Orbital elements
 * @param theta - True anomaly
 * @returns { x, y } position in world coordinates
 */
export function getPositionFromTrueAnomaly(orbit, theta) {
    const { a, e, omega } = orbit;

    // Distance from focus
    const r = a * (1 - e * e) / (1 + e * Math.cos(theta));

    // Position in orbital plane (before rotation by argument of periapsis)
    const xOrbital = r * Math.cos(theta);
    const yOrbital = r * Math.sin(theta);

    // Rotate by argument of periapsis
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);

    return {
        x: xOrbital * cosOmega - yOrbital * sinOmega,
        y: xOrbital * sinOmega + yOrbital * cosOmega
    };
}

/**
 * Get position at a given time
 * @param orbit - Orbital elements { a, e, omega, M0 }
 * @param t - Time
 * @returns { x, y } position in world coordinates
 */
export function getPositionAtTime(orbit, t) {
    const M = meanAnomalyAtTime(orbit, t);
    const E = solveKeplerEquation(M, orbit.e);
    const theta = trueAnomalyFromEccentric(E, orbit.e);

    return getPositionFromTrueAnomaly(orbit, theta);
}

/**
 * Get velocity at a given time
 * @param orbit - Orbital elements { a, e, omega, M0 }
 * @param t - Time
 * @returns { vx, vy } velocity in world coordinates
 */
export function getVelocityAtTime(orbit, t) {
    const { a, e, omega } = orbit;

    const M = meanAnomalyAtTime(orbit, t);
    const E = solveKeplerEquation(M, orbit.e);
    const theta = trueAnomalyFromEccentric(E, orbit.e);

    // Distance
    const r = a * (1 - e * e) / (1 + e * Math.cos(theta));

    // Vis-viva equation: v² = μ(2/r - 1/a)
    const vMag = Math.sqrt(MU * (2 / r - 1 / a));

    // Semi-latus rectum
    const p = a * (1 - e * e);

    // Velocity components in orbital frame
    const h = Math.sqrt(MU * p); // Specific angular momentum
    const vr = MU / h * e * Math.sin(theta); // Radial velocity
    const vTheta = MU / h * (1 + e * Math.cos(theta)); // Tangential velocity

    // Convert to Cartesian in orbital frame
    const vxOrbital = vr * Math.cos(theta) - vTheta * Math.sin(theta);
    const vyOrbital = vr * Math.sin(theta) + vTheta * Math.cos(theta);

    // Rotate by argument of periapsis
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);

    return {
        vx: vxOrbital * cosOmega - vyOrbital * sinOmega,
        vy: vxOrbital * sinOmega + vyOrbital * cosOmega
    };
}

/**
 * Compute orbital elements from position and velocity vectors
 * @param r - Position { x, y }
 * @param v - Velocity { vx, vy }
 * @returns Orbital elements { a, e, omega, M0 } or null if escape trajectory
 */
export function computeOrbitFromStateVectors(r, v) {
    const rx = r.x;
    const ry = r.y;
    const vx = v.vx;
    const vy = v.vy;

    const rMag = magnitude(rx, ry);
    const vMag = magnitude(vx, vy);

    // Specific angular momentum (scalar, z-component of cross product)
    const h = cross(rx, ry, vx, vy);

    // Specific orbital energy
    const energy = vMag * vMag / 2 - MU / rMag;

    // Check for escape trajectory
    if (energy >= 0) {
        return null; // Parabolic or hyperbolic - not a closed orbit
    }

    // Semi-major axis
    const a = -MU / (2 * energy);

    // Eccentricity vector
    // e = (v × h) / μ - r / |r|
    // In 2D: e = (1/μ) * ((v² - μ/r) * r - (r·v) * v)
    const rdotv = dot(rx, ry, vx, vy);
    const term1 = vMag * vMag - MU / rMag;

    const ex = (term1 * rx - rdotv * vx) / MU;
    const ey = (term1 * ry - rdotv * vy) / MU;

    const e = magnitude(ex, ey);

    // Argument of periapsis
    let omega = Math.atan2(ey, ex);
    if (omega < 0) omega += 2 * Math.PI;

    // True anomaly
    let theta;
    if (e < 1e-10) {
        // Circular orbit - use position angle
        theta = Math.atan2(ry, rx) - omega;
    } else {
        // cos(θ) = (e · r) / (|e| |r|)
        const cosTheta = dot(ex, ey, rx, ry) / (e * rMag);
        theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));

        // Determine sign from radial velocity
        if (rdotv < 0) {
            theta = 2 * Math.PI - theta;
        }
    }

    // Eccentric anomaly from true anomaly
    const tanHalfTheta = Math.tan(theta / 2);
    const sqrtRatio = Math.sqrt((1 - e) / (1 + e));
    const E = 2 * Math.atan(sqrtRatio * tanHalfTheta);

    // Mean anomaly
    const M = E - e * Math.sin(E);
    const M0 = normalizeAngle(M);

    return { a, e, omega, M0 };
}

/**
 * Generate pre-computed orbit path for rendering
 * @param orbit - Orbital elements
 * @param numPoints - Number of points (default from constants)
 * @returns Array of { x, y } points
 */
export function generateOrbitPath(orbit, numPoints = ORBIT_PATH_POINTS) {
    const path = [];

    for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * 2 * Math.PI;
        const pos = getPositionFromTrueAnomaly(orbit, theta);
        path.push(pos);
    }

    return path;
}

/**
 * Get current true anomaly at time t
 * @param orbit - Orbital elements
 * @param t - Time
 * @returns True anomaly in radians
 */
export function getTrueAnomalyAtTime(orbit, t) {
    const M = meanAnomalyAtTime(orbit, t);
    const E = solveKeplerEquation(M, orbit.e);
    return trueAnomalyFromEccentric(E, orbit.e);
}
