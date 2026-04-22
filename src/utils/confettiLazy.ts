import type { Options } from 'canvas-confetti'

type ConfettiFn = (options?: Options) => void

let confettiImpl: ConfettiFn | null = null
let loadPromise: Promise<ConfettiFn> | null = null

function loadConfetti(): Promise<ConfettiFn> {
  if (confettiImpl) return Promise.resolve(confettiImpl)
  if (!loadPromise) {
    loadPromise = import('canvas-confetti').then((m) => {
      confettiImpl = m.default
      return confettiImpl
    })
  }
  return loadPromise
}

/** Same API as `canvas-confetti`; loads the library on first use (smaller initial JS). */
export function fireConfetti(options: Options): void {
  void loadConfetti().then((c) => {
    c(options)
  })
}

/** Start loading confetti during idle time so first burst has no noticeable delay. */
export function preloadConfetti(): void {
  if (typeof window === 'undefined') return
  const run = () => void loadConfetti()
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(run, { timeout: 4000 })
  } else {
    window.setTimeout(run, 2000)
  }
}
