import { ref } from 'vue'
import type { PrepareNoteForSaveResult } from '~/utils/validation'

export const useNoteValidation = () => {
  const titleError = ref('')
  const todoErrors = ref<Record<string, string>>({})

  const applyPrepareResult = (result: PrepareNoteForSaveResult): void => {
    if (result.ok) {
      return
    }

    if (result.field === 'title') {
      titleError.value = result.error
      return
    }

    todoErrors.value = Object.fromEntries(
      result.emptyTodoIds.map((todoId) => [todoId, result.error])
    )
  }

  const clearTitleError = (): void => {
    titleError.value = ''
  }

  const clearTodoError = (todoId: string): void => {
    todoErrors.value = Object.fromEntries(
      Object.entries(todoErrors.value).filter(([id]) => id !== todoId)
    )
  }

  const reset = (): void => {
    titleError.value = ''
    todoErrors.value = {}
  }

  return {
    titleError,
    todoErrors,
    applyPrepareResult,
    clearTitleError,
    clearTodoError,
    reset
  }
}
