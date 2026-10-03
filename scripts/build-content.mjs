// Turns vault/ into the gitignored .content/ staging folder that VitePress builds from.
// Only notes with `publish: true` are copied, so unpublished notes never reach VitePress
// (and therefore never reach the search index, sitemap or build output).
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { slug } from 'github-slugger'
import { buildImageIndex, buildIndex, entryLocation, walkNotes } from './lib/vault-index.mjs'
import { transformBody } from './lib/obsidian-syntax.mjs'
import { tagSlug } from '../.vitepress/tag-slug.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const VAULT_DIR = path.resolve(ROOT, process.env.VAULT_DIR ?? 'vault')
export const OUT_DIR = path.join(ROOT, '.content')
const PAGES_DIR = path.join(ROOT, 'pages')
const PUBLIC_DIR = path.join(ROOT, 'public')
const MANIFEST = path.join(ROOT, 'slugs.json')
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, 'categories.json'), 'utf8'))

const warn = (msg) => console.warn(`[content] ${msg}`)

function* walkAll(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walkAll(full)
    else if (entry.isFile()) yield full
  }
}

const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const categoryLabel = (key) => CATEGORIES.find((c) => c.key === key)?.label ?? titleCase(key)
const categoryDescription = (key) => CATEGORIES.find((c) => c.key === key)?.description ?? ''

// YAML turns `2026-10-01` into a Date; keep dates as plain YYYY-MM-DD strings.
const asDay = (v) => {
  if (!v) return undefined
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

// Front matter wins; otherwise first/last commit date, then file mtime (e.g. no git in the container).
let warnedNoGit = false
function fileDates(file) {
  try {
    const out = execFileSync('git', ['log', '--follow', '--format=%aI', '--', file], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .filter(Boolean)
    if (out.length) return { created: out[out.length - 1].slice(0, 10), updated: out[0].slice(0, 10) }
  } catch {
    // fall through to mtime
  }
  if (!warnedNoGit) {
    warnedNoGit = true
    warn('no git history available for some notes; using file modification time for missing dates')
  }
  const mtime = fs.statSync(file).mtime.toISOString().slice(0, 10)
  return { created: mtime, updated: mtime }
}

// The title comes from front matter and is shown as the page H1. Make sure the H1 exists and is
// followed by the entry meta line (status badge, category, tags, dates).
function withHeader(content, title) {
  const body = content.replace(/^\s*\n/, '')
  const m = /^# .+(\r?\n|$)/.exec(body)
  if (m) return body.slice(0, m[0].length) + '\n<EntryMeta />\n' + body.slice(m[0].length)
  return `# ${title}\n\n<EntryMeta />\n\n${body}`
}

// Large raster images are downscaled at build time (width only, never upscaled). sharp is loaded lazily so
// a missing native binary only means images are copied as-is.
const MAX_IMAGE_WIDTH = 1600
let sharpMod
async function loadSharp() {
  if (sharpMod === undefined) {
    try {
      sharpMod = (await import('sharp')).default
    } catch {
      sharpMod = null
      warn('sharp is not available; images are copied without optimization')
    }
  }
  return sharpMod
}

const imageCache = new Map() // abs path -> { stamp, buf } so dev rebuilds don't re-resize unchanged images
async function readOptimized(abs) {
  const stat = fs.statSync(abs)
  const stamp = `${stat.mtimeMs}:${stat.size}`
  if (imageCache.get(abs)?.stamp === stamp) return imageCache.get(abs).buf
  let buf = fs.readFileSync(abs)
  if (/\.(png|jpe?g|webp)$/i.test(abs)) {
    const sharp = await loadSharp()
    if (sharp) {
      try {
        const meta = await sharp(buf).metadata()
        if ((meta.width ?? 0) > MAX_IMAGE_WIDTH) {
          buf = await sharp(buf).rotate().resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true }).toBuffer()
        }
      } catch (err) {
        warn(`could not optimize ${path.basename(abs)}: ${err.message}`)
      }
    }
  }
  imageCache.set(abs, { stamp, buf })
  return buf
}

const normalizeRedirectFrom = (p) => '/' + String(p).trim().replace(/^\/+|\/+$/g, '').replace(/\.(html|md)$/, '')

// Collect everything that should exist in .content/ as Map<relative posix path, string|Buffer>.
export async function collectOutputs() {
  const outputs = new Map()
  const index = buildIndex(VAULT_DIR)
  const images = buildImageIndex(VAULT_DIR, warn)
  let skipped = 0

  // Pass 1: published notes, their locations and metadata.
  const notes = []
  const sources = new Map() // output path -> vault file, for collision errors
  for (const file of walkNotes(VAULT_DIR)) {
    const rel = path.relative(VAULT_DIR, file).split(path.sep)
    const parsed = matter(fs.readFileSync(file, 'utf8'))
    if (parsed.data.publish !== true) {
      skipped++
      continue
    }
    const loc = entryLocation(rel, parsed.data)
    if (!loc) {
      warn(`skipped ${rel.join('/')}: no category (put it in a folder or set \`category\`)`)
      continue
    }
    const { category, outRel, url } = loc
    if (category === 'tags') throw new Error(`${rel.join('/')}: "tags" is reserved for the generated tag pages; use another category name`)
    if (sources.has(outRel) || outRel === `${category}/index.md`) {
      throw new Error(`Slug collision: "${rel.join('/')}" and "${sources.get(outRel) ?? 'the category page'}" both map to ${url}`)
    }
    sources.set(outRel, rel.join('/'))

    const title = String(parsed.data.title ?? rel[rel.length - 1].replace(/\.md$/, ''))
    const needsDates = !parsed.data.date || !parsed.data.updated
    const git = needsDates ? fileDates(file) : null
    const date = asDay(parsed.data.date) ?? git.created
    const updated = asDay(parsed.data.updated) ?? git?.updated ?? date
    notes.push({
      source: rel.join('/'),
      outRel,
      url,
      category,
      title,
      parsed,
      date,
      updated,
    })
  }

  // Pass 2: convert Obsidian syntax, collecting images to copy and link edges for backlinks.
  const imageNames = new Map() // absolute path -> output name
  const usedNames = new Set()
  const addImage = (abs) => {
    if (imageNames.has(abs)) return imageNames.get(abs)
    const ext = path.extname(abs).toLowerCase()
    const base = slug(path.basename(abs, path.extname(abs))) || 'image'
    let name = base + ext
    for (let i = 2; usedNames.has(name); i++) name = `${base}-${i}${ext}`
    usedNames.add(name)
    imageNames.set(abs, name)
    return name
  }

  const incoming = new Map() // target url -> Map(source url -> { title, url })
  for (const n of notes) {
    n.body = transformBody(n.parsed.content, {
      index,
      images,
      source: n.source,
      url: n.url,
      outDir: path.posix.dirname(n.outRel),
      addImage,
      addEdge: (target) => {
        if (!incoming.has(target)) incoming.set(target, new Map())
        incoming.get(target).set(n.url, { title: n.title, url: n.url })
      },
      warn,
    })
  }

  for (const [abs, name] of imageNames) outputs.set(`attachments/${name}`, await readOptimized(abs))

  // Redirects for renamed entries: `redirect_from: [/old-category/old-slug]` in the new note's front matter.
  const publishedUrls = new Set(notes.map((n) => n.url))
  const redirects = {}
  for (const n of notes) {
    for (const raw of [].concat(n.parsed.data.redirect_from ?? [])) {
      const from = normalizeRedirectFrom(raw)
      if (publishedUrls.has(from)) warn(`${n.source}: redirect_from ${from} is a live page; ignored`)
      else redirects[from] = n.url
    }
  }

  // Pass 3: write entries (with backlinks in front matter) and generated pages.
  for (const n of notes) {
    const backlinks = [...(incoming.get(n.url)?.values() ?? [])].sort((a, b) => a.title.localeCompare(b.title))
    const data = {
      ...n.parsed.data,
      title: n.title,
      category: n.category,
      status: n.parsed.data.status ?? 'draft',
      tags: n.parsed.data.tags ?? [],
      date: n.date,
      updated: n.updated,
    }
    if (backlinks.length) data.backlinks = backlinks
    outputs.set(n.outRel, matter.stringify(withHeader(n.body, n.title), data))
  }

  // Category pages and sidebar are generated, so there is no per-entry or per-category config.
  const order = (k) => {
    const i = CATEGORIES.findIndex((c) => c.key === k)
    return i === -1 ? CATEGORIES.length : i
  }
  const keys = [...new Set(notes.map((n) => n.category))].sort((a, b) => order(a) - order(b) || a.localeCompare(b))
  const sidebar = keys.map((key) => ({
    text: categoryLabel(key),
    link: `/${key}/`,
    collapsed: false,
    items: notes
      .filter((n) => n.category === key)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((n) => ({ text: n.title, link: n.url })),
  }))
  for (const key of keys) {
    const label = categoryLabel(key)
    outputs.set(
      `${key}/index.md`,
      matter.stringify(`# ${label}\n\n<CategoryList category="${key}" />\n`, {
        title: label,
        description: categoryDescription(key),
        category: key,
        isCategory: true,
        aside: false,
        search: false, // listing page, not content
      }),
    )
  }

  // Tag pages: /tags/ (all tags) and /tags/<slug> (entries with that tag). Tags that differ only by
  // case or punctuation merge into one page.
  const tagLabels = new Map() // slug -> first label seen
  for (const n of [...notes].sort((a, b) => a.outRel.localeCompare(b.outRel))) {
    for (const t of [].concat(n.parsed.data.tags ?? [])) {
      const s = tagSlug(t)
      if (s && !tagLabels.has(s)) tagLabels.set(s, String(t).trim())
    }
  }
  const tagFront = { isTag: true, aside: false, search: false }
  outputs.set(
    'tags/index.md',
    matter.stringify('# Tags\n\n<TagList />\n', { ...tagFront, title: 'Tags', description: 'All tags used across the entries.' }),
  )
  for (const [s, label] of tagLabels) {
    const safe = label.replace(/[<>&{}]/g, (c) => `&#${c.charCodeAt(0)};`)
    outputs.set(
      `tags/${s}.md`,
      matter.stringify(`# Tagged: ${safe}\n\n<TagEntries tag="${s}" />\n`, {
        ...tagFront,
        title: `Tagged: ${label}`,
        description: `Entries tagged ${label}.`,
        tag: s,
        tagLabel: label,
      }),
    )
  }
  outputs.set('_data/sidebar.json', JSON.stringify(sidebar, null, 2) + '\n')
  outputs.set('_data/redirects.json', JSON.stringify(redirects, null, 2) + '\n')

  for (const file of walkAll(PAGES_DIR)) {
    outputs.set(path.relative(PAGES_DIR, file).split(path.sep).join('/'), fs.readFileSync(file))
  }
  // VitePress resolves its public dir relative to srcDir.
  for (const file of walkAll(PUBLIC_DIR)) {
    outputs.set('public/' + path.relative(PUBLIC_DIR, file).split(path.sep).join('/'), fs.readFileSync(file))
  }

  return { outputs, skipped, count: notes.length, urls: [...publishedUrls], redirects }
}

// slugs.json lists every URL ever published, so a rename or removal that would break old links is noticed.
function checkManifest({ urls, redirects }, write) {
  let known = []
  try {
    known = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).urls ?? []
  } catch {
    // no manifest yet
  }
  const live = new Set(urls)
  for (const url of known) {
    if (!live.has(url) && !redirects[url]) {
      warn(`${url} was published before but no longer exists. Add \`redirect_from: [${url}]\` to its new note, or delete it from slugs.json if it was removed on purpose`)
    }
  }
  if (write) {
    const next = JSON.stringify({ urls: [...new Set([...known, ...urls])].sort() }, null, 2) + '\n'
    if (!fs.existsSync(MANIFEST) || fs.readFileSync(MANIFEST, 'utf8') !== next) fs.writeFileSync(MANIFEST, next)
  }
}

// Write changed files and delete stale ones, instead of wiping the folder,
// so the dev server only sees real changes. `writeManifest` is for local use only: CI never edits slugs.json.
export async function syncContent({ writeManifest = false } = {}) {
  const result = await collectOutputs()
  const { outputs, skipped, count } = result
  checkManifest(result, writeManifest)
  fs.mkdirSync(OUT_DIR, { recursive: true })

  let written = 0
  for (const [rel, data] of outputs) {
    const dest = path.join(OUT_DIR, rel)
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
    if (fs.existsSync(dest) && fs.readFileSync(dest).equals(buf)) continue
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, buf)
    written++
  }

  let removed = 0
  for (const file of walkAll(OUT_DIR)) {
    const rel = path.relative(OUT_DIR, file).split(path.sep).join('/')
    if (rel.startsWith('.vitepress/')) continue
    if (!outputs.has(rel)) {
      fs.rmSync(file)
      removed++
    }
  }

  return { published: count, skipped, written, removed }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { published, skipped, written, removed } = await syncContent({ writeManifest: process.argv.includes('--write-manifest') })
  console.log(`[content] ${published} entries, ${skipped} unpublished skipped (${written} written, ${removed} removed)`)
}
