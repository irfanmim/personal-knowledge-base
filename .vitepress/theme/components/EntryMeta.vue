<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { categoryLabel, formatDate } from '../../categories.js'
import { tagSlug } from '../../tag-slug.js'
import StatusBadge from './StatusBadge.vue'

const { frontmatter: fm } = useData()
</script>

<template>
  <div class="meta">
    <StatusBadge :status="fm.status" />
    <a class="cat" :href="withBase(`/${fm.category}/`)">{{ categoryLabel(fm.category) }}</a>
    <a v-for="tag in fm.tags" :key="tag" class="tag" :href="withBase(`/tags/${tagSlug(tag)}`)">{{ tag }}</a>
    <span class="dates">
      Created {{ formatDate(fm.date) }}<template v-if="fm.updated && fm.updated !== fm.date"> · Updated {{ formatDate(fm.updated) }}</template>
    </span>
  </div>
</template>

<style scoped>
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  color: var(--vp-c-text-3);
  font-size: 13px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 24px;
}
.cat {
  color: var(--vp-c-text-2);
  text-decoration: none;
}
.cat:hover {
  color: var(--vp-c-brand-1);
}
.tag {
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border-radius: 6px;
  padding: 1px 8px;
  text-decoration: none;
}
.tag:hover {
  color: var(--vp-c-brand-1);
}
</style>
