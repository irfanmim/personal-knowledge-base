<script setup lang="ts">
import { computed } from 'vue'
import { data as entries } from '../../data/entries.data.js'
import { tagSlug } from '../../tag-slug.js'
import EntryRows from './EntryRows.vue'

const props = defineProps<{ tag: string }>()
const items = computed(() =>
  entries.filter((e) => e.tags.some((t) => tagSlug(t) === props.tag)).sort((a, b) => a.title.localeCompare(b.title)),
)
</script>

<template>
  <p class="sub">{{ items.length }} {{ items.length === 1 ? 'entry' : 'entries' }}</p>
  <EntryRows :entries="items" />
</template>

<style scoped>
.sub {
  color: var(--vp-c-text-2);
  margin: 0 0 24px;
}
</style>
