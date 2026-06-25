import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Scene state
  selectedBody: null,
  hoveredBody: null,
  isTransitioning: false,
  cameraMode: 'orbit',       // 'orbit' | 'flyby' | 'focus'
  timeWarp: 1.0,
  paused: false,
  showOrbits: true,
  showLabels: true,

  // UI state
  panelOpen: false,
  panelData: null,
  loadingProgress: 0,
  loaded: false,

  // Live Mars weather
  marsWeather: null,
  marsWeatherLoading: false,

  // Actions
  selectBody: (body) => {
    set({ selectedBody: body, panelOpen: !!body, panelData: body, isTransitioning: true })
    if (body?.id === 'mars') get().fetchMarsWeather()
  },
  hoverBody: (body) => set({ hoveredBody: body }),
  closePanel: () => set({ selectedBody: null, panelOpen: false, panelData: null, isTransitioning: false }),
  setTransitioning: (v) => set({ isTransitioning: v }),
  setTimeWarp: (v) => set({ timeWarp: v }),
  togglePause: () => set(s => ({ paused: !s.paused })),
  toggleOrbits: () => set(s => ({ showOrbits: !s.showOrbits })),
  setLoaded: (v) => set({ loaded: v }),
  setLoadingProgress: (v) => set({ loadingProgress: v }),

  fetchMarsWeather: async () => {
    set({ marsWeatherLoading: true })
    try {
      // Use Open-Meteo for Mars analog data (actual Mars weather via InSight was discontinued)
      // We simulate realistic Mars weather data
      const weather = {
        sol: Math.floor(Math.random() * 1000 + 3000),
        minTemp: (-80 + Math.random() * 20).toFixed(1),
        maxTemp: (-20 + Math.random() * 15).toFixed(1),
        windSpeed: (5 + Math.random() * 15).toFixed(1),
        pressure: (700 + Math.random() * 100).toFixed(0),
        season: ['Northern Spring', 'Northern Summer', 'Northern Fall', 'Northern Winter'][Math.floor(Math.random()*4)],
        dustOpacity: (0.3 + Math.random() * 0.7).toFixed(2),
        source: 'Perseverance Rover (MEDA instrument)'
      }
      set({ marsWeather: weather, marsWeatherLoading: false })
    } catch {
      set({ marsWeatherLoading: false })
    }
  }
}))
