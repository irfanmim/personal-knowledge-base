import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import EntryMeta from './components/EntryMeta.vue'
import CategoryList from './components/CategoryList.vue'
import TagList from './components/TagList.vue'
import TagEntries from './components/TagEntries.vue'
import './styles/tokens.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // Used from generated markdown: <EntryMeta /> after each entry's H1, <CategoryList /> on category pages.
    app.component('EntryMeta', EntryMeta)
    app.component('CategoryList', CategoryList)
    app.component('TagList', TagList)
    app.component('TagEntries', TagEntries)
  },
} satisfies Theme
