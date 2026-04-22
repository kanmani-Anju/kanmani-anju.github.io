import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, domAnimation } from 'framer-motion'
import './index.css'
import App from './App.tsx'

console.log(
  '%cKanmani ❤️ Anju',
  'color:#e879a9;font-weight:bold;font-size:14px',
  '| boot OK | base:',
  import.meta.env.BASE_URL,
  '| mode:',
  import.meta.env.MODE,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={domAnimation}>
      <App />
    </LazyMotion>
  </StrictMode>,
)
