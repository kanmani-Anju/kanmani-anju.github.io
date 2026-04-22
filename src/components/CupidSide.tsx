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
  const skin = isNight ? '#fcd5c0' : '#ffdfc9'
  const skinStroke = isNight ? '#b8957a' : '#f0bfa8'
  const blush = isNight ? '#f9a8c0' : '#ff9eb5'

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

  const dim = isNight ? 'max-sm:opacity-45 sm:opacity-42' : 'max-sm:opacity-95 sm:opacity-95'
  const base = freeze ?? anchor
  const path = tourPath()
  const touring = freeze !== null

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
          className="relative drop-shadow-[0_6px_16px_rgba(255,130,170,0.4)]"
          animate={{
            x: [0, -5, 0],
            scale: [1, 0.97, 1],
            opacity: [1, 0.85, 1],
          }}
          transition={{
            duration: FLIGHT_MS / 1000,
            repeat: Infinity,
            repeatDelay: PAUSE_MS / 1000,
            ease: 'easeInOut',
            times: [0, 0.22, 1],
          }}
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
              <linearGradient id={wingGrad} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffefb" />
                <stop offset="100%" stopColor="#ffd6e8" />
              </linearGradient>
            </defs>

            <motion.g
              style={{ transformOrigin: '60px 82px' }}
              animate={{ rotate: [0, 2, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.path
                d="M 56 74 C 32 68 10 82 8 108 C 22 96 42 88 54 82 Z"
                fill={`url(#${wingGrad})`}
                stroke={isNight ? '#6b4a60' : '#f9a8d4'}
                strokeWidth="0.65"
                strokeLinejoin="round"
                style={{ transformOrigin: '54px 80px' }}
                animate={{ rotate: [0, 12, 0] }}
                transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.path
                d="M 64 74 C 88 68 110 82 112 108 C 98 96 78 88 66 82 Z"
                fill={`url(#${wingGrad})`}
                stroke={isNight ? '#6b4a60' : '#f9a8d4'}
                strokeWidth="0.65"
                strokeLinejoin="round"
                style={{ transformOrigin: '66px 80px' }}
                animate={{ rotate: [0, -12, 0] }}
                transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.g>

            <ellipse cx="52" cy="124" rx="9" ry="11" fill={skin} stroke={skinStroke} strokeWidth="0.6" />
            <ellipse cx="68" cy="124" rx="9" ry="11" fill={skin} stroke={skinStroke} strokeWidth="0.6" />
            <ellipse cx="50" cy="136" rx="7" ry="4.5" fill={skin} stroke={skinStroke} strokeWidth="0.5" />
            <ellipse cx="70" cy="136" rx="7" ry="4.5" fill={skin} stroke={skinStroke} strokeWidth="0.5" />

            <motion.g
              style={{ transformOrigin: '60px 88px' }}
              animate={{ rotate: [0, 2.5, -1.5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M 44 64 Q 38 82 37 100 Q 44 114 60 118 Q 76 114 83 100 Q 82 82 76 64 Q 60 58 44 64 Z"
                fill={`url(#${dressGrad})`}
                stroke={isNight ? '#7c6b8a' : '#e9d5ff'}
                strokeWidth="0.7"
                strokeLinejoin="round"
              />
              <path
                d="M 42 98 Q 60 108 78 98"
                stroke={isNight ? '#9b8ab0' : '#ddd6fe'}
                strokeWidth="0.55"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 38 102 Q 44 108 50 104 Q 56 110 60 106 Q 64 110 70 104 Q 76 108 82 102"
                fill="none"
                stroke={isNight ? '#a89bb8' : '#ffffff'}
                strokeWidth="0.9"
                strokeLinecap="round"
                opacity="0.9"
              />
            </motion.g>

            <path
              d="M 44 66 Q 28 74 24 88"
              stroke={skin}
              strokeWidth="7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="23" cy="90" r="5" fill={skin} stroke={skinStroke} strokeWidth="0.5" />

            <motion.g
              style={{ transformOrigin: '84px 72px' }}
              animate={{ rotate: [0, -8, 3, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M 74 68 Q 90 58 106 66 Q 90 76 74 68"
                fill="none"
                stroke="#a16207"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line x1="78" y1="68" x2="102" y2="66" stroke="#6b4423" strokeWidth="0.55" opacity="0.9" />
              <path d="M 72 66 L 76 72 M 104 64 L 108 70" stroke="#c2410c" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M 78 70 L 68 82" stroke={skin} strokeWidth="7" strokeLinecap="round" />
              <circle cx="67" cy="84" r="5" fill={skin} stroke={skinStroke} strokeWidth="0.5" />
            </motion.g>

            <circle cx="60" cy="44" r="21" fill={skin} stroke={skinStroke} strokeWidth="0.85" />
            <circle cx="45" cy="50" r="5" fill={blush} opacity="0.45" />
            <circle cx="75" cy="50" r="5" fill={blush} opacity="0.45" />
            <ellipse cx="52" cy="42" rx="4.2" ry="5" fill="#2d2640" />
            <ellipse cx="68" cy="42" rx="4.2" ry="5" fill="#2d2640" />
            <ellipse cx="53.5" cy="40" rx="1.5" ry="1.8" fill="#ffffff" opacity="0.95" />
            <ellipse cx="69.5" cy="40" rx="1.5" ry="1.8" fill="#ffffff" opacity="0.95" />
            <circle cx="51" cy="44" r="0.9" fill="#ffffff" opacity="0.5" />
            <circle cx="67" cy="44" r="0.9" fill="#ffffff" opacity="0.5" />
            <ellipse cx="60" cy="48" rx="2" ry="1.5" fill={isNight ? '#e8b4a0' : '#ffc4b0'} opacity="0.7" />
            <path
              d="M 52 54 Q 60 60 68 54"
              stroke="#e879a9"
              strokeWidth="1.1"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 52 26 Q 60 18 68 26 Q 64 22 60 24 Q 56 22 52 26"
              fill={isNight ? '#4a3728' : '#6d4c41'}
            />
            <path
              d="M 46 30 Q 60 22 74 30"
              fill="none"
              stroke={isNight ? '#4a3728' : '#6d4c41'}
              strokeWidth="3"
              strokeLinecap="round"
            />

            <motion.ellipse
              cx="60"
              cy="14"
              rx="18"
              ry="4.5"
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
