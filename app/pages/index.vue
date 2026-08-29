<script setup lang="ts">
const router = useRouter()
const store = useNotesStore()
const { notes } = storeToRefs(store)
const { confirm } = useConfirmDialog()

const handleCreate = async (): Promise<void> => {
  const note = createEmptyNote()
  saveDraft({
    noteId: note.id,
    draft: note,
    isNew: true
  })
  await router.push(`/notes/${note.id}`)
}

const handleDelete = async (id: string): Promise<void> => {
  const focusTarget = getFocusTargetAfterDelete(
    notes.value.map((note) => note.id),
    id
  )

  const accepted = await confirm({
    title: 'Удалить заметку?',
    message: 'Это действие нельзя отменить.',
    confirmLabel: 'Удалить',
    cancelLabel: 'Отмена',
    danger: true
  })

  if (!accepted) {
    return
  }

  store.deleteNote(id)
  await nextTick()

  if (focusTarget.type === 'create') {
    document.getElementById('create-note-button')?.focus()
    return
  }

  document.getElementById(`note-card-link-${focusTarget.id}`)?.focus()
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <h1>Все заметки</h1>
      <AppButton v-if="notes.length > 0" id="create-note-button" @click="handleCreate">Создать заметку</AppButton>
    </header>

    <main>
      <EmptyState
        v-if="notes.length === 0"
        title="Пока нет заметок"
        message="Создайте первую заметку, чтобы начать список дел."
      >
        <AppButton id="create-note-button" @click="handleCreate">Создать заметку</AppButton>
      </EmptyState>

      <ul v-else class="notes-grid" aria-label="Список заметок">
        <li v-for="note in notes" :key="note.id">
          <NoteCard :note @remove="handleDelete(note.id)" />
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped lang="scss">
.page__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
