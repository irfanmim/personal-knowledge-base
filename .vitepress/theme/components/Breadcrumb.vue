<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { categoryLabel } from '../../categories.js'

const { frontmatter } = useData()
const category = computed(() => frontmatter.value.category as string | undefined)
const isCategory = computed(() => !!frontmatter.value.isCategory)
const isTag = computed(() => !!frontmatter.value.isTag)
</script>

<template>
  <nav v-if="isTag" class="crumb" aria-label="Breadcrumb">
    <a :href="withBase('/')">Knowledge Base</a>
    <i>›</i>
    <template v-if="frontmatter.tag">
      <a :href="withBase('/tags/')">Tags</a>
      <i>›</i>
      {{ frontmatter.tagLabel }}
    </template>
    <template v-else>Tags</template>
  </nav>
  <nav v-else-if="category" class="crumb" aria-label="Breadcrumb">
    <a :href="withBase('/')">Knowledge Base</a>
    <i>›</i>
    <template v-if="isCategory">{{ categoryLabel(category) }}</template>
    <template v-else>
      <a :href="withBase(`/${category}/`)">{{ categoryLabel(category) }}</a>
      <i>›</i>
      {{ frontmatter.title }}
    </template>
  </nav>
</template>

<style scoped>
.crumb {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-bottom: 14px;
}
.crumb a {
  color: var(--vp-c-text-2);
  text-decoration: none;
}
.crumb a:hover {
  color: var(--vp-c-brand-1);
}
.crumb i {
  margin: 0 6px;
  font-style: normal;
}
</style>
