/**
 * Edit names, dates, and messages here — no need to hunt through components.
 */
export const BRAND = 'Jemc'

export const SITE = {
  title: 'Kanmani ❤️ Anju 💖',
  subtitle: 'Every second with you is my favorite ❤️',
} as const

/** When your story began (local timezone) */
export const RELATIONSHIP_START_ISO = '2023-01-01T00:00:00'

export const SECRET = {
  /** Not case-sensitive; trim only */
  passwords: ['Kanmani', 'Anju', 'love'],
  message: "No matter what, it's always you ❤️",
} as const

export const MEMORIES = [
  {
    title: 'First chat',
    date: 'The day words became butterflies',
    body: 'When our screens lit up and the world got smaller—in the best way.',
    emoji: '💬',
  },
  {
    title: 'First call',
    date: 'When I heard your voice for real',
    body: 'Static, smiles, and that nervous happy silence that says everything.',
    emoji: '📞',
  },
  {
    title: 'First meet',
    date: 'The day time stood still',
    body: 'Proof that the best stories are the ones we write together.',
    emoji: '🌷',
  },
] as const

/** Polaroids: paths under /public — use BASE_URL in components */
export const GALLERY = [
  { src: 'our-photo.jpg', caption: 'YEH MERI HAII 💕', tilt: -4 },
  { src: 'https://picsum.photos/seed/love1/400/480', caption: 'Us, always 📸', tilt: 3 },
  { src: 'https://picsum.photos/seed/love2/400/480', caption: 'My favorite view 🌸', tilt: -2 },
] as const

/** Leave empty to hide the music player. Example: 'music.mp3' in /public */
export const MUSIC_SRC: string = ''
