<script setup lang="ts">
import type { Todo } from '../types/note'

defineProps<{
  todos: Todo[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  toggle: [todoId: string]
  'update-text': [todoId: string, value: string]
  blur: [todoId: string]
  remove: [todoId: string]
}>()
</script>

<template>
  <ul class="todo-list" :aria-label="readonly ? 'Предпросмотр задач' : 'Список задач'">
    <TodoItem
      v-for="todo in todos"
      :key="todo.id"
      :todo="todo"
      :readonly="readonly"
      @toggle="emit('toggle', todo.id)"
      @update-text="emit('update-text', todo.id, $event)"
      @blur="emit('blur', todo.id)"
      @remove="emit('remove', todo.id)"
    />
  </ul>
</template>

<style scoped lang="scss">
.todo-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
