import { ref } from 'vue'

export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger?: boolean
}

export const useConfirmDialog = () => {
  const isOpen = ref(false)
  const title = ref('')
  const message = ref('')
  const confirmLabel = ref('OK')
  const cancelLabel = ref('Отмена')
  const danger = ref(false)
  let resolveConfirm: ((value: boolean) => void) | null = null

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
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
    isOpen.value = false
    resolveConfirm?.(true)
    resolveConfirm = null
  }

  const handleCancel = (): void => {
    isOpen.value = false
    resolveConfirm?.(false)
    resolveConfirm = null
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
