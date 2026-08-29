import type { Note } from '../types/note'
import { stripEmptyTodos } from './note'

export const TITLE_REQUIRED_MESSAGE = 'Название заметки не может быть пустым.'

export const prepareNoteForSave = (
  note: Note
): { ok: true; note: Note } | { ok: false; error: string } => {
  const title = note.title.trim()

  if (title.length === 0) {
    return { ok: false, error: TITLE_REQUIRED_MESSAGE }
  }

  return {
    ok: true,
    note: stripEmptyTodos({
      ...note,
      title
    })
  }
}
