import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useNoteHistory } from '~/composables/useNoteHistory'
import { createEmptyNote, createTodo } from '~/utils/note'

describe('useNoteHistory', () => {
  it('records a structural change and undoes it', () => {
    const draft = ref(createEmptyNote('n1'))
    const onChange = vi.fn()
    const history = useNoteHistory(draft, { onChange })

    history.addTodo()

    expect(draft.value.todos).toHaveLength(1)
    expect(history.canUndo.value).toBe(true)
    expect(onChange).toHaveBeenCalled()

    history.undo()

    expect(draft.value.todos).toHaveLength(0)
    expect(history.canRedo.value).toBe(true)
  })

  it('commits title edits on blur', () => {
    const draft = ref(createEmptyNote('n1'))
    const history = useNoteHistory(draft, { onChange: vi.fn() })

    history.handleTitleInput('Hello')
    expect(draft.value.title).toBe('Hello')
    expect(history.canUndo.value).toBe(false)

    history.handleTitleBlur()

    expect(history.canUndo.value).toBe(true)

    history.undo()
    expect(draft.value.title).toBe('')
  })

  it('toggles a todo through history', () => {
    const todo = createTodo('Buy milk')
    const note = createEmptyNote('n1')
    note.todos = [todo]
    const draft = ref(note)
    const history = useNoteHistory(draft, { onChange: vi.fn() })

    history.toggleTodo(todo.id)

    expect(draft.value.todos[0]?.completed).toBe(true)

    history.undo()
    expect(draft.value.todos[0]?.completed).toBe(false)
  })
})
