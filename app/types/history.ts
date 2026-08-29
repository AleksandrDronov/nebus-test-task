import type { Todo } from './note'

export const HISTORY_LIMIT = 50

export type HistoryOperation =
  | {
      type: 'set-title'
      before: string
      after: string
    }
  | {
      type: 'set-todo-text'
      todoId: string
      before: string
      after: string
    }
  | {
      type: 'toggle-todo'
      todoId: string
      before: boolean
      after: boolean
    }
  | {
      type: 'add-todo'
      todo: Todo
      index: number
    }
  | {
      type: 'remove-todo'
      todo: Todo
      index: number
    }
