import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EXOPLANETS } from '../data/planets'
import { useStore } from '../store'
import Planet from './Planet'

export default function ExoplanetScene() {
  const { timeWarp, paused } = useStore()

  return (
    <group>
      {/* Red dwarf star for exoplanet system */}
      <RedDwarf />

      {/* Exoplanets arranged in space */}
      {EXOPLANETS.map((exo, i) => (
        <Planet 
          key={exo.id} 
          data={{ ...exo, index: i }} 
          isExoplanet={true}
          timeWarp={timeWarp}
          paused={paused}
        />
      ))}
    </group>
  )
}

function RedDwarf() {
  const ref = useRef()
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ff3010'),
  }), [])

  useFrame(s => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.05
  })

  return (
    <group>
      <pointLight position={[0,0,0]} intensity={3} distance={200} color="#ff4020" decay={1} />
      <mesh ref={ref}>
        <sphereGeometry args={[2, 32, 32]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* Red dwarf glow */}
      <mesh>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial color="#ff2010" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}
