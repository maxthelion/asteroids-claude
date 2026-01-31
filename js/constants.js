// Physical and simulation constants

// Gravitational parameter (μ) - arbitrary units for simulation
// Scaled so orbital periods are reasonable for viewing
export const MU = 1000;

// Distance scaling: 1 AU = this many pixels at zoom level 1
export const AU_TO_PIXELS = 150;

// Asteroid belt boundaries (in AU)
export const BELT_INNER_RADIUS = 2.0;
export const BELT_OUTER_RADIUS = 3.5;

// Number of asteroids to generate
export const ASTEROID_COUNT = 1000;

// Asteroid size range (pixels at zoom 1)
export const MIN_ASTEROID_RADIUS = 2;
export const MAX_ASTEROID_RADIUS = 20;

// Eccentricity range for asteroids
export const MIN_ECCENTRICITY = 0.0;
export const MAX_ECCENTRICITY = 0.3;

// Orbit path resolution (points per orbit)
export const ORBIT_PATH_POINTS = 100;

// Camera settings
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 50;
export const ZOOM_SPEED = 0.001;
export const PAN_SPEED = 1;

// Mini-map settings
export const MINIMAP_SIZE = 200;
export const MINIMAP_PADDING = 10;

// Selection settings
export const CLICK_TOLERANCE = 8; // pixels

// Kepler equation solver
export const KEPLER_MAX_ITERATIONS = 50;
export const KEPLER_TOLERANCE = 1e-8;

// Delta-V settings
export const MAX_DELTA_V = 5; // km/s equivalent in sim units
export const DELTA_V_SCALE = 0.1; // Convert slider to velocity units

// Time settings
export const TIME_SCALE = 0.001; // How fast simulation runs

// Colors
export const COLORS = {
    background: '#0a0a15',
    sun: '#ffdd44',
    sunGlow: 'rgba(255, 200, 50, 0.3)',
    asteroid: '#888899',
    asteroidHighlight: '#ffffff',
    orbitPath: 'rgba(100, 150, 255, 0.5)',
    projectedOrbit: 'rgba(255, 150, 50, 0.8)',
    minimapBackground: 'rgba(10, 10, 30, 0.8)',
    minimapViewport: 'rgba(255, 255, 255, 0.5)',
    minimapBorder: 'rgba(100, 150, 255, 0.5)',
    selectionRing: '#44aaff'
};
