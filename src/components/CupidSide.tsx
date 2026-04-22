import { memo, useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

const FLIGHT_MS = 2800
const PAUSE_MS = 2200
const CYCLE = FLIGHT_MS + PAUSE_MS
const TOUR_DURATION_S = 11.5
const TOUR_MIN_WAIT_MS = 14_000
const TOUR_MAX_WAIT_MS = 32_000

type Pt = { cx: number; cy: number }

function tourPath() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 400
  const h = typeof window !== 'undefined' ? window.innerHeight : 700
  const pad = Math.min(56, w * 0.08)
  return {
    x: [0, w - pad - w * 0.12, w * 0.55, pad + w * 0.06, 0] as number[],
    y: [0, pad + h * 0.08, h * 0.42, h * 0.72 - pad, 0] as number[],
    rotate: [0, -10, 6, -4, 0] as number[],
  }
}

type Props = {
  isNight: boolean
}

/**
 * Baby cupid in the header; occasionally flies around the viewport and returns home.
 * Portal + fixed positioning avoids root overflow-x clipping during the tour.
 */
function CupidSideComponent({ isNight }: Props) {
  const uid = useId().replace(/:/g, '')
  const dressGrad = `cupid-dress-${uid}`
  const wingGrad = `cupid-wing-${uid}`
  const wingGradBack = `cupid-wing-back-${uid}`
  const skin = isNight ? '#fcd5c0' : '#ffdfc9'
  const skinStroke = isNight ? '#b8957a' : '#f0bfa8'
  const blush = isNight ? '#f9a8c0' : '#ff9eb5'
  const hairDark = isNight ? '#3d2418' : '#4a3020'
  const hairMid = isNight ? '#523028' : '#6b4423'
  const hairLight = isNight ? '#6b483c' : '#8b5a3c'
  const hairStroke = isNight ? '#2a1810' : '#3d2818'

  const beaconRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<Pt>({ cx: 0, cy: 0 })
  const [anchor, setAnchor] = useState<Pt>({ cx: 0, cy: 0 })
  const [freeze, setFreeze] = useState<Pt | null>(null)
  const [tourSeq, setTourSeq] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const [heartTip, setHeartTip] = useState(true)
  const [flightKey, setFlightKey] = useState(0)

  const syncAnchor = useCallback(() => {
    const el = beaconRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    anchorRef.current = { cx, cy }
    setAnchor({ cx, cy })
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMq = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', onMq)
    return () => mq.removeEventListener('change', onMq)
  }, [])

  useEffect(() => {
    syncAnchor()
    window.addEventListener('resize', syncAnchor, { passive: true })
    window.addEventListener('scroll', syncAnchor, { capture: true, passive: true })
    return () => {
      window.removeEventListener('resize', syncAnchor)
      window.removeEventListener('scroll', syncAnchor, true)
    }
  }, [syncAnchor])

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeartTip((h) => !h)
      setFlightKey((k) => k + 1)
    }, CYCLE)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    const runTour = () => {
      const a = anchorRef.current
      if (a.cx === 0 && a.cy === 0) return
      setFreeze({ ...a })
      setTourSeq((s) => s + 1)
      window.setTimeout(() => {
        if (!cancelled) setFreeze(null)
      }, TOUR_DURATION_S * 1000 + 80)
    }

    const schedule = () => {
      const wait = TOUR_MIN_WAIT_MS + Math.random() * (TOUR_MAX_WAIT_MS - TOUR_MIN_WAIT_MS)
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        runTour()
        schedule()
      }, wait)
    }

    schedule()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [reduceMotion])

  /** Night: keep cupid + drop-shadow glow visible on small screens (low opacity was washing out the glow). */
  const dim = isNight ? 'max-sm:opacity-95 sm:opacity-42' : 'max-sm:opacity-95 sm:opacity-95'
  const base = freeze ?? anchor
  const path = tourPath()
  const touring = freeze !== null
  const nightGlowMotion = isNight && !reduceMotion

  const cupidInner = (
    <motion.div
      key={tourSeq}
      className={`relative flex flex-col items-center ${dim}`}
      initial={touring ? { x: 0, y: 0, rotate: 0 } : false}
      animate={
        touring
          ? {
              x: path.x,
              y: path.y,
              rotate: path.rotate,
            }
          : { x: 0, y: 0, rotate: 0 }
      }
      transition={
        touring
          ? {
              duration: TOUR_DURATION_S,
              times: [0, 0.22, 0.48, 0.74, 1],
              ease: 'easeInOut',
            }
          : {}
      }
    >
      <motion.div
        className="relative flex flex-col items-center"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          className={
            isNight
              ? reduceMotion
                ? 'relative drop-shadow-[0_0_22px_rgba(251,113,133,0.65)] drop-shadow-[0_0_48px_rgba(192,132,252,0.45)]'
                : 'relative'
              : 'relative drop-shadow-[0_6px_16px_rgba(255,130,170,0.4)]'
          }
          animate={
            nightGlowMotion
              ? {
                  filter: [
                    'drop-shadow(0 0 14px rgba(251,113,133,0.55)) drop-shadow(0 0 38px rgba(192,132,252,0.4))',
                    'drop-shadow(0 0 26px rgba(251,113,133,0.85)) drop-shadow(0 0 58px rgba(244,114,182,0.55))',
                    'drop-shadow(0 0 14px rgba(251,113,133,0.55)) drop-shadow(0 0 38px rgba(192,132,252,0.4))',
                  ],
                  x: [0, -5, 0],
                  scale: [1, 0.97, 1],
                  opacity: [1, 0.85, 1],
                }
              : {
                  x: [0, -5, 0],
                  scale: [1, 0.97, 1],
                  opacity: [1, 0.85, 1],
                }
          }
          transition={
            nightGlowMotion
              ? {
                  filter: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] },
                  x: {
                    duration: FLIGHT_MS / 1000,
                    repeat: Infinity,
                    repeatDelay: PAUSE_MS / 1000,
                    ease: 'easeInOut',
                    times: [0, 0.22, 1],
                  },
                  scale: {
                    duration: FLIGHT_MS / 1000,
                    repeat: Infinity,
                    repeatDelay: PAUSE_MS / 1000,
                    ease: 'easeInOut',
                    times: [0, 0.22, 1],
                  },
                  opacity: {
                    duration: FLIGHT_MS / 1000,
                    repeat: Infinity,
                    repeatDelay: PAUSE_MS / 1000,
                    ease: 'easeInOut',
                    times: [0, 0.22, 1],
                  },
                }
              : {
                  duration: FLIGHT_MS / 1000,
                  repeat: Infinity,
                  repeatDelay: PAUSE_MS / 1000,
                  ease: 'easeInOut',
                  times: [0, 0.22, 1],
                }
          }
        >
          <svg
            viewBox="0 0 120 210"
            className="h-[7.35rem] w-auto transform-gpu sm:h-[12rem] md:h-[13.5rem]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={dressGrad} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#fffafd" />
                <stop offset="100%" stopColor="#f5f0ff" />
              </linearGradient>
              <linearGradient id={wingGrad} x1="15%" y1="0%" x2="85%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="28%" stopColor="#fff5f9" />
                <stop offset="52%" stopColor="#fce7f3" />
                <stop offset="78%" stopColor="#fbcfe8" />
                <stop offset="100%" stopColor="#f0abfc" />
              </linearGradient>
              <linearGradient id={wingGradBack} x1="100%" y1="15%" x2="0%" y2="95%">
                <stop offset="0%" stopColor="#fdf2f8" />
                <stop offset="40%" stopColor="#fbcfe8" />
                <stop offset="72%" stopColor="#f9a8d4" />
                <stop offset="100%" stopColor="#e879a9" />
              </linearGradient>
            </defs>

            <motion.g
              style={{ transformOrigin: '60px 82px' }}
              animate={{ rotate: [0, 2, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.g
                style={{ transformOrigin: '54px 80px' }}
                animate={{ rotate: [0, 12, 0] }}
                transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path
                  d="M 58 74 C 38 68 12 78 6 100 C 4 108 8 118 14 116 C 22 108 36 92 50 84 C 54 81 57 76 58 74 Z"
                  fill={`url(#${wingGradBack})`}
                  stroke={isNight ? '#7c5a6e' : '#f472b6'}
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                  opacity={isNight ? 0.72 : 0.88}
                />
                <path
                  d="M 56 76 C 44 74 30 78 22 86 C 14 94 10 104 12 110 C 16 108 24 100 32 94 C 40 88 48 83 54 80 C 55.5 78.5 56 76 56 76 Z"
                  fill={`url(#${wingGrad})`}
                  stroke={isNight ? '#8b6b85' : '#f9a8d4'}
                  strokeWidth="0.55"
                  strokeLinejoin="round"
                />
                <path
                  d="M 52 80 Q 38 88 24 100 M 48 78 Q 36 86 28 96"
                  fill="none"
                  stroke={isNight ? '#fce7f3' : '#ffffff'}
                  strokeWidth="0.38"
                  strokeLinecap="round"
                  opacity="0.45"
                />
              </motion.g>
              <motion.g
                style={{ transformOrigin: '66px 80px' }}
                animate={{ rotate: [0, -12, 0] }}
                transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path
                  d="M 62 74 C 82 68 108 78 114 100 C 116 108 112 118 106 116 C 98 108 84 92 70 84 C 66 81 63 76 62 74 Z"
                  fill={`url(#${wingGradBack})`}
                  stroke={isNight ? '#7c5a6e' : '#f472b6'}
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                  opacity={isNight ? 0.72 : 0.88}
                />
                <path
                  d="M 64 76 C 76 74 90 78 98 86 C 106 94 110 104 108 110 C 104 108 96 100 88 94 C 80 88 72 83 66 80 C 64.5 78.5 64 76 64 76 Z"
                  fill={`url(#${wingGrad})`}
                  stroke={isNight ? '#8b6b85' : '#f9a8d4'}
                  strokeWidth="0.55"
                  strokeLinejoin="round"
                />
                <path
                  d="M 68 80 Q 82 88 96 100 M 72 78 Q 84 86 92 96"
                  fill="none"
                  stroke={isNight ? '#fce7f3' : '#ffffff'}
                  strokeWidth="0.38"
                  strokeLinecap="round"
                  opacity="0.45"
                />
              </motion.g>
            </motion.g>

            <ellipse cx="51" cy="126" rx="10" ry="12" fill={skin} stroke={skinStroke} strokeWidth="0.65" />
            <ellipse cx="69" cy="126" rx="10" ry="12" fill={skin} stroke={skinStroke} strokeWidth="0.65" />
            <ellipse cx="49" cy="139" rx="8" ry="5" fill={skin} stroke={skinStroke} strokeWidth="0.55" />
            <ellipse cx="71" cy="139" rx="8" ry="5" fill={skin} stroke={skinStroke} strokeWidth="0.55" />

            <motion.g
              style={{ transformOrigin: '60px 92px' }}
              animate={{ rotate: [0, 2.5, -1.5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M 42 66 C 38 78 36 94 38 104 C 42 116 52 122 60 123 C 68 122 78 116 82 104 C 84 94 82 78 78 66 C 72 61 66 59 60 59 C 54 59 48 61 42 66 Z"
                fill={`url(#${dressGrad})`}
                stroke={isNight ? '#7c6b8a' : '#e9d5ff'}
                strokeWidth="0.75"
                strokeLinejoin="round"
              />
              <path
                d="M 40 100 Q 60 112 80 100"
                stroke={isNight ? '#9b8ab0' : '#ddd6fe'}
                strokeWidth="0.6"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 36 104 Q 44 112 52 108 Q 60 114 68 108 Q 76 112 84 104"
                fill="none"
                stroke={isNight ? '#a89bb8' : '#ffffff'}
                strokeWidth="0.95"
                strokeLinecap="round"
                opacity="0.9"
              />
            </motion.g>

            <path
              d="M 46 68 Q 30 78 24 92"
              stroke={skin}
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="22" cy="93" r="5.5" fill={skin} stroke={skinStroke} strokeWidth="0.55" />

            <motion.g
              style={{ transformOrigin: '86px 74px' }}
              animate={{ rotate: [0, -8, 3, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M 76 70 Q 92 60 108 68 Q 92 78 76 70"
                fill="none"
                stroke="#a16207"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line x1="80" y1="70" x2="104" y2="68" stroke="#6b4423" strokeWidth="0.55" opacity="0.9" />
              <path d="M 74 68 L 78 74 M 106 66 L 110 72" stroke="#c2410c" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M 80 72 L 70 84" stroke={skin} strokeWidth="8" strokeLinecap="round" />
              <circle cx="69" cy="86" r="5.5" fill={skin} stroke={skinStroke} strokeWidth="0.55" />
            </motion.g>

            {/* Curly hair — ringlets around the crown */}
            <g stroke={hairStroke} strokeWidth="0.42" strokeLinejoin="round">
              <path
                d="M 38 52 C 35 34 44 19 60 14 C 76 19 85 34 82 52 C 78 47 70 44 60 44 C 50 44 42 47 38 52 Z"
                fill={hairDark}
                opacity="0.94"
              />
              <ellipse cx="47" cy="22" rx="6.2" ry="7.5" fill={hairMid} transform="rotate(-22 47 22)" />
              <ellipse cx="57" cy="16" rx="6.6" ry="8" fill={hairDark} transform="rotate(-5 57 16)" />
              <ellipse cx="69" cy="16" rx="6.6" ry="8" fill={hairMid} transform="rotate(7 69 16)" />
              <ellipse cx="79" cy="22" rx="6.2" ry="7.5" fill={hairDark} transform="rotate(24 79 22)" />
              <ellipse cx="60" cy="12" rx="6" ry="7.5" fill={hairLight} />
              <ellipse cx="41" cy="32" rx="5.5" ry="7" fill={hairDark} transform="rotate(-40 41 32)" />
              <ellipse cx="79" cy="32" rx="5.5" ry="7" fill={hairMid} transform="rotate(40 79 32)" />
              <ellipse cx="33" cy="42" rx="5" ry="6.5" fill={hairDark} transform="rotate(-52 33 42)" />
              <ellipse cx="87" cy="42" rx="5" ry="6.5" fill={hairMid} transform="rotate(52 87 42)" />
              <ellipse cx="52" cy="38" rx="4.5" ry="5.5" fill={hairLight} opacity="0.85" transform="rotate(-12 52 38)" />
              <ellipse cx="68" cy="38" rx="4.5" ry="5.5" fill={hairLight} opacity="0.85" transform="rotate(12 68 38)" />
            </g>

            <ellipse cx="60" cy="48" rx="24" ry="22" fill={skin} stroke={skinStroke} strokeWidth="0.95" />
            <circle cx="42" cy="54" r="6" fill={blush} opacity="0.42" />
            <circle cx="78" cy="54" r="6" fill={blush} opacity="0.42" />
            <ellipse cx="48.5" cy="46" rx="5.8" ry="6.5" fill="#2d2640" />
            <ellipse cx="71.5" cy="46" rx="5.8" ry="6.5" fill="#2d2640" />
            <ellipse cx="50" cy="43.5" rx="2" ry="2.3" fill="#ffffff" opacity="0.96" />
            <ellipse cx="73" cy="43.5" rx="2" ry="2.3" fill="#ffffff" opacity="0.96" />
            <circle cx="47.5" cy="47.5" r="1.1" fill="#ffffff" opacity="0.55" />
            <circle cx="70.5" cy="47.5" r="1.1" fill="#ffffff" opacity="0.55" />
            <ellipse cx="60" cy="51" rx="2.2" ry="1.6" fill={isNight ? '#e8b4a0' : '#ffc4b0'} opacity="0.72" />
            <path
              d="M 50 57 Q 60 64 70 57"
              stroke="#e879a9"
              strokeWidth="1.25"
              strokeLinecap="round"
              fill="none"
            />

            <motion.ellipse
              cx="60"
              cy="13"
              rx="20"
              ry="5"
              fill="none"
              stroke={isNight ? '#fde68a' : '#fbbf24'}
              strokeWidth="1.3"
              opacity="0.92"
              animate={{ y: [0, -1.5, 0], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>

        <motion.span
          key={`arrow-sm-${flightKey}`}
          className="absolute left-[56%] top-[30%] text-sm leading-none sm:hidden"
          initial={{ x: 0, y: 0, opacity: 0, rotate: -28, scale: 0.5 }}
          animate={{
            x: [0, 14, 62, 92],
            y: [0, -7, -28, -40],
            opacity: [0, 1, 1, 0],
            rotate: [-28, -14, 12, 22],
            scale: [0.5, 0.88, 0.82, 0.68],
          }}
          transition={{
            duration: FLIGHT_MS / 1000,
            times: [0, 0.12, 0.72, 1],
            ease: 'easeOut',
          }}
        >
          {heartTip ? '💘' : '➷'}
        </motion.span>
        <motion.span
          key={`arrow-lg-${flightKey}`}
          className="absolute left-[56%] top-[30%] hidden text-xl leading-none sm:inline md:text-2xl"
          initial={{ x: 0, y: 0, opacity: 0, rotate: -28, scale: 0.55 }}
          animate={{
            x: [0, 28, 125, 178],
            y: [0, -12, -52, -72],
            opacity: [0, 1, 1, 0],
            rotate: [-28, -14, 12, 22],
            scale: [0.55, 1.05, 1, 0.88],
          }}
          transition={{
            duration: FLIGHT_MS / 1000,
            times: [0, 0.12, 0.72, 1],
            ease: 'easeOut',
          }}
        >
          {heartTip ? '💘' : '➷'}
        </motion.span>

        <motion.span
          className="absolute -right-0.5 top-[12%] text-xs opacity-85 sm:text-base md:text-lg"
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.88, 1.08, 0.88], rotate: [0, 18, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          ✨
        </motion.span>
      </motion.div>
    </motion.div>
  )

  const anchorVisible = Math.abs(anchor.cx) + Math.abs(anchor.cy) > 2
  const portalShell = anchorVisible ? (
    <div
      className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-1/2 transform-gpu"
      style={{ left: base.cx, top: base.cy }}
      aria-hidden
    >
      {cupidInner}
    </div>
  ) : null

  return (
    <>
      <div
        ref={beaconRef}
        className="pointer-events-none absolute left-0 top-1/2 z-10 block min-h-[7.35rem] w-[4.65rem] -translate-y-1/2 opacity-0 sm:-left-1 sm:min-h-[12rem] sm:w-[8rem] md:left-0 md:w-[8.75rem]"
        aria-hidden
      />
      {anchorVisible ? createPortal(portalShell, document.body) : null}
    </>
  )
}

export const CupidSide = memo(CupidSideComponent)
