import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDraftPersistence } from '~/composables/useDraftPersistence'
import { configureDraftStorage, loadDraft } from '~/utils/persistence'
import { createMemoryAdapter } from '~/utils/storage'
import { createEmptyNote } from '~/utils/note'
import type { DraftPayload } from '~/types/storage'

describe('useDraftPersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    configureDraftStorage(createMemoryAdapter<DraftPayload>())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces persistSoon and writes the latest draft', () => {
    const persistence = useDraftPersistence()
    const first = createEmptyNote('n1')
    const second = { ...createEmptyNote('n1'), title: 'Later' }

    persistence.persistSoon({ noteId: 'n1', draft: first, isNew: true })
    persistence.persistSoon({ noteId: 'n1', draft: second, isNew: true })

    expect(loadDraft()).toBeNull()

    vi.advanceTimersByTime(400)

    const saved = loadDraft()
    expect(saved?.noteId).toBe('n1')
    expect(saved?.draft.title).toBe('Later')
    expect(saved?.isNew).toBe(true)
  })

  it('flushes a pending debounce in persistNow', () => {
    const persistence = useDraftPersistence()
    const draft = { ...createEmptyNote('n1'), title: 'Now' }

    persistence.persistSoon({ noteId: 'n1', draft: createEmptyNote('n1'), isNew: false })
    persistence.persistNow({ noteId: 'n1', draft, isNew: false })

    expect(loadDraft()?.draft.title).toBe('Now')

    vi.advanceTimersByTime(400)
    expect(loadDraft()?.draft.title).toBe('Now')
  })

  it('discards the pending write and clears storage', () => {
    const persistence = useDraftPersistence()

    persistence.persistSoon({
      noteId: 'n1',
      draft: createEmptyNote('n1'),
      isNew: true
    })
    persistence.discard()

    vi.advanceTimersByTime(400)

    expect(loadDraft()).toBeNull()
  })
})
