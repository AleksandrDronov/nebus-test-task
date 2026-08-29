import type { Note, Todo } from '~/types/note'
import type { DraftPayload, StorageAdapter, StoragePayload } from '~/types/storage'
import { STORAGE_VERSION } from '~/types/storage'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isTodo = (value: unknown): value is Todo => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.completed === 'boolean'
  )
}

const isNote = (value: unknown): value is Note => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    Array.isArray(value.todos) &&
    value.todos.every(isTodo) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

export const parseNotesPayload = (raw: unknown): Note[] => {
  if (!isRecord(raw)) {
    return []
  }

  if (raw.version !== STORAGE_VERSION) {
    return []
  }

  if (!Array.isArray(raw.notes)) {
    return []
  }

  return raw.notes.filter(isNote)
}

export const parseDraftPayload = (raw: unknown): DraftPayload | null => {
  if (!isRecord(raw)) {
    return null
  }

  if (raw.version !== STORAGE_VERSION) {
    return null
  }

  if (typeof raw.noteId !== 'string' || typeof raw.updatedAt !== 'string') {
    return null
  }

  if (!isNote(raw.draft)) {
    return null
  }

  return {
    version: STORAGE_VERSION,
    noteId: raw.noteId,
    draft: raw.draft,
    updatedAt: raw.updatedAt,
    isNew: raw.isNew === true
  }
}

export const createMemoryAdapter = <T>(): StorageAdapter<T> => {
  let data: T | null = null

  return {
    load: () => data,
    save: (value) => {
      data = value
    },
    remove: () => {
      data = null
    }
  }
}

export const createLocalStorageAdapter = <T>(key: string): StorageAdapter<T> => {
  const readWindow = (): Storage | null => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      return window.localStorage
    } catch {
      return null
    }
  }

  return {
    load: () => {
      const storage = readWindow()

      if (!storage) {
        return null
      }

      try {
        const raw = storage.getItem(key)

        if (!raw) {
          return null
        }

        return JSON.parse(raw) as T
      } catch {
        return null
      }
    },
    save: (data) => {
      const storage = readWindow()

      if (!storage) {
        return
      }

      try {
        storage.setItem(key, JSON.stringify(data))
      } catch {
        return
      }
    },
    remove: () => {
      const storage = readWindow()

      if (!storage) {
        return
      }

      storage.removeItem(key)
    }
  }
}

export const toStoragePayload = (notes: Note[]): StoragePayload => ({
  version: STORAGE_VERSION,
  notes
})
