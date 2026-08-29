import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Note } from '~/types/note'
import type { StorageAdapter, StoragePayload } from '~/types/storage'
import { NOTES_STORAGE_KEY, STORAGE_VERSION } from '~/types/storage'
import { nowIso } from '~/utils/id'
import { parseNotesPayload, createLocalStorageAdapter, toStoragePayload } from '~/utils/storage'

const sortNotesByUpdatedAtDesc = (items: Note[]): Note[] => {
  return [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

let notesAdapter: StorageAdapter<StoragePayload> =
  createLocalStorageAdapter<StoragePayload>(NOTES_STORAGE_KEY)

export const configureNotesStorage = (adapter: StorageAdapter<StoragePayload>): void => {
  notesAdapter = adapter
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])

  const persist = (): void => {
    notesAdapter.save(toStoragePayload(notes.value))
  }

  const load = (): void => {
    notes.value = sortNotesByUpdatedAtDesc(parseNotesPayload(notesAdapter.load()))
  }

  load()

  const getNote = (id: string): Note | undefined => {
    return notes.value.find((note) => note.id === id)
  }

  const saveNote = (note: Note): void => {
    const index = notes.value.findIndex((item) => item.id === note.id)
    const next: Note = {
      ...note,
      updatedAt: nowIso()
    }

    if (index === -1) {
      notes.value = sortNotesByUpdatedAtDesc([...notes.value, next])
    } else {
      const copy = [...notes.value]
      copy[index] = next
      notes.value = sortNotesByUpdatedAtDesc(copy)
    }

    persist()
  }

  const deleteNote = (id: string): boolean => {
    const exists = notes.value.some((note) => note.id === id)

    if (!exists) {
      return false
    }

    notes.value = notes.value.filter((note) => note.id !== id)
    persist()
    return true
  }

  return {
    notes,
    load,
    persist,
    getNote,
    saveNote,
    deleteNote,
    storageVersion: STORAGE_VERSION
  }
})
