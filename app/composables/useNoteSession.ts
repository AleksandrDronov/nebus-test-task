import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Note } from '~/types/note'
import { cloneNote, createEmptyNote, notesContentEqual } from '~/utils/note'
import { useNotesStore } from '~/stores/notes'
import { clearDraft, loadDraftForNote } from '~/utils/persistence'

export const useNoteSession = (noteIdSource: MaybeRefOrGetter<string>) => {
  const store = useNotesStore()
  const original = ref<Note | null>(null)
  const draft = ref<Note | null>(null)
  const isNew = ref(false)
  const notFound = ref(false)
  const isReady = ref(false)
  const pendingRestore = ref<Note | null>(null)

  const noteId = (): string => toValue(noteIdSource)

  const needsRestore = computed(() => pendingRestore.value !== null)

  const isDirty = computed(() => {
    if (!draft.value || !original.value) {
      return false
    }

    return !notesContentEqual(draft.value, original.value)
  })

  const resetDraftToOriginal = (): void => {
    if (!original.value) {
      return
    }

    draft.value = cloneNote(original.value)
  }

  const initialize = (): void => {
    notFound.value = false
    isReady.value = false
    pendingRestore.value = null
    const id = noteId()
    const stored = store.getNote(id)
    const existingDraft = loadDraftForNote(id)

    if (stored) {
      original.value = cloneNote(stored)
      isNew.value = false

      if (existingDraft && !notesContentEqual(existingDraft.draft, stored)) {
        pendingRestore.value = existingDraft.draft
        draft.value = cloneNote(stored)
      } else {
        draft.value = cloneNote(stored)
      }

      isReady.value = true
      return
    }

    if (existingDraft?.isNew) {
      isNew.value = true
      original.value = createEmptyNote(id)

      if (!notesContentEqual(existingDraft.draft, original.value)) {
        pendingRestore.value = existingDraft.draft
        draft.value = cloneNote(original.value)
      } else {
        draft.value = cloneNote(existingDraft.draft)
      }

      isReady.value = true
      return
    }

    notFound.value = true
    draft.value = null
    original.value = null
    isNew.value = false
    isReady.value = true
  }

  const restoreDraft = (restore: boolean): void => {
    if (restore && pendingRestore.value) {
      draft.value = cloneNote(pendingRestore.value)
    } else if (!restore) {
      clearDraft()
      resetDraftToOriginal()
    }

    pendingRestore.value = null
  }

  initialize()

  watch(
    () => toValue(noteIdSource),
    () => {
      initialize()
    }
  )

  return {
    original,
    draft,
    isNew,
    notFound,
    isReady,
    needsRestore,
    isDirty,
    initialize,
    restoreDraft,
    resetDraftToOriginal
  }
}
