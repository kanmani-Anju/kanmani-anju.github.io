import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * GitHub Pages asset base:
 * - User/org site (`<name>.github.io` repo): base MUST be `/` → https://kanmani-anju.github.io/
 * - Project site (`/<repo>/`): set `VITE_BASE_PATH=/<repo>/` or `vite build --base=/<repo>/`
 * - `npm run dev` → base `/`
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
})
