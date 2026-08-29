export const CREATE_NOTE_BUTTON_ID = 'create-note-button'

export const getNoteCardLinkId = (noteId: string): string => {
  return `note-card-link-${noteId}`
}

export type FocusTargetAfterDelete =
  | {
      type: 'create'
    }
  | {
      type: 'note'
      id: string
    }

export const getFocusTargetAfterDelete = (
  noteIds: string[],
  deletedId: string
): FocusTargetAfterDelete => {
  const index = noteIds.indexOf(deletedId)
  const remaining = noteIds.filter((id) => id !== deletedId)

  if (remaining.length === 0) {
    return { type: 'create' }
  }

  const nextIndex = index === -1 ? 0 : Math.min(index, remaining.length - 1)
  const id = remaining[nextIndex]

  if (!id) {
    return { type: 'create' }
  }

  return { type: 'note', id }
}
