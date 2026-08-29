import { nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { confirmDialogConfig } from '~/config/confirmDialog'
import { useNotesStore } from '~/stores/notes'
import { createEmptyNote } from '~/utils/note'
import { saveDraft } from '~/utils/persistence'
import {
  CREATE_NOTE_BUTTON_ID,
  getFocusTargetAfterDelete,
  getNoteCardLinkId
} from '~/utils/list-focus'
import { useConfirmDialog } from '~/composables/useConfirmDialog'

/**
 * Список заметок на главной странице.
 *
 * Создаёт новую заметку через черновик и удаляет существующую
 * с подтверждением и переносом фокуса на соседнюю карточку.
 *
 * @returns список заметок и обработчики создания/удаления
 */
export const useNotesList = () => {
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

    const accepted = await confirm(confirmDialogConfig.deleteNote)

    if (!accepted) {
      return
    }

    store.deleteNote(id)
    await nextTick()

    if (focusTarget.type === 'create') {
      document.getElementById(CREATE_NOTE_BUTTON_ID)?.focus()
      return
    }

    document.getElementById(getNoteCardLinkId(focusTarget.id))?.focus()
  }

  return {
    notes,
    handleCreate,
    handleDelete
  }
}
