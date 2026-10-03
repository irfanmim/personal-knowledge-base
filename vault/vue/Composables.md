---
title: Composables
publish: true
status: complete
category: vue
tags: [vue3, composition-api]
date: 2026-09-10
updated: 2026-09-24
description: Extracting reusable stateful logic with the Composition API.
---

## What they are

A composable is a function that uses Vue's reactivity to encapsulate and reuse stateful logic.

```js
export function useToggle(initial = false) {
  const on = ref(initial)
  const toggle = () => (on.value = !on.value)
  return { on, toggle }
}
```


