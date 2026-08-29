import { ref } from 'vue'

/** Содержимое и оформление модального подтверждения. */
export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger?: boolean
}

const isOpen = ref(false)
const title = ref('')
const message = ref('')
const confirmLabel = ref('OK')
const cancelLabel = ref('Отмена')
const danger = ref(false)
let resolveConfirm: ((value: boolean) => void) | null = null

const settle = (value: boolean): void => {
  isOpen.value = false
  resolveConfirm?.(value)
  resolveConfirm = null
}

/**
 * Глобальный диалог подтверждения.
 *
 * Состояние общее для всех вызовов: новый `confirm` закрывает предыдущий
 * как отмену. Резолвит промис в `true` при подтверждении и в `false` при отмене.
 *
 * @returns состояние диалога, `confirm` и обработчики кнопок
 */
export const useConfirmDialog = () => {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    if (resolveConfirm) {
      resolveConfirm(false)
      resolveConfirm = null
    }

    title.value = options.title
    message.value = options.message
    confirmLabel.value = options.confirmLabel
    cancelLabel.value = options.cancelLabel
    danger.value = options.danger === true
    isOpen.value = true

    return new Promise((resolve) => {
      resolveConfirm = resolve
    })
  }

  const handleConfirm = (): void => {
    settle(true)
  }

  const handleCancel = (): void => {
    settle(false)
  }

  return {
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    danger,
    confirm,
    handleConfirm,
    handleCancel
  }
}
