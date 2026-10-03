import { createContentLoader } from 'vitepress'

// One loader feeds the home page, category pages and recent list. Generated category pages
// (isCategory) and the home page are not entries.
export default createContentLoader('**/*.md', {
  transform(pages) {
    return pages
      .filter((p) => p.url !== '/' && !p.frontmatter.isCategory && !p.frontmatter.isTag)
      .map((p) => ({
        url: p.url,
        title: p.frontmatter.title,
        description: p.frontmatter.description ?? '',
        category: p.frontmatter.category,
        status: p.frontmatter.status,
        tags: p.frontmatter.tags ?? [],
        date: p.frontmatter.date,
        updated: p.frontmatter.updated,
      }))
      .sort((a, b) => String(b.updated).localeCompare(String(a.updated)) || a.title.localeCompare(b.title))
  },
})
