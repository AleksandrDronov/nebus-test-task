<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const isNotFound = computed(() => props.error.status === 404)

const title = computed(() => (isNotFound.value ? 'Страница не найдена' : 'Что-то пошло не так'))

const message = computed(() =>
  isNotFound.value
    ? 'Такой страницы нет, либо она была удалена.'
    : 'Произошла непредвиденная ошибка. Можно вернуться к списку заметок.'
)
</script>

<template>
  <div class="app-shell">
    <EmptyState :title :message>
      <AppButton to="/">Вернуться к заметкам</AppButton>
    </EmptyState>
  </div>
</template>
