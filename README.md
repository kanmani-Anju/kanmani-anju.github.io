# Kanmani ❤️ Anju

A small, playful love page for **Kanmani** — timers, daily quotes (India time), a growing rose & kisses, gallery placeholders, night mode with moon and stars, and lots of little hearts.

**Live site:** [kanmani-anju.github.io](https://kanmani-anju.github.io/)

## Run locally

```bash
npm ci
npm run dev
```

## Build & check

```bash
npm run ci
```

Produces `dist/` (and copies `404.html` for GitHub Pages).

## Deploy

Push to `main` on the `*.github.io` repo — **GitHub Actions** builds and publishes the `dist` folder (see `.github/workflows/deploy-pages.yml`).

## Stack

React, TypeScript, Vite, Tailwind CSS, Framer Motion.

Most names, dates, and messages are editable in `src/config.ts`.
