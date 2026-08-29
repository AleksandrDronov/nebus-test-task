import type { Note } from './note'

export const STORAGE_VERSION = 1
export const NOTES_STORAGE_KEY = 'notes-spa:notes'
export const DRAFT_STORAGE_KEY = 'notes-spa:draft'

export interface StoragePayload {
  version: number
  notes: Note[]
}

export interface DraftPayload {
  version: number
  noteId: string
  draft: Note
  updatedAt: string
  isNew: boolean
}

export interface StorageAdapter<T> {
  load: () => T | null
  save: (data: T) => void
  remove: () => void
}
