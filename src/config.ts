/**
 * Edit names, dates, and messages here — no need to hunt through components.
 */
export const BRAND = 'Jemc'

export const SITE = {
  title: 'Kanmani ❤️ Anju 💖',
  /** Pre-proposal / early-days friendly — not “we’re officially forever” */
  subtitle: 'You make ordinary days feel like something special ✨',
} as const

/**
 * Timer “day one” (local midnight). Set to your real first-chat / first-meet date anytime.
 * Currently: today — so the counter starts fresh from this launch.
 */
export const RELATIONSHIP_START_ISO = '2026-04-22T00:00:00'

/** Celebrate Us 🎉: this many quick taps in a row opens the big heart */
export const CELEBRATE_TAPS_REQUIRED = 8
/** If you pause between taps longer than this, the count resets */
export const CELEBRATE_TAP_RESET_MS = 3000

/** Rose reaches full bloom and moves “into the pot” after this many saved kisses */
export const ROSE_KISSES_FOR_FULL_BLOOM = 365

/** Section headings & hints (easy to tweak) */
export const COPY = {
  timerLabel: 'Every day with you on my mind 💕',
  memoriesTitle: 'Moments that already mean a lot',
  galleryTitle: 'Photos & little snapshots',
  /** Caption under empty polaroid frames (no photo yet) */
  galleryWaitingCaption: 'Waiting to capture with you ✨',
  /** Love meter — sun / moon metaphor (she’s the moon, you’re the sun) */
  loveMeterTitle: 'I’m your sun ☀️ · You’re my moon 🌙',
  loveMeterNote:
    'Just like you said — I’m the sun, you’re the moon, and we light up the same sky. How much I adore you — yes, it’s a lot 😊',
  quoteDateLabel: 'Today’s quote',
  quoteNextButton: 'When is the next quote?',
  quoteWaitTitle: 'Kanmani 💕',
  quoteWaitBody:
    'This quote is yours for the whole day. A new one will be here tomorrow ✨',
  greetingMorning: 'Good morning, sunshine ☀️',
  greetingAfternoon: 'Good afternoon — hope you’re smiling 🌸',
  greetingEvening: 'Good evening — glad you’re here 🌆',
  greetingNight: 'Good night — sweet dreams 🌙',
  roseSectionTitle: 'Our rose 🌹',
  roseSectionSub: 'Every kiss helps it grow — 365 kisses until it blooms fully in its pot.',
  /** Progress toward full bloom; {cur} and {max} are numbers */
  roseKissProgressLabel: '{cur} / {max} kisses toward full bloom',
  /** Shown under the rose when kiss count reaches {max} */
  roseCompleteLabel: '{max} kisses — fully bloomed and planted in our pot 🪴',
  kissHint: 'One soft kiss a day (saves for tomorrow after that).',
  kissButtonReady: 'Kiss 💋',
  kissButtonWait: 'Already kissed today 💕',
  /** Clears today’s kiss lock and rolls the total back by one on this device */
  kissUndoTodayButton: 'Reset today’s kiss',
  kissUndoModalTitle: 'Reset today’s kiss',
  kissUndoModalBody:
    'Enter your secret phrase to clear today’s kiss on this device. Your shared total will go down by one.',
  kissUndoPasswordPlaceholder: 'Secret phrase',
  kissUndoModalSubmit: 'Reset',
  kissUndoModalCancel: 'Cancel',
  kissTotalLabel: 'Kisses shared so far: {n}',
  kissGrowthCaption: 'This bar fills toward full bloom — one kiss at a time, up to 365.',
  /** Wrong secret phrase in “Reset today’s kiss” modal */
  kissRestartWrongPassword: 'That phrase is not right — nothing was changed.',
  /** Shown after the big heart in Celebrate Us popup */
  celebrateNames: 'Kanmani ❤️ Anju',
  celebrateClose: 'Close 💕',
  /** Site footer; {brand} is replaced with BRAND from this file */
  footerLine:
    'Made with care and with all my love by {brand} — for Kanmani. Tap anywhere for little hearts 💖',
  /** Second line under the footer (original / personal note) */
  footerLineOwn: 'No more copy — this is my own.',
  whyDailyLabel: 'Why I love you · today',
} as const

export const SECRET = {
  /** Not case-sensitive; trim only */
  passwords: ['Kanmani', 'Anju', 'love'],
  /**
   * One line per IST calendar day (deterministic from the date).
   * Add or reorder lines anytime — same day always shows the same line until you change the list.
   */
  dailyMessages: [
    'You’re someone I choose in my heart, every day ❤️',
    'Today, like every day, I’m glad it’s you 💕',
    'My heart still says your name first ✨',
    'If I could replay one feeling on loop, it’d be “you.”',
    'You’re my soft place to land — today and always 🌸',
    'Choosing you isn’t a decision; it’s my favorite habit.',
    'Every sunrise is a little sweeter because you exist ☀️',
    'You’re the plot twist I never saw coming — and never want to undo.',
    'I fall for you in new ways, even on ordinary Tuesdays.',
    'Home isn’t a place when I’m talking about you.',
    'You make “I miss you” feel like a love language.',
    'I’d pick this feeling again tomorrow without a second thought.',
    'You’re my calm, my spark, and my favorite “good morning.”',
    'Loving you feels honest — like the truest thing I know.',
    'If my heart had a bookmark, it’d be stuck on you.',
    'You’re proof that gentle can still be unforgettable.',
    'I choose this — us — quietly, loudly, every day 💖',
    'Some hearts just fit. Yours and mine already do.',
  ],
} as const

export const MEMORIES = [
  {
    title: 'When we first talked',
    date: 'The start of all my favorite notifications',
    body: 'I didn’t know a chat could feel like coming home.',
    emoji: '💬',
  },
  {
    title: 'That first call',
    date: 'Your voice > everything else',
    body: 'Nervous laughs, long pauses, and still not wanting to hang up.',
    emoji: '📞',
  },
  {
    title: 'All our futures',
    date: 'Every tomorrow I picture has you in it',
    body: 'Not just one big day — the quiet ordinary ones too: lazy Sundays, road trips, soft plans, and years we haven’t named yet. Wherever we’re headed, I’m glad it’s with you.',
    emoji: '🌷',
  },
] as const

/**
 * Polaroids: `src` is a path under /public or full URL. Leave `src` empty for a “coming soon” frame.
 * Only the first slot has a photo for now; add paths here when you have more pictures.
 */
export const GALLERY = [
  { src: 'our-photo.jpg', caption: 'You and me, one day 💕', tilt: -4 },
  { src: '', tilt: 3 },
  { src: '', tilt: -2 },
] as const

/** Short lines shown under the polaroid row */
export const GALLERY_QUOTES = [
  'Some memories are too good to rush — we’ll freeze them here when the time is right.',
  'Every empty frame is a promise: more laughter, more us, more someday-soon.',
  'The camera can wait. What matters is we’re making the story 💕',
] as const

/** Leave empty to hide the music player. Example: 'music.mp3' in /public */
export const MUSIC_SRC: string = ''
