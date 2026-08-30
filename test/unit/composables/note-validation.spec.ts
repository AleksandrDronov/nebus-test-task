import { describe, expect, it } from 'vitest'
import { useNoteValidation } from '~/composables/useNoteValidation'
import { TITLE_REQUIRED_MESSAGE, TODO_REQUIRED_MESSAGE } from '~/utils/validation'

describe('useNoteValidation', () => {
  it('applies a title error from a failed prepare result', () => {
    const validation = useNoteValidation()

    validation.applyPrepareResult({
      ok: false,
      error: TITLE_REQUIRED_MESSAGE,
      field: 'title',
      emptyTodoIds: []
    })

    expect(validation.titleError.value).toBe(TITLE_REQUIRED_MESSAGE)
    expect(validation.todoErrors.value).toEqual({})
  })

  it('applies todo errors from a failed prepare result', () => {
    const validation = useNoteValidation()

    validation.applyPrepareResult({
      ok: false,
      error: TODO_REQUIRED_MESSAGE,
      field: 'todos',
      emptyTodoIds: ['t1', 't2']
    })

    expect(validation.todoErrors.value).toEqual({
      t1: TODO_REQUIRED_MESSAGE,
      t2: TODO_REQUIRED_MESSAGE
    })
  })

  it('clears a single todo error and the title error', () => {
    const validation = useNoteValidation()
    validation.titleError.value = TITLE_REQUIRED_MESSAGE
    validation.todoErrors.value = { t1: TODO_REQUIRED_MESSAGE, t2: TODO_REQUIRED_MESSAGE }

    validation.clearTitleError()
    validation.clearTodoError('t1')

    expect(validation.titleError.value).toBe('')
    expect(validation.todoErrors.value).toEqual({ t2: TODO_REQUIRED_MESSAGE })
  })

  it('resets all field errors', () => {
    const validation = useNoteValidation()
    validation.titleError.value = TITLE_REQUIRED_MESSAGE
    validation.todoErrors.value = { t1: TODO_REQUIRED_MESSAGE }

    validation.reset()

    expect(validation.titleError.value).toBe('')
    expect(validation.todoErrors.value).toEqual({})
  })
})
