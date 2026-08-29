import type { Note } from '~/types/note'
import type { HistoryOperation } from '~/types/history'
import { HISTORY_LIMIT } from '~/types/history'

export { HISTORY_LIMIT }

export const invertOperation = (operation: HistoryOperation): HistoryOperation => {
  switch (operation.type) {
    case 'set-title':
      return {
        type: 'set-title',
        before: operation.after,
        after: operation.before
      }
    case 'set-todo-text':
      return {
        type: 'set-todo-text',
        todoId: operation.todoId,
        before: operation.after,
        after: operation.before
      }
    case 'toggle-todo':
      return {
        type: 'toggle-todo',
        todoId: operation.todoId,
        before: operation.after,
        after: operation.before
      }
    case 'add-todo':
      return {
        type: 'remove-todo',
        todo: operation.todo,
        index: operation.index
      }
    case 'remove-todo':
      return {
        type: 'add-todo',
        todo: operation.todo,
        index: operation.index
      }
  }
}

export const applyOperation = (note: Note, operation: HistoryOperation): Note => {
  switch (operation.type) {
    case 'set-title':
      return {
        ...note,
        title: operation.after
      }
    case 'set-todo-text':
      return {
        ...note,
        todos: note.todos.map((todo) => {
          if (todo.id !== operation.todoId) {
            return todo
          }

          return {
            ...todo,
            text: operation.after
          }
        })
      }
    case 'toggle-todo':
      return {
        ...note,
        todos: note.todos.map((todo) => {
          if (todo.id !== operation.todoId) {
            return todo
          }

          return {
            ...todo,
            completed: operation.after
          }
        })
      }
    case 'add-todo': {
      const todos = [...note.todos]
      todos.splice(operation.index, 0, operation.todo)
      return {
        ...note,
        todos
      }
    }
    case 'remove-todo':
      return {
        ...note,
        todos: note.todos.filter((_, index) => index !== operation.index)
      }
  }
}

export type HistoryManager = {
  execute: (note: Note, operation: HistoryOperation) => Note
  undo: (note: Note) => Note
  redo: (note: Note) => Note
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
  size: () => number
}

export const createHistoryManager = (limit: number = HISTORY_LIMIT): HistoryManager => {
  const past: HistoryOperation[] = []
  const future: HistoryOperation[] = []

  const execute = (note: Note, operation: HistoryOperation): Note => {
    const next = applyOperation(note, operation)
    past.push(operation)
    future.length = 0

    if (past.length > limit) {
      past.shift()
    }

    return next
  }

  const undo = (note: Note): Note => {
    const operation = past.pop()

    if (!operation) {
      return note
    }

    future.push(operation)
    return applyOperation(note, invertOperation(operation))
  }

  const redo = (note: Note): Note => {
    const operation = future.pop()

    if (!operation) {
      return note
    }

    past.push(operation)
    return applyOperation(note, operation)
  }

  const clear = (): void => {
    past.length = 0
    future.length = 0
  }

  return {
    execute,
    undo,
    redo,
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    clear,
    size: () => past.length
  }
}

export type TextHistoryBuffer = {
  change: (from: string, to: string) => void
  flush: () => void
  cancel: () => void
}

export const createTextHistoryBuffer = (
  commit: (before: string, after: string) => void,
  delayMs = 400
): TextHistoryBuffer => {
  let before: string | null = null
  let after = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = (): void => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }

    if (before !== null && before !== after) {
      commit(before, after)
    }

    before = null
  }

  const change = (from: string, to: string): void => {
    if (before === null) {
      before = from
    }

    after = to

    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(flush, delayMs)
  }

  const cancel = (): void => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }

    before = null
  }

  return {
    change,
    flush,
    cancel
  }
}
