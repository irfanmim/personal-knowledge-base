<script setup lang="ts">
import { STATUS_LABELS } from '../../categories.js'

defineProps<{ status: string }>()
</script>

<template>
  <span class="badge" :class="status">{{ STATUS_LABELS[status] ?? status }}</span>
</template>

<style scoped>
.badge {
  --c: var(--vp-c-text-3);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: 500 12px var(--vp-font-family-base);
  padding: 2px 9px;
  border-radius: 999px;
  color: var(--c);
  border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
  background: color-mix(in srgb, var(--c) 10%, transparent);
  white-space: nowrap;
}
.badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c);
}
.draft {
  --c: var(--kb-st-draft);
}
.evolving {
  --c: var(--kb-st-evolving);
}
.complete {
  --c: var(--kb-st-complete);
}
</style>
