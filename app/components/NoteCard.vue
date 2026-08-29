<script setup lang="ts">
import type { Note } from '~/types/note'
import { getNoteCardLinkId } from '~/utils/list-focus'

const props = defineProps<{
  note: Note
}>()

const emit = defineEmits<{
  remove: []
}>()

const previewTodos = computed(() => props.note.todos.slice(0, 3))
const displayTitle = computed(() => props.note.title || 'Без названия')
</script>

<template>
  <article class="note-card">
    <h2 class="note-card__title">
      <NuxtLink :id="getNoteCardLinkId(note.id)" :to="`/notes/${note.id}`" class="note-card__link">
        <span class="note-card__title-text">{{ displayTitle }}</span>
      </NuxtLink>
    </h2>

    <TodoList v-if="previewTodos.length > 0" :todos="previewTodos" readonly />
    <p v-else class="note-card__empty">Нет задач</p>

    <div class="note-card__actions">
      <AppButton variant="danger" @click="emit('remove')">Удалить</AppButton>
    </div>
  </article>
</template>

<style scoped lang="scss">
.note-card {
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
  transition: border-color 0.15s ease;
}

.note-card__link {
  color: inherit;
  text-decoration: none;
}

.note-card__link::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
}

.note-card__link:hover .note-card__title-text {
  text-decoration: underline;
}

.note-card__link:hover::after {
  border-color: var(--color-accent);
}

.note-card__title {
  font-size: 1.2rem;
}

.note-card__title-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-card__empty {
  margin: 0;
  color: var(--color-muted);
}
.note-card__actions {
  z-index: 1;
  width: fit-content;
  margin-top: auto;
  margin-left: auto;
}
</style>
