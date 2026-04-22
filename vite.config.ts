import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * GitHub Pages asset base:
 * - User/org site (repo name ends with .github.io): base is "/" e.g. kanmani-anju.github.io
 * - Project site: set VITE_BASE_PATH=/<repo>/ or vite build --base=/<repo>/
 */
function githubPagesBase(): string {
  const raw = process.env.VITE_BASE_PATH?.trim()
  if (!raw || raw === '/') return '/'
  const noTrail = raw.replace(/\/+$/, '')
  return `${noTrail.startsWith('/') ? noTrail : `/${noTrail}`}/`
}

export default defineConfig({
  plugins: [react()],
  base: githubPagesBase(),
  build: {
    /** Smaller, faster output on modern browsers (mobile + desktop) */
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/react-dom')) return 'react-dom'
          if (id.includes('node_modules/react/')) return 'react'
        },
      },
    },
  },
})
