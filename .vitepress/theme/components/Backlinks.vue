<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { frontmatter } = useData()
const links = computed(() => (frontmatter.value.backlinks ?? []) as { title: string; url: string }[])
</script>

<template>
  <section v-if="links.length" class="linked">
    <h3>Linked from</h3>
    <a v-for="l in links" :key="l.url" :href="withBase(l.url)">{{ l.title }}</a>
  </section>
</template>

<style scoped>
.linked {
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid var(--vp-c-divider);
}
h3 {
  font: 600 16px var(--kb-display);
  margin: 0 0 10px;
}
a {
  display: block;
  padding: 6px 0;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
</style>
