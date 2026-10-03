<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as entries } from '../../data/entries.data.js'
import { tagSlug } from '../../tag-slug.js'

// slug -> { label, count }, most used first
const tags = computed(() => {
  const map = new Map<string, { slug: string; label: string; count: number }>()
  for (const e of entries) {
    for (const t of new Set(e.tags.map((x: string) => tagSlug(x)))) {
      if (!t) continue
      const label = e.tags.find((x: string) => tagSlug(x) === t)
      const cur = map.get(t) ?? { slug: t, label, count: 0 }
      cur.count++
      map.set(t, cur)
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
})
</script>

<template>
  <p v-if="!tags.length" class="sub">No tags yet.</p>
  <div v-else class="cloud">
    <a v-for="t in tags" :key="t.slug" class="chip" :href="withBase(`/tags/${t.slug}`)">
      {{ t.label }} <span>{{ t.count }}</span>
    </a>
  </div>
</template>

<style scoped>
.sub {
  color: var(--vp-c-text-2);
}
.cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--kb-panel);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  font-size: 14px;
}
.chip span {
  color: var(--vp-c-text-3);
  font-size: 12px;
}
.chip:hover {
  border-color: var(--vp-c-brand-2);
}
</style>
