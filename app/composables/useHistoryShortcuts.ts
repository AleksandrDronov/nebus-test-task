import { getCurrentInstance, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Проверяет, находится ли фокус в нативном текстовом поле.
 * Для таких целей браузер сам обрабатывает Cmd/Ctrl+Z.
 *
 * @param target — цель события клавиатуры
 * @returns `true`, если это input, textarea или contenteditable
 */
export const isNativeTextTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

/**
 * Подписывает окно на Cmd/Ctrl+Z и Cmd/Ctrl+Shift+Z.
 *
 * Не перехватывает сочетания внутри нативных текстовых полей.
 * Регистрирует слушатели только при вызове внутри setup-компонента.
 *
 * @param options.undo — откат последнего действия
 * @param options.redo — повтор отменённого действия
 * @param options.enabled — активны ли сочетания
 */
export const useHistoryShortcuts = (options: {
  undo: () => void
  redo: () => void
  enabled: Ref<boolean>
}): void => {
  const handleKeydown = (event: KeyboardEvent): void => {
    if (!options.enabled.value) {
      return
    }

    const modifier = event.metaKey || event.ctrlKey

    if (!modifier || event.altKey || event.key.toLowerCase() !== 'z') {
      return
    }

    if (isNativeTextTarget(event.target)) {
      return
    }

    event.preventDefault()

    if (event.shiftKey) {
      options.redo()
      return
    }

    options.undo()
  }

  if (!getCurrentInstance()) {
    return
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}
