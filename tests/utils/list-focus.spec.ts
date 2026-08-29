import { describe, expect, it } from 'vitest'
import { getFocusTargetAfterDelete } from '../../app/utils/list-focus'

describe('getFocusTargetAfterDelete', () => {
  it('returns the create action when the last note is removed', () => {
    expect(getFocusTargetAfterDelete(['n1'], 'n1')).toEqual({ type: 'create' })
  })

  it('focuses the next note when a middle card is removed', () => {
    expect(getFocusTargetAfterDelete(['n1', 'n2', 'n3'], 'n2')).toEqual({
      type: 'note',
      id: 'n3'
    })
  })

  it('focuses the previous note when the last card is removed', () => {
    expect(getFocusTargetAfterDelete(['n1', 'n2', 'n3'], 'n3')).toEqual({
      type: 'note',
      id: 'n2'
    })
  })

  it('focuses the first remaining note when the first card is removed', () => {
    expect(getFocusTargetAfterDelete(['n1', 'n2'], 'n1')).toEqual({
      type: 'note',
      id: 'n2'
    })
  })
})
