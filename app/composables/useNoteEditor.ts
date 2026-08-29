import {
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  reactive,
  toValue,
  watch,
  type MaybeRefOrGetter
} from 'vue'
import type { EditorSaveResult, EditorView } from '~/types/editor'
import { useNotesStore } from '~/stores/notes'
import { prepareNoteForSave } from '~/utils/validation'
import { useHistoryShortcuts } from '~/composables/useUndoRedo'
import { useNoteSession } from '~/composables/useNoteSession'
import { useNoteHistory } from '~/composables/useNoteHistory'
import { useDraftPersistence } from '~/composables/useDraftPersistence'
import { useNoteValidation } from '~/composables/useNoteValidation'
import { useCrossTabGuard } from '~/composables/useCrossTabGuard'

export const useNoteEditor = (noteIdSource: MaybeRefOrGetter<string>) => {
  const store = useNotesStore()
  const session = useNoteSession(noteIdSource)
  const persistence = useDraftPersistence()
  const validation = useNoteValidation()
  const guard = useCrossTabGuard(() => toValue(noteIdSource), session.isNew)

  const persistIfPossible = (): void => {
    if (!session.draft.value || session.notFound.value) {
      return
    }

    persistence.persistSoon({
      noteId: toValue(noteIdSource),
      draft: session.draft.value,
      isNew: session.isNew.value
    })
  }

  const persistNowIfPossible = (): void => {
    if (!session.draft.value || session.notFound.value) {
      return
    }

    persistence.persistNow({
      noteId: toValue(noteIdSource),
      draft: session.draft.value,
      isNew: session.isNew.value
    })
  }

  const history = useNoteHistory(session.draft, {
    onChange: persistIfPossible
  })

  const view = computed<EditorView>(() => {
    if (!session.isReady.value) {
      return 'loading'
    }

    if (session.notFound.value) {
      return 'not-found'
    }

    if (guard.saveBlockedMessage.value) {
      return 'blocked'
    }

    if (session.draft.value) {
      return 'editing'
    }

    return 'loading'
  })

  const discardSession = (): void => {
    history.reset()
    persistence.discard()
    session.resetDraftToOriginal()
    validation.reset()
  }

  const handleTitleInput = (value: string): void => {
    validation.clearTitleError()
    history.handleTitleInput(value)
  }

  const handleTodoTextInput = (todoId: string, value: string): void => {
    validation.clearTodoError(todoId)
    history.handleTodoTextInput(todoId, value)
  }

  const handleRemoveTodo = (todoId: string): void => {
    validation.clearTodoError(todoId)
    history.removeTodo(todoId)
  }

  const save = async (): Promise<EditorSaveResult> => {
    if (!session.draft.value) {
      return 'invalid'
    }

    history.flushTextHistory()
    validation.reset()
    guard.reset()

    if (guard.checkDeleted()) {
      return 'blocked'
    }

    const prepared = prepareNoteForSave(session.draft.value)

    if (!prepared.ok) {
      validation.applyPrepareResult(prepared)
      return 'invalid'
    }

    store.saveNote(prepared.note)
    discardSession()
    return 'saved'
  }

  const discard = (): void => {
    history.flushTextHistory()
    discardSession()
  }

  const removeNote = (): void => {
    history.flushTextHistory()
    store.deleteNote(toValue(noteIdSource))
    discardSession()
  }

  const restoreDraft = (restore: boolean): void => {
    session.restoreDraft(restore)
    persistNowIfPossible()
  }

  const bindWindowListeners = (): void => {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('storage', guard.handleStorage)
  }

  const unbindWindowListeners = (): void => {
    if (typeof window === 'undefined') {
      return
    }

    window.removeEventListener('storage', guard.handleStorage)
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      bindWindowListeners()
    })

    onUnmounted(() => {
      persistence.cancelPending()
      history.reset()
      unbindWindowListeners()
    })
  }

  useHistoryShortcuts({
    undo: history.undo,
    redo: history.redo,
    enabled: computed(() => Boolean(session.draft.value))
  })

  watch(
    () => toValue(noteIdSource),
    () => {
      history.reset()
      validation.reset()
      guard.reset()
    }
  )

  return reactive({
    view,
    draft: session.draft,
    original: session.original,
    isNew: session.isNew,
    isDirty: session.isDirty,
    notFound: session.notFound,
    deletedInOtherTab: guard.deletedInOtherTab,
    titleError: validation.titleError,
    todoErrors: validation.todoErrors,
    saveBlockedMessage: guard.saveBlockedMessage,
    needsRestore: session.needsRestore,
    isReady: session.isReady,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    handleTitleInput,
    handleTitleBlur: history.handleTitleBlur,
    handleTodoTextInput,
    handleTodoTextBlur: history.handleTodoTextBlur,
    addTodo: history.addTodo,
    removeTodo: handleRemoveTodo,
    toggleTodo: history.toggleTodo,
    undo: history.undo,
    redo: history.redo,
    save,
    discard,
    removeNote,
    restoreDraft
  })
}
