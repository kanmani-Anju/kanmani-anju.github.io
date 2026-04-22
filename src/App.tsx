import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  BRAND,
  CELEBRATE_TAP_RESET_MS,
  CELEBRATE_TAPS_REQUIRED,
  COPY,
  GALLERY,
  GALLERY_QUOTES,
  MEMORIES,
  MUSIC_SRC,
  RELATIONSHIP_START_ISO,
  SECRET,
  SITE,
} from './config'
import { LOVE_QUOTES } from './data/quotes'
import { SURPRISE_NOTES, WHY_REASONS } from './data/messages'
import { useLocalStorage } from './hooks/useLocalStorage'
import { CupidSide } from './components/CupidSide'
import { RoseAndKiss } from './components/RoseAndKiss'
import { IST_TIMEZONE, istCalendarDateKey } from './utils/istCalendar'

const LS_THEME = 'ka-theme-night'

function getISTHour(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(d)
  return parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10)
}

/** Morning / afternoon / evening / night by India Standard Time; updates every minute */
function useGreetingIST() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])
  void tick
  const h = getISTHour()
  if (h >= 5 && h <= 11) return COPY.greetingMorning
  if (h >= 12 && h <= 16) return COPY.greetingAfternoon
  if (h >= 17 && h <= 20) return COPY.greetingEvening
  return COPY.greetingNight
}

function useTimerParts(from: Date) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  return useMemo(() => {
    const delta = Math.max(0, now - from.getTime())
    const sec = Math.floor(delta / 1000) % 60
    const min = Math.floor(delta / 60000) % 60
    const hr = Math.floor(delta / 3600000) % 24
    const dayMs = 86400000
    let days = Math.floor(delta / dayMs)

    const start = new Date(from)
    const end = new Date(now)
    let years = end.getFullYear() - start.getFullYear()
    let months = end.getMonth() - start.getMonth()
    if (months < 0) {
      years -= 1
      months += 12
    }
    let dayAdjust = end.getDate() - start.getDate()
    if (dayAdjust < 0) {
      months -= 1
      if (months < 0) {
        years -= 1
        months += 12
      }
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
      dayAdjust += prevMonth.getDate()
    }
    days = dayAdjust
    return { years, months, days, hr, min, sec }
  }, [from, now])
}

function quoteIndexForIstDate(isoDateKey: string) {
  let h = 0
  for (let i = 0; i < isoDateKey.length; i++) h = (h * 31 + isoDateKey.charCodeAt(i)) >>> 0
  return h % LOVE_QUOTES.length
}

function whyIndexForIstDate(isoDateKey: string) {
  const s = `${isoDateKey}|why`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return Math.abs(h) % WHY_REASONS.length
}

function secretLineForIstDate(isoDateKey: string, messages: readonly string[]) {
  if (messages.length === 0) return ''
  const s = `${isoDateKey}|secret-daily`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return messages[Math.abs(h) % messages.length] ?? messages[0]
}

function pickRandom<T>(arr: readonly T[], avoid?: T) {
  if (arr.length === 0) return undefined as T
  let x = arr[Math.floor(Math.random() * arr.length)]!
  let guard = 0
  while (avoid !== undefined && x === avoid && guard++ < 24) {
    x = arr[Math.floor(Math.random() * arr.length)]!
  }
  return x
}

const AnimatedDigit = memo(function AnimatedDigit({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="tabular-nums"
    >
      {value}
    </motion.span>
  )
})

type HeartBurst = { id: number; x: number; y: number; emoji?: string }

export default function App() {
  const base = import.meta.env.BASE_URL
  const greeting = useGreetingIST()
  const startDate = useMemo(() => new Date(RELATIONSHIP_START_ISO), [])
  const parts = useTimerParts(startDate)

  const [isNight, setIsNight] = useLocalStorage(LS_THEME, false)
  const [, setIstTick] = useState(0)
  const [quoteWaitOpen, setQuoteWaitOpen] = useState(false)

  const [surpriseOpen, setSurpriseOpen] = useState(false)
  const [surpriseText, setSurpriseText] = useState('')
  const [secretOpen, setSecretOpen] = useState(false)
  const [secretInput, setSecretInput] = useState('')
  const [secretOk, setSecretOk] = useState(false)
  const [secretTried, setSecretTried] = useState(false)

  const [hearts, setHearts] = useState<HeartBurst[]>([])
  const heartId = useRef(0)
  const quoteWaitCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const celebrateNamesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const celebrateTapResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const celebrateTaps = useRef(0)
  const [celebrateOpen, setCelebrateOpen] = useState(false)
  const [celebrateShowNames, setCelebrateShowNames] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setIstTick((x) => x + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    return () => {
      if (quoteWaitCloseTimer.current) clearTimeout(quoteWaitCloseTimer.current)
      if (celebrateNamesTimer.current) clearTimeout(celebrateNamesTimer.current)
      if (celebrateTapResetTimer.current) clearTimeout(celebrateTapResetTimer.current)
    }
  }, [])

  const closeQuoteWaitAnimated = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (quoteWaitCloseTimer.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const romantic = ['💕', '💖', '💗', '✨', '🌸', '💝', '💕'] as const
    const spread = [-48, -28, -12, 0, 12, 28, 48]
    spread.forEach((dx, i) => {
      window.setTimeout(() => {
        const id = ++heartId.current
        const emoji = romantic[i % romantic.length]
        setHearts((h) => [...h, { id, x: cx + dx, y: cy, emoji }])
        window.setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 1400)
      }, i * 70)
    })

    const bloom = {
      particleCount: 40,
      spread: 55,
      startVelocity: 22,
      gravity: 0.9,
      scalar: 0.75,
      ticks: 90,
      colors: ['#ff8fab', '#ffd6e8', '#e8d9ff', '#ffc8dd', '#fff0f5'],
    }
    confetti({ ...bloom, origin: { x: 0.45, y: 0.48 } })
    window.setTimeout(() => {
      confetti({ ...bloom, particleCount: 35, origin: { x: 0.55, y: 0.52 }, spread: 65 })
    }, 120)

    quoteWaitCloseTimer.current = window.setTimeout(() => {
      setQuoteWaitOpen(false)
      quoteWaitCloseTimer.current = null
    }, 820)
  }, [])

  const istToday = istCalendarDateKey()
  const secretDailyLine = secretLineForIstDate(istToday, SECRET.dailyMessages)
  const quoteIdx = quoteIndexForIstDate(istToday)
  const quote = LOVE_QUOTES[quoteIdx] ?? ''
  const whyToday = WHY_REASONS[whyIndexForIstDate(istToday)] ?? ''

  const glass = isNight
    ? 'rounded-3xl border border-white/15 bg-white/[0.07] shadow-glow-lg backdrop-blur-xl'
    : 'glass'

  const muted = isNight ? 'text-slate-300' : 'text-muted'

  const onPageClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, textarea, [data-no-heart]')) return
    const id = ++heartId.current
    setHearts((h) => [...h, { id, x: e.clientX, y: e.clientY }])
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 1200)
  }, [])

  const closeCelebrate = useCallback(() => {
    if (celebrateNamesTimer.current) {
      clearTimeout(celebrateNamesTimer.current)
      celebrateNamesTimer.current = null
    }
    celebrateTaps.current = 0
    if (celebrateTapResetTimer.current) {
      clearTimeout(celebrateTapResetTimer.current)
      celebrateTapResetTimer.current = null
    }
    setCelebrateOpen(false)
    setCelebrateShowNames(false)
  }, [])

  const celebrate = () => {
    if (celebrateNamesTimer.current) {
      clearTimeout(celebrateNamesTimer.current)
      celebrateNamesTimer.current = null
    }
    setCelebrateShowNames(false)
    setCelebrateOpen(true)

    confetti({
      particleCount: 130,
      spread: 88,
      origin: { y: 0.55 },
      colors: ['#ff8fab', '#ffd6e8', '#e8d9ff', '#ffd4c4', '#fff'],
    })
    confetti({
      particleCount: 90,
      spread: 100,
      startVelocity: 38,
      origin: { x: 0.35, y: 0.5 },
      colors: ['#fbcfe8', '#fce7f3', '#fda4af'],
      scalar: 1,
    })
    confetti({
      particleCount: 90,
      spread: 100,
      startVelocity: 38,
      origin: { x: 0.65, y: 0.5 },
      colors: ['#fbcfe8', '#fce7f3', '#fda4af'],
      scalar: 1,
    })

    celebrateNamesTimer.current = window.setTimeout(() => {
      setCelebrateShowNames(true)
      celebrateNamesTimer.current = null
    }, 2400)
  }

  const onCelebrateTap = () => {
    if (celebrateTapResetTimer.current) {
      clearTimeout(celebrateTapResetTimer.current)
      celebrateTapResetTimer.current = null
    }
    celebrateTapResetTimer.current = window.setTimeout(() => {
      celebrateTaps.current = 0
      celebrateTapResetTimer.current = null
    }, CELEBRATE_TAP_RESET_MS)

    celebrateTaps.current += 1
    if (celebrateTaps.current < CELEBRATE_TAPS_REQUIRED) {
      confetti({
        particleCount: 28,
        spread: 52,
        startVelocity: 18,
        origin: { x: 0.5, y: 0.72 },
        colors: ['#ff8fab', '#ffd6e8', '#fce7f3'],
        scalar: 0.85,
      })
      return
    }

    celebrateTaps.current = 0
    if (celebrateTapResetTimer.current) {
      clearTimeout(celebrateTapResetTimer.current)
      celebrateTapResetTimer.current = null
    }
    celebrate()
  }

  const checkSecret = () => {
    setSecretTried(true)
    const p = secretInput.trim().toLowerCase()
    const ok = SECRET.passwords.some((x) => x.toLowerCase() === p)
    setSecretOk(ok)
  }

  const toggleMusic = async () => {
    if (!MUSIC_SRC) return
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      try {
        await a.play()
        setPlaying(true)
      } catch {
        setPlaying(false)
      }
    }
  }

  return (
    <div
      role="presentation"
      onClick={onPageClick}
      className={`relative min-h-svh overflow-x-hidden transition-colors duration-700 ${
        isNight ? 'dark bg-gradient-to-br from-slate-950 via-[#1a0a1f] to-slate-900 text-slate-100' : 'bg-gradient-to-br from-love-blush via-love-pink to-love-lilac text-slate-800'
      }`}
    >
      <FloatingBackdrop isNight={isNight} />

      {MUSIC_SRC ? (
        <audio ref={audioRef} src={`${base}${MUSIC_SRC.replace(/^\//, '')}`} loop preload="none" />
      ) : null}

      <header className="relative z-10 overflow-visible px-4 pb-6 pt-10 text-center sm:pt-14">
        <CupidSide isNight={isNight} />
        <motion.div
          className="relative z-10 mx-auto max-w-2xl"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.09, delayChildren: 0.06 },
            },
          }}
        >
          {/* Tiny floating accents — pointer-events none */}
          <span className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
            {[
              { e: '💕', l: '8%', t: '12%', d: 2.8, r: [-4, 4] as [number, number] },
              { e: '✨', l: '88%', t: '8%', d: 3.2, r: [6, -6] as [number, number] },
              { e: '🌸', l: '4%', t: '62%', d: 3.5, r: [5, -5] as [number, number] },
              { e: '💖', l: '92%', t: '55%', d: 2.6, r: [-6, 6] as [number, number] },
            ].map((x, i) => (
              <motion.span
                key={i}
                className="absolute text-lg opacity-70 sm:text-xl"
                style={{ left: x.l, top: x.t }}
                animate={{
                  y: [0, -10, 0],
                  rotate: x.r,
                  scale: [1, 1.12, 1],
                  opacity: [0.45, 0.95, 0.45],
                }}
                transition={{
                  duration: x.d,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.35,
                }}
              >
                {x.e}
              </motion.span>
            ))}
          </span>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 10, scale: 0.92 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 420, damping: 24 },
              },
            }}
            className={`relative mb-2 text-xs font-semibold uppercase tracking-[0.2em] ${muted}`}
          >
            {BRAND}
          </motion.p>

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 22, scale: 0.9 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 260, damping: 20 },
              },
            }}
            className="font-display relative text-4xl font-bold drop-shadow-sm sm:text-5xl md:text-6xl"
          >
            {SITE.title}
          </motion.h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: {
                opacity: 1,
                y: 0,
                transition: { type: 'spring', stiffness: 320, damping: 26 },
              },
            }}
            className={`relative mx-auto mt-3 max-w-md text-base font-medium sm:text-lg ${muted}`}
          >
            {SITE.subtitle}
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.85, y: 12 },
              show: {
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { type: 'spring', stiffness: 400, damping: 18 },
              },
            }}
            className="relative mt-4 inline-block"
          >
            <motion.p
              className="rounded-full bg-white/40 px-4 py-2 text-sm font-semibold shadow-md backdrop-blur-md dark:bg-white/10"
              animate={{
                boxShadow: [
                  '0 4px 14px rgba(255, 143, 171, 0.35)',
                  '0 6px 22px rgba(232, 121, 250, 0.45)',
                  '0 4px 14px rgba(255, 143, 171, 0.35)',
                ],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              {greeting}
            </motion.p>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: {
                opacity: 1,
                y: 0,
                transition: { type: 'spring', stiffness: 360, damping: 22 },
              },
            }}
            className="relative mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <motion.button
              type="button"
              data-no-heart
              onClick={() => setIsNight(!isNight)}
              className={`rounded-full px-4 py-2 text-sm font-bold shadow-md ${
                isNight
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'bg-white/70 text-rose-600 hover:bg-white'
              }`}
              whileHover={{ scale: 1.08, rotate: [-1, 1, 0] }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {isNight ? 'Cute Mode 💖' : 'Night Mode 🌙'}
            </motion.button>
          </motion.div>
        </motion.div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-lg flex-col gap-5 px-4 pb-24 sm:max-w-xl md:max-w-2xl">
        <section className={`p-6 sm:p-8 ${glass}`}>
          <p className={`text-center text-sm font-semibold ${muted}`}>{COPY.timerLabel}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center sm:grid-cols-6 sm:gap-2">
            {(
              [
                ['Years', parts.years],
                ['Months', parts.months],
                ['Days', parts.days],
                ['Hours', parts.hr],
                ['Min', parts.min],
                ['Sec', parts.sec],
              ] as const
            ).map(([label, n]) => (
              <div key={label} className="rounded-2xl bg-white/30 px-1 py-3 dark:bg-white/10">
                <div className="font-display text-2xl font-bold tabular-nums sm:text-3xl">
                  <AnimatedDigit value={n} />
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${muted}`}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        <RoseAndKiss glass={glass} muted={muted} />

        <section className={`p-6 sm:p-8 ${glass}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={`text-sm font-semibold ${muted}`}>
                {COPY.quoteDateLabel} · {istToday}
              </p>
            </div>
            <button
              type="button"
              data-no-heart
              onClick={() => setQuoteWaitOpen(true)}
              className="shrink-0 rounded-full bg-love-rose/90 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-love-rose"
            >
              {COPY.quoteNextButton}
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={istToday}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 text-center text-lg font-medium leading-relaxed sm:text-xl"
            >
              {quote}
            </motion.p>
          </AnimatePresence>
        </section>

        <section className={`grid gap-3 sm:grid-cols-2 ${glass} p-4 sm:p-6`}>
          <button
            type="button"
            data-no-heart
            onClick={() => {
              setSurpriseText(pickRandom(SURPRISE_NOTES, surpriseText) ?? '')
              setSurpriseOpen(true)
            }}
            className="rounded-2xl bg-gradient-to-br from-love-rose to-purple-400 px-4 py-4 text-left font-bold text-white shadow-lg transition hover:scale-[1.02]"
          >
            🎁 Surprise Love Note
          </button>
          <div className="rounded-2xl border border-white/30 bg-white/50 px-4 py-4 text-left shadow-md backdrop-blur-sm dark:border-white/10 dark:bg-white/10">
            <p className={`text-xs font-semibold ${muted}`}>
              💬 {COPY.whyDailyLabel} · {istToday}
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={istToday}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-2 font-bold leading-snug"
              >
                {whyToday}
              </motion.p>
            </AnimatePresence>
          </div>
        </section>

        <section className={`p-6 ${glass}`}>
          <p className="text-center font-bold">How much you mean to me ♾️</p>
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/40 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-love-rose via-love-peach to-purple-400 shadow-glow"
              initial={{ width: '92%' }}
              animate={{ width: '100%' }}
              transition={{ type: 'spring', stiffness: 40, damping: 14 }}
            />
          </div>
          <p className={`mt-2 text-center text-sm ${muted}`}>{COPY.loveMeterNote}</p>
        </section>

        <section className={`flex flex-wrap justify-center gap-3 p-4 ${glass}`}>
          {MUSIC_SRC ? (
            <button
              type="button"
              data-no-heart
              onClick={toggleMusic}
              className="rounded-full bg-white/60 px-4 py-2 text-sm font-bold shadow dark:bg-white/15"
            >
              {playing ? '⏸ Pause music' : '▶️ Soft music'}
            </button>
          ) : null}
          <button
            type="button"
            data-no-heart
            onClick={onCelebrateTap}
            className="rounded-full bg-love-rose px-4 py-2 text-sm font-bold text-white shadow-lg"
          >
            Celebrate Us 🎉
          </button>
          <button
            type="button"
            data-no-heart
            onClick={() => {
              setSecretOpen(true)
              setSecretOk(false)
              setSecretTried(false)
              setSecretInput('')
            }}
            className="rounded-full bg-white/60 px-4 py-2 text-sm font-bold dark:bg-white/15"
          >
            🔐 Secret message
          </button>
        </section>

        <section className={`p-6 ${glass}`}>
          <h2 className="font-display text-center text-2xl font-bold">{COPY.memoriesTitle}</h2>
          <div className="mt-5 flex flex-col gap-4">
            {MEMORIES.map((m) => (
              <motion.div
                key={m.title}
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl border border-white/40 bg-white/30 p-4 text-left shadow-md dark:border-white/10 dark:bg-white/10"
              >
                <span className="text-2xl">{m.emoji}</span>
                <h3 className="mt-1 font-bold">{m.title}</h3>
                <p className={`text-sm ${muted}`}>{m.date}</p>
                <p className="mt-2 text-sm leading-relaxed">{m.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className={`p-6 ${glass}`}>
          <h2 className="font-display text-center text-2xl font-bold">{COPY.galleryTitle}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-8">
            {GALLERY.map((g, i) => (
              <motion.div
                key={`${g.src || 'empty'}-${i}`}
                animate={{ rotate: [g.tilt - 1, g.tilt + 1, g.tilt] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-44 shrink-0 sm:w-52"
              >
                <div className="rounded-sm bg-white p-3 pb-10 shadow-xl ring-1 ring-black/5 dark:bg-slate-100">
                  {g.src ? (
                    <img
                      src={g.src.startsWith('http') ? g.src : `${base}${g.src}`}
                      alt=""
                      className="aspect-[4/5] w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex aspect-[4/5] w-full items-center justify-center border border-dashed border-slate-300/90 bg-gradient-to-b from-white to-slate-100/90 dark:border-slate-400/50 dark:from-slate-200/50 dark:to-slate-300/40"
                      aria-hidden
                    >
                      <span className="text-3xl opacity-45">📷</span>
                    </div>
                  )}
                </div>
                <p className="-mt-8 text-center font-display text-lg text-slate-800 dark:text-slate-100">
                  {'caption' in g && g.caption ? g.caption : COPY.galleryWaitingCaption}
                </p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-white/25 pt-6 dark:border-white/10">
            {GALLERY_QUOTES.map((line, j) => (
              <p
                key={j}
                className={`text-center text-sm italic leading-relaxed sm:text-base ${muted}`}
              >
                {line}
              </p>
            ))}
          </div>
        </section>
      </main>

      <footer className={`relative z-10 pb-10 text-center text-xs leading-relaxed ${muted}`}>
        {COPY.footerLine.replace('{brand}', BRAND)}
      </footer>

      <AnimatePresence>
        {surpriseOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            data-no-heart
            onClick={() => setSurpriseOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-800"
            >
              <p className="text-lg font-semibold leading-relaxed text-slate-800 dark:text-slate-100">{surpriseText}</p>
              <button
                type="button"
                className="mt-4 rounded-full bg-love-rose px-4 py-2 text-sm font-bold text-white"
                onClick={() => setSurpriseOpen(false)}
              >
                Close 💕
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {quoteWaitOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            data-no-heart
            onClick={() => setQuoteWaitOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-800"
            >
              <p className="font-display text-2xl font-bold text-love-rose dark:text-love-peach">{COPY.quoteWaitTitle}</p>
              <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">{COPY.quoteWaitBody}</p>
              <div className="relative mx-auto mt-5 inline-flex justify-center">
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -m-3 rounded-full border-2 border-love-rose/45"
                  animate={{ scale: [1, 1.65], opacity: [0.55, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -m-3 rounded-full border border-purple-300/50"
                  animate={{ scale: [1, 1.9], opacity: [0.35, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                />
                <motion.button
                  type="button"
                  className="relative rounded-full bg-gradient-to-r from-love-rose via-rose-400 to-purple-400 px-5 py-2.5 text-sm font-bold text-white shadow-md"
                  animate={{
                    scale: [1, 1.045, 1],
                    boxShadow: [
                      '0 4px 18px rgba(255, 143, 171, 0.45)',
                      '0 6px 28px rgba(232, 164, 255, 0.55)',
                      '0 4px 18px rgba(255, 143, 171, 0.45)',
                    ],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  whileHover={{
                    scale: 1.08,
                    boxShadow: '0 10px 32px rgba(255, 143, 171, 0.6)',
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeQuoteWaitAnimated}
                >
                  Okay 💕
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {secretOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            data-no-heart
            onClick={() => setSecretOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            >
              <p className="font-bold text-slate-800 dark:text-slate-100">Enter the nickname 🔐</p>
              <input
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                placeholder="Your secret word"
              />
              <button
                type="button"
                onClick={checkSecret}
                className="mt-3 w-full rounded-full bg-slate-900 py-2 font-bold text-white dark:bg-white dark:text-slate-900"
              >
                Unlock
              </button>
              {secretOk ? (
                <p className="mt-4 text-center font-semibold text-love-rose dark:text-love-peach">{secretDailyLine}</p>
              ) : secretTried && !secretOk ? (
                <p className="mt-2 text-center text-sm text-red-500">Not quite — try a nickname you both use 💭</p>
              ) : null}
              <button type="button" className="mt-4 w-full text-sm text-slate-500" onClick={() => setSecretOpen(false)}>
                Close
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {hearts.map((h) => (
        <motion.span
          key={h.id}
          initial={{ x: h.x, y: h.y, scale: 0.35, opacity: 1, rotate: -12 }}
          animate={{
            y: h.y - 130,
            scale: [1, 1.35, 1.15],
            opacity: [1, 1, 0],
            rotate: [0, 8, -4],
          }}
          transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed left-0 top-0 z-[100] text-3xl drop-shadow-[0_2px_8px_rgba(255,143,171,0.6)]"
          style={{ x: h.x - 16, y: h.y - 16 }}
        >
          {h.emoji ?? '💖'}
        </motion.span>
      ))}

      <AnimatePresence>
        {celebrateOpen ? (
          <motion.div
            key="celebrate-modal"
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md"
            data-no-heart
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCelebrate}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex min-h-[280px] w-full max-w-sm flex-col items-center justify-center rounded-3xl border border-white/50 bg-white/90 px-6 py-10 text-center shadow-2xl dark:border-white/15 dark:bg-slate-900/95"
            >
              <AnimatePresence mode="wait">
                {!celebrateShowNames ? (
                  <motion.div
                    key="celebrate-heart"
                    initial={{ scale: 0, rotate: -14 }}
                    animate={{
                      scale: [0, 1.18, 0.94, 1.06, 1],
                      rotate: [0, 7, -5, 3, 0],
                    }}
                    exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.35 } }}
                    transition={{
                      duration: 2.15,
                      times: [0, 0.28, 0.48, 0.75, 1],
                      ease: 'easeOut',
                    }}
                    className="select-none text-[min(36vw,180px)] leading-none drop-shadow-[0_0_40px_rgba(255,100,150,0.75)]"
                  >
                    💖
                  </motion.div>
                ) : (
                  <motion.div
                    key="celebrate-names"
                    initial={{ opacity: 0, y: 16, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <p className="font-display text-3xl font-bold leading-tight text-love-rose dark:text-love-peach sm:text-4xl">
                      {COPY.celebrateNames}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {celebrateShowNames ? (
                <button
                  type="button"
                  className="mt-8 rounded-full bg-love-rose px-5 py-2 text-sm font-bold text-white shadow-md"
                  onClick={closeCelebrate}
                >
                  {COPY.celebrateClose}
                </button>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function FloatingBackdrop({ isNight }: { isNight: boolean }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${(i * 7 + 5) % 100}%`,
        delay: `${(i % 5) * 1.2}s`,
        dur: `${10 + (i % 6)}s`,
      })),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {hearts.map((h) => (
        <span
          key={h.id}
          className={`absolute bottom-[-10%] animate-drift text-2xl ${isNight ? 'opacity-25' : 'opacity-40'}`}
          style={{
            left: h.left,
            animationDuration: `${h.dur}s`,
            animationDelay: h.delay,
          }}
        >
          {h.id % 3 === 0 ? '💕' : h.id % 3 === 1 ? '✨' : '🌸'}
        </span>
      ))}
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={`s-${i}`}
          className="sparkle-dot"
          style={{
            left: `${(i * 13) % 100}%`,
            top: `${(i * 17) % 100}%`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}
