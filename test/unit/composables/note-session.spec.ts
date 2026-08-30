import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNoteSession } from '~/composables/useNoteSession'
import { configureNotesStorage, useNotesStore } from '~/stores/notes'
import { createMemoryAdapter } from '~/utils/storage'
import { createEmptyNote } from '~/utils/note'
import { configureDraftStorage, loadDraft, saveDraft } from '~/utils/persistence'
import type { DraftPayload, StoragePayload } from '~/types/storage'

describe('useNoteSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureNotesStorage(createMemoryAdapter<StoragePayload>())
    configureDraftStorage(createMemoryAdapter<DraftPayload>())
  })

  it('opens an existing note as editing without a restore prompt', () => {
    const stored = { ...createEmptyNote('n1'), title: 'Saved' }
    useNotesStore().saveNote(stored)

    const session = useNoteSession('n1')

    expect(session.isReady.value).toBe(true)
    expect(session.notFound.value).toBe(false)
    expect(session.isNew.value).toBe(false)
    expect(session.draft.value?.title).toBe('Saved')
    expect(session.needsRestore.value).toBe(false)
    expect(session.isDirty.value).toBe(false)
  })

  it('marks an unknown id as not found', () => {
    const session = useNoteSession('missing')

    expect(session.isReady.value).toBe(true)
    expect(session.notFound.value).toBe(true)
    expect(session.draft.value).toBeNull()
  })

  it('asks to restore when a stored draft differs from the note', () => {
    const stored = { ...createEmptyNote('n1'), title: 'Saved' }
    const draft = { ...createEmptyNote('n1'), title: 'Unsaved' }
    useNotesStore().saveNote(stored)
    saveDraft({ noteId: 'n1', draft, isNew: false })

    const session = useNoteSession('n1')

    expect(session.needsRestore.value).toBe(true)
    expect(session.draft.value?.title).toBe('Saved')
  })

  it('applies the pending draft when restore is accepted', () => {
    const stored = { ...createEmptyNote('n1'), title: 'Saved' }
    const draft = { ...createEmptyNote('n1'), title: 'Unsaved' }
    useNotesStore().saveNote(stored)
    saveDraft({ noteId: 'n1', draft, isNew: false })

    const session = useNoteSession('n1')
    session.restoreDraft(true)

    expect(session.draft.value?.title).toBe('Unsaved')
    expect(session.needsRestore.value).toBe(false)
    expect(session.isDirty.value).toBe(true)
  })

  it('keeps the stored note and clears the draft when restore is rejected', () => {
    const stored = { ...createEmptyNote('n1'), title: 'Saved' }
    const draft = { ...createEmptyNote('n1'), title: 'Unsaved' }
    useNotesStore().saveNote(stored)
    saveDraft({ noteId: 'n1', draft, isNew: false })

    const session = useNoteSession('n1')
    session.restoreDraft(false)

    expect(session.draft.value?.title).toBe('Saved')
    expect(session.needsRestore.value).toBe(false)
    expect(loadDraft()).toBeNull()
  })

  it('resumes a new note from a creation draft', () => {
    const draft = { ...createEmptyNote('new-1'), title: 'Draft title' }
    saveDraft({ noteId: 'new-1', draft, isNew: true })

    const session = useNoteSession('new-1')

    expect(session.isNew.value).toBe(true)
    expect(session.notFound.value).toBe(false)
    expect(session.needsRestore.value).toBe(true)
    expect(session.draft.value?.title).toBe('')
  })
})
