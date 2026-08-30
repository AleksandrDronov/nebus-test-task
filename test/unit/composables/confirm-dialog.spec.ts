import { describe, expect, it } from 'vitest'
import { useConfirmDialog } from '~/composables/useConfirmDialog'

describe('useConfirmDialog', () => {
  it('shares one dialog instance between callers', async () => {
    const first = useConfirmDialog()
    const second = useConfirmDialog()

    const pending = first.confirm({
      title: 'Удалить?',
      message: 'Нельзя отменить.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена'
    })

    expect(second.isOpen.value).toBe(true)
    expect(second.title.value).toBe('Удалить?')

    second.handleCancel()
    await expect(pending).resolves.toBe(false)
    expect(first.isOpen.value).toBe(false)
  })

  it('resolves the previous confirm as rejected when a new one opens', async () => {
    const dialog = useConfirmDialog()
    const first = dialog.confirm({
      title: 'Первый',
      message: 'Один',
      confirmLabel: 'OK',
      cancelLabel: 'Отмена'
    })
    const second = dialog.confirm({
      title: 'Второй',
      message: 'Два',
      confirmLabel: 'OK',
      cancelLabel: 'Отмена'
    })

    expect(dialog.title.value).toBe('Второй')
    await expect(first).resolves.toBe(false)

    dialog.handleConfirm()
    await expect(second).resolves.toBe(true)
  })
})
