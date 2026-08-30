import { describe, expect, it, vi } from 'vitest'
import {
  applyOperation,
  createHistoryManager,
  createTextHistoryBuffer,
  HISTORY_LIMIT
} from '~/utils/history'
import { createEmptyNote, createTodo } from '~/utils/note'
import type { HistoryOperation } from '~/types/history'

const noteWithTodo = () => {
  const todo = createTodo('Buy milk')
  const note = createEmptyNote('note-1')
  note.title = 'Groceries'
  note.todos = [todo]
  return { note, todo }
}

describe('history manager', () => {
  it('starts with empty undo and redo', () => {
    const history = createHistoryManager()

    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
    expect(history.size()).toBe(0)
  })

  it('execute applies an operation and enables undo', () => {
    const history = createHistoryManager()
    const note = createEmptyNote('note-1')

    const next = history.execute(note, {
      type: 'set-title',
      before: '',
      after: 'Hello'
    })

    expect(next.title).toBe('Hello')
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)
  })

  it('undo restores previous title', () => {
    const history = createHistoryManager()
    const note = createEmptyNote('note-1')
    const edited = history.execute(note, {
      type: 'set-title',
      before: '',
      after: 'Hello'
    })

    const undone = history.undo(edited)

    expect(undone.title).toBe('')
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(true)
  })

  it('redo reapplies the undone operation', () => {
    const history = createHistoryManager()
    let note = createEmptyNote('note-1')
    note = history.execute(note, { type: 'set-title', before: '', after: 'Hello' })
    note = history.undo(note)
    note = history.redo(note)

    expect(note.title).toBe('Hello')
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)
  })

  it('supports multiple undo and redo steps', () => {
    const history = createHistoryManager()
    let note = createEmptyNote('note-1')
    note = history.execute(note, { type: 'set-title', before: '', after: 'A' })
    note = history.execute(note, { type: 'set-title', before: 'A', after: 'B' })
    note = history.execute(note, { type: 'set-title', before: 'B', after: 'C' })

    note = history.undo(note)
    note = history.undo(note)
    expect(note.title).toBe('A')

    note = history.redo(note)
    note = history.redo(note)
    expect(note.title).toBe('C')
  })

  it('clears the redo branch after a new change', () => {
    const history = createHistoryManager()
    let note = createEmptyNote('note-1')
    note = history.execute(note, { type: 'set-title', before: '', after: 'A' })
    note = history.execute(note, { type: 'set-title', before: 'A', after: 'B' })
    note = history.undo(note)
    note = history.execute(note, { type: 'set-title', before: 'A', after: 'C' })

    expect(history.canRedo()).toBe(false)
    expect(note.title).toBe('C')

    note = history.redo(note)
    expect(note.title).toBe('C')
  })

  it('keeps at most 50 operations and drops the oldest', () => {
    const history = createHistoryManager()
    let note = createEmptyNote('note-1')

    for (let index = 0; index < HISTORY_LIMIT + 1; index += 1) {
      const before = index === 0 ? '' : `t${index - 1}`
      const after = `t${index}`
      note = history.execute(note, { type: 'set-title', before, after })
    }

    expect(history.size()).toBe(HISTORY_LIMIT)
    expect(note.title).toBe('t50')

    for (let index = 0; index < HISTORY_LIMIT; index += 1) {
      note = history.undo(note)
    }

    expect(note.title).toBe('t0')
    expect(history.canUndo()).toBe(false)
  })

  it('groups continuous text input into one operation', () => {
    vi.useFakeTimers()
    const history = createHistoryManager()
    let note = createEmptyNote('note-1')
    const buffer = createTextHistoryBuffer((before, after) => {
      note = history.execute(note, { type: 'set-title', before, after })
    }, 400)

    buffer.change('', 'H')
    note = { ...note, title: 'H' }
    buffer.change('H', 'He')
    note = { ...note, title: 'He' }
    buffer.change('He', 'Hello')
    note = { ...note, title: 'Hello' }

    vi.advanceTimersByTime(400)

    expect(history.size()).toBe(1)
    expect(note.title).toBe('Hello')

    note = history.undo(note)
    expect(note.title).toBe('')

    vi.useRealTimers()
  })

  it('records add, remove and toggle as three atomic operations', () => {
    const history = createHistoryManager()
    const todo = createTodo('Task')
    let note = createEmptyNote('note-1')

    note = history.execute(note, { type: 'add-todo', todo, index: 0 })
    note = history.execute(note, {
      type: 'toggle-todo',
      todoId: todo.id,
      before: false,
      after: true
    })
    note = history.execute(note, { type: 'remove-todo', todo: note.todos[0]!, index: 0 })

    expect(history.size()).toBe(3)
    expect(note.todos).toHaveLength(0)

    note = history.undo(note)
    expect(note.todos).toHaveLength(1)
    expect(note.todos[0]?.completed).toBe(true)
  })

  it('edits todo text and title through operations', () => {
    const { note, todo } = noteWithTodo()
    const history = createHistoryManager()

    let next = history.execute(note, {
      type: 'set-todo-text',
      todoId: todo.id,
      before: todo.text,
      after: 'Buy bread'
    })
    next = history.execute(next, {
      type: 'set-title',
      before: next.title,
      after: 'Shopping'
    })

    expect(next.todos[0]?.text).toBe('Buy bread')
    expect(next.title).toBe('Shopping')
  })

  it('clears history', () => {
    const history = createHistoryManager()
    const note = createEmptyNote('note-1')
    history.execute(note, { type: 'set-title', before: '', after: 'A' })
    history.clear()

    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
    expect(history.size()).toBe(0)
  })

  it('applyOperation does not mutate the original note', () => {
    const note = createEmptyNote('note-1')
    const operation: HistoryOperation = {
      type: 'set-title',
      before: '',
      after: 'New'
    }

    applyOperation(note, operation)
    expect(note.title).toBe('')
  })
})
