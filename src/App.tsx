import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  BRAND,
  GALLERY,
  MEMORIES,
  MUSIC_SRC,
  RELATIONSHIP_START_ISO,
  SECRET,
  SITE,
} from './config'
import { LOVE_QUOTES } from './data/quotes'
import { FUNNY_LINES, SURPRISE_NOTES, WHY_REASONS } from './data/messages'
import { useLocalStorage } from './hooks/useLocalStorage'

const LS_THEME = 'ka-theme-night'
const LS_QUOTE_IDX = 'ka-quote-idx'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function useGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning Sunshine ☀️'
  if (h < 17) return 'Good Afternoon My Love 🌸'
  return 'Good Night My Heart 🌙'
}

function useTimerParts(from: Date) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  return useMemo(() => {
    let delta = Math.max(0, now - from.getTime())
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

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function dailyQuoteIndex() {
  const key = dayKey()
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h % LOVE_QUOTES.length
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

function AnimatedDigit({ value }: { value: number }) {
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
}

type HeartBurst = { id: number; x: number; y: number }

export default function App() {
  const base = import.meta.env.BASE_URL
  const greeting = useGreeting()
  const startDate = useMemo(() => new Date(RELATIONSHIP_START_ISO), [])
  const parts = useTimerParts(startDate)

  const [isNight, setIsNight] = useLocalStorage(LS_THEME, false)
  const [quoteIdx, setQuoteIdx] = useLocalStorage(LS_QUOTE_IDX, dailyQuoteIndex())

  const [surpriseOpen, setSurpriseOpen] = useState(false)
  const [surpriseText, setSurpriseText] = useState('')
  const [secretOpen, setSecretOpen] = useState(false)
  const [secretInput, setSecretInput] = useState('')
  const [secretOk, setSecretOk] = useState(false)
  const [secretTried, setSecretTried] = useState(false)
  const [whyText, setWhyText] = useState(() => pickRandom(WHY_REASONS)!)
  const [funnyText, setFunnyText] = useState(() => pickRandom(FUNNY_LINES)!)

  const [hearts, setHearts] = useState<HeartBurst[]>([])
  const heartId = useRef(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  const quote = LOVE_QUOTES[quoteIdx % LOVE_QUOTES.length] ?? ''

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

  const celebrate = () => {
    confetti({
      particleCount: 120,
      spread: 85,
      origin: { y: 0.65 },
      colors: ['#ff8fab', '#ffd6e8', '#e8d9ff', '#ffd4c4', '#fff'],
    })
  }

  const newQuote = () => {
    let n = Math.floor(Math.random() * LOVE_QUOTES.length)
    if (LOVE_QUOTES.length > 1) {
      while (n === quoteIdx % LOVE_QUOTES.length) n = Math.floor(Math.random() * LOVE_QUOTES.length)
    }
    setQuoteIdx(n)
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

      <header className="relative z-10 px-4 pb-6 pt-10 text-center sm:pt-14">
        <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.2em] ${muted}`}>{BRAND}</p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl font-bold drop-shadow-sm sm:text-5xl md:text-6xl"
        >
          {SITE.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={`mx-auto mt-3 max-w-md text-base font-medium sm:text-lg ${muted}`}
        >
          {SITE.subtitle}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 inline-block rounded-full bg-white/40 px-4 py-2 text-sm font-semibold shadow-md backdrop-blur-md dark:bg-white/10"
        >
          {greeting}
        </motion.p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            data-no-heart
            onClick={() => setIsNight(!isNight)}
            className={`rounded-full px-4 py-2 text-sm font-bold shadow-md transition ${
              isNight
                ? 'bg-white/15 text-white hover:bg-white/25'
                : 'bg-white/70 text-rose-600 hover:bg-white'
            }`}
          >
            {isNight ? 'Cute Mode 💖' : 'Night Mode 🌙'}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-lg flex-col gap-5 px-4 pb-24 sm:max-w-xl md:max-w-2xl">
        <section className={`p-6 sm:p-8 ${glass}`}>
          <p className={`text-center text-sm font-semibold ${muted}`}>Our Love Story Running Since 💕</p>
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
          <p className={`mt-4 text-center text-xs ${muted}`}>
            Start date (edit in <code className="rounded bg-black/5 px-1 dark:bg-white/10">src/config.ts</code>)
          </p>
        </section>

        <section className={`p-6 sm:p-8 ${glass}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold ${muted}`}>Daily love quote · {dayKey()}</p>
            <button
              type="button"
              data-no-heart
              onClick={newQuote}
              className="shrink-0 rounded-full bg-love-rose/90 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-love-rose"
            >
              💫 New Quote
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIdx}
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
          <button
            type="button"
            data-no-heart
            onClick={() => setFunnyText(pickRandom(FUNNY_LINES, funnyText) ?? '')}
            className="rounded-2xl bg-white/50 px-4 py-4 text-left font-bold shadow-md backdrop-blur-sm dark:bg-white/10"
          >
            😂 Funny: {funnyText}
          </button>
          <button
            type="button"
            data-no-heart
            onClick={() => setWhyText(pickRandom(WHY_REASONS, whyText) ?? '')}
            className="rounded-2xl bg-white/50 px-4 py-4 text-left font-bold shadow-md backdrop-blur-sm dark:bg-white/10 sm:col-span-2"
          >
            💬 Why I love you: {whyText}
          </button>
        </section>

        <section className={`p-6 ${glass}`}>
          <p className="text-center font-bold">Infinite Love Level ♾️</p>
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/40 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-love-rose via-love-peach to-purple-400 shadow-glow"
              initial={{ width: '92%' }}
              animate={{ width: '100%' }}
              transition={{ type: 'spring', stiffness: 40, damping: 14 }}
            />
          </div>
          <p className={`mt-2 text-center text-sm ${muted}`}>Always 100% — obviously 😄</p>
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
            onClick={celebrate}
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
          <h2 className="font-display text-center text-2xl font-bold">Our memories</h2>
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
          <h2 className="font-display text-center text-2xl font-bold">Photo gallery</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-8">
            {GALLERY.map((g) => (
              <motion.div
                key={g.caption}
                animate={{ rotate: [g.tilt - 1, g.tilt + 1, g.tilt] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-44 shrink-0 sm:w-52"
              >
                <div className="rounded-sm bg-white p-3 pb-10 shadow-xl ring-1 ring-black/5 dark:bg-slate-100">
                  <img
                    src={g.src.startsWith('http') ? g.src : `${base}${g.src}`}
                    alt=""
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
                <p className="-mt-8 text-center font-display text-lg text-slate-800 dark:text-slate-100">{g.caption}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className={`relative z-10 pb-10 text-center text-xs ${muted}`}>
        Made with love · {BRAND} · click anywhere for hearts 💖
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
                <p className="mt-4 text-center font-semibold text-love-rose dark:text-love-peach">{SECRET.message}</p>
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
          initial={{ x: h.x, y: h.y, scale: 0.6, opacity: 1 }}
          animate={{ y: h.y - 120, scale: 1.4, opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="pointer-events-none fixed left-0 top-0 z-40 text-3xl"
          style={{ x: h.x - 16, y: h.y - 16 }}
        >
          💖
        </motion.span>
      ))}
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
