import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Note } from '../types/note'
import type { StorageAdapter, StoragePayload } from '../types/storage'
import { NOTES_STORAGE_KEY, STORAGE_VERSION } from '../types/storage'
import { nowIso } from '../utils/id'
import { parseNotesPayload, createLocalStorageAdapter, toStoragePayload } from '../utils/storage'

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
    notes.value = parseNotesPayload(notesAdapter.load())
  }

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
      notes.value = [...notes.value, next]
    } else {
      const copy = [...notes.value]
      copy[index] = next
      notes.value = copy
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
