// markdown-it plugin for Obsidian callouts:
//   > [!tip] Optional title
//   > body...
// `[!type]-` / `[!type]+` make a collapsible callout (closed / open).

// Obsidian has many callout types; group them into a few visual styles.
const STYLE = {
  note: 'note', info: 'note', todo: 'note', abstract: 'note', summary: 'note', tldr: 'note',
  example: 'note', quote: 'note', cite: 'note',
  tip: 'tip', hint: 'tip', important: 'tip', success: 'tip', check: 'tip', done: 'tip',
  question: 'warning', help: 'warning', faq: 'warning', warning: 'warning', caution: 'warning', attention: 'warning',
  failure: 'danger', fail: 'danger', missing: 'danger', danger: 'danger', error: 'danger', bug: 'danger',
}

const MARKER = /^\[!([\w-]+)\]([+-]?)[ \t]*([^\n]*)/

export default function callouts(md) {
  md.core.ruler.push('obsidian_callouts', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const open = tokens[i]
      if (open.type !== 'blockquote_open') continue
      const para = tokens[i + 1]
      const inline = tokens[i + 2]
      if (para?.type !== 'paragraph_open' || inline?.type !== 'inline') continue
      const m = MARKER.exec(inline.content)
      if (!m) continue

      const [, rawType, fold, rawTitle] = m
      const type = rawType.toLowerCase()
      const title = rawTitle.trim() || type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
      const foldable = fold !== ''

      // Find the matching close tag at the same nesting level.
      let close = i + 1
      while (close < tokens.length && !(tokens[close].type === 'blockquote_close' && tokens[close].level === open.level)) close++
      if (close >= tokens.length) continue

      // Drop the marker line from the first paragraph; remove the paragraph if nothing else is on it.
      const brk = inline.children.findIndex((t) => t.type === 'softbreak' || t.type === 'hardbreak')
      if (brk === -1) {
        tokens.splice(i + 1, 3)
        close -= 3
      } else {
        inline.children = inline.children.slice(brk + 1)
        inline.content = inline.content.slice(inline.content.indexOf('\n') + 1)
      }

      const tag = foldable ? 'details' : 'div'
      open.tag = tag
      open.attrJoin('class', `callout callout-${STYLE[type] ?? 'note'}`)
      if (fold === '+') open.attrSet('open', '')
      tokens[close].tag = tag

      const head = new state.Token('html_block', '', 0)
      const esc = md.utils.escapeHtml(title)
      head.content = foldable ? `<summary class="callout-title">${esc}</summary>\n` : `<p class="callout-title">${esc}</p>\n`
      tokens.splice(i + 1, 0, head)
    }
  })
}
