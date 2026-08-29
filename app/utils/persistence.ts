import type { DraftPayload } from '~/types/storage'
import { DRAFT_STORAGE_KEY, STORAGE_VERSION } from '~/types/storage'
import { createLocalStorageAdapter, parseDraftPayload } from '~/utils/storage'
import { nowIso } from '~/utils/id'

const draftAdapter = createLocalStorageAdapter<DraftPayload>(DRAFT_STORAGE_KEY)

export const loadDraft = (): DraftPayload | null => {
  return parseDraftPayload(draftAdapter.load())
}

export const saveDraft = (payload: Omit<DraftPayload, 'version' | 'updatedAt'>): void => {
  draftAdapter.save({
    version: STORAGE_VERSION,
    noteId: payload.noteId,
    draft: payload.draft,
    isNew: payload.isNew,
    updatedAt: nowIso()
  })
}

export const clearDraft = (): void => {
  draftAdapter.remove()
}

export const loadDraftForNote = (noteId: string): DraftPayload | null => {
  const draft = loadDraft()

  if (!draft || draft.noteId !== noteId) {
    return null
  }

  return draft
}
