import { computed, getCurrentInstance, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { createHistoryManager } from '~/utils/history'

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

export const isNativeTextTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

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

export const useCanUndoRedo = (canUndo: Ref<boolean>, canRedo: Ref<boolean>) => {
  return {
    undoDisabled: computed(() => !canUndo.value),
    redoDisabled: computed(() => !canRedo.value)
  }
}
