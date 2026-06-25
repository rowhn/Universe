import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SunVertexShader, SunFragmentShader, CoronaVertexShader, CoronaFragmentShader } from '../shaders'
import { useStore } from '../store'
import { SUN_DATA } from '../data/planets'

export default function Sun() {
  const { camera } = useThree()
  const meshRef = useRef()
  const coronaRef = useRef()
  const corona2Ref = useRef()
  const glowRef = useRef()
  const selectBody = useStore(s => s.selectBody)

  const sunMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: SunVertexShader,
    fragmentShader: SunFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#fff8e0') },  // Core
      uColorB: { value: new THREE.Color('#ff9020') },  // Mid
      uColorC: { value: new THREE.Color('#ff4000') },  // Limb
    }
  }), [])

  const coronaMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CoronaVertexShader,
    fragmentShader: CoronaFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#ffcc50') },
      uIntensity: { value: 1.2 },
    },
    transparent: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  const corona2Material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CoronaVertexShader,
    fragmentShader: CoronaFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#ff8020') },
      uIntensity: { value: 0.5 },
    },
    transparent: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  const glowMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#ff4000') },
      uIntensity: { value: 1.0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uTime;
      void main() {
        float dist = length(vUv - 0.5) * 2.0;
        float alpha = exp(-dist * 4.0) * uIntensity;
        // Animated subtle flicker
        alpha *= 0.85 + 0.15 * sin(uTime * 2.0);
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  const sunGeo = useMemo(() => new THREE.SphereGeometry(6.0, 64, 64), [])
  const coronaGeo = useMemo(() => new THREE.SphereGeometry(7.2, 48, 48), [])
  const corona2Geo = useMemo(() => new THREE.SphereGeometry(9.0, 32, 32), [])
  const planeGeo = useMemo(() => new THREE.PlaneGeometry(45, 45), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    sunMaterial.uniforms.uTime.value = t
    coronaMaterial.uniforms.uTime.value = t
    corona2Material.uniforms.uTime.value = t
    glowMaterial.uniforms.uTime.value = t
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.03
    }
    // Pulsing corona
    if (coronaRef.current) {
      const pulse = 1.0 + Math.sin(t * 0.3) * 0.03
      coronaRef.current.scale.setScalar(pulse)
    }
    if (corona2Ref.current) {
      const pulse2 = 1.0 + Math.sin(t * 0.2 + 1.0) * 0.05
      corona2Ref.current.scale.setScalar(pulse2)
    }
    if (glowRef.current) {
      glowRef.current.lookAt(camera.position)
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    selectBody({ ...SUN_DATA, id: 'sun', isStar: true })
  }

  return (
    <group>
      {/* Point lights — higher intensity for better Bloom interaction */}
      <pointLight position={[0, 0, 0]} intensity={15} distance={500} decay={0.5} color="#fff5e0" />
      <pointLight position={[0, 0, 0]} intensity={5} distance={200} decay={0} color="#ffaa40" />

      {/* Sun sphere */}
      <mesh ref={meshRef} onClick={handleClick} geometry={sunGeo} material={sunMaterial} />

      {/* Inner corona */}
      <mesh ref={coronaRef} geometry={coronaGeo} material={coronaMaterial} />

      {/* Outer corona */}
      <mesh ref={corona2Ref} geometry={corona2Geo} material={corona2Material} />

      {/* Global Sun Glow */}
      <mesh ref={glowRef} geometry={planeGeo} material={glowMaterial} />

      {/* Solar flare streaks */}
      {[0, 1, 2, 3].map(i => (
        <SolarFlare key={i} index={i} />
      ))}
    </group>
  )
}

function SolarFlare({ index }) {
  const ref = useRef()
  const angle = (index / 4) * Math.PI * 2
  const length = 2 + Math.random() * 3

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CoronaVertexShader,
    fragmentShader: CoronaFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#ff6010') },
      uIntensity: { value: 0.8 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  useFrame(state => {
    const t = state.clock.elapsedTime
    mat.uniforms.uTime.value = t
    if (ref.current) {
      ref.current.rotation.z = angle + t * 0.05 * (index % 2 === 0 ? 1 : -1)
      const scale = 0.8 + Math.sin(t * 0.4 + index * 1.5) * 0.3
      ref.current.scale.set(1, scale, 1)
    }
  })

  return (
    <mesh ref={ref} rotation={[0, 0, angle]}>
      <sphereGeometry args={[3.5 + length, 16, 16]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}
