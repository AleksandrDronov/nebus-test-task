import { computed, getCurrentInstance, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { createHistoryManager } from '~/utils/history'

/**
 * Низкоуровневый доступ к менеджеру истории undo/redo.
 *
 * @template T — тип снимка, к которому применяется история
 * @param apply — функция применения следующего снимка к текущему состоянию
 * @returns менеджер истории, флаги canUndo/canRedo и переданная `apply`
 */
export const useUndoRedo = <T>(apply: (current: T, next: T) => void) => {
  const history = createHistoryManager()
  const canUndo = ref(false)
  const canRedo = ref(false)

  const syncFlags = (): void => {
    canUndo.value = history.canUndo()
    canRedo.value = history.canRedo()
  }

  return {
    history,
    canUndo,
    canRedo,
    syncFlags,
    apply
  }
}

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

/**
 * Инвертирует флаги истории в `disabled` для кнопок тулбара.
 *
 * @param canUndo — можно ли отменить действие
 * @param canRedo — можно ли повторить действие
 * @returns computed-флаги `undoDisabled` и `redoDisabled`
 */
export const useCanUndoRedo = (canUndo: Ref<boolean>, canRedo: Ref<boolean>) => {
  return {
    undoDisabled: computed(() => !canUndo.value),
    redoDisabled: computed(() => !canRedo.value)
  }
}
