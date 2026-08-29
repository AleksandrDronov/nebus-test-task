<script setup lang="ts">
import { confirmDialogConfig } from '~/config/confirmDialog'

const route = useRoute()
const noteId = computed(() => String(route.params.id ?? ''))

const editor = useNoteEditor(noteId)
const { confirm } = useConfirmDialog()

const handleSave = async (): Promise<void> => {
  await editor.save()
}

const handleCancelEditing = async (): Promise<void> => {
  if (!editor.isDirty) {
    await editor.cancel(true)
    return
  }

  const accepted = await confirm(confirmDialogConfig[editor.isNew ? 'cancelCreate' : 'cancelEdit'])

  if (accepted) {
    await editor.cancel(true)
  }
}

const handleDelete = async (): Promise<void> => {
  const accepted = await confirm(confirmDialogConfig.deleteNote)

  if (accepted) {
    await editor.removeNote()
  }
}
</script>

<template>
  <div class="editor">
    <EmptyState
      v-if="editor.isReady && editor.notFound"
      title="Заметка не найдена"
      message="Такой заметки нет, либо она была удалена."
    >
      <AppButton @click="navigateTo('/')">Вернуться к заметкам</AppButton>
    </EmptyState>

    <form v-else-if="editor.draft" class="editor__form" @submit.prevent="handleSave">
      <header class="editor__header">
        <h1>{{ editor.isNew ? 'Новая заметка' : 'Изменение заметки' }}</h1>
        <div class="editor__toolbar">
          <AppButton variant="ghost" :disabled="!editor.canUndo" type="button" @click="editor.undo"
            >Отменить</AppButton
          >
          <AppButton variant="ghost" :disabled="!editor.canRedo" type="button" @click="editor.redo"
            >Повторить</AppButton
          >
        </div>
      </header>

      <p v-if="editor.saveBlockedMessage" class="editor__alert" role="alert">
        {{ editor.saveBlockedMessage }}
      </p>

      <label class="editor__title-field">
        <span>Название</span>
        <input
          class="editor__title-input"
          type="text"
          :value="editor.draft.title"
          :aria-invalid="Boolean(editor.titleError)"
          aria-describedby="title-error"
          placeholder="Название заметки"
          @input="editor.handleTitleInput(($event.target as HTMLInputElement).value)"
          @blur="editor.handleTitleBlur"
        />
      </label>
      <p v-if="editor.titleError" id="title-error" class="editor__error" role="alert">
        {{ editor.titleError }}
      </p>

      <section aria-label="Задачи">
        <TodoList
          :todos="editor.draft.todos"
          :errors="editor.todoErrors"
          @toggle="editor.toggleTodo"
          @update-text="editor.handleTodoTextInput"
          @blur="editor.handleTodoTextBlur"
          @remove="editor.removeTodo"
        />
        <AppButton class="editor__add" variant="secondary" type="button" @click="editor.addTodo"
          >Добавить задачу</AppButton
        >
      </section>

      <div class="editor__actions">
        <AppButton variant="secondary" type="button" @click="handleCancelEditing">{{
          editor.isNew ? 'Отменить' : 'Отменить редактирование'
        }}</AppButton>
        <AppButton v-if="!editor.isNew" variant="danger" type="button" @click="handleDelete"
          >Удалить</AppButton
        >
        <AppButton type="submit" :disabled="Boolean(editor.saveBlockedMessage)"
          >Сохранить</AppButton
        >
      </div>

      <p v-if="editor.saveBlockedMessage" class="editor__back">
        <NuxtLink to="/">Вернуться к списку</NuxtLink>
      </p>
    </form>

    <ConfirmDialog
      :open="editor.showRestoreDialog"
      v-bind="confirmDialogConfig.restoreDraft"
      @confirm="editor.restoreDraftChoice(true)"
      @cancel="editor.restoreDraftChoice(false)"
    />
  </div>
</template>

<style scoped lang="scss">
.editor__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.editor__toolbar,
.editor__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.editor__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.editor__title-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 600;
}

.editor__title-input {
  width: 100%;
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: #fff;
}

.editor__error,
.editor__alert {
  margin: 0;
  color: var(--color-danger);
}

.editor__add {
  margin-top: 12px;
}

.editor__actions {
  justify-content: flex-end;
  padding-top: 8px;
}

.editor__back-link {
  text-decoration: none;
}

.editor__back a {
  color: var(--color-accent-strong);
}

@media (max-width: 720px) {
  .editor__form {
    padding: 16px;
  }

  .editor__actions {
    justify-content: stretch;
  }

  .editor__actions :deep(.app-button) {
    flex: 1;
  }
}
</style>
