// Converts Obsidian syntax in a published note's body into plain markdown.
// Fenced and inline code are left untouched.
import path from 'node:path'
import { slug } from 'github-slugger'
import { isImage } from './vault-index.mjs'

// Code spans we must not rewrite: fenced blocks (closed or running to the end) and inline code.
const CODE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^\1[ \t]*$|(?![\s\S]))|`[^`\n]+`/gm
// ![[target#heading|display]] — target may be empty for same-note heading links.
const WIKI = /(!?)\[\[([^\]|#\n]*)(?:#([^\]|\n]*))?(?:\|([^\]\n]*))?\]\]/g

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * ctx: {
 *   index,        // buildIndex() result
 *   images,       // buildImageIndex() result
 *   source,       // vault-relative path of this note (for messages)
 *   url,          // this note's published URL
 *   outDir,       // posix dir of this note inside .content/
 *   addImage(abs) // registers an image for copying, returns its output filename
 *   addEdge(url)  // records a link to another published note
 *   warn(msg)
 * }
 */
export function transformBody(body, ctx) {
  const parts = []
  let last = 0
  for (const m of body.matchAll(CODE)) {
    parts.push(convert(body.slice(last, m.index), ctx), m[0])
    last = m.index + m[0].length
  }
  parts.push(convert(body.slice(last), ctx))
  return parts.join('')
}

function convert(text, ctx) {
  return text.replace(WIKI, (whole, bang, rawTarget, rawHeading, rawDisplay) => {
    const target = rawTarget.trim()
    const heading = rawHeading?.trim().replace(/^\^.*/, '') // block refs (#^id) have no heading anchor
    const display = rawDisplay?.trim()

    if (bang) return embed(target, display, ctx)

    const anchor = heading ? '#' + slug(heading) : ''
    if (!target) return heading ? `[${display || heading}](${anchor})` : whole // [[#Heading]] in the same note

    const res = ctx.index.resolve(target)
    const text = display || target
    if (res.state === 'ok') {
      if (res.url !== ctx.url) ctx.addEdge(res.url)
      return `[${text}](${res.url}${anchor})`
    }
    if (res.state === 'missing') ctx.warn(`${ctx.source}: [[${target}]] matches no note; rendered as plain text`)
    if (res.state === 'ambiguous') ctx.warn(`${ctx.source}: [[${target}]] is ambiguous; use [[folder/name]]. Rendered as plain text`)
    return text // unpublished or unresolved: plain text, never a broken link
  })
}

function embed(target, display, ctx) {
  const base = path.posix.basename(target)
  if (!isImage(base)) {
    // Note transclusion is not supported: fall back to a link (or plain text if unpublished).
    ctx.warn(`${ctx.source}: ![[${target}]] is not an image; transclusion is not supported, linking instead`)
    const res = ctx.index.resolve(target)
    if (res.state === 'ok') {
      if (res.url !== ctx.url) ctx.addEdge(res.url)
      return `[${display || target}](${res.url})`
    }
    return display || target
  }

  const file = ctx.images.get(base.toLowerCase())
  if (!file) {
    ctx.warn(`${ctx.source}: image "${base}" not found in the vault; omitted`)
    return ''
  }
  const name = ctx.addImage(file)
  // Relative so Vite hashes and fingerprints it (served from /assets/ with long-term caching).
  const src = path.posix.relative(ctx.outDir, `attachments/${name}`)

  // ![[img.png|300]] / ![[img.png|300x200]] set a size; any other text is the alt text.
  const size = /^(\d+)(?:x(\d+))?$/.exec(display ?? '')
  const alt = size || !display ? base.replace(/\.[^.]+$/, '') : display
  if (size) {
    return `<img src="${src}" alt="${escapeAttr(alt)}" width="${size[1]}"${size[2] ? ` height="${size[2]}"` : ''}>`
  }
  return `![${alt}](${src})`
}
