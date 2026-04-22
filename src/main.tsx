import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
    <App />
  </StrictMode>,
)
