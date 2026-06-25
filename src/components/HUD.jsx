import { motion } from 'framer-motion'
import { useStore } from '../store'

export default function HUD() {
  const timeWarp = useStore(s => s.timeWarp)
  const setTimeWarp = useStore(s => s.setTimeWarp)
  const paused = useStore(s => s.paused)
  const togglePause = useStore(s => s.togglePause)
  const showOrbits = useStore(s => s.showOrbits)
  const toggleOrbits = useStore(s => s.toggleOrbits)

  return (
    <>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        padding: '18px 28px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 100,
      }}>
        <div>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 20, fontWeight: 900,
            letterSpacing: '0.35em',
            background: 'linear-gradient(90deg, #00d4ff, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            PROJECT UNIVERSE
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#2a5070', letterSpacing: '0.2em', marginTop: 3 }}>
            SOL SYSTEM · KEPLER MECHANICS · PBR RENDERING
          </div>
        </div>

        <div style={{ textAlign: 'right', pointerEvents: 'none' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#2a5070', letterSpacing: '0.15em' }}>
            8 PLANETS · 1 STAR · ELLIPTICAL ORBITS
          </div>
        </div>
      </div>

      {/* Left controls */}
      <div style={{
        position: 'fixed', left: 24, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 100,
      }}>
        <ControlBtn onClick={togglePause} title={paused ? 'Resume' : 'Pause'} active={paused}>
          {paused ? '▶' : '⏸'}
        </ControlBtn>
        <ControlBtn onClick={toggleOrbits} title="Toggle Orbits" active={showOrbits}>
          ⊙
        </ControlBtn>
        <ControlBtn onClick={() => setTimeWarp(1)} title="Reset Speed">
          ↺
        </ControlBtn>
      </div>

      {/* Time warp */}
      <div style={{
        position: 'fixed', bottom: 28, left: 24,
        background: 'rgba(4,10,28,0.8)',
        border: '1px solid rgba(0,180,255,0.15)',
        backdropFilter: 'blur(16px)',
        borderRadius: 14, padding: '14px 18px',
        minWidth: 160, zIndex: 100,
      }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#00b4ff', letterSpacing: '0.2em', marginBottom: 10 }}>
          ⏱ TIME WARP
        </div>
        <input
          type="range" min="0" max="100" step="1"
          value={Math.sqrt(timeWarp) * 10}
          onChange={e => setTimeWarp(Math.pow(e.target.value / 10, 2))}
          style={{ width: '100%', accentColor: '#00d4ff', cursor: 'pointer' }}
        />
        <div style={{
          fontFamily: "'Orbitron', monospace", fontSize: 14, fontWeight: 700,
          color: '#c0e0f0', textAlign: 'center', marginTop: 8,
        }}>
          {timeWarp.toFixed(1)}×
        </div>
      </div>

      {/* Bottom hints */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        style={{
          position: 'fixed', bottom: 28,
          left: '37%', transform: 'translateX(-50%)',
          display: 'flex', gap: 12, zIndex: 100,
        }}
      >
        {[['DRAG', 'Orbit'], ['SCROLL', 'Zoom'], ['CLICK', 'Focus'], ['ESC', 'Reset']].map(([key, label]) => (
          <HintChip key={key} keyLabel={key} label={label} />
        ))}
      </motion.div>
    </>
  )
}

function ControlBtn({ onClick, children, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 38, height: 38,
        background: active ? 'rgba(0,180,255,0.15)' : 'rgba(4,10,28,0.8)',
        border: `1px solid ${active ? 'rgba(0,180,255,0.4)' : 'rgba(0,180,255,0.15)'}`,
        backdropFilter: 'blur(12px)',
        borderRadius: 10, color: active ? '#00d4ff' : '#4a7090',
        fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(0,180,255,0.5)'; e.currentTarget.style.color = '#00d4ff' }}
      onMouseOut={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(0,180,255,0.15)'; e.currentTarget.style.color = '#4a7090' } }}
    >
      {children}
    </button>
  )
}

function HintChip({ keyLabel, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: 'rgba(0,0,0,0.5)',
      border: '1px solid rgba(0,180,255,0.12)',
      borderRadius: 20, padding: '6px 12px',
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: 11, color: '#2a5070', letterSpacing: '0.05em',
    }}>
      <span style={{
        background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.25)',
        borderRadius: 4, padding: '1px 6px',
        fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#00a0c0',
      }}>{keyLabel}</span>
      {label}
    </div>
  )
}

function WarpGateBtn({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(135deg, rgba(60,0,120,0.6), rgba(0,20,80,0.6))',
        border: '1px solid rgba(160,100,255,0.4)',
        backdropFilter: 'blur(16px)',
        borderRadius: 12, padding: '12px 18px',
        cursor: 'pointer', color: '#c090ff',
        fontFamily: "'Orbitron', monospace", fontSize: 11,
        fontWeight: 700, letterSpacing: '0.2em',
        boxShadow: '0 0 20px rgba(120,60,255,0.2)',
      }}
    >
      <span style={{ fontSize: 16 }}>⬡</span>
      WARP GATE
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: '#8060c0' }}>EXOPLANETS</span>
    </motion.button>
  )
}

function BackBtn({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(0,20,40,0.7)',
        border: '1px solid rgba(0,180,255,0.3)',
        backdropFilter: 'blur(16px)',
        borderRadius: 12, padding: '12px 18px',
        cursor: 'pointer', color: '#00d4ff',
        fontFamily: "'Orbitron', monospace", fontSize: 11,
        fontWeight: 700, letterSpacing: '0.2em',
      }}
    >
      ← SOLAR SYSTEM
    </motion.button>
  )
}

function ExoplanetSelector() {
  const { selectBody, selectedBody } = useStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: 'fixed', bottom: 80,
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 10, zIndex: 100,
        flexWrap: 'wrap', justifyContent: 'center',
        maxWidth: 800,
      }}
    >
      {EXOPLANETS.map((exo, i) => (
        <motion.button
          key={exo.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          onClick={() => selectBody(exo)}
          style={{
            background: selectedBody?.id === exo.id ? 'rgba(0,180,255,0.15)' : 'rgba(4,10,28,0.8)',
            border: `1px solid ${selectedBody?.id === exo.id ? 'rgba(0,180,255,0.5)' : 'rgba(0,180,255,0.15)'}`,
            backdropFilter: 'blur(12px)',
            borderRadius: 10, padding: '8px 14px',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 10,
            color: exo.isHabitable ? '#00c864' : '#ff6040',
            letterSpacing: '0.1em', fontWeight: 700,
          }}>{exo.name}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: '#2a5070', marginTop: 2 }}>
            {exo.distance}
          </div>
        </motion.button>
      ))}
    </motion.div>
  )
}
