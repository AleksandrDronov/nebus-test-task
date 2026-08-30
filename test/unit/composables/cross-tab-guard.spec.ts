import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { useCrossTabGuard } from '~/composables/useCrossTabGuard'
import { configureNotesStorage, useNotesStore } from '~/stores/notes'
import { createMemoryAdapter } from '~/utils/storage'
import { createEmptyNote } from '~/utils/note'
import { NOTES_STORAGE_KEY } from '~/types/storage'
import type { StoragePayload } from '~/types/storage'

describe('useCrossTabGuard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureNotesStorage(createMemoryAdapter<StoragePayload>())
  })

  it('blocks save when an existing note disappeared from the store', () => {
    const isNew = ref(false)
    const guard = useCrossTabGuard(() => 'n1', isNew)

    expect(guard.checkDeleted()).toBe(true)
    expect(guard.saveBlockedMessage.value).toContain('удалена в другой вкладке')
  })

  it('does not block a new note that is not in the store', () => {
    const isNew = ref(true)
    const guard = useCrossTabGuard(() => 'n1', isNew)

    expect(guard.checkDeleted()).toBe(false)
    expect(guard.saveBlockedMessage.value).toBe('')
  })

  it('reacts to a storage event for notes', () => {
    const store = useNotesStore()
    store.saveNote(createEmptyNote('n1'))

    const isNew = ref(false)
    const guard = useCrossTabGuard(() => 'n1', isNew)

    store.deleteNote('n1')
    guard.handleStorage({ key: NOTES_STORAGE_KEY } as StorageEvent)

    expect(guard.saveBlockedMessage.value).toContain('удалена в другой вкладке')
  })

  it('ignores storage events for other keys', () => {
    const isNew = ref(false)
    const guard = useCrossTabGuard(() => 'n1', isNew)

    guard.handleStorage({ key: 'other' } as StorageEvent)

    expect(guard.saveBlockedMessage.value).toBe('')
  })
})
