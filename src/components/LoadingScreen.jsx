import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useStore } from '../store'

const LOADING_PHRASES = [
  'Initializing solar system...',
  'Calibrating Kepler mechanics...',
  'Loading PBR planet shaders...',
  'Synthesizing Milky Way skybox...',
  'Compiling corona shaders...',
  'Calibrating orbital velocities...',
  'Seeding exoplanet database...',
  'Engaging warp drive...',
]

export default function LoadingScreen() {
  const { loaded, loadingProgress } = useStore()
  const [phrase, setPhrase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPhrase(p => (p + 1) % LOADING_PHRASES.length)
    }, 700)
    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {!loaded && (
        <motion.div
          key="loading"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0,
            background: '#000',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 999, fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          {/* Animated rings */}
          <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 48 }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ rotate: 360 * (i % 2 === 0 ? 1 : -1) }}
                transition={{ duration: 3 + i * 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  inset: i * 16,
                  borderRadius: '50%',
                  border: `1px solid rgba(0,180,255,${0.4 - i * 0.1})`,
                  borderTopColor: i === 0 ? '#00d4ff' : i === 1 ? '#a78bfa' : '#ffd700',
                  borderLeftColor: 'transparent',
                  borderBottomColor: 'transparent',
                }}
              />
            ))}
            {/* Center star */}
            <div style={{
              position: 'absolute', inset: '50%',
              width: 20, height: 20,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fff8e0, #ffcc50, #ff8020)',
              boxShadow: '0 0 30px rgba(255,200,60,0.8), 0 0 60px rgba(255,100,20,0.4)',
            }} />
          </div>

          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 32, fontWeight: 900,
            letterSpacing: '0.35em',
            background: 'linear-gradient(90deg, #00d4ff, #a78bfa, #ffd700)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: 8,
          }}>
            PROJECT UNIVERSE
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: '#2a5070', letterSpacing: '0.3em', marginBottom: 48,
          }}>
            HELIOCENTRIC · PBR · KEPLER MECHANICS
          </div>

          {/* Progress bar */}
          <div style={{ width: 300, marginBottom: 16 }}>
            <div style={{
              height: 2, background: 'rgba(255,255,255,0.06)',
              borderRadius: 1, overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #00d4ff, #a78bfa)',
                  boxShadow: '0 0 10px rgba(0,212,255,0.8)',
                  borderRadius: 1,
                }}
              />
            </div>
          </div>

          <motion.div
            key={phrase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              color: '#2a6080', letterSpacing: '0.15em',
            }}
          >
            {LOADING_PHRASES[phrase]}
          </motion.div>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 12,
            color: '#00a0c0', marginTop: 10, fontWeight: 700,
          }}>
            {Math.round(loadingProgress)}%
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
