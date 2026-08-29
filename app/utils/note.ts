import type { Note, Todo } from '../types/note'
import { createId, nowIso } from './id'

export const createEmptyNote = (id: string = createId()): Note => {
  const timestamp = nowIso()

  return {
    id,
    title: '',
    todos: [],
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

export const createTodo = (text = ''): Todo => ({
  id: createId(),
  text,
  completed: false
})

export const cloneNote = (note: Note): Note => ({
  ...note,
  todos: note.todos.map((todo) => ({ ...todo }))
})

export const notesContentEqual = (left: Note, right: Note): boolean => {
  if (left.title !== right.title) {
    return false
  }

  if (left.todos.length !== right.todos.length) {
    return false
  }

  return left.todos.every((todo, index) => {
    const other = right.todos[index]
    return (
      other !== undefined &&
      todo.id === other.id &&
      todo.text === other.text &&
      todo.completed === other.completed
    )
  })
}
