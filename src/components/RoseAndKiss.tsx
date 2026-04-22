import { memo, useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { COPY, ROSE_KISSES_FOR_FULL_BLOOM } from '../config'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { fireConfetti } from '../utils/confettiLazy'
import { istCalendarDateKey } from '../utils/istCalendar'

const LS_LAST_KISS = 'ka-last-kiss-ist'
const LS_KISS_TOTAL = 'ka-kiss-total'

/** Secret phrase for “Reset today’s kiss” modal (trimmed). */
const KISS_RESET_PASSWORD = 'loveyou'

const KISS_PALETTES = [
  ['#ff8fab', '#ffd6e8', '#e8d9ff', '#fff'],
  ['#f472b6', '#fbcfe8', '#ddd6fe', '#fff'],
  ['#fb7185', '#fecdd3', '#e9d5ff', '#fff1f2'],
  ['#ec4899', '#fce7f3', '#c4b5fd', '#ffffff'],
  ['#db2777', '#fbcfe8', '#a78bfa', '#fff'],
  ['#be185d', '#fda4af', '#818cf8', '#fdf2f8'],
] as const

const KISS_EMOJI_BURST = ['💋', '💕', '😘', '💖', '✨', '💗'] as const

/** Butterflies around the rose: min always flying; scales up toward full bloom */
const MIN_BUTTERFLIES = 3
const MAX_BUTTERFLIES = 12

const BUTTERFLY_ORBIT_STEPS = 24

/** Orbit wraps from above the bloom down past the pot base (SVG y grows downward) */
const POT_ORBIT_BOTTOM_Y = 253
const FLOW_ORBIT_TOP_OFFSET = 56
const ORBIT_RX_BASE = 52

const BAR_GRADIENTS = [
  'from-pink-400 via-rose-400 to-violet-400',
  'from-fuchsia-400 via-pink-400 to-rose-400',
  'from-rose-400 via-orange-300 to-pink-500',
  'from-purple-400 via-pink-400 to-rose-300',
  'from-pink-500 via-red-300 to-purple-400',
  'from-violet-400 via-fuchsia-300 to-rose-400',
] as const

type Props = {
  glass: string
  muted: string
}

function RoseAndKissComponent({ glass, muted }: Props) {
  const svgId = useId().replace(/:/g, '')
  const stemPotGradId = `roseStemPot-${svgId}`
  const petalGradId = `rosePetal-${svgId}`
  const potGradId = `rosePot-${svgId}`
  const waterGradId = `roseWater-${svgId}`

  const istToday = istCalendarDateKey()

  const [lastKissIst, setLastKissIst] = useLocalStorage<string | null>(LS_LAST_KISS, null)
  const [kissTotal, setKissTotal] = useLocalStorage<number>(LS_KISS_TOTAL, 0)
  const [kissBurst, setKissBurst] = useState<{ id: number; x: number; y: number; emoji: string }[]>([])
  const burstIdRef = useRef(0)
  const kissBusyRef = useRef(false)
  const [denyShake, setDenyShake] = useState(false)
  const [potPulseKey, setPotPulseKey] = useState(0)
  const [waterPourKey, setWaterPourKey] = useState(0)
  const [undoModalOpen, setUndoModalOpen] = useState(false)
  const [undoPassword, setUndoPassword] = useState('')
  const [undoPasswordError, setUndoPasswordError] = useState(false)
  const undoPasswordInputRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion()

  const kisses = kissTotal ?? 0
  const roseProgress = Math.min(1, kisses / ROSE_KISSES_FOR_FULL_BLOOM)
  const roseComplete = kisses >= ROSE_KISSES_FOR_FULL_BLOOM

  const canKissToday = lastKissIst !== istToday
  const variant = kisses % KISS_PALETTES.length
  const kissLoveProgress = roseProgress

  const stemH = 24 + roseProgress * 72
  const budScale = 0.35 + roseProgress * 0.65
  const leafScale = 0.2 + roseProgress * 0.85
  const petalOpen = roseProgress

  const { butterflyOrbitCy, butterflyRing } = useMemo(() => {
    const n = Math.max(
      MIN_BUTTERFLIES,
      Math.min(MAX_BUTTERFLIES, 1 + Math.round((kisses / ROSE_KISSES_FOR_FULL_BLOOM) * (MAX_BUTTERFLIES - 1))),
    )
    const stemHLocal = 24 + roseProgress * 72
    const budScaleLocal = 0.35 + roseProgress * 0.65
    const bloomCenterY = 248 - stemHLocal - 42 * budScaleLocal
    const flowerTopY = bloomCenterY - FLOW_ORBIT_TOP_OFFSET
    const orbitCy = (POT_ORBIT_BOTTOM_Y + flowerTopY) / 2
    const orbitRy = (POT_ORBIT_BOTTOM_Y - flowerTopY) / 2 + 6
    const ring = Array.from({ length: n }, (_, i) => {
      const base = (i / Math.max(n, 1)) * Math.PI * 2 + i * 0.37
      const rx = ORBIT_RX_BASE + (i % 5) * 4
      const orbitXs: number[] = []
      const orbitYs: number[] = []
      for (let k = 0; k <= BUTTERFLY_ORBIT_STEPS; k++) {
        const ang = (k / BUTTERFLY_ORBIT_STEPS) * Math.PI * 2 + base
        orbitXs.push(rx * Math.cos(ang))
        orbitYs.push(orbitRy * Math.sin(ang))
      }
      const orbitTimes = orbitXs.map((_, k) => k / BUTTERFLY_ORBIT_STEPS)
      return {
        orbitXs,
        orbitYs,
        orbitTimes,
        orbitDuration: 9 + (i % 8) * 1.85,
        phase: i * 0.45,
        dur: 4.2 + (i % 5) * 0.55,
        scale: 0.28 + (i % 3) * 0.035,
        flip: i % 2 === 1,
        wingA: i % 3 === 0 ? '#f9a8d4' : i % 3 === 1 ? '#e9d5ff' : '#fbcfe8',
        wingB: i % 3 === 0 ? '#f472b6' : i % 3 === 1 ? '#ddd6fe' : '#fda4af',
      }
    })
    return { butterflyOrbitCy: orbitCy, butterflyRing: ring }
  }, [kisses, roseProgress])

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Rose & Kiss]', {
        istToday,
        kisses,
        roseProgress: roseProgress.toFixed(4),
        roseComplete,
        canKissToday,
        lastKissIst,
      })
    }
  }, [istToday, kisses, roseProgress, roseComplete, canKissToday, lastKissIst])

  useEffect(() => {
    if (!undoModalOpen) return
    const id = window.setTimeout(() => undoPasswordInputRef.current?.focus(), 80)
    return () => window.clearTimeout(id)
  }, [undoModalOpen])

  useEffect(() => {
    if (!undoModalOpen) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setUndoModalOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [undoModalOpen])

  const onKiss = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (kissBusyRef.current) return
    if (!canKissToday) {
      setDenyShake(true)
      window.setTimeout(() => setDenyShake(false), 600)
      setWaterPourKey((k) => k + 1)
      return
    }
    kissBusyRef.current = true
    window.setTimeout(() => {
      kissBusyRef.current = false
    }, 900)

    setLastKissIst(istToday)
    const nextTotal = kisses + 1
    setKissTotal(nextTotal)
    setWaterPourKey((k) => k + 1)
    const paletteIndex = nextTotal % KISS_PALETTES.length
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    if (nextTotal === ROSE_KISSES_FOR_FULL_BLOOM) {
      setPotPulseKey((k) => k + 1)
      const burst = () => {
        fireConfetti({
          particleCount: 120,
          spread: 360,
          startVelocity: 35,
          origin: { x: cx / window.innerWidth, y: cy / window.innerHeight },
          colors: ['#ff8fab', '#f472b6', '#c084fc', '#fde047', '#fda4af', '#fff'],
          scalar: 1.05,
          ticks: 200,
        })
      }
      burst()
      window.setTimeout(burst, 180)
      window.setTimeout(burst, 360)
      window.setTimeout(() => {
        fireConfetti({
          particleCount: 80,
          spread: 100,
          startVelocity: 28,
          origin: { x: 0.5, y: 0.35 },
          colors: ['#ff8fab', '#e9d5ff', '#fef08a'],
        })
      }, 120)
    }

    KISS_EMOJI_BURST.forEach((emoji, i) => {
      window.setTimeout(() => {
        const id = ++burstIdRef.current
        setKissBurst((b) => [...b, { id, x: cx + (i - (KISS_EMOJI_BURST.length - 1) / 2) * 16, y: cy, emoji }])
        window.setTimeout(() => setKissBurst((b) => b.filter((x) => x.id !== id)), 1200)
      }, i * 65)
    })

    const colors = [...KISS_PALETTES[paletteIndex]]
    const nx = cx / window.innerWidth
    const ny = cy / window.innerHeight
    fireConfetti({
      particleCount: 42,
      spread: 58,
      startVelocity: 24,
      origin: { x: nx, y: ny },
      colors,
      scalar: 0.8,
    })
    window.requestAnimationFrame(() => {
      fireConfetti({
        particleCount: 28,
        spread: 64,
        startVelocity: 18,
        origin: { x: nx * 0.95 + 0.02, y: Math.min(0.92, ny + 0.06) },
        colors: [...colors].reverse(),
        scalar: 0.72,
      })
    })
  }

  const openUndoTodayModal = () => {
    if (lastKissIst !== istToday) return
    setUndoPassword('')
    setUndoPasswordError(false)
    setUndoModalOpen(true)
  }

  const closeUndoTodayModal = () => {
    setUndoModalOpen(false)
  }

  const submitUndoTodayModal = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (lastKissIst !== istToday) return
    if (undoPassword.trim() !== KISS_RESET_PASSWORD) {
      setUndoPasswordError(true)
      return
    }
    setLastKissIst(null)
    setKissTotal(Math.max(0, kisses - 1))
    setUndoModalOpen(false)
    if (import.meta.env.DEV) console.log('[Rose & Kiss] today’s kiss undone', { istToday })
  }

  return (
    <section className={`overflow-visible p-6 sm:p-8 ${glass}`}>
      <p className={`text-center text-sm font-semibold ${muted}`}>{COPY.roseSectionTitle}</p>
      <p className={`mt-1 text-center text-xs ${muted}`}>{COPY.roseSectionSub}</p>

      <div className="mt-6 flex flex-col items-center gap-8 overflow-visible sm:flex-row sm:items-end sm:justify-center">
        <div className="relative flex flex-col items-center overflow-visible pt-6 sm:pt-2">
          <div className="relative h-72 w-40 overflow-visible sm:h-80 sm:w-44">
            <svg
              viewBox="-5 -50 130 305"
              preserveAspectRatio="xMidYMax meet"
              overflow="visible"
              className="h-full w-full transform-gpu overflow-visible drop-shadow-lg"
            >
              <defs>
                <linearGradient id={stemPotGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#15803d" />
                  <stop offset="55%" stopColor="#22c55e" />
                  <stop offset="82%" stopColor="#2d6b3e" />
                  <stop offset="100%" stopColor="#4a3728" />
                </linearGradient>
                <linearGradient id={petalGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="50%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#be123c" />
                </linearGradient>
                <linearGradient id={potGradId} x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#f0a88a" />
                  <stop offset="28%" stopColor="#d2694a" />
                  <stop offset="55%" stopColor="#a84a2e" />
                  <stop offset="100%" stopColor="#6b2d12" />
                </linearGradient>
                <linearGradient id={waterGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f0f9ff" />
                  <stop offset="35%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <motion.g
                key={`pot-${potPulseKey}`}
                initial={potPulseKey > 0 ? { scale: 0.88, opacity: 0.75 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 130, damping: 15 }}
                style={{ transformOrigin: '60px 248px' }}
              >
                {/* Square-taper planter: wide top, straight sides, narrow flat bottom (trapezoid) */}
                <path
                  d="M 26 188 L 94 188 L 94 191 L 92 191 L 90 197 L 74 248 L 46 248 L 30 197 L 28 191 L 26 191 Z"
                  fill={`url(#${potGradId})`}
                  stroke="#4a2510"
                  strokeWidth="0.75"
                  strokeLinejoin="miter"
                />
                <path
                  d="M 28 189 L 92 189"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.55"
                  strokeLinecap="round"
                  opacity="0.4"
                />
                <path
                  d="M 32 197 L 88 197 L 86 198 L 34 198 Z"
                  fill="#000000"
                  opacity="0.06"
                />
                <path
                  d="M 34 198 L 48 245"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.45"
                  strokeLinecap="round"
                  opacity="0.14"
                />
                <path
                  d="M 72 198 L 86 245"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="0.35"
                  strokeLinecap="round"
                  opacity="0.08"
                />
                <ellipse cx="60" cy="248" rx="13" ry="2.4" fill="#000000" opacity="0.08" />
              </motion.g>
              <motion.rect
                x="56"
                width="8"
                rx="3"
                fill={`url(#${stemPotGradId})`}
                initial={false}
                animate={{ height: stemH, y: 200 - stemH }}
                transition={{ type: 'spring', stiffness: 48, damping: 20 }}
              />
              <motion.path
                d="M 60 160 Q 35 145 30 125 Q 45 135 60 155"
                fill="#22c55e"
                stroke="#166534"
                strokeWidth="0.5"
                initial={false}
                animate={{
                  scale: leafScale,
                  opacity: 0.35 + leafScale * 0.65,
                  rotate: -8 * leafScale,
                }}
                style={{ transformOrigin: '60px 160px' }}
                transition={{ type: 'spring', stiffness: 50, damping: 18 }}
              />
              <motion.path
                d="M 60 175 Q 85 158 92 138 Q 78 150 60 168"
                fill="#4ade80"
                stroke="#166534"
                strokeWidth="0.5"
                initial={false}
                animate={{
                  scale: leafScale * 0.95,
                  opacity: 0.3 + leafScale * 0.7,
                  rotate: 10 * leafScale,
                }}
                style={{ transformOrigin: '60px 175px' }}
                transition={{ type: 'spring', stiffness: 50, damping: 18 }}
              />
              <motion.g
                style={{ transformOrigin: '60px 55px' }}
                initial={false}
                animate={{
                  scale: budScale,
                  y: 200 - stemH - 42 * budScale,
                }}
                transition={{ type: 'spring', stiffness: 42, damping: 16 }}
              >
                <motion.g
                  animate={{ rotate: [0, 2.5, -1.5, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: '60px 48px' }}
                >
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <motion.ellipse
                      key={deg}
                      cx="60"
                      cy="48"
                      rx={14 + petalOpen * 5}
                      ry={10 + petalOpen * 6}
                      fill={`url(#${petalGradId})`}
                      opacity={0.55 + petalOpen * 0.4}
                      transform={`rotate(${deg + i * 2} 60 48)`}
                      initial={false}
                    />
                  ))}
                  <circle cx="60" cy="48" r={8 + petalOpen * 6} fill="#881337" opacity={0.85} />
                  <circle cx="60" cy="48" r={4 + petalOpen * 3} fill="#fda4af" />
                </motion.g>
              </motion.g>
              <g>
                {/* Soil + rim — wide mouth of taper pot */}
                <path
                  d="M 34 204 Q 42 196 54 198 L 57 198 L 56 207 Q 44 206 34 204 Z"
                  fill="#2d1f1c"
                  opacity="0.92"
                />
                <path
                  d="M 86 204 Q 78 196 66 198 L 63 198 L 64 207 Q 76 206 86 204 Z"
                  fill="#2d1f1c"
                  opacity="0.92"
                />
                <ellipse cx="60" cy="200" rx="27" ry="5.5" fill="#3d2a24" />
                <ellipse cx="60" cy="197" rx="21" ry="3.8" fill="#5c4037" opacity="0.9" />
                <ellipse cx="60" cy="198" rx="13" ry="2" fill="#6d5246" opacity="0.55" />
                <path
                  d="M 35 199 L 60 202 L 85 199"
                  fill="none"
                  stroke="#8b7355"
                  strokeWidth="0.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.45"
                />
                <path
                  d="M 32 196 L 88 196"
                  fill="none"
                  stroke="#7c2d12"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </g>
              {waterPourKey > 0 ? (
                <motion.g key={waterPourKey} style={{ pointerEvents: 'none' }}>
                  <motion.path
                    d="M 92 6 Q 78 72 66 138 Q 60 178 60 198"
                    stroke={`url(#${waterGradId})`}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0.92 }}
                    animate={{
                      pathLength: 1,
                      opacity: [0.92, 0.72, 0],
                    }}
                    transition={{
                      pathLength: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 1.1, times: [0, 0.32, 1], ease: 'easeIn' },
                    }}
                  />
                  <motion.path
                    d="M 100 14 Q 86 88 72 168 L 64 198"
                    stroke={`url(#${waterGradId})`}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0.78 }}
                    animate={{
                      pathLength: 1,
                      opacity: [0.78, 0.5, 0],
                    }}
                    transition={{
                      pathLength: { duration: 0.44, delay: 0.05, ease: 'easeOut' },
                      opacity: { duration: 1.05, delay: 0.06, times: [0, 0.38, 1] },
                    }}
                  />
                  <motion.ellipse
                    cx="60"
                    cy="200"
                    rx="10"
                    ry="3.5"
                    fill="#7dd3fc"
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{
                      scale: [0.2, 1.35, 2],
                      opacity: [0, 0.7, 0],
                    }}
                    transition={{ delay: 0.36, duration: 0.6, ease: 'easeOut' }}
                    style={{ transformOrigin: '60px 200px' }}
                  />
                  {[51, 60, 69].map((x, i) => (
                    <motion.circle
                      key={i}
                      cx={x}
                      cy="196"
                      r="2.4"
                      fill="#bae6fd"
                      initial={{ opacity: 0 }}
                      animate={{
                        cy: [196, 218],
                        opacity: [0, 0.95, 0],
                      }}
                      transition={{
                        delay: 0.38 + i * 0.05,
                        duration: 0.52,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  ))}
                </motion.g>
              ) : null}
              <g className="pointer-events-none" style={{ opacity: 0.88 }}>
                <g transform={`translate(60 ${butterflyOrbitCy})`}>
                  {butterflyRing.map((b, i) => (
                    <motion.g
                      key={i}
                      initial={false}
                      animate={
                        reduceMotion
                          ? { x: b.orbitXs[0], y: b.orbitYs[0] }
                          : { x: b.orbitXs, y: b.orbitYs }
                      }
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                              duration: b.orbitDuration,
                              repeat: Infinity,
                              repeatType: 'loop',
                              ease: 'linear',
                              times: b.orbitTimes,
                            }
                      }
                    >
                      <g transform={`scale(${b.flip ? -b.scale : b.scale} ${b.scale})`}>
                        <motion.g
                          style={{ transformOrigin: '0px 0px' }}
                          animate={{
                            x: [0, 1.2, -0.8, 0],
                            y: [0, -0.8, 0.6, 0],
                          }}
                          transition={{
                            duration: b.dur * 1.15,
                            repeat: Infinity,
                            repeatType: 'loop',
                            ease: 'easeInOut',
                            delay: b.phase,
                            times: [0, 0.33, 0.66, 1],
                          }}
                        >
                          {/** Upper wings — hinge on body; opposite rotate reads as flapping */}
                          <motion.g
                            style={{ transformOrigin: '0px -3px' }}
                            initial={false}
                            animate={
                              reduceMotion
                                ? { rotate: 4, scaleY: 1 }
                                : { rotate: [6, -38, 6], scaleY: [1, 0.88, 1] }
                            }
                            transition={{
                              duration: 0.34 + (i % 4) * 0.04,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: b.phase * 0.2,
                              times: [0, 0.5, 1],
                            }}
                          >
                            <ellipse cx="-7" cy="-5" rx="11.5" ry="7.5" fill={b.wingA} opacity="0.96" />
                          </motion.g>
                          <motion.g
                            style={{ transformOrigin: '0px -3px' }}
                            initial={false}
                            animate={
                              reduceMotion
                                ? { rotate: -4, scaleY: 1 }
                                : { rotate: [-6, 38, -6], scaleY: [1, 0.88, 1] }
                            }
                            transition={{
                              duration: 0.34 + (i % 4) * 0.04,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: b.phase * 0.2,
                              times: [0, 0.5, 1],
                            }}
                          >
                            <ellipse cx="7" cy="-5" rx="11.5" ry="7.5" fill={b.wingA} opacity="0.96" />
                          </motion.g>
                          {/** Lower wings — smaller stroke */}
                          <motion.g
                            style={{ transformOrigin: '0px 4px' }}
                            initial={false}
                            animate={
                              reduceMotion
                                ? { rotate: 3, scaleY: 1 }
                                : { rotate: [4, -28, 4], scaleY: [1, 0.92, 1] }
                            }
                            transition={{
                              duration: 0.38 + (i % 3) * 0.05,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: 0.06 + b.phase * 0.2,
                              times: [0, 0.5, 1],
                            }}
                          >
                            <ellipse cx="-6" cy="5" rx="8.5" ry="6" fill={b.wingB} opacity="0.92" />
                          </motion.g>
                          <motion.g
                            style={{ transformOrigin: '0px 4px' }}
                            initial={false}
                            animate={
                              reduceMotion
                                ? { rotate: -3, scaleY: 1 }
                                : { rotate: [-4, 28, -4], scaleY: [1, 0.92, 1] }
                            }
                            transition={{
                              duration: 0.38 + (i % 3) * 0.05,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: 0.06 + b.phase * 0.2,
                              times: [0, 0.5, 1],
                            }}
                          >
                            <ellipse cx="6" cy="5" rx="8.5" ry="6" fill={b.wingB} opacity="0.92" />
                          </motion.g>
                          <ellipse cx="0" cy="0" rx="1.5" ry="9.5" fill="#3f2a22" opacity="0.92" />
                          <ellipse cx="0" cy="-9" rx="1.3" ry="2.4" fill="#3f2a22" />
                        </motion.g>
                      </g>
                    </motion.g>
                  ))}
                </g>
              </g>
            </svg>
          </div>
          <p className={`mt-2 max-w-[14rem] text-center text-xs font-medium ${muted}`}>
            {roseComplete
              ? COPY.roseCompleteLabel.replace('{max}', String(ROSE_KISSES_FOR_FULL_BLOOM))
              : COPY.roseKissProgressLabel
                  .replace('{cur}', String(kisses))
                  .replace('{max}', String(ROSE_KISSES_FOR_FULL_BLOOM))}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className={`text-center text-xs ${muted}`}>{COPY.kissHint}</p>
          <motion.div animate={denyShake ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.45 }}>
            <motion.button
              type="button"
              data-no-heart
              onClick={onKiss}
              className={`relative rounded-full px-6 py-3 text-base font-bold text-white shadow-lg ${
                canKissToday
                  ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500'
                  : 'cursor-not-allowed bg-slate-400/70 dark:bg-slate-600/80'
              }`}
              whileHover={canKissToday ? { scale: 1.06 } : {}}
              whileTap={canKissToday ? { scale: 0.94 } : {}}
              animate={
                canKissToday
                  ? {
                      boxShadow: [
                        '0 6px 20px rgba(244, 63, 94, 0.45)',
                        '0 8px 28px rgba(217, 70, 239, 0.5)',
                        '0 6px 20px rgba(244, 63, 94, 0.45)',
                      ],
                    }
                  : {}
              }
              transition={canKissToday ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              {canKissToday ? COPY.kissButtonReady : COPY.kissButtonWait}
            </motion.button>
          </motion.div>
          {!canKissToday ? (
            <button
              type="button"
              data-no-heart
              onClick={openUndoTodayModal}
              className="text-center text-[11px] font-semibold text-love-rose underline decoration-love-rose/50 underline-offset-2 dark:text-love-peach"
            >
              {COPY.kissUndoTodayButton}
            </button>
          ) : null}
          <p className={`text-center text-[11px] ${muted}`}>
            {COPY.kissTotalLabel.replace('{n}', String(kisses))}
          </p>
          <div className="w-full max-w-[200px]">
            <div className="h-2 overflow-hidden rounded-full bg-white/40 dark:bg-white/15">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${BAR_GRADIENTS[variant]}`}
                initial={false}
                animate={{ width: `${Math.max(8, kissLoveProgress * 100)}%` }}
                transition={{ type: 'spring', stiffness: 90, damping: 20 }}
              />
            </div>
            <p className={`mt-1 text-center text-[10px] ${muted}`}>{COPY.kissGrowthCaption}</p>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {kissBurst.map((b) => (
          <motion.span
            key={b.id}
            initial={{ x: b.x, y: b.y, scale: 0.35, opacity: 1 }}
            animate={{
              y: b.y - 96,
              scale: [1, 1.25, 1.05],
              opacity: [1, 1, 0],
              rotate: [0, 10, -5],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed left-0 top-0 z-[100] text-2xl"
            style={{ x: b.x - 14, y: b.y - 14 }}
          >
            {b.emoji}
          </motion.span>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {undoModalOpen ? (
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            data-no-heart
            onClick={closeUndoTodayModal}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="kiss-undo-modal-title"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            >
              <h2 id="kiss-undo-modal-title" className="text-center text-lg font-semibold text-slate-800 dark:text-slate-100">
                {COPY.kissUndoModalTitle}
              </h2>
              <p className={`mt-3 text-center text-sm leading-relaxed ${muted}`}>{COPY.kissUndoModalBody}</p>
              <form className="mt-5 space-y-3" onSubmit={submitUndoTodayModal}>
                <input
                  ref={undoPasswordInputRef}
                  type="password"
                  autoComplete="off"
                  value={undoPassword}
                  onChange={(ev) => {
                    setUndoPassword(ev.target.value)
                    setUndoPasswordError(false)
                  }}
                  placeholder={COPY.kissUndoPasswordPlaceholder}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none ring-love-rose/30 transition-shadow focus:ring-2 dark:bg-slate-900/80 dark:text-slate-100 ${
                    undoPasswordError
                      ? 'border-red-400 dark:border-red-500/80'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
                {undoPasswordError ? (
                  <p className="text-center text-xs font-medium text-red-600 dark:text-red-400">{COPY.kissRestartWrongPassword}</p>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    data-no-heart
                    onClick={closeUndoTodayModal}
                    className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                  >
                    {COPY.kissUndoModalCancel}
                  </button>
                  <button
                    type="submit"
                    data-no-heart
                    className="rounded-full bg-love-rose px-5 py-2.5 text-sm font-bold text-white shadow-md dark:bg-love-peach dark:text-slate-900"
                  >
                    {COPY.kissUndoModalSubmit}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}

export const RoseAndKiss = memo(RoseAndKissComponent)
