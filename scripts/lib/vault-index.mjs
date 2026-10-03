// Shared vault knowledge: which notes exist, where they publish to, and how a wikilink target resolves.
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { slug } from 'github-slugger'

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i
export const isImage = (name) => IMAGE_EXT.test(name)

// Dot-folders (.obsidian), underscore-folders (_drafts, _templates) and attachments never publish.
// `drafts: true` additionally descends into the top-level _drafts/ (used only to resolve links).
export function* walkNotes(vaultDir, { drafts = false } = {}) {
  function* walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'attachments') continue
        if (entry.name.startsWith('_') && !(drafts && entry.name === '_drafts' && dir === vaultDir)) continue
        yield* walk(full)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        yield full
      }
    }
  }
  yield* walk(vaultDir)
}

// Where a published note lands: folder = category unless front matter overrides, sub-paths kept in the URL.
export function entryLocation(relSegments, data) {
  const folder = relSegments.length > 1 ? relSegments[0] : null
  const category = slug(String(data.category ?? folder ?? ''))
  if (!category) return null
  const rest = relSegments.length > 1 ? relSegments.slice(1) : relSegments
  const parts = rest.map((seg, i) => slug(i === rest.length - 1 ? seg.replace(/\.md$/, '') : seg))
  const outRel = [category, ...parts].join('/') + '.md'
  return { category, outRel, url: '/' + outRel.replace(/\.md$/, '') }
}

// Index of ALL notes (published or not) so links to unpublished notes can be detected.
export function buildIndex(vaultDir) {
  const notes = []
  for (const file of walkNotes(vaultDir, { drafts: true })) {
    const rel = path.relative(vaultDir, file).split(path.sep)
    const inDrafts = rel[0] === '_drafts'
    const data = matter(fs.readFileSync(file, 'utf8')).data
    const loc = !inDrafts && data.publish === true ? entryLocation(rel, data) : null
    const aliases = [].concat(data.aliases ?? []).map(String)
    const relPath = rel.join('/').replace(/\.md$/, '')
    notes.push({
      relPath,
      pathKey: relPath.toLowerCase(),
      nameKey: rel[rel.length - 1].replace(/\.md$/, '').toLowerCase(),
      aliasKeys: aliases.map((a) => a.toLowerCase()),
      url: loc?.url ?? null,
    })
  }

  // Obsidian semantics: filename first (case-insensitive), then aliases; `folder/name` matches by path suffix.
  function resolve(target) {
    const key = target.trim().replace(/\.md$/i, '').toLowerCase()
    let found
    if (key.includes('/')) found = notes.filter((n) => n.pathKey === key || n.pathKey.endsWith('/' + key))
    else {
      found = notes.filter((n) => n.nameKey === key)
      if (!found.length) found = notes.filter((n) => n.aliasKeys.includes(key))
    }
    if (found.length === 0) return { state: 'missing' }
    if (found.length > 1) return { state: 'ambiguous' }
    return found[0].url ? { state: 'ok', url: found[0].url } : { state: 'unpublished' }
  }

  return { resolve }
}

// Image files anywhere in the vault (excluding dot/underscore folders), keyed by lower-cased filename.
export function buildImageIndex(vaultDir, warn) {
  const images = new Map()
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && !entry.name.startsWith('_')) walk(full)
      } else if (entry.isFile() && isImage(entry.name)) {
        const key = entry.name.toLowerCase()
        if (images.has(key)) warn?.(`duplicate image name "${entry.name}"; using ${path.relative(vaultDir, images.get(key))}`)
        else images.set(key, full)
      }
    }
  }
  walk(vaultDir)
  return images
}
