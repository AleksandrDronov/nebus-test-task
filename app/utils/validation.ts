import type { Note } from '~/types/note'

export const TITLE_REQUIRED_MESSAGE = 'Название заметки не может быть пустым.'
export const TODO_REQUIRED_MESSAGE = 'Текст задачи не может быть пустым.'

export type PrepareNoteForSaveResult =
  | { ok: true; note: Note }
  | { ok: false; error: string; field: 'title' | 'todos'; emptyTodoIds: string[] }

export const prepareNoteForSave = (note: Note): PrepareNoteForSaveResult => {
  const title = note.title.trim()

  if (title.length === 0) {
    return {
      ok: false,
      error: TITLE_REQUIRED_MESSAGE,
      field: 'title',
      emptyTodoIds: []
    }
  }

  const emptyTodoIds = note.todos
    .filter((todo) => todo.text.trim().length === 0)
    .map((todo) => todo.id)

  if (emptyTodoIds.length > 0) {
    return {
      ok: false,
      error: TODO_REQUIRED_MESSAGE,
      field: 'todos',
      emptyTodoIds
    }
  }

  return {
    ok: true,
    note: {
      ...note,
      title
    }
  }
}
