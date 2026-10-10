/**
 * Generates OG images and apple-touch-icon from simple SVGs via sharp.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(root, '..', 'public')
const ogDir = path.join(publicDir, 'og')

function svgFor(locale) {
  const tagline =
    locale === 'pt'
      ? 'Cabos · orçamentos · offline'
      : 'Cables · quotes · offline'
  const subtitle = locale === 'pt' ? 'auraconnect.pt' : 'auraconnect.pt'
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF8F1"/>
      <stop offset="55%" stop-color="#F0E6DC"/>
      <stop offset="100%" stop-color="#E0C4A8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="64" y="64" width="120" height="120" rx="28" fill="#C45C16"/>
  <path d="M86 124h22l10-22 16 44 10-22h24" stroke="#FFFAF5" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="64" y="280" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif" font-size="92" font-weight="700" fill="#1C1410">CableFlow</text>
  <text x="64" y="360" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif" font-size="40" font-weight="500" fill="#5C4F45">${tagline}</text>
  <text x="64" y="540" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif" font-size="28" fill="#8A7464">${subtitle}</text>
</svg>`
}

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#C45C16"/>
  <path d="M12 32h10l5-10 8 20 5-10h12" stroke="#FFFAF5" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`
}

async function main() {
  const sharp = (await import('sharp')).default
  fs.mkdirSync(ogDir, { recursive: true })

  for (const locale of ['pt', 'en']) {
    const out = path.join(ogDir, `cableflow-${locale}.png`)
    await sharp(Buffer.from(svgFor(locale))).png().toFile(out)
    console.log('wrote', out)
  }

  const apple = path.join(publicDir, 'apple-touch-icon.png')
  await sharp(Buffer.from(iconSvg())).resize(180, 180).png().toFile(apple)
  console.log('wrote', apple)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
