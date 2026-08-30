import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotesList } from '~/composables/useNotesList'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { configureNotesStorage, useNotesStore } from '~/stores/notes'
import { createMemoryAdapter } from '~/utils/storage'
import { createEmptyNote } from '~/utils/note'
import { configureDraftStorage, loadDraft } from '~/utils/persistence'
import type { DraftPayload, StoragePayload } from '~/types/storage'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
}))

describe('useNotesList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureNotesStorage(createMemoryAdapter<StoragePayload>())
    configureDraftStorage(createMemoryAdapter<DraftPayload>())
    push.mockReset()
  })

  it('saves a new draft and opens the editor', async () => {
    const { handleCreate } = useNotesList()

    await handleCreate()

    const payload = loadDraft()
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
    const target = await pending

    expect(store.getNote('n1')).toBeDefined()
    expect(target).toBeNull()
  })

  it('deletes a note and returns the next card target', async () => {
    const store = useNotesStore()
    store.saveNote({ ...createEmptyNote('n1'), updatedAt: '2026-08-02T00:00:00.000Z' })
    store.saveNote({ ...createEmptyNote('n2'), updatedAt: '2026-08-01T00:00:00.000Z' })

    const dialog = useConfirmDialog()
    const { handleDelete } = useNotesList()
    const pending = handleDelete('n1')
    dialog.handleConfirm()
    const target = await pending

    expect(store.getNote('n1')).toBeUndefined()
    expect(target).toEqual({ type: 'note', id: 'n2' })
  })

  it('returns the create target after deleting the last note', async () => {
    const store = useNotesStore()
    store.saveNote(createEmptyNote('n1'))

    const dialog = useConfirmDialog()
    const { handleDelete } = useNotesList()
    const pending = handleDelete('n1')
    dialog.handleConfirm()
    const target = await pending

    expect(store.notes).toHaveLength(0)
    expect(target).toEqual({ type: 'create' })
  })
})
