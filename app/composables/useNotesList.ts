import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { confirmDialogConfig } from '~/config/confirmDialog'
import { useNotesStore } from '~/stores/notes'
import { createEmptyNote } from '~/utils/note'
import { getFocusTargetAfterDelete, type FocusTargetAfterDelete } from '~/utils/list-focus'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { useDraftPersistence } from '~/composables/useDraftPersistence'

/**
 * Список заметок на главной странице.
 *
 * Создаёт новую заметку через черновик и удаляет существующую
 * с подтверждением. Куда перенести фокус, решает страница.
 *
 * @returns список заметок и обработчики создания/удаления
 */
export const useNotesList = () => {
  const router = useRouter()
  const store = useNotesStore()
  const { notes } = storeToRefs(store)
  const { confirm } = useConfirmDialog()
  const persistence = useDraftPersistence()

  const handleCreate = async (): Promise<void> => {
    const note = createEmptyNote()
    persistence.persistNow({
      noteId: note.id,
      draft: note,
      isNew: true
    })
    await router.push(`/notes/${note.id}`)
  }

  const handleDelete = async (id: string): Promise<FocusTargetAfterDelete | null> => {
    const focusTarget = getFocusTargetAfterDelete(
      notes.value.map((note) => note.id),
      id
    )

    const accepted = await confirm(confirmDialogConfig.deleteNote)

    if (!accepted) {
      return null
    }

    store.deleteNote(id)
    return focusTarget
  }

  return {
    notes,
    handleCreate,
    handleDelete
  }
}
