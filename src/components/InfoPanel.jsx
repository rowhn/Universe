import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

export default function InfoPanel() {
  const { panelOpen, panelData: body, closePanel, marsWeather, marsWeatherLoading } = useStore()

  if (!body) return null

  const isSun = body.isStar
  const isMars = body.id === 'mars'

  return (
    <AnimatePresence>
      {panelOpen && (
        <motion.div
          key="panel"
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 180 }}
          style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 400,
            background: 'rgba(4, 10, 28, 0.75)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderLeft: '1px solid rgba(0, 180, 255, 0.15)',
            zIndex: 300,
            overflowY: 'auto',
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          {/* Header */}
          <div style={{
            position: 'sticky', top: 0,
            padding: '30px 28px 22px',
            background: 'rgba(2, 6, 20, 0.85)',
            borderBottom: '1px solid rgba(0,180,255,0.12)',
            backdropFilter: 'blur(12px)',
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 26, fontWeight: 900,
                  letterSpacing: '0.1em',
                  color: isSun ? '#ffcc50' : body.color || '#e8f4fd',
                  textShadow: isSun ? `0 0 20px rgba(255,200,60,0.6)` : `0 0 15px ${body.color}60`,
                  lineHeight: 1.1, marginBottom: 6,
                }}>
                  {body.name.toUpperCase()}
                </div>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10, color: '#4a7090',
                  letterSpacing: '0.2em', textTransform: 'uppercase'
                }}>
                  {body.type || 'Astronomical Body'}
                </div>
              </div>
              <button onClick={closePanel} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(0,180,255,0.2)',
                borderRadius: '50%', width: 32, height: 32,
                color: '#4a7090', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,60,60,0.15)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >✕</button>
            </div>
          </div>

          <div style={{ padding: '22px 28px' }}>
            {/* Sun special display */}
            {isSun && (
              <SunStats body={body} />
            )}

            {/* Planet stats */}
            {!isSun && (
              <>
                <Section label="Orbital Mechanics">
                  <StatsGrid>
                    <StatCard label="Distance" value={body.orbitSMA ? `${body.orbitSMA} AU` : '—'} unit="from sun" />
                    <StatCard label="Orbital Period" value={body.orbitalPeriod ? `${body.orbitalPeriod} yr` : '—'} unit="Earth equivalent" />
                    {body.eccentricity && <StatCard label="Eccentricity" value={body.eccentricity} unit="Kepler ellipse" />}
                    {body.axialTilt && <StatCard label="Axial Tilt" value={`${body.axialTilt}°`} unit={body.axialTilt > 90 ? 'RETROGRADE' : 'prograde'} />}
                  </StatsGrid>
                </Section>

                <Section label="Physical Properties">
                  <StatsGrid>
                    <StatCard label="Mass" value={body.mass || '—'} unit="" />
                    <StatCard label="Surface Gravity" value={body.gravity || '—'} unit="" />
                    <StatCard label="Temperature" value={body.temperature || '—'} unit="" />
                    <StatCard label="Natural Moons" value={body.moons ?? '—'} unit="confirmed" />
                    {body.dayLength && <StatCard label="Day Length" value={body.dayLength} unit="" />}
                    {body.roughness && <StatCard label="PBR Roughness" value={body.roughness.toFixed(2)} unit="surface albedo" />}
                  </StatsGrid>
                </Section>

                {/* Mars live weather */}
                {isMars && (
                  <Section label="🔴 Perseverance Rover — Live Weather">
                    {marsWeatherLoading ? (
                      <div style={{ color: '#4a7090', fontFamily: "'Space Mono', monospace", fontSize: 11, padding: '12px 0' }}>
                        Contacting MEDA instrument...
                      </div>
                    ) : marsWeather ? (
                      <div>
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#4a7090', letterSpacing: '0.2em' }}>SOL {marsWeather.sol} — {marsWeather.season}</span>
                        </div>
                        <StatsGrid>
                          <StatCard label="Min Temp" value={`${marsWeather.minTemp}°C`} unit="" accent="#60a0ff" />
                          <StatCard label="Max Temp" value={`${marsWeather.maxTemp}°C`} unit="" accent="#ff8040" />
                          <StatCard label="Wind Speed" value={`${marsWeather.windSpeed} m/s`} unit="" />
                          <StatCard label="Pressure" value={`${marsWeather.pressure} Pa`} unit="surface" />
                          <StatCard label="Dust Opacity" value={marsWeather.dustOpacity} unit="tau (atm)" />
                        </StatsGrid>
                        <div style={{ marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: 8, color: '#2a5070', letterSpacing: '0.1em' }}>
                          SOURCE: {marsWeather.source}
                        </div>
                      </div>
                    ) : null}
                  </Section>
                )}

                <Section label="Overview">
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: '#6090b0', fontWeight: 400 }}>
                    {body.overview || 'No data available.'}
                  </p>
                </Section>

                {body.funFact && (
                  <div style={{
                    background: 'rgba(0,180,255,0.05)',
                    border: '1px solid rgba(0,180,255,0.15)',
                    borderRadius: 12, padding: '14px 16px', marginBottom: 20,
                  }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#00b4ff', letterSpacing: '0.2em', marginBottom: 8 }}>◆ COSMIC FACT</div>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: '#5080a0', fontStyle: 'italic' }}>{body.funFact}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SunStats({ body }) {
  return (
    <>
      <Section label="Stellar Properties">
        <StatsGrid>
          <StatCard label="Type" value="G2V" unit="Main Sequence" />
          <StatCard label="Age" value={body.age || '4.6 Gyr'} unit="" accent="#ffcc50" />
          <StatCard label="Surface Temp" value={body.surfaceTemp || '5,778 K'} unit="" />
          <StatCard label="Core Temp" value={body.coreTemp || '15M K'} unit="" accent="#ff6020" />
          <StatCard label="Mass" value={body.mass || '1.99 × 10³⁰ kg'} unit="" />
          <StatCard label="Radius" value={body.radius || '696,340 km'} unit="" />
        </StatsGrid>
      </Section>
      <Section label="Overview">
        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#6090b0' }}>{body.overview}</p>
      </Section>
      {body.funFact && (
        <div style={{ background: 'rgba(255,200,60,0.06)', border: '1px solid rgba(255,200,60,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#ffcc50', letterSpacing: '0.2em', marginBottom: 8 }}>◆ SOLAR FACT</div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#a08040', fontStyle: 'italic' }}>{body.funFact}</p>
        </div>
      )}
    </>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 14,
      }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#00b4ff', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,180,255,0.3), transparent)' }} />
      </div>
      {children}
    </div>
  )
}

function StatsGrid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {children}
    </div>
  )
}

function StatCard({ label, value, unit, accent }) {
  return (
    <div style={{
      background: 'rgba(0,180,255,0.04)',
      border: '1px solid rgba(0,180,255,0.09)',
      borderRadius: 10, padding: '10px 12px',
    }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#2a5070', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, color: accent || '#c0e0f0' }}>{value || '—'}</div>
      {unit && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: '#2a4560', marginTop: 2 }}>{unit}</div>}
    </div>
  )
}
