import { watch, type MaybeRefOrGetter } from 'vue'
import { useRouter } from 'vue-router'
import { confirmDialogConfig } from '~/config/confirmDialog'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { useNoteEditor } from '~/composables/useNoteEditor'

/**
 * Страничный слой редактора заметки.
 *
 * Оборачивает `useNoteEditor`: диалоги подтверждения, восстановление черновика
 * и навигация после сохранения, отмены, удаления или ухода со страницы.
 *
 * @param noteIdSource — id заметки (строка, ref или getter)
 * @returns редактор и обработчики действий страницы
 */
export const useNoteEditorPage = (noteIdSource: MaybeRefOrGetter<string>) => {
  const editor = useNoteEditor(noteIdSource)
  const router = useRouter()
  const { confirm, handleCancel: dismissConfirm } = useConfirmDialog()

  const confirmDiscard = (): Promise<boolean> => {
    return confirm(confirmDialogConfig[editor.isNew ? 'cancelCreate' : 'cancelEdit'])
  }

  watch(
    () => editor.needsRestore,
    async (needsRestore) => {
      if (!needsRestore) {
        return
      }

      const accepted = await confirm(confirmDialogConfig.restoreDraft)
      editor.restoreDraft(accepted)
    },
    { immediate: true }
  )

  const handleSave = async (): Promise<void> => {
    const result = await editor.save()

    if (result === 'saved') {
      await router.push('/')
    }
  }

  const handleCancel = async (): Promise<void> => {
    if (editor.isDirty) {
      const accepted = await confirmDiscard()

      if (!accepted) {
        return
      }
    }

    editor.discard()
    await router.push('/')
  }

  const handleDelete = async (): Promise<void> => {
    const accepted = await confirm(confirmDialogConfig.deleteNote)

    if (!accepted) {
      return
    }

    editor.removeNote()
    await router.push('/')
  }

  const handleLeave = async (): Promise<boolean> => {
    if (editor.needsRestore) {
      dismissConfirm()
      editor.restoreDraft(false)
    }

    if (!editor.isDirty) {
      return true
    }

    const accepted = await confirmDiscard()

    if (!accepted) {
      return false
    }

    editor.discard()
    return true
  }

  return {
    editor,
    handleSave,
    handleCancel,
    handleDelete,
    handleLeave
  }
}
