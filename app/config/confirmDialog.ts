import type { ConfirmOptions } from '~/composables/useConfirmDialog'

export const confirmDialogConfig = {
  cancelCreate: {
    title: 'Отменить создание?',
    message: 'Новая заметка не будет сохранена.',
    confirmLabel: 'Отменить создание',
    cancelLabel: 'Продолжить создание',
    danger: true
  },
  cancelEdit: {
    title: 'Отменить редактирование?',
    message: 'Все несохранённые изменения будут потеряны.',
    confirmLabel: 'Отменить изменения',
    cancelLabel: 'Продолжить редактирование',
    danger: true
  },
  deleteNote: {
    title: 'Удалить заметку?',
    message: 'Это действие нельзя отменить.',
    confirmLabel: 'Удалить',
    cancelLabel: 'Отмена',
    danger: true
  },
  restoreDraft: {
    title: 'Найдено незавершённое редактирование.',
    message: 'Восстановить черновик?',
    confirmLabel: 'Восстановить',
    cancelLabel: 'Отказаться'
  }
} as const satisfies Record<
  'cancelCreate' | 'cancelEdit' | 'deleteNote' | 'restoreDraft',
  ConfirmOptions
>
