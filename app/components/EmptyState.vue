<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()
</script>

<template>
  <section class="empty-state">
    <h2 class="empty-state__title">
      {{ title }}
    </h2>
    <p class="empty-state__message">
      {{ message }}
    </p>
    <slot />
  </section>
</template>

<style scoped lang="scss">
.empty-state {
  padding: 48px 24px;
  text-align: center;
  background: var(--color-surface);
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-lg);
}

.empty-state__title {
  margin: 0 0 8px;
}

.empty-state__message {
  margin: 0 0 20px;
  color: var(--color-muted);
}
</style>
