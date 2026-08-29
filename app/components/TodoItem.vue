<script setup lang="ts">
import type { Todo } from '../types/note'

defineProps<{
  todo: Todo
  readonly?: boolean
}>()

const emit = defineEmits<{
  toggle: []
  'update-text': [value: string]
  blur: []
  remove: []
}>()
</script>

<template>
  <li class="todo-item" :class="{ 'todo-item--completed': todo.completed }">
    <AppCheckbox
      :model-value="todo.completed"
      :disabled="readonly"
      :label="todo.text || 'Задача без названия'"
      @update:model-value="emit('toggle')"
    />

    <input
      v-if="!readonly"
      class="todo-item__input"
      type="text"
      :value="todo.text"
      :aria-label="'Текст задачи'"
      placeholder="Текст задачи"
      @input="emit('update-text', ($event.target as HTMLInputElement).value)"
      @blur="emit('blur')"
    />

    <p v-else class="todo-item__text">
      {{ todo.text || 'Пустая задача' }}
    </p>

    <AppButton v-if="!readonly" variant="ghost" aria-label="Удалить задачу" @click="emit('remove')">
      Удалить
    </AppButton>
  </li>
</template>

<style scoped lang="scss">
.todo-item {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 44px;
}

.todo-item__input,
.todo-item__text {
  width: 100%;
  margin: 0;
  border: 0;
  background: transparent;
  color: inherit;
}

.todo-item__input {
  padding: 8px 0;
}

.todo-item__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-item--completed .todo-item__input,
.todo-item--completed .todo-item__text {
  color: var(--color-muted);
  text-decoration: line-through;
}
</style>
