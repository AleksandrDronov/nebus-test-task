<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useNotesStore } from '../stores/notes'
import { createEmptyNote } from '../utils/note'
import { saveDraft } from '../composables/usePersistence'

const router = useRouter()
const store = useNotesStore()
const { notes } = storeToRefs(store)
const {
  isOpen: isConfirmOpen,
  title: confirmTitle,
  message: confirmMessage,
  confirmLabel,
  cancelLabel,
  danger: confirmDanger,
  confirm,
  handleConfirm,
  handleCancel
} = useConfirmDialog()

onMounted(() => {
  store.load()
})

const handleCreate = async (): Promise<void> => {
  const note = createEmptyNote()
  saveDraft({
    noteId: note.id,
    draft: note,
    isNew: true
  })
  await router.push(`/notes/${note.id}`)
}

const handleEdit = async (id: string): Promise<void> => {
  await router.push(`/notes/${id}`)
}

const handleDelete = async (id: string): Promise<void> => {
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
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <h1>Все заметки</h1>
      <AppButton @click="handleCreate"> Создать заметку </AppButton>
    </header>

    <main>
      <EmptyState
        v-if="notes.length === 0"
        title="Пока нет заметок"
        message="Создайте первую заметку, чтобы начать список дел."
      >
        <AppButton @click="handleCreate"> Создать заметку </AppButton>
      </EmptyState>

      <section v-else class="notes-grid" aria-label="Список заметок">
        <NoteCard
          v-for="note in notes"
          :key="note.id"
          :note="note"
          @edit="handleEdit(note.id)"
          @remove="handleDelete(note.id)"
        />
      </section>
    </main>

    <ConfirmDialog
      :open="isConfirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-label="confirmLabel"
      :cancel-label="cancelLabel"
      :danger="confirmDanger"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped lang="scss">
.page__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.page__header h1 {
  margin: 4px 0 0;
}

.page__eyebrow {
  margin: 0;
  color: var(--color-accent-strong);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
</style>
