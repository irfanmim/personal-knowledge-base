// One-off generator for public/og-default.png (1200x630), the default Open Graph / Twitter image.
// Run `npm run og` and commit the result. Needs a system font (text is rendered by librsvg), so
// inside the alpine Docker container run `apk add --no-cache fontconfig ttf-dejavu` first.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FONT = "'DejaVu Sans', 'Inter', sans-serif"

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="85%" cy="10%" r="70%">
      <stop offset="0" stop-color="#22d3ee" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0a0e17"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="80" y="96" width="56" height="6" rx="3" fill="#22d3ee"/>
  <text x="80" y="170" fill="#22d3ee" font-family="${FONT}" font-size="26" letter-spacing="5">SOFTWARE ENGINEERING NOTES</text>
  <text x="80" y="330" fill="#e6ebf4" font-family="${FONT}" font-size="104" font-weight="700">Knowledge Base</text>
  <text x="80" y="404" fill="#aab6cc" font-family="${FONT}" font-size="34">What I know, organized by topic.</text>
  <text x="80" y="548" fill="#7c8aa5" font-family="${FONT}" font-size="30">knowledge.irfanmim.com</text>
</svg>`

const out = path.join(ROOT, 'public', 'og-default.png')
fs.mkdirSync(path.dirname(out), { recursive: true })
await sharp(Buffer.from(svg)).png().toFile(out)
console.log(`wrote ${path.relative(ROOT, out)}`)
