import { ref, type Ref } from 'vue'
import { NOTES_STORAGE_KEY } from '~/types/storage'
import { useNotesStore } from '~/stores/notes'

export const NOTE_DELETED_IN_OTHER_TAB_MESSAGE =
  'Заметка была удалена в другой вкладке. Сохранение невозможно.'

export const useCrossTabGuard = (noteId: () => string, isNew: Ref<boolean>) => {
  const store = useNotesStore()
  const deletedInOtherTab = ref(false)
  const saveBlockedMessage = ref('')

  const markDeleted = (): void => {
    deletedInOtherTab.value = true
    saveBlockedMessage.value = NOTE_DELETED_IN_OTHER_TAB_MESSAGE
  }

  const reset = (): void => {
    deletedInOtherTab.value = false
    saveBlockedMessage.value = ''
  }

  const checkDeleted = (): boolean => {
    store.load()

    if (deletedInOtherTab.value || (!isNew.value && !store.getNote(noteId()))) {
      markDeleted()
      return true
    }

    return false
  }

  const handleStorage = (event: StorageEvent): void => {
    if (event.key !== NOTES_STORAGE_KEY) {
      return
    }

    checkDeleted()
  }

  return {
    deletedInOtherTab,
    saveBlockedMessage,
    checkDeleted,
    handleStorage,
    reset
  }
}
