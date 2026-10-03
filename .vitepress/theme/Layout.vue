<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import Backlinks from './components/Backlinks.vue'
import Breadcrumb from './components/Breadcrumb.vue'
import CategoryGrid from './components/CategoryGrid.vue'
import RecentList from './components/RecentList.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-before>
      <Breadcrumb />
    </template>
    <template #doc-after>
      <Backlinks />
    </template>
    <template #home-hero-after>
      <div class="kb-home">
        <CategoryGrid />
        <RecentList />
      </div>
    </template>
  </Layout>
</template>

<style scoped>
.kb-home {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px 64px;
}
</style>
