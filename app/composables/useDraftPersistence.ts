import type { Note } from '~/types/note'
import { clearDraft, saveDraft } from '~/utils/persistence'

const DRAFT_DEBOUNCE_MS = 400

/** Данные черновика для записи в persistence. */
export type DraftPersistPayload = {
  noteId: string
  draft: Note
  isNew: boolean
}

/**
 * Отложенная запись черновика заметки.
 *
 * `persistSoon` дебаунсит сохранение, `persistNow` пишет сразу,
 * `discard` снимает таймер и очищает сохранённый черновик.
 *
 * @returns методы записи, отмены таймера и удаления черновика
 */
export const useDraftPersistence = () => {
  let draftTimer: ReturnType<typeof setTimeout> | null = null

  const cancelPending = (): void => {
    if (!draftTimer) {
      return
    }

    clearTimeout(draftTimer)
    draftTimer = null
  }

  const persistSoon = (payload: DraftPersistPayload): void => {
    cancelPending()

    draftTimer = setTimeout(() => {
      saveDraft(payload)
    }, DRAFT_DEBOUNCE_MS)
  }

  const persistNow = (payload: DraftPersistPayload): void => {
    cancelPending()
    saveDraft(payload)
  }

  const discard = (): void => {
    cancelPending()
    clearDraft()
  }

  return {
    persistSoon,
    persistNow,
    cancelPending,
    discard
  }
}
