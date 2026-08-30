<script setup lang="ts">
import type { Note } from '~/types/note'

defineProps<{
  draft: Note
  isNew: boolean
  titleError: string
  todoErrors: Record<string, string>
  canUndo: boolean
  canRedo: boolean
}>()

const emit = defineEmits<{
  save: []
  cancel: []
  delete: []
  undo: []
  redo: []
  'update-title': [value: string]
  'blur-title': []
  toggle: [todoId: string]
  'update-text': [todoId: string, value: string]
  blur: [todoId: string]
  remove: [todoId: string]
  'add-todo': []
}>()

const handleTitleInput = (event: Event): void => {
  const target = event.target

  if (!(target instanceof HTMLInputElement)) {
    return
  }

  emit('update-title', target.value)
}

const handleSave = (): void => {
  emit('save')
}
</script>

<template>
  <form class="editor-form" @submit.prevent="handleSave">
    <header class="editor-form__header">
      <h1>{{ isNew ? 'Новая заметка' : 'Изменение заметки' }}</h1>
      <div class="editor-form__toolbar">
        <AppButton variant="ghost" :disabled="!canUndo" type="button" @click="emit('undo')"
          >Отменить</AppButton
        >
        <AppButton variant="ghost" :disabled="!canRedo" type="button" @click="emit('redo')"
          >Повторить</AppButton
        >
      </div>
    </header>

    <label class="editor-form__title-field">
      <span>Название</span>
      <input
        class="editor-form__title-input"
        type="text"
        :value="draft.title"
        :aria-invalid="Boolean(titleError)"
        :aria-describedby="titleError ? 'title-error' : undefined"
        placeholder="Название заметки"
        @input="handleTitleInput"
        @blur="emit('blur-title')"
      />
    </label>
    <p v-if="titleError" id="title-error" class="editor-form__error" role="alert">
      {{ titleError }}
    </p>

    <section aria-label="Задачи">
      <TodoList
        :todos="draft.todos"
        :errors="todoErrors"
        @toggle="emit('toggle', $event)"
        @update-text="(todoId, value) => emit('update-text', todoId, value)"
        @blur="emit('blur', $event)"
        @remove="emit('remove', $event)"
      />
      <AppButton
        class="editor-form__add"
        variant="secondary"
        type="button"
        @click="emit('add-todo')"
        >Добавить задачу</AppButton
      >
    </section>

    <div class="editor-form__actions">
      <AppButton variant="secondary" type="button" @click="emit('cancel')">{{
        isNew ? 'Отменить' : 'Отменить редактирование'
      }}</AppButton>
      <AppButton v-if="!isNew" variant="danger" type="button" @click="emit('delete')"
        >Удалить</AppButton
      >
      <AppButton type="submit">Сохранить</AppButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
.editor-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.editor-form__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.editor-form__toolbar,
.editor-form__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.editor-form__title-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 600;
}

.editor-form__title-input {
  width: 100%;
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: #fff;
}

.editor-form__error {
  margin: 0;
  color: var(--color-danger);
}

.editor-form__add {
  margin-top: 12px;
}

.editor-form__actions {
  justify-content: flex-end;
  padding-top: 8px;
}

@media (max-width: 720px) {
  .editor-form {
    padding: 16px;
  }

  .editor-form__actions {
    justify-content: stretch;
  }

  .editor-form__actions :deep(.app-button) {
    flex: 1;
  }
}
</style>
