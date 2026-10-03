<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as entries } from '../../data/entries.data.js'
import EntryRows from './EntryRows.vue'

const props = defineProps<{ category: string }>()
const { frontmatter } = useData()
const items = computed(() =>
  entries.filter((e) => e.category === props.category).sort((a, b) => a.title.localeCompare(b.title)),
)
</script>

<template>
  <p class="sub">
    {{ items.length }} {{ items.length === 1 ? 'entry' : 'entries' }}<template v-if="frontmatter.description"> · {{ frontmatter.description }}</template>
  </p>
  <EntryRows :entries="items" />
</template>

<style scoped>
.sub {
  color: var(--vp-c-text-2);
  margin: 0 0 24px;
}
</style>
