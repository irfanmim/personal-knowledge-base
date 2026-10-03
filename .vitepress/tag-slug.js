// Shared by the content pipeline and the theme so tag URLs always match.
export const tagSlug = (tag) =>
  String(tag)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
