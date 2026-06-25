import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { StarfieldFragmentShader, StarfieldVertexShader } from '../shaders'
import { useStore } from '../store'
import { SOLAR_SYSTEM } from '../data/planets'

// ──────────────────────────────────────────────
// HDR MILKY WAY STARFIELD
// ──────────────────────────────────────────────
export function Starfield() {
  const ref = useRef()
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: StarfieldVertexShader,
    fragmentShader: StarfieldFragmentShader,
    uniforms: { uTime: { value: 0 } },
    side: THREE.BackSide,
    depthWrite: false,
  }), [])
  
  const geo = useMemo(() => new THREE.SphereGeometry(10000, 64, 64), [])
  const starsRef = useRef()

  useFrame(state => { 
    mat.uniforms.uTime.value = state.clock.elapsedTime 
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.005
      starsRef.current.rotation.x = state.clock.elapsedTime * 0.002
    }
  })

  // Static high-density star layer for depth
  const staticStars = useMemo(() => {
    const count = 3000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = 9000
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      sizes[i] = Math.random() * 2
    }
    return { positions, sizes }
  }, [])

  return (
    <group>
      {/* Dynamic Nebula Layer */}
      <mesh ref={ref} geometry={geo} material={mat} />
      
      {/* Static Distant Star Layer */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[staticStars.positions, 3]} />
          <bufferAttribute attach="attributes-size" args={[staticStars.sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial 
          size={1.5} 
          sizeAttenuation={false} 
          color="#ffffff" 
          transparent 
          opacity={0.8} 
          blending={THREE.AdditiveBlending} 
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ──────────────────────────────────────────────
// CINEMATIC CAMERA CONTROLLER
// Spline-interpolated fly-by to selected planets
// ──────────────────────────────────────────────
function lerpV3(a, b, t) {
  return new THREE.Vector3(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.z + (b.z - a.z) * t
  )
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4)
}

export function CameraController() {
  const { camera, controls } = useThree()
  const { selectedBody, isTransitioning, setTransitioning, showExoplanets } = useStore()

  const transitionRef = useRef({
    active: false,
    t: 0,
    fromPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
    splineMid: new THREE.Vector3(),
    duration: 2.5,
  })

  const orbitRef = useRef({ theta: 0.4, phi: 0.35, dist: 85, target: new THREE.Vector3(0, 0, 0) })

  // Get planet world position from its orbit params
  function getPlanetPos(body) {
    if (!body || body.isStar) return new THREE.Vector3(0, 0, 0)
    const sma = body.orbitSMA ?? 20
    const ecc = body.eccentricity ?? 0
    const b = sma * Math.sqrt(1 - ecc * ecc)
    const focus = sma * ecc
    // Use approximate current angle
    const angle = Math.random() * Math.PI * 2  // Will snap to live orbit
    return new THREE.Vector3(sma * Math.cos(angle) - focus, 0, b * Math.sin(angle))
  }

  useEffect(() => {
    if (!selectedBody || !isTransitioning) return

    const tr = transitionRef.current
    tr.fromPos.copy(camera.position)
    tr.fromTarget.copy(new THREE.Vector3(0, 0, 0)) // approximate

    if (selectedBody.isStar) {
      // Fly toward Sun from outside
      tr.toPos.set(8, 3, 8)
      tr.toTarget.set(0, 0, 0)
    } else {
      // Find planet roughly
      const dist = (selectedBody.displayRadius ?? 1) * 5 + 4
      const sma = selectedBody.orbitSMA ?? 20
      const approxAngle = Math.PI * 0.7
      const px = sma * Math.cos(approxAngle)
      const pz = sma * Math.sin(approxAngle)
      tr.toTarget.set(px, 0, pz)
      tr.toPos.set(px + dist * 0.7, dist * 0.5, pz + dist * 0.7)
    }

    // Spline mid-point (arc upward for cinematic effect)
    tr.splineMid.set(
      (tr.fromPos.x + tr.toPos.x) * 0.5,
      Math.max(tr.fromPos.y, tr.toPos.y) + 20,
      (tr.fromPos.z + tr.toPos.z) * 0.5
    )

    tr.t = 0
    tr.active = true
    tr.duration = selectedBody.isStar ? 2.0 : 2.8

  }, [selectedBody, isTransitioning])

  useFrame((state, delta) => {
    const tr = transitionRef.current

    if (tr.active) {
      tr.t = Math.min(tr.t + delta / tr.duration, 1.0)
      const et = easeInOutCubic(tr.t)

      // Quadratic Bezier spline
      const p0 = tr.fromPos, p1 = tr.splineMid, p2 = tr.toPos
      const q0 = lerpV3(p0, p1, et)
      const q1 = lerpV3(p1, p2, et)
      const bezier = lerpV3(q0, q1, et)

      camera.position.copy(bezier)
      const lookTarget = lerpV3(tr.fromTarget, tr.toTarget, easeOutQuart(tr.t))
      camera.lookAt(lookTarget)

      if (tr.t >= 1.0) {
        tr.active = false
        setTransitioning(false)
      }
    }
  })

  return null
}

// ──────────────────────────────────────────────
// ORBIT CONTROLS WRAPPER
// ──────────────────────────────────────────────
export function SceneSetup() {
  return null
}
