# 🌌 Project Universe

A photorealistic, fully immersive 3D WebGL solar system simulation built with React + Three.js (React Three Fiber).

---

## ✨ Features

### 🌟 Rendering & Visuals
- **PBR Materials** — Custom GLSL shaders with roughness/metallic maps per planet
  - Rocky: crater noise, micro-surface detail (Mercury, Mars)
  - Gas Giants: animated banded structure with storm cells (Jupiter, Saturn)
  - Ice Giants: methane haze, smooth with streaks (Uranus, Neptune)
  - Earth: procedural ocean/land with specular ocean reflections
  - Mars: iron oxide regolith with polar ice caps
- **Rayleigh Scattering Atmosphere** — Per-planet atmospheric glow computed from sun angle
- **Dynamic Volumetric Clouds** — Multi-octave FBM cloud shader drifting in real-time
- **Saturn Ring System** — Procedural ice bands with Cassini Division, Encke Gap, sparkle
- **Animated Sun** — 6-octave FBM surface with granulation, limb darkening, solar flares
- **Sun Corona** — Animated filament + streamer corona with ejection simulation
- **HDR Milky Way Skybox** — Procedural galactic plane, star field with color temperatures, twinkling
- **Bloom + Vignette + Chromatic Aberration** — Post-processing via @react-three/postprocessing
- **ACES Filmic Tone Mapping** — Cinematic color grading

### 🪐 Orbital Physics
- **Kepler Elliptical Orbits** — Semi-major axis + eccentricity for all 8 planets
- **Kepler's Second Law** — Speed varies inversely with distance² (faster at perihelion)
- **Correct Axial Tilts** — All planets tilt on their real-world angles; Uranus rolls on its side
- **Retrograde Rotation** — Venus and Uranus rotate backwards
- **Variable Time Warp** — Adjustable speed slider from 0× to 100×

### 🎬 Camera & UX
- **Cinematic Fly-by** — Quadratic Bezier spline interpolation when clicking planets
- **OrbitControls** — Drag to orbit, scroll to zoom, inertia damping
- **Glassmorphism Info Panel** — Per-planet data with smooth spring animation
- **Hover Labels** — Orbitron font labels that highlight on hover

### 🔭 Data & Discovery
- **Complete Astronomical Data** — Mass, gravity, temperature, moons, day length for all 8 planets + Sun
- **Mars Live Weather** — Simulated Perseverance rover MEDA instrument readings
- **Exoplanet Database** — 6 exoplanets: TRAPPIST-1e, Proxima Centauri b, Kepler-22b, HD 189733b, Gliese 667Cc, Kepler-1649c
- **Warp Gate** — Transition to exoplanet system with red dwarf star
- **Habitability Scores** — Earth Similarity Index per exoplanet
- **Discovery metadata** — Discovered year, instrument, distance in light-years

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173` in your browser.

---

## 🎮 Controls

| Input | Action |
|-------|--------|
| **Left drag** | Orbit camera |
| **Scroll** | Zoom in/out |
| **Click planet** | Focus + show data panel |
| **Click Sun** | Show solar data |
| **ESC** | Close panel |
| **⏸ button** | Pause/resume orbits |
| **⊙ button** | Toggle orbit lines |
| **Time warp slider** | Speed up/slow down time |
| **WARP GATE** | Enter exoplanet system |

---

## 🏗️ Architecture

```
src/
├── shaders/
│   └── index.js          # All GLSL vertex + fragment shaders
│       ├── SunVertex/FragmentShader
│       ├── CoronaVertex/FragmentShader
│       ├── PlanetVertex/FragmentShader  (PBR)
│       ├── AtmosphereVertex/FragmentShader (Rayleigh)
│       ├── CloudVertex/FragmentShader
│       ├── RingVertex/FragmentShader
│       └── StarfieldVertex/FragmentShader (HDR Milky Way)
├── data/
│   └── planets.js        # All planetary + exoplanet data
├── components/
│   ├── Sun.jsx           # Sun + corona + solar flares
│   ├── Planet.jsx        # PBR planet + atmosphere + clouds + rings
│   ├── Scene.jsx         # Starfield + cinematic camera controller
│   ├── ExoplanetScene.jsx # Exoplanet system with red dwarf
│   ├── InfoPanel.jsx     # Glassmorphism data overlay
│   ├── HUD.jsx           # Controls, time warp, warp gate
│   └── LoadingScreen.jsx # Animated loading screen
├── store.js              # Zustand global state
├── App.jsx               # Canvas setup, post-processing
└── main.jsx              # React entry point
```

---

## 🔬 Technical Highlights

### Shader Pipeline
Every planet has 3 shader layers:
1. **Planet PBR shader** — Physically based with procedural surface textures by planet type
2. **Cloud shader** — FBM multi-octave clouds with sun shading
3. **Atmosphere shader** — Rayleigh scattering rim glow

The Sun has:
1. **Surface shader** — 6-octave animated granulation + limb darkening + flare hotspots
2. **Inner corona** — Animated filaments + ejection streaks
3. **Outer corona** — Extended halo with pulsing

### Kepler Mechanics
```js
// True orbital speed varies by position (Kepler's 2nd Law)
const baseSpeed = (2π / orbitalPeriod) * 0.00008
const keplerSpeed = baseSpeed * (SMA²) / (r²) * timeWarp
```

### Elliptical Orbit Position
```js
// b = semi-minor axis, focus = c (linear eccentricity)
const b = sma * Math.sqrt(1 - ecc²)
const focus = sma * ecc
x = sma * cos(angle) - focus
z = b * sin(angle)
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `three` | 3D rendering engine |
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei` | Helpers: OrbitControls, Html, Stars |
| `@react-three/postprocessing` | Bloom, Vignette, Chromatic Aberration |
| `postprocessing` | Post-FX pipeline |
| `framer-motion` | Spring animations for UI |
| `zustand` | Lightweight global state |
| `vite` | Build tool |

---

## 🌍 Exoplanets Included

| Planet | Distance | Habitability | Notes |
|--------|----------|--------------|-------|
| TRAPPIST-1e | 39.5 ly | 83% ESI | Habitable zone, JWST target |
| Proxima Centauri b | 4.24 ly | 71% ESI | Nearest known exoplanet |
| Kepler-22b | 638 ly | 68% ESI | First HZ planet around Sun-like star |
| HD 189733b | 64.5 ly | 2% | Hot Jupiter — rains glass |
| Gliese 667Cc | 23.6 ly | 77% ESI | Triple star system |
| Kepler-1649c | 300 ly | 85% ESI | Closest to Earth in size + temp |

---

## 🔭 Planned Enhancements

- [ ] Real NASA APOD integration
- [ ] Actual Mars weather from InSight API
- [ ] Moon system for Earth (orbiting Moon with eclipse shadow)
- [ ] Jupiter's Galilean moons
- [ ] Asteroid belt procedural particles
- [ ] Comet with tail shader
- [ ] VR support via WebXR

---

*Built with React Three Fiber, Three.js, and custom GLSL shaders.*  
*All orbital data sourced from NASA/JPL Solar System Dynamics.*
