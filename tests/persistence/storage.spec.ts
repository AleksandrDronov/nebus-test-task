import { describe, expect, it } from 'vitest'
import { parseDraftPayload, parseNotesPayload } from '../../app/utils/storage'
import { STORAGE_VERSION } from '../../app/types/storage'
import { createEmptyNote } from '../../app/utils/note'
import { prepareNoteForSave, TITLE_REQUIRED_MESSAGE } from '../../app/utils/validation'

describe('persistence parsing', () => {
  it('accepts a valid payload', () => {
    const note = createEmptyNote('n1')
    const parsed = parseNotesPayload({
      version: STORAGE_VERSION,
      notes: [note]
    })

    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.id).toBe('n1')
  })

  it('returns an empty list for corrupted JSON-like data', () => {
    expect(parseNotesPayload(undefined)).toEqual([])
    expect(parseNotesPayload('nope')).toEqual([])
    expect(parseNotesPayload({ version: STORAGE_VERSION })).toEqual([])
  })

  it('parses a valid draft and rejects a draft for a broken note', () => {
    const note = createEmptyNote('n1')
    const draft = parseDraftPayload({
      version: STORAGE_VERSION,
      noteId: 'n1',
      draft: note,
      updatedAt: note.updatedAt,
      isNew: true
    })

    expect(draft?.noteId).toBe('n1')
    expect(parseDraftPayload({ version: STORAGE_VERSION, noteId: 'n1' })).toBeNull()
  })
})

describe('validation', () => {
  it('rejects an empty title', () => {
    const result = prepareNoteForSave(createEmptyNote('n1'))
    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.error).toBe(TITLE_REQUIRED_MESSAGE)
    }
  })

  it('strips empty todos on save', () => {
    const note = createEmptyNote('n1')
    note.title = '  Title  '
    note.todos = [
      { id: 't1', text: '  Keep  ', completed: false },
      { id: 't2', text: '   ', completed: false }
    ]

    const result = prepareNoteForSave(note)
    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.note.title).toBe('Title')
      expect(result.note.todos).toHaveLength(1)
      expect(result.note.todos[0]?.text).toBe('  Keep  ')
    }
  })
})
