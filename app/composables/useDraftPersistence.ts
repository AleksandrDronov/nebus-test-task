import type { Note } from '~/types/note'
import { clearDraft, saveDraft } from '~/utils/persistence'

const DRAFT_DEBOUNCE_MS = 400

export type DraftPersistPayload = {
  noteId: string
  draft: Note
  isNew: boolean
}

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
