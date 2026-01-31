# Asteroid Belt Simulation

A 2D asteroid belt simulation featuring 1000+ objects in elliptical Keplerian orbits around a sun, with interactive controls for navigation and orbital maneuvers.

## Features

- **1000+ asteroids** orbiting in realistic Keplerian orbits
- **Zoom and pan** navigation with mouse
- **Mini-map** for quick navigation across the belt
- **Asteroid selection** with orbital information display
- **Delta-V orbit projection** - plan orbital maneuvers and see the resulting trajectory
- **Apply maneuvers** - change asteroid orbits with delta-v burns

## Quick Start

Simply open `index.html` in a modern web browser. No build tools or server required.

```bash
# Option 1: Open directly
open index.html

# Option 2: Use a local server (optional, for development)
python -m http.server 8000
# Then visit http://localhost:8000
```

## Controls

| Action | Control |
|--------|---------|
| Zoom | Mouse scroll wheel |
| Pan | Click and drag |
| Select asteroid | Click on asteroid |
| Center on asteroid | Double-click asteroid |
| Reset view | Press `R` |
| Deselect | Press `Escape` |
| Pause/Resume | Press `Space` |

### Mini-map

- Click anywhere on the mini-map to navigate to that location
- The white rectangle shows your current viewport
- Selected asteroids appear highlighted

### Delta-V Panel

When an asteroid is selected, the Delta-V panel appears:

1. **Magnitude slider**: Set the delta-v amount (0-5 km/s)
2. **Direction slider**: Set the burn direction (0-360°)
3. **Quick buttons**:
   - **Prograde**: Burn in direction of travel (raises orbit)
   - **Retrograde**: Burn opposite to travel (lowers orbit)
   - **Radial In**: Burn toward sun
   - **Radial Out**: Burn away from sun
4. **Projected orbit**: Orange dashed line shows new trajectory
5. **Apply**: Execute the maneuver to change the orbit

## Technical Details

### Orbital Mechanics

The simulation uses Keplerian orbital mechanics:

- **Kepler's equation** solved via Newton-Raphson iteration
- **Orbital elements**: semi-major axis (a), eccentricity (e), argument of periapsis (ω), mean anomaly at epoch (M₀)
- **Vis-viva equation** for velocity calculations
- **State vector to orbital elements** conversion for delta-v projection

### Performance

- **Quadtree** spatial partitioning for efficient click detection
- **Level-of-detail (LOD)** rendering - distant asteroids rendered as simple dots
- **Frustum culling** - only visible asteroids are rendered
- **Pre-computed orbit paths** for fast rendering

### File Structure

```
asteroids-claude/
├── index.html          # Main HTML with canvas elements
├── css/
│   └── style.css       # UI styling
├── js/
│   ├── main.js         # Entry point, game loop
│   ├── constants.js    # Physical constants, config
│   ├── orbital.js      # Keplerian orbit calculations
│   ├── asteroid.js     # Asteroid class with orbit data
│   ├── sun.js          # Sun object
│   ├── camera.js       # Zoom/pan, coordinate transforms
│   ├── renderer.js     # Canvas rendering, LOD
│   ├── minimap.js      # Mini-map rendering & interaction
│   ├── selection.js    # Click detection, quadtree
│   ├── deltav-panel.js # Delta-v UI and orbit projection
│   └── utils.js        # Math helpers
└── README.md           # This file
```

## Browser Compatibility

Tested on modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires ES6 module support.
