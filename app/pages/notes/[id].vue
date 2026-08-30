<script setup lang="ts">
const route = useRoute()
const noteId = computed(() => String(route.params.id ?? ''))
const { editor, handleSave, handleCancel, handleDelete, handleLeave } = useNoteEditorPage(noteId)

onBeforeRouteLeave(async () => {
  return handleLeave()
})
</script>

<template>
  <div class="editor">
    <p v-if="editor.view === 'loading'" class="editor__loading" role="status">Загрузка…</p>

    <EmptyState
      v-else-if="editor.view === 'not-found'"
      title="Заметка не найдена"
      message="Такой заметки нет, либо она была удалена."
    >
      <AppButton to="/">Вернуться к заметкам</AppButton>
    </EmptyState>

    <EmptyState
      v-else-if="editor.view === 'blocked'"
      title="Заметка удалена"
      :message="editor.saveBlockedMessage"
    >
      <AppButton to="/">Вернуться к списку</AppButton>
    </EmptyState>

    <NoteEditorForm
      v-else-if="editor.view === 'editing' && editor.draft"
      :draft="editor.draft"
      :is-new="editor.isNew"
      :title-error="editor.titleError"
      :todo-errors="editor.todoErrors"
      :can-undo="editor.canUndo"
      :can-redo="editor.canRedo"
      @save="handleSave"
      @cancel="handleCancel"
      @delete="handleDelete"
      @undo="editor.undo"
      @redo="editor.redo"
      @update-title="editor.handleTitleInput"
      @blur-title="editor.handleTitleBlur"
      @toggle="editor.toggleTodo"
      @update-text="editor.handleTodoTextInput"
      @blur="editor.handleTodoTextBlur"
      @remove="editor.removeTodo"
      @add-todo="editor.addTodo"
    />
  </div>
</template>

<style scoped lang="scss">
.editor__loading {
  margin: 0;
  padding: 48px 24px;
  text-align: center;
  color: var(--color-muted);
}
</style>
