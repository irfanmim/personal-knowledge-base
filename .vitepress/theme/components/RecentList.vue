<script setup lang="ts">
import { withBase } from 'vitepress'
import { data as entries } from '../../data/entries.data.js'
import { categoryLabel, formatDate } from '../../categories.js'
import StatusBadge from './StatusBadge.vue'

const recent = entries.slice(0, 6)
</script>

<template>
  <section v-if="recent.length">
    <div class="head"><h2>Recently updated</h2></div>
    <ul class="recent">
      <li v-for="e in recent" :key="e.url">
        <a class="ti" :href="withBase(e.url)">{{ e.title }}</a>
        <span class="cat">{{ categoryLabel(e.category) }}</span>
        <StatusBadge :status="e.status" />
        <span class="when">{{ formatDate(e.updated) }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.head {
  margin: 44px 0 16px;
}
h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 20px;
  font-family: var(--kb-display);
}
.recent {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--kb-panel);
}
li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-top: 1px solid var(--vp-c-divider);
}
li:first-child {
  border-top: 0;
}
.ti {
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.ti:hover {
  color: var(--vp-c-brand-1);
}
.cat {
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border-radius: 6px;
  padding: 2px 8px;
  white-space: nowrap;
}
.when {
  margin-left: auto;
  color: var(--vp-c-text-3);
  font-size: 13px;
  white-space: nowrap;
}
@media (max-width: 640px) {
  li {
    flex-wrap: wrap;
  }
  .when {
    margin-left: 0;
  }
}
</style>
