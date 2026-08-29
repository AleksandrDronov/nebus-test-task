import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { configureNotesStorage, useNotesStore } from '../../app/stores/notes'
import { createMemoryAdapter, parseNotesPayload } from '../../app/utils/storage'
import { createEmptyNote, createTodo } from '../../app/utils/note'
import { STORAGE_VERSION } from '../../app/types/storage'
import type { StoragePayload } from '../../app/types/storage'

describe('notes store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureNotesStorage(createMemoryAdapter<StoragePayload>())
  })

  it('creates and reads a note', () => {
    const store = useNotesStore()
    const note = createEmptyNote('n1')
    note.title = 'First'

    store.saveNote(note)

    expect(store.getNote('n1')?.title).toBe('First')
    expect(store.notes).toHaveLength(1)
  })

  it('updates a note', () => {
    const store = useNotesStore()
    const note = createEmptyNote('n1')
    note.title = 'First'
    store.saveNote(note)

    store.saveNote({
      ...note,
      title: 'Updated'
    })

    expect(store.getNote('n1')?.title).toBe('Updated')
    expect(store.notes).toHaveLength(1)
  })

  it('deletes a note', () => {
    const store = useNotesStore()
    store.saveNote(createEmptyNote('n1'))

    expect(store.deleteNote('n1')).toBe(true)
    expect(store.getNote('n1')).toBeUndefined()
    expect(store.deleteNote('n1')).toBe(false)
  })

  it('persists notes and restores them after reload', () => {
    const adapter = createMemoryAdapter<StoragePayload>()
    configureNotesStorage(adapter)

    const store = useNotesStore()
    const note = createEmptyNote('n1')
    note.title = 'Persisted'
    note.todos = [createTodo('One')]
    store.saveNote(note)

    setActivePinia(createPinia())
    configureNotesStorage(adapter)
    const reloaded = useNotesStore()

    expect(reloaded.notes).toHaveLength(1)
    expect(reloaded.getNote('n1')?.title).toBe('Persisted')
    expect(reloaded.getNote('n1')?.todos[0]?.text).toBe('One')
  })

  it('stores schema version in the payload', () => {
    const adapter = createMemoryAdapter<StoragePayload>()
    configureNotesStorage(adapter)
    const store = useNotesStore()
    store.saveNote(createEmptyNote('n1'))

    expect(adapter.load()?.version).toBe(STORAGE_VERSION)
    expect(store.storageVersion).toBe(STORAGE_VERSION)
  })

  it('returns undefined for a missing note', () => {
    const store = useNotesStore()
    expect(store.getNote('missing')).toBeUndefined()
  })

  it('does not crash on invalid persisted data', () => {
    const adapter = createMemoryAdapter<StoragePayload>()
    adapter.save({ version: STORAGE_VERSION, notes: 'bad' as unknown as StoragePayload['notes'] })
    configureNotesStorage(adapter)

    const store = useNotesStore()
    expect(() => store.load()).not.toThrow()
    expect(store.notes).toEqual([])
  })

  it('ignores an unknown schema version', () => {
    expect(parseNotesPayload({ version: 99, notes: [createEmptyNote('n1')] })).toEqual([])
  })

  it('ignores a null payload', () => {
    expect(parseNotesPayload(null)).toEqual([])
  })

  it('handles deleting a note that no longer exists', () => {
    const store = useNotesStore()
    store.saveNote(createEmptyNote('n1'))
    store.deleteNote('n1')

    expect(store.deleteNote('n1')).toBe(false)
    expect(store.getNote('n1')).toBeUndefined()
  })
})
