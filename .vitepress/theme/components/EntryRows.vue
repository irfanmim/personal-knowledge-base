<script setup lang="ts">
import { withBase } from 'vitepress'
import { tagSlug } from '../../tag-slug.js'
import StatusBadge from './StatusBadge.vue'

defineProps<{ entries: { url: string; title: string; description?: string; status: string; tags: string[] }[] }>()
</script>

<template>
  <div v-for="e in entries" :key="e.url" class="row">
    <div class="top">
      <a class="t" :href="withBase(e.url)">{{ e.title }}</a>
      <StatusBadge :status="e.status" />
    </div>
    <p v-if="e.description">{{ e.description }}</p>
    <a v-for="tag in e.tags" :key="tag" class="tag" :href="withBase(`/tags/${tagSlug(tag)}`)">{{ tag }}</a>
  </div>
</template>

<style scoped>
.row {
  position: relative;
  padding: 18px 20px;
  background: var(--kb-panel);
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  margin-bottom: 12px;
}
.row:hover {
  border-color: var(--vp-c-brand-2);
}
.top {
  display: flex;
  align-items: center;
  gap: 12px;
}
/* The title link covers the whole card; tag links sit above it. */
.t {
  font: 600 18px var(--kb-display);
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.t::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
}
.top :deep(.badge) {
  margin-left: auto;
}
p {
  margin: 6px 0 8px;
  color: var(--vp-c-text-2);
  font-size: 15px;
}
.tag {
  position: relative;
  z-index: 1;
  display: inline-block;
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border-radius: 6px;
  padding: 1px 8px;
  margin-right: 6px;
  text-decoration: none;
}
.tag:hover {
  color: var(--vp-c-brand-1);
}
</style>
