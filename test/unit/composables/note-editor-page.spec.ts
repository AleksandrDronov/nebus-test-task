import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNoteEditorPage } from '~/composables/useNoteEditorPage'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { configureNotesStorage, useNotesStore } from '~/stores/notes'
import { createMemoryAdapter } from '~/utils/storage'
import { createEmptyNote } from '~/utils/note'
import { configureDraftStorage, saveDraft } from '~/utils/persistence'
import type { DraftPayload, StoragePayload } from '~/types/storage'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
}))

describe('useNoteEditorPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureNotesStorage(createMemoryAdapter<StoragePayload>())
    configureDraftStorage(createMemoryAdapter<DraftPayload>())
    push.mockReset()
  })

  it('navigates home after a successful save', async () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Saved' })
    const page = useNoteEditorPage('n1')

    page.editor.handleTitleInput('Updated')
    page.editor.handleTitleBlur()
    await page.handleSave()

    expect(useNotesStore().getNote('n1')?.title).toBe('Updated')
    expect(push).toHaveBeenCalledWith('/')
  })

  it('does not navigate when save is invalid', async () => {
    useNotesStore().saveNote(createEmptyNote('n1'))
    const page = useNoteEditorPage('n1')

    await page.handleSave()

    expect(push).not.toHaveBeenCalled()
  })

  it('asks to restore a differing draft through the shared confirm', async () => {
    const stored = { ...createEmptyNote('n1'), title: 'Saved' }
    const draft = { ...createEmptyNote('n1'), title: 'Unsaved' }
    useNotesStore().saveNote(stored)
    saveDraft({ noteId: 'n1', draft, isNew: false })

    const dialog = useConfirmDialog()
    const page = useNoteEditorPage('n1')

    expect(dialog.isOpen.value).toBe(true)
    expect(dialog.title.value).toContain('незавершённое')

    dialog.handleConfirm()
    await Promise.resolve()

    expect(page.editor.draft?.title).toBe('Unsaved')
    expect(page.editor.needsRestore).toBe(false)
  })

  it('discards dirty changes and navigates after cancel is confirmed', async () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Saved' })
    const dialog = useConfirmDialog()
    const page = useNoteEditorPage('n1')

    page.editor.handleTitleInput('Dirty')
    const pending = page.handleCancel()
    dialog.handleConfirm()
    await pending

    expect(push).toHaveBeenCalledWith('/')
  })

  it('stays on the page when cancel is rejected', async () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Saved' })
    const dialog = useConfirmDialog()
    const page = useNoteEditorPage('n1')

    page.editor.handleTitleInput('Dirty')
    const pending = page.handleCancel()
    dialog.handleCancel()
    await pending

    expect(push).not.toHaveBeenCalled()
    expect(page.editor.draft?.title).toBe('Dirty')
  })

  it('deletes the note after confirm and navigates home', async () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Saved' })
    const dialog = useConfirmDialog()
    const page = useNoteEditorPage('n1')

    const pending = page.handleDelete()
    dialog.handleConfirm()
    await pending

    expect(useNotesStore().getNote('n1')).toBeUndefined()
    expect(push).toHaveBeenCalledWith('/')
  })

  it('blocks leaving while dirty until discard is confirmed', async () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Saved' })
    const dialog = useConfirmDialog()
    const page = useNoteEditorPage('n1')

    page.editor.handleTitleInput('Dirty')
    const pending = page.handleLeave()
    dialog.handleCancel()

    await expect(pending).resolves.toBe(false)
    expect(page.editor.draft?.title).toBe('Dirty')
  })

  it('discards and allows leaving after confirm', async () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Saved' })
    const dialog = useConfirmDialog()
    const page = useNoteEditorPage('n1')

    page.editor.handleTitleInput('Dirty')
    const pending = page.handleLeave()
    dialog.handleConfirm()

    await expect(pending).resolves.toBe(true)
  })

  it('allows leaving immediately when the draft is clean', async () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Saved' })
    const page = useNoteEditorPage('n1')

    await expect(page.handleLeave()).resolves.toBe(true)
  })

  it('allows leaving without confirm when the note was deleted in another tab', async () => {
    const store = useNotesStore()
    store.saveNote({ ...createEmptyNote('n1'), title: 'Saved' })
    const dialog = useConfirmDialog()
    const page = useNoteEditorPage('n1')

    page.editor.handleTitleInput('Dirty')
    store.deleteNote('n1')
    await page.handleSave()

    expect(page.editor.view).toBe('blocked')

    const pending = page.handleLeave()
    await Promise.resolve()

    expect(dialog.isOpen.value).toBe(false)
    await expect(pending).resolves.toBe(true)
  })

  it('closes the restore prompt when leaving the page', async () => {
    const stored = { ...createEmptyNote('n1'), title: 'Saved' }
    const draft = { ...createEmptyNote('n1'), title: 'Unsaved' }
    useNotesStore().saveNote(stored)
    saveDraft({ noteId: 'n1', draft, isNew: false })

    const dialog = useConfirmDialog()
    const page = useNoteEditorPage('n1')

    expect(dialog.isOpen.value).toBe(true)

    await expect(page.handleLeave()).resolves.toBe(true)
    await Promise.resolve()

    expect(dialog.isOpen.value).toBe(false)
    expect(page.editor.needsRestore).toBe(false)
    expect(page.editor.draft?.title).toBe('Saved')
  })
})
