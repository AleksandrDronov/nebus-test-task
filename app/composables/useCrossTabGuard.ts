import { ref, type Ref } from 'vue'
import { NOTES_STORAGE_KEY } from '~/types/storage'
import { useNotesStore } from '~/stores/notes'

/** Сообщение, когда заметку удалили в другой вкладке. */
export const NOTE_DELETED_IN_OTHER_TAB_MESSAGE =
  'Заметка была удалена в другой вкладке. Сохранение невозможно.'

/**
 * Защита редактора от удаления заметки в другой вкладке.
 *
 * Слушает `storage` по ключу заметок и перед сохранением перечитывает стор.
 * Для новой (ещё не сохранённой) заметки удаление в другой вкладке не блокирует.
 *
 * @param noteId — текущий id заметки
 * @param isNew — создаётся ли заметка в этой сессии
 * @returns флаги блокировки, проверка перед save и обработчик `storage`
 */
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
