<script setup lang="ts">
import type { Todo } from '~/types/note'

defineProps<{
  todo: Todo
  readonly?: boolean
  error?: string
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
    <div class="todo-item__row">
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
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `todo-error-${todo.id}` : undefined"
        :aria-label="'Текст задачи'"
        placeholder="Текст задачи"
        @input="emit('update-text', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur')"
      />

      <p v-else class="todo-item__text">
        {{ todo.text || 'Пустая задача' }}
      </p>

      <AppButton
        v-if="!readonly"
        variant="ghost"
        aria-label="Удалить задачу"
        @click="emit('remove')"
      >
        Удалить
      </AppButton>
    </div>

    <p v-if="error" :id="`todo-error-${todo.id}`" class="todo-item__error" role="alert">
      {{ error }}
    </p>
  </li>
</template>

<style scoped lang="scss">
@use '../assets/styles/mixins' as *;

.todo-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-item__row {
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
  @include truncate;
}

.todo-item--completed .todo-item__input,
.todo-item--completed .todo-item__text {
  color: var(--color-muted);
  text-decoration: line-through;
}

.todo-item__error {
  margin: 0 0 0 34px;
  color: var(--color-danger);
}

.todo-item__input[aria-invalid='true'] {
  box-shadow: 0 1px 0 var(--color-danger);
}
</style>
