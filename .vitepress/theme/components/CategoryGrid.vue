<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as entries } from '../../data/entries.data.js'
import { groupByCategory } from '../../categories.js'

const groups = computed(() => groupByCategory(entries))
</script>

<template>
  <section>
    <div class="head">
      <h2>Categories</h2>
      <small>{{ groups.length }} categories · {{ entries.length }} entries</small>
    </div>
    <div class="grid">
      <a v-for="g in groups" :key="g.key" class="card" :href="withBase(`/${g.key}/`)">
        <div class="t">{{ g.label }}</div>
        <div class="c">{{ g.entries.length }} {{ g.entries.length === 1 ? 'entry' : 'entries' }}</div>
      </a>
    </div>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 44px 0 16px;
}
h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 20px;
  font-family: var(--kb-display);
}
small {
  color: var(--vp-c-text-3);
  font-size: 13px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}
.card {
  display: block;
  background: var(--kb-panel);
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 18px 20px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: border-color 0.15s, transform 0.15s;
}
.card:hover {
  border-color: var(--vp-c-brand-2);
  transform: translateY(-2px);
}
.t {
  font: 600 17px var(--kb-display);
}
.c {
  color: var(--vp-c-text-3);
  font-size: 13px;
  margin-top: 4px;
}
</style>
