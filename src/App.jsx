import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import { useStore } from './store'
import { SOLAR_SYSTEM } from './data/planets'

import Sun from './components/Sun'
import Planet from './components/Planet'
import { Starfield, CameraController } from './components/Scene'
import InfoPanel from './components/InfoPanel'
import HUD from './components/HUD'
import LoadingScreen from './components/LoadingScreen'

function SolarSystemScene() {
  return (
    <>
      {SOLAR_SYSTEM.map(planet => (
        <Planet key={planet.id} data={planet} />
      ))}
    </>
  )
}

function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.5}
        radius={0.7}
        blendFunction={BlendFunction.ADD}
      />
      <Vignette eskil={false} offset={0.15} darkness={0.7} />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.0004, 0.0004]}
      />
    </EffectComposer>
  )
}

function SceneContents() {
  return (
    <>
      <CameraController />
      {/* HDR Milky Way background */}
      <Starfield />
      <ambientLight intensity={0.1} />
      <Sun />
      <SolarSystemScene />
    </>
  )
}

export default function App() {
  const setLoaded = useStore(s => s.setLoaded)
  const setLoadingProgress = useStore(s => s.setLoadingProgress)
  const closePanel = useStore(s => s.closePanel)
  const loaded = useStore(s => s.loaded)

  // Simulate loading progress
  useEffect(() => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 3 + Math.random() * 5
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setTimeout(() => setLoaded(true), 400)
      }
      setLoadingProgress(progress)
    }, 60)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <Canvas
        camera={{
          position: [0, 25, 90],
          fov: 55,
          near: 0.1,
          far: 20000,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onPointerMissed={() => closePanel()}
        style={{ position: 'absolute', inset: 0, opacity: 1 }}
      >
        <SceneContents />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={1}
          maxDistance={5000}
        />
      </Canvas>

      {/* UI Layer */}
      <InfoPanel />
      <HUD />
      <LoadingScreen />
    </div>
  )
}
