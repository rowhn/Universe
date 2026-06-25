import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  PlanetVertexShader, PlanetFragmentShader,
  AtmosphereVertexShader, AtmosphereFragmentShader,
  CloudVertexShader, CloudFragmentShader,
  RingVertexShader, RingFragmentShader
} from '../shaders'
import { useStore } from '../store'

const SUN_POSITION = new THREE.Vector3(0, 0, 0)

// Kepler ellipse: x = a*cos(E), z = b*sin(E), b = a*sqrt(1 - e^2)
function getOrbitPosition(sma, ecc, angle) {
  const b = sma * Math.sqrt(1 - ecc * ecc)
  const focus = sma * ecc  // Sun at focus
  return {
    x: sma * Math.cos(angle) - focus,
    z: b * Math.sin(angle)
  }
}

// PlanetType mapping
const PLANET_TYPE_MAP = {
  rocky: 0, venus: 0, mars: 4, earth: 3, gas_giant: 1, ice_giant: 2,
  hot_jupiter: 1, ocean_world: 3
}

export default function Planet({ data, isExoplanet = false }) {
  const meshRef = useRef()
  const cloudRef = useRef()
  const groupRef = useRef()
  const orbitRef = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)

  const selectBody = useStore(s => s.selectBody)
  const hoverBody = useStore(s => s.hoverBody)
  const hoveredBody = useStore(s => s.hoveredBody)
  const selectedBody = useStore(s => s.selectedBody)
  const showOrbits = useStore(s => s.showOrbits)
  const showLabels = useStore(s => s.showLabels)
  const timeWarp = useStore(s => s.timeWarp)
  const paused = useStore(s => s.paused)

  const isSelected = selectedBody?.id === data.id
  const isHovered = hoveredBody?.id === data.id

  // For exoplanets, we use a simpler circular orbit with some vertical wobble
  const exoOrbitR = useMemo(() => 8 + (data.index || 0) * 5, [data.index])
  const exoSpeed = useMemo(() => 0.003 / ((data.index || 0) + 1), [data.index])

  const planetType = PLANET_TYPE_MAP[data.texture?.type || 'rocky']

  // PBR material
  const planetMaterial = useMemo(() => {
    const tex = data.texture || {}
    const c1 = new THREE.Color(tex.surfaceColor1 || tex.oceanColor || data.color || '#888')
    const c2 = new THREE.Color(tex.surfaceColor2 || tex.landColor || '#666')
    const c3 = new THREE.Color(tex.surfaceColor3 || tex.cloudColor || '#aaa')

    return new THREE.ShaderMaterial({
      vertexShader: PlanetVertexShader,
      fragmentShader: PlanetFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: c1 },
        uColor2: { value: c2 },
        uColor3: { value: c3 },
        uEmissive: { value: new THREE.Color(data.emissiveColor || '#000') },
        uSunPosition: { value: SUN_POSITION },
        uRoughness: { value: data.roughness ?? 0.7 },
        uMetalness: { value: data.metalness ?? 0.0 },
        uPlanetType: { value: planetType },
        uSelected: { value: 0 },
      }
    })
  }, [data.id])

  // Atmosphere material
  const atmosphereMaterial = useMemo(() => {
    if (!data.hasAtmosphere) return null
    return new THREE.ShaderMaterial({
      vertexShader: AtmosphereVertexShader,
      fragmentShader: AtmosphereFragmentShader,
      uniforms: {
        uAtmosphereColor: { value: new THREE.Color(data.atmosphereColor || '#4488ff') },
        uOpacity: { value: data.atmosphereOpacity ?? 0.3 },
        uSunPosition: { value: SUN_POSITION },
      },
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [data.id])

  // Cloud material
  const cloudMaterial = useMemo(() => {
    if (!data.hasClouds) return null
    return new THREE.ShaderMaterial({
      vertexShader: CloudVertexShader,
      fragmentShader: CloudFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uCloudColor: { value: new THREE.Color(data.cloudColor || '#ffffff') },
        uCloudSpeed: { value: data.cloudSpeed ?? 0.002 },
        uSunPosition: { value: SUN_POSITION },
      },
      transparent: true,
      depthWrite: false,
    })
  }, [data.id])

  // Ring material
  const ringMaterial = useMemo(() => {
    if (!data.hasRings) return null
    return new THREE.ShaderMaterial({
      vertexShader: RingVertexShader,
      fragmentShader: RingFragmentShader,
      uniforms: {
        uRingColor: { value: new THREE.Color(data.ringColor || '#c8b878') },
        uInnerRadius: { value: data.ringInnerRadius ?? 1.3 },
        uOuterRadius: { value: data.ringOuterRadius ?? 2.2 },
        uSunPosition: { value: SUN_POSITION },
        uTime: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }, [data.id])

  // Orbit line geometry
  const orbitPoints = useMemo(() => {
    const pts = []
    const sma = isExoplanet ? exoOrbitR : data.orbitSMA
    const ecc = isExoplanet ? 0 : (data.eccentricity ?? 0)
    const segments = 256
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      const pos = getOrbitPosition(sma, ecc, a)
      pts.push(new THREE.Vector3(pos.x, 0, pos.z))
    }
    return pts
  }, [data.id, isExoplanet, exoOrbitR])

  const trailPoints = useMemo(() => {
    const count = 20
    const positions = new Float32Array(count * 3)
    return positions
  }, [])

  const trailRef = useRef()

  useFrame((state, delta) => {
    if (!paused) {
      if (!isExoplanet) {
        // Kepler's second law — speed proportional to 1/r² near focus
        const pos = getOrbitPosition(data.orbitSMA, data.eccentricity, angleRef.current)
        const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
        const baseSpeed = (2 * Math.PI / data.orbitalPeriod) * 0.00015
        const keplerSpeed = baseSpeed * (data.orbitSMA * data.orbitSMA) / (r * r) * timeWarp
        angleRef.current += keplerSpeed
      } else {
        // Simple exoplanet orbit
        angleRef.current += exoSpeed * timeWarp * 1.5
      }
    }

    if (groupRef.current) {
      if (isExoplanet) {
        groupRef.current.position.x = Math.cos(angleRef.current) * exoOrbitR
        groupRef.current.position.z = Math.sin(angleRef.current) * exoOrbitR
        groupRef.current.position.y = Math.sin(angleRef.current * 0.3 + (data.index || 0)) * 0.5
      } else {
        const orbitPos = getOrbitPosition(data.orbitSMA, data.eccentricity, angleRef.current)
        groupRef.current.position.x = orbitPos.x
        groupRef.current.position.z = orbitPos.z
        groupRef.current.position.y = 0
      }
    }

    // Trail logic
    if (trailRef.current && !paused) {
      const positions = trailRef.current.geometry.attributes.position.array
      for (let i = 19; i > 0; i--) {
        positions[i * 3] = positions[(i - 1) * 3]
        positions[i * 3 + 1] = positions[(i - 1) * 3 + 1]
        positions[i * 3 + 2] = positions[(i - 1) * 3 + 2]
      }
      positions[0] = groupRef.current.position.x
      positions[1] = groupRef.current.position.y
      positions[2] = groupRef.current.position.z
      trailRef.current.geometry.attributes.position.needsUpdate = true
    }

    // Planet rotation (self)
    if (meshRef.current && !paused) {
      const rotSpeed = (1 / Math.abs(data.rotationPeriod || 1)) * 0.001 * timeWarp
      const dir = data.rotationPeriod < 0 ? -1 : 1
      meshRef.current.rotation.y += rotSpeed * dir
    }

    // Cloud drift
    if (cloudRef.current && cloudMaterial && !paused) {
      cloudRef.current.rotation.y += 0.0003 * timeWarp
      cloudMaterial.uniforms.uTime.value = state.clock.elapsedTime
    }

    // Update planet shader
    if (planetMaterial) {
      planetMaterial.uniforms.uTime.value = state.clock.elapsedTime
      planetMaterial.uniforms.uSelected.value = isSelected || isHovered ? 1.0 : 0.0
    }

    if (ringMaterial) ringMaterial.uniforms.uTime.value = state.clock.elapsedTime
  })

  const handleClick = (e) => {
    e.stopPropagation()
    selectBody(data)
  }

  const r = data.displayRadius ?? 1
  const planetGeo = useMemo(() => new THREE.SphereGeometry(r, 64, 64), [r])
  const cloudGeo = useMemo(() => new THREE.SphereGeometry(r * 1.02, 64, 64), [r])
  const atmosphereGeo = useMemo(() => new THREE.SphereGeometry(r * 1.15, 64, 64), [r])
  const ringGeo = useMemo(() => new THREE.RingGeometry(
    r * (data.ringInnerRadius ?? 1.4),
    r * (data.ringOuterRadius ?? 2.4),
    128
  ), [r, data.ringInnerRadius, data.ringOuterRadius])

  return (
    <>
      {/* Orbit line */}
      {showOrbits && orbitPoints && (
        <line ref={orbitRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(orbitPoints.flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={isSelected ? '#00d4ff' : isHovered ? '#ffffff' : '#445566'}
            opacity={isSelected ? 0.9 : isHovered ? 0.6 : 0.25}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            linewidth={isSelected ? 2 : 1}
          />
        </line>
      )}

      {/* Orbital trail */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[trailPoints, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isSelected ? 3 : 2}
          color={data.color || '#ffffff'}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </points>

      {/* Planet group */}
      <group ref={groupRef}>
        {/* Axial tilt group */}
        <group rotation={[0, 0, (data.axialTilt || 0) * Math.PI / 180]}>

          {/* Planet mesh */}
          <mesh
            ref={meshRef}
            onClick={handleClick}
            onPointerOver={(e) => { e.stopPropagation(); hoverBody(data) }}
            onPointerOut={() => hoverBody(null)}
            geometry={planetGeo}
            material={planetMaterial}
          />

          {/* Clouds layer */}
          {cloudMaterial && (
            <mesh ref={cloudRef} geometry={cloudGeo} material={cloudMaterial} />
          )}

          {/* Atmosphere layer */}
          {atmosphereMaterial && (
            <mesh geometry={atmosphereGeo} material={atmosphereMaterial} />
          )}

          {/* Rings layer */}
          {ringMaterial && (
            <mesh rotation={[Math.PI / 2.2, 0, 0]} geometry={ringGeo} material={ringMaterial} />
          )}
        </group>

        {/* Label */}
        {showLabels && (
          <Html
            position={[0, r * 1.6, 0]}
            center
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            occlude={[meshRef]}
          >
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: isSelected ? '#00d4ff' : isHovered ? '#80e0ff' : '#4a7090',
              textShadow: isSelected ? '0 0 12px rgba(0,212,255,0.8)' : 'none',
              whiteSpace: 'nowrap',
              transition: 'color 0.3s',
              fontWeight: isSelected ? 700 : 400,
            }}>
              {data.name.toUpperCase()}
            </div>
          </Html>
        )}
      </group>
    </>
  )
}
