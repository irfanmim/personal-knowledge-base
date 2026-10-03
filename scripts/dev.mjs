// Dev server: keep .content/ in sync with vault/ while VitePress serves it with hot reload.
import chokidar from 'chokidar'
import { createServer } from 'vitepress'
import { syncContent, VAULT_DIR } from './build-content.mjs'

const run = async () => {
  try {
    const { published, skipped } = await syncContent({ writeManifest: true })
    console.log(`[content] ${published} entries, ${skipped} unpublished skipped`)
  } catch (err) {
    console.error(`[content] ${err.message}`)
  }
}

await run()

let timer
chokidar
  .watch([VAULT_DIR, 'categories.json', 'pages', 'public'], {
    ignoreInitial: true,
    ignored: (p) => p.includes('.obsidian'),
    usePolling: process.env.USE_POLLING === 'true',
  })
  .on('all', () => {
    clearTimeout(timer)
    timer = setTimeout(run, 150)
  })

const server = await createServer('.', { host: true })
await server.listen()
server.printUrls()
