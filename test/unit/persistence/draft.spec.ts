import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearDraft,
  configureDraftStorage,
  loadDraft,
  loadDraftForNote,
  saveDraft
} from '~/utils/persistence'
import { createMemoryAdapter } from '~/utils/storage'
import { createEmptyNote } from '~/utils/note'
import { STORAGE_VERSION } from '~/types/storage'
import type { DraftPayload } from '~/types/storage'

describe('draft persistence', () => {
  beforeEach(() => {
    configureDraftStorage(createMemoryAdapter<DraftPayload>())
  })

  it('saves and loads a draft with schema version', () => {
    const draft = { ...createEmptyNote('n1'), title: 'Unsaved' }

    saveDraft({ noteId: 'n1', draft, isNew: false })

    const loaded = loadDraft()
    expect(loaded?.version).toBe(STORAGE_VERSION)
    expect(loaded?.noteId).toBe('n1')
    expect(loaded?.draft.title).toBe('Unsaved')
    expect(loaded?.isNew).toBe(false)
    expect(loaded?.updatedAt).toEqual(expect.any(String))
  })

  it('returns a draft only for the matching note id', () => {
    const draft = { ...createEmptyNote('n1'), title: 'Unsaved' }
    saveDraft({ noteId: 'n1', draft, isNew: true })

    expect(loadDraftForNote('n1')?.draft.title).toBe('Unsaved')
    expect(loadDraftForNote('other')).toBeNull()
  })

  it('clears the stored draft', () => {
    saveDraft({
      noteId: 'n1',
      draft: createEmptyNote('n1'),
      isNew: true
    })

    clearDraft()

    expect(loadDraft()).toBeNull()
  })

  it('returns null for invalid persisted data', () => {
    const adapter = createMemoryAdapter<DraftPayload>()
    adapter.save({ version: STORAGE_VERSION } as DraftPayload)
    configureDraftStorage(adapter)

    expect(loadDraft()).toBeNull()
  })

  it('persists through the injected adapter', () => {
    const adapter = createMemoryAdapter<DraftPayload>()
    configureDraftStorage(adapter)

    saveDraft({
      noteId: 'n1',
      draft: { ...createEmptyNote('n1'), title: 'Kept' },
      isNew: false
    })

    expect(adapter.load()?.draft.title).toBe('Kept')
  })
})
