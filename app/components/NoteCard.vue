<script setup lang="ts">
import type { Note } from '../types/note'

const props = defineProps<{
  note: Note
}>()

const emit = defineEmits<{
  edit: []
  remove: []
}>()

const previewTodos = computed(() => props.note.todos.slice(0, 3))
</script>

<template>
  <article class="note-card">
    <h2 class="note-card__title">
      {{ note.title || 'Без названия' }}
    </h2>

    <TodoList
      v-if="previewTodos.length > 0"
      :todos="previewTodos"
      readonly
    />
    <p
      v-else
      class="note-card__empty"
    >
      Нет задач
    </p>

    <div class="note-card__actions">
      <AppButton
        variant="secondary"
        @click="emit('edit')"
      >
        Изменить
      </AppButton>
      <AppButton
        variant="danger"
        @click="emit('remove')"
      >
        Удалить
      </AppButton>
    </div>
  </article>
</template>

<style scoped lang="scss">
.note-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
}

.note-card__title {
  margin: 0;
  font-size: 1.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-card__empty {
  margin: 0;
  color: var(--color-muted);
}

.note-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}
</style>
