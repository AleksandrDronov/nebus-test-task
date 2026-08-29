import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter
} from 'vue'
import { useRouter } from 'vue-router'
import { NOTES_STORAGE_KEY } from '../types/storage'
import type { Note } from '../types/note'
import { cloneNote, createEmptyNote, createTodo, notesContentEqual } from '../utils/note'
import { createHistoryManager, createTextHistoryBuffer } from '../utils/history'
import { prepareNoteForSave } from '../utils/validation'
import { nowIso } from '../utils/id'
import { useNotesStore } from '../stores/notes'
import { clearDraft, loadDraftForNote, saveDraft } from './usePersistence'
import { isNativeTextTarget } from './useUndoRedo'

const DRAFT_DEBOUNCE_MS = 400
const TEXT_DEBOUNCE_MS = 400

export const useNoteEditor = (noteIdSource: MaybeRefOrGetter<string>) => {
  const store = useNotesStore()
  const router = useRouter()

  const original = ref<Note | null>(null)
  const draft = ref<Note | null>(null)
  const isNew = ref(false)
  const notFound = ref(false)
  const deletedInOtherTab = ref(false)
  const titleError = ref('')
  const todoErrors = ref<Record<string, string>>({})
  const saveBlockedMessage = ref('')
  const showRestoreDialog = ref(false)
  const pendingRestore = ref<Note | null>(null)
  const isReady = ref(false)
  const canUndo = ref(false)
  const canRedo = ref(false)

  const history = createHistoryManager()
  let draftTimer: ReturnType<typeof setTimeout> | null = null

  const noteId = (): string => toValue(noteIdSource)

  const clearTodoError = (todoId: string): void => {
    todoErrors.value = Object.fromEntries(
      Object.entries(todoErrors.value).filter(([id]) => id !== todoId)
    )
  }

  const isDirty = computed(() => {
    if (!draft.value || !original.value) {
      return false
    }

    return !notesContentEqual(draft.value, original.value)
  })

  const syncFlags = (): void => {
    canUndo.value = history.canUndo()
    canRedo.value = history.canRedo()
  }

  const persistDraftSoon = (): void => {
    if (!draft.value || notFound.value) {
      return
    }

    if (draftTimer) {
      clearTimeout(draftTimer)
    }

    draftTimer = setTimeout(() => {
      if (!draft.value) {
        return
      }

      saveDraft({
        noteId: noteId(),
        draft: draft.value,
        isNew: isNew.value
      })
    }, DRAFT_DEBOUNCE_MS)
  }

  const persistDraftNow = (): void => {
    if (draftTimer) {
      clearTimeout(draftTimer)
      draftTimer = null
    }

    if (!draft.value || notFound.value) {
      return
    }

    saveDraft({
      noteId: noteId(),
      draft: draft.value,
      isNew: isNew.value
    })
  }

  const discardSession = (): void => {
    if (draftTimer) {
      clearTimeout(draftTimer)
      draftTimer = null
    }

    titleBuffer.cancel()
    todoTextBuffer.cancel()
    history.clear()
    syncFlags()
    clearDraft()
  }

  const titleBuffer = createTextHistoryBuffer((before, after) => {
    if (!draft.value) {
      return
    }

    draft.value = history.execute(draft.value, {
      type: 'set-title',
      before,
      after
    })
    syncFlags()
    persistDraftSoon()
  }, TEXT_DEBOUNCE_MS)

  const todoTextBuffer = createTextHistoryBuffer((before, after) => {
    if (!draft.value || !activeTodoId) {
      return
    }

    draft.value = history.execute(draft.value, {
      type: 'set-todo-text',
      todoId: activeTodoId,
      before,
      after
    })
    syncFlags()
    persistDraftSoon()
  }, TEXT_DEBOUNCE_MS)

  let activeTodoId: string | null = null

  const flushTextHistory = (): void => {
    titleBuffer.flush()
    todoTextBuffer.flush()
  }

  const handleTitleInput = (value: string): void => {
    if (!draft.value) {
      return
    }

    titleError.value = ''
    const previous = draft.value.title
    draft.value = {
      ...draft.value,
      title: value,
      updatedAt: nowIso()
    }
    titleBuffer.change(previous, value)
    persistDraftSoon()
  }

  const handleTitleBlur = (): void => {
    titleBuffer.flush()
  }

  const handleTodoTextInput = (todoId: string, value: string): void => {
    if (!draft.value) {
      return
    }

    if (activeTodoId !== todoId) {
      todoTextBuffer.flush()
      activeTodoId = todoId
    }

    clearTodoError(todoId)

    const todo = draft.value.todos.find((item) => item.id === todoId)

    if (!todo) {
      return
    }

    const previous = todo.text
    draft.value = {
      ...draft.value,
      todos: draft.value.todos.map((item) => {
        if (item.id !== todoId) {
          return item
        }

        return {
          ...item,
          text: value
        }
      }),
      updatedAt: nowIso()
    }
    todoTextBuffer.change(previous, value)
    persistDraftSoon()
  }

  const handleTodoTextBlur = (): void => {
    todoTextBuffer.flush()
    activeTodoId = null
  }

  const addTodo = (): void => {
    if (!draft.value) {
      return
    }

    flushTextHistory()
    const todo = createTodo()
    draft.value = history.execute(draft.value, {
      type: 'add-todo',
      todo,
      index: draft.value.todos.length
    })
    syncFlags()
    persistDraftSoon()
  }

  const removeTodo = (todoId: string): void => {
    if (!draft.value) {
      return
    }

    flushTextHistory()
    const index = draft.value.todos.findIndex((item) => item.id === todoId)
    const todo = draft.value.todos[index]

    if (index === -1 || !todo) {
      return
    }

    clearTodoError(todoId)

    draft.value = history.execute(draft.value, {
      type: 'remove-todo',
      todo,
      index
    })
    syncFlags()
    persistDraftSoon()
  }

  const toggleTodo = (todoId: string): void => {
    if (!draft.value) {
      return
    }

    flushTextHistory()
    const todo = draft.value.todos.find((item) => item.id === todoId)

    if (!todo) {
      return
    }

    draft.value = history.execute(draft.value, {
      type: 'toggle-todo',
      todoId,
      before: todo.completed,
      after: !todo.completed
    })
    syncFlags()
    persistDraftSoon()
  }

  const undo = (): void => {
    if (!draft.value || !history.canUndo()) {
      return
    }

    flushTextHistory()
    draft.value = history.undo(draft.value)
    syncFlags()
    persistDraftSoon()
  }

  const redo = (): void => {
    if (!draft.value || !history.canRedo()) {
      return
    }

    flushTextHistory()
    draft.value = history.redo(draft.value)
    syncFlags()
    persistDraftSoon()
  }

  const restoreDraftChoice = (restore: boolean): void => {
    showRestoreDialog.value = false

    if (restore && pendingRestore.value) {
      draft.value = cloneNote(pendingRestore.value)
    } else if (!restore) {
      clearDraft()

      if (original.value) {
        draft.value = cloneNote(original.value)
      }
    }

    pendingRestore.value = null
    persistDraftNow()
  }

  const save = async (): Promise<boolean> => {
    if (!draft.value) {
      return false
    }

    flushTextHistory()
    titleError.value = ''
    todoErrors.value = {}
    saveBlockedMessage.value = ''

    store.load()

    if (deletedInOtherTab.value || (!isNew.value && !store.getNote(noteId()))) {
      deletedInOtherTab.value = true
      saveBlockedMessage.value = 'Заметка была удалена в другой вкладке. Сохранение невозможно.'
      return false
    }

    const prepared = prepareNoteForSave(draft.value)

    if (!prepared.ok) {
      if (prepared.field === 'title') {
        titleError.value = prepared.error
        return false
      }

      todoErrors.value = Object.fromEntries(
        prepared.emptyTodoIds.map((todoId) => [todoId, prepared.error])
      )
      return false
    }

    store.saveNote(prepared.note)
    discardSession()
    await router.push('/')
    return true
  }

  const cancel = async (confirmed: boolean): Promise<boolean> => {
    flushTextHistory()

    if (!confirmed && isDirty.value) {
      return false
    }

    discardSession()
    await router.push('/')
    return true
  }

  const removeNote = async (): Promise<void> => {
    flushTextHistory()
    store.deleteNote(noteId())
    discardSession()
    await router.push('/')
  }

  const handleStorage = (event: StorageEvent): void => {
    if (event.key !== NOTES_STORAGE_KEY) {
      return
    }

    store.load()

    if (!isNew.value && !store.getNote(noteId())) {
      deletedInOtherTab.value = true
      saveBlockedMessage.value = 'Заметка была удалена в другой вкладке. Сохранение невозможно.'
    }
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    const modifier = event.metaKey || event.ctrlKey

    if (!modifier || event.altKey || event.key.toLowerCase() !== 'z') {
      return
    }

    if (isNativeTextTarget(event.target)) {
      return
    }

    event.preventDefault()

    if (event.shiftKey) {
      redo()
      return
    }

    undo()
  }

  const initialize = (): void => {
    notFound.value = false
    deletedInOtherTab.value = false
    titleError.value = ''
    todoErrors.value = {}
    saveBlockedMessage.value = ''
    showRestoreDialog.value = false
    pendingRestore.value = null
    isReady.value = false
    const id = noteId()
    const stored = store.getNote(id)
    const existingDraft = loadDraftForNote(id)

    if (stored) {
      original.value = cloneNote(stored)
      isNew.value = false

      if (existingDraft && !notesContentEqual(existingDraft.draft, stored)) {
        pendingRestore.value = existingDraft.draft
        showRestoreDialog.value = true
        draft.value = cloneNote(stored)
      } else {
        draft.value = cloneNote(stored)
      }

      isReady.value = true
      return
    }

    if (existingDraft?.isNew) {
      isNew.value = true
      original.value = createEmptyNote(id)

      if (!notesContentEqual(existingDraft.draft, original.value)) {
        pendingRestore.value = existingDraft.draft
        showRestoreDialog.value = true
        draft.value = cloneNote(original.value)
      } else {
        draft.value = cloneNote(existingDraft.draft)
      }

      isReady.value = true
      return
    }

    notFound.value = true
    isReady.value = true
  }

  onMounted(() => {
    initialize()
    window.addEventListener('storage', handleStorage)
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    if (draftTimer) {
      clearTimeout(draftTimer)
    }

    titleBuffer.cancel()
    todoTextBuffer.cancel()
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('keydown', handleKeydown)
  })

  watch(
    () => toValue(noteIdSource),
    () => {
      history.clear()
      syncFlags()
      initialize()
    }
  )

  return reactive({
    draft,
    original,
    isNew,
    isDirty,
    notFound,
    deletedInOtherTab,
    titleError,
    todoErrors,
    saveBlockedMessage,
    showRestoreDialog,
    isReady,
    canUndo,
    canRedo,
    handleTitleInput,
    handleTitleBlur,
    handleTodoTextInput,
    handleTodoTextBlur,
    addTodo,
    removeTodo,
    toggleTodo,
    undo,
    redo,
    save,
    cancel,
    removeNote,
    restoreDraftChoice
  })
}
