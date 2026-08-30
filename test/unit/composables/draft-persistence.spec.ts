import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDraftPersistence } from '~/composables/useDraftPersistence'
import { clearDraft, saveDraft } from '~/utils/persistence'
import { createEmptyNote } from '~/utils/note'

vi.mock('~/utils/persistence', () => ({
  saveDraft: vi.fn(),
  clearDraft: vi.fn()
}))

describe('useDraftPersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(saveDraft).mockReset()
    vi.mocked(clearDraft).mockReset()
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

    expect(saveDraft).not.toHaveBeenCalled()

    vi.advanceTimersByTime(400)

    expect(saveDraft).toHaveBeenCalledTimes(1)
    expect(saveDraft).toHaveBeenCalledWith({
      noteId: 'n1',
      draft: second,
      isNew: true
    })
  })

  it('flushes a pending debounce in persistNow', () => {
    const persistence = useDraftPersistence()
    const draft = { ...createEmptyNote('n1'), title: 'Now' }

    persistence.persistSoon({ noteId: 'n1', draft: createEmptyNote('n1'), isNew: false })
    persistence.persistNow({ noteId: 'n1', draft, isNew: false })

    expect(saveDraft).toHaveBeenCalledTimes(1)
    expect(saveDraft).toHaveBeenCalledWith({
      noteId: 'n1',
      draft,
      isNew: false
    })

    vi.advanceTimersByTime(400)
    expect(saveDraft).toHaveBeenCalledTimes(1)
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

    expect(saveDraft).not.toHaveBeenCalled()
    expect(clearDraft).toHaveBeenCalledTimes(1)
  })
})
