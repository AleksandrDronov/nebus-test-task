import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotesList } from '~/composables/useNotesList'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { configureNotesStorage, useNotesStore } from '~/stores/notes'
import { createMemoryAdapter } from '~/utils/storage'
import { createEmptyNote } from '~/utils/note'
import { saveDraft } from '~/utils/persistence'
import type { StoragePayload } from '~/types/storage'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
}))

vi.mock('~/utils/persistence', () => ({
  saveDraft: vi.fn()
}))

const createFocusable = () => ({
  focus: vi.fn()
})

describe('useNotesList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureNotesStorage(createMemoryAdapter<StoragePayload>())
    push.mockReset()
    vi.mocked(saveDraft).mockReset()
  })

  it('saves a new draft and opens the editor', async () => {
    const { handleCreate } = useNotesList()

    await handleCreate()

    expect(saveDraft).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(saveDraft).mock.calls[0]?.[0]
    expect(payload?.isNew).toBe(true)
    expect(payload?.noteId).toBe(payload?.draft.id)
    expect(push).toHaveBeenCalledWith(`/notes/${payload?.noteId}`)
  })

  it('does not delete a note when confirm is cancelled', async () => {
    const store = useNotesStore()
    store.saveNote(createEmptyNote('n1'))
    const dialog = useConfirmDialog()
    const { handleDelete } = useNotesList()

    const pending = handleDelete('n1')
    dialog.handleCancel()
    await pending

    expect(store.getNote('n1')).toBeDefined()
  })

  it('deletes a note and focuses the next card', async () => {
    const store = useNotesStore()
    store.saveNote({ ...createEmptyNote('n1'), updatedAt: '2026-08-02T00:00:00.000Z' })
    store.saveNote({ ...createEmptyNote('n2'), updatedAt: '2026-08-01T00:00:00.000Z' })

    const nextCard = createFocusable()
    vi.stubGlobal('document', {
      getElementById: (id: string) => (id === 'note-card-link-n2' ? nextCard : null)
    })

    const dialog = useConfirmDialog()
    const { handleDelete } = useNotesList()
    const pending = handleDelete('n1')
    dialog.handleConfirm()
    await pending

    expect(store.getNote('n1')).toBeUndefined()
    expect(nextCard.focus).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('focuses the create button after deleting the last note', async () => {
    const store = useNotesStore()
    store.saveNote(createEmptyNote('n1'))

    const createButton = createFocusable()
    vi.stubGlobal('document', {
      getElementById: (id: string) => (id === 'create-note-button' ? createButton : null)
    })

    const dialog = useConfirmDialog()
    const { handleDelete } = useNotesList()
    const pending = handleDelete('n1')
    dialog.handleConfirm()
    await pending

    expect(store.notes).toHaveLength(0)
    expect(createButton.focus).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})
