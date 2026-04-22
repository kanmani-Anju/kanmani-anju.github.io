/**
 * GitHub Pages serves 404.html for unknown paths. Copy the SPA shell so client routes work if you add a router later.
 */
const fs = require('fs')
const path = require('path')

const dist = path.join(__dirname, '..', 'dist')
const index = path.join(dist, 'index.html')
const notFound = path.join(dist, '404.html')

if (!fs.existsSync(index)) {
  console.warn('[copy-404] dist/index.html missing; skip')
  process.exit(0)
}
fs.copyFileSync(index, notFound)
console.log('[copy-404] wrote dist/404.html')
