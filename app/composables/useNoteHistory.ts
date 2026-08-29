import { ref, type Ref } from 'vue'
import type { Note } from '~/types/note'
import { createTodo } from '~/utils/note'
import { createHistoryManager, createTextHistoryBuffer } from '~/utils/history'
import { nowIso } from '~/utils/id'

const TEXT_DEBOUNCE_MS = 400

type NoteHistoryOptions = {
  onChange?: () => void
}

export const useNoteHistory = (draft: Ref<Note | null>, options: NoteHistoryOptions = {}) => {
  const history = createHistoryManager()
  const canUndo = ref(false)
  const canRedo = ref(false)
  let activeTodoId: string | null = null

  const syncFlags = (): void => {
    canUndo.value = history.canUndo()
    canRedo.value = history.canRedo()
  }

  const notifyChange = (): void => {
    options.onChange?.()
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
    notifyChange()
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
    notifyChange()
  }, TEXT_DEBOUNCE_MS)

  const flushTextHistory = (): void => {
    titleBuffer.flush()
    todoTextBuffer.flush()
  }

  const reset = (): void => {
    titleBuffer.cancel()
    todoTextBuffer.cancel()
    history.clear()
    activeTodoId = null
    syncFlags()
  }

  const handleTitleInput = (value: string): void => {
    if (!draft.value) {
      return
    }

    const previous = draft.value.title
    draft.value = {
      ...draft.value,
      title: value,
      updatedAt: nowIso()
    }
    titleBuffer.change(previous, value)
    notifyChange()
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
    notifyChange()
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
    notifyChange()
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

    draft.value = history.execute(draft.value, {
      type: 'remove-todo',
      todo,
      index
    })
    syncFlags()
    notifyChange()
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
    notifyChange()
  }

  const undo = (): void => {
    if (!draft.value || !history.canUndo()) {
      return
    }

    flushTextHistory()
    draft.value = history.undo(draft.value)
    syncFlags()
    notifyChange()
  }

  const redo = (): void => {
    if (!draft.value || !history.canRedo()) {
      return
    }

    flushTextHistory()
    draft.value = history.redo(draft.value)
    syncFlags()
    notifyChange()
  }

  return {
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
    flushTextHistory,
    reset
  }
}
