# personal-website-knowledge

The source of **https://knowledge.irfanmim.com**: a static [VitePress](https://vitepress.dev) site built from an
Obsidian vault. It is independent of irfanmim.com (`personal-website-fe` / `personal-website-be`) and only links to it.

```
vault/      Obsidian vault (open ONLY this folder in Obsidian)
scripts/    content pipeline: vault/ -> .content/ (publish filter, wikilinks, images, backlinks, tags)
.vitepress/ site config + custom theme
pages/      home page source;  public/  .htaccess, robots.txt, og image
```

## Writing and publishing

1. Create notes in Obsidian. Start drafts in `vault/_drafts/` (gitignored, never committed, never built).
2. To publish: move the note into a category folder (e.g. `vault/system-design/`) and set `publish: true`.
   The `_templates/entry.md` template has all front matter fields.
3. Commit and push to `main`. GitHub Actions builds and deploys the site.

> **This repo is public.** Anything committed is readable on GitHub, including notes with `publish: false`.
> Keep unpublished work in `vault/_drafts/` (ignored by git).

Front matter:

```yaml
---
title: Rate Limiter
publish: true            # only publish: true is built
status: evolving         # draft | evolving | complete
category: system-design  # optional, defaults to the folder name
tags: [redis, scalability]
date: 2026-10-01         # optional, falls back to git history
updated: 2026-10-03
description: One-line summary used for listings, search and link previews
aliases: [Throttling]    # other names usable in [[wikilinks]]
redirect_from: [/system-design/old-slug]   # after renaming/moving a published note
---
```

Supported Obsidian syntax: `[[Note]]`, `[[Note|text]]`, `[[Note#Heading]]`, `![[image.png]]`, `![[image.png|300]]`,
callouts (`> [!tip] Title`, `[!note]-` for collapsed). Links to unpublished or missing notes render as plain text.

Category names and order are set in `categories.json`.

## Running locally

- With Docker: `docker compose up -d --build` in `../personal-website-be`, then open http://localhost:5174.
- Or with Node 22: `npm install && npm run dev`.
- `npm run build` writes the site to `.vitepress/dist/`; `npm run preview` serves it.
- `npm run slugs` records published URLs in `slugs.json` (also done by `npm run dev`). Commit that file.
  The build warns if a published URL disappears without a `redirect_from`.

## Deploy setup (one time)

Deploys run from `.github/workflows/deploy.yml` on every push to `main` (and manually via "Run workflow").

1. **Create a dedicated deploy key** on your machine:
   `ssh-keygen -t ed25519 -f knowledge_deploy -C "github-deploy-knowledge" -N ""`
2. **Add the public key** (`knowledge_deploy.pub`) in the Hostinger panel (Advanced → SSH Access → add key).
3. **Find the SSH details** in the same panel: host, port (often not 22), username. The target path is the
   document root of the `knowledge` subdomain (e.g. `/home/<user>/domains/irfanmim.com/public_html/knowledge`).
4. **Check rsync exists**: `ssh -p <port> -i knowledge_deploy <user>@<host> 'which rsync'`.
   If it prints nothing, the workflow needs the scp fallback; ask for it to be added.
5. **Get the host key**: `ssh-keyscan -p <port> <host>`. Compare its fingerprint with the one in the panel
   (`ssh-keygen -lf <(ssh-keyscan -p <port> <host>)`), then use the output as `SSH_KNOWN_HOSTS`.
6. **Add GitHub secrets** (repo → Settings → Secrets and variables → Actions):

   | Secret | Value |
   |---|---|
   | `SSH_PRIVATE_KEY` | contents of `knowledge_deploy` (the private key) |
   | `SSH_HOST` | server host |
   | `SSH_PORT` | SSH port |
   | `SSH_USER` | SSH username |
   | `SSH_PATH` | absolute document root of the subdomain, no trailing slash |
   | `SSH_KNOWN_HOSTS` | output from step 5 |

7. **First run**: Actions → "Deploy Knowledge Base" → Run workflow with **dry run** ticked and read the
   rsync output (it lists what would change/delete). Then run again without dry run.

Safety: the workflow refuses to run if `SSH_PATH` is empty or shallower than 3 folders, verifies the host key
(no `StrictHostKeyChecking=no`), and never touches `.well-known/` or `cgi-bin/` on the server. `.htaccess` ships
from `public/` so it is part of every deploy. Commit `package-lock.json` (the workflow uses `npm ci`).

## Obsidian Git plugin

The vault is `vault/`, but the git repository is one level up. In Obsidian: Settings → Community plugins →
install **Obsidian Git**, then in its settings:

- **Custom base path (git repository path)**: `..`
- **Commit message**: `content: {{date}}` (so content commits are easy to tell from code commits)
- **Auto commit-and-sync after stopping file edits**: ~10 minutes, **Pull on startup**: on
- Prefer a clean `main` for code work: do code changes on branches/PRs so auto-commits never sweep up
  half-finished code, or give Obsidian its own clone of the repo.

`vault/.obsidian/` in git: commit `app.json`, `appearance.json`, `core-plugins.json`, `community-plugins.json`,
`templates.json` and plugin `data.json` files (settings). Ignored (see `.gitignore`): `workspace*.json`, `cache`,
`.trash/`, and plugin `main.js`/`styles.css` (reinstall plugins on a new machine).

## Later: moving the vault to its own repo

Keep drafts private and the site public: `git filter-repo --subdirectory-filter vault` (on a copy) creates a
history containing only the vault. The site repo can then check it out beside itself in CI and point
`VAULT_DIR` at it (the pipeline already reads `process.env.VAULT_DIR`).
