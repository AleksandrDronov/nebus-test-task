import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNoteEditor } from '~/composables/useNoteEditor'
import { configureNotesStorage, useNotesStore } from '~/stores/notes'
import { createMemoryAdapter } from '~/utils/storage'
import { createEmptyNote, createTodo } from '~/utils/note'
import { loadDraftForNote } from '~/utils/persistence'
import { TITLE_REQUIRED_MESSAGE } from '~/utils/validation'
import type { StoragePayload } from '~/types/storage'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
}))

vi.mock('~/utils/persistence', () => ({
  loadDraftForNote: vi.fn(),
  saveDraft: vi.fn(),
  clearDraft: vi.fn()
}))

describe('useNoteEditor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureNotesStorage(createMemoryAdapter<StoragePayload>())
    push.mockReset()
    vi.mocked(loadDraftForNote).mockReset()
    vi.mocked(loadDraftForNote).mockReturnValue(null)
  })

  it('exposes not-found view for an unknown note', () => {
    const editor = useNoteEditor('missing')

    expect(editor.view).toBe('not-found')
    expect(editor.draft).toBeNull()
  })

  it('exposes editing view for a stored note', () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Saved' })

    const editor = useNoteEditor('n1')

    expect(editor.view).toBe('editing')
    expect(editor.draft?.title).toBe('Saved')
    expect(editor.needsRestore).toBe(false)
  })

  it('saves a valid note without navigating', async () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Old' })
    const editor = useNoteEditor('n1')

    editor.handleTitleInput('Updated')
    editor.handleTitleBlur()

    const result = await editor.save()

    expect(result).toBe('saved')
    expect(useNotesStore().getNote('n1')?.title).toBe('Updated')
    expect(push).not.toHaveBeenCalled()
  })

  it('returns invalid when the title is empty', async () => {
    useNotesStore().saveNote(createEmptyNote('n1'))
    const editor = useNoteEditor('n1')

    const result = await editor.save()

    expect(result).toBe('invalid')
    expect(editor.titleError).toBe(TITLE_REQUIRED_MESSAGE)
    expect(push).not.toHaveBeenCalled()
  })

  it('returns blocked when the note was deleted in another tab', async () => {
    const store = useNotesStore()
    store.saveNote({ ...createEmptyNote('n1'), title: 'Keep' })
    const editor = useNoteEditor('n1')

    store.deleteNote('n1')

    const result = await editor.save()

    expect(result).toBe('blocked')
    expect(editor.view).toBe('blocked')
    expect(editor.saveBlockedMessage).toContain('удалена в другой вкладке')
    expect(push).not.toHaveBeenCalled()
  })

  it('discards the session without navigating', async () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Saved' })
    const editor = useNoteEditor('n1')

    editor.handleTitleInput('Dirty')
    editor.discard()

    expect(editor.isDirty).toBe(false)
    expect(push).not.toHaveBeenCalled()
  })

  it('deletes the note without navigating', async () => {
    useNotesStore().saveNote({ ...createEmptyNote('n1'), title: 'Saved' })
    const editor = useNoteEditor('n1')

    editor.removeNote()

    expect(useNotesStore().getNote('n1')).toBeUndefined()
    expect(push).not.toHaveBeenCalled()
  })

  it('adds a todo through the history facade', () => {
    const note = { ...createEmptyNote('n1'), title: 'Saved', todos: [createTodo('One')] }
    useNotesStore().saveNote(note)
    const editor = useNoteEditor('n1')

    editor.addTodo()

    expect(editor.draft?.todos).toHaveLength(2)
    expect(editor.canUndo).toBe(true)
  })
})
