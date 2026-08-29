# Notes SPA — Design

Date: 2026-08-29

Source of truth: `ТЗ Frontend.pdf`. Implementation details follow `Frontend Implementation Specification.md` where they do not contradict the TZ.

## Goal

A two-page Nuxt SPA for notes. Each note has a title and a todo list. Persistence, undo/redo, draft recovery, and confirmation dialogs are implemented by hand.

## Locked decisions

These are the TZ “на своё усмотрение” choices:

| Topic | Decision |
| --- | --- |
| Empty title on save | Trim; if empty, show inline error `Название заметки не может быть пустым.` Do not save. |
| Empty todos on save | Drop todos whose trimmed text is empty. Do not block save. |
| Missing note URL | Not-found state on `/notes/:id` with button `Вернуться к заметкам`. No redirect. |
| New note | Generate UUID, write an `isNew` draft, open `/notes/:id`. Nothing is added to the persisted notes list until Save. |
| Todo preview count | First 3 todos on the list page. Checkboxes visible and disabled. |
| Text history grouping | Debounce 400 ms and commit on blur. One operation per field burst. |
| Persistence writes | Debounce 400 ms; also write on Save / Delete / confirmed discard. |
| Native vs app undo | Do not intercept Ctrl/Cmd+Z or Shift+Z when the event target is `input`, `textarea`, or `contenteditable`. |
| Cross-tab delete | Listen to `storage`. If the open note disappears, show `Заметка была удалена в другой вкладке.` and a link back to the list. Save is blocked. |
| Schema version | `STORAGE_VERSION = 1`. Unknown/corrupt payload → empty notes, no crash. |
| SPA mode | `ssr: false`. |

## Architecture

```text
Pinia notes store  ←→  localStorage (versioned payload)
        ↑
   useNoteEditor (draft + isDirty + save/cancel/delete)
        ↑
   useUndoRedo (operation stack, limit 50)
        ↑
   pages/notes/[id].vue
```

- **Store** owns persisted notes and load/save. No modal UI.
- **History** is a pure TS stack of operations (not snapshots). Independent of Vue, DOM, and storage.
- **Draft** is a separate localStorage payload. Restore is always a confirmation, never automatic.
- **Modals** are custom (`AppModal` + `ConfirmDialog`) with focus trap, Escape, Tab cycle, and focus restoration.

## History operations

```ts
type HistoryOperation =
  | { type: 'set-title'; before: string; after: string }
  | { type: 'set-todo-text'; todoId: string; before: string; after: string }
  | { type: 'toggle-todo'; todoId: string; before: boolean; after: boolean }
  | { type: 'add-todo'; todo: Todo; index: number }
  | { type: 'remove-todo'; todo: Todo; index: number }
```

`execute` applies the operation, pushes it, clears redo, trims to 50. `undo`/`redo` invert or re-apply. Save and Cancel call `clear()`.

`isDirty` compares draft to original (deep equality of title + todos). Undo back to original → `isDirty === false`.

## Pages

1. `/` — list, create, edit, delete-with-confirm, read-only todo preview.
2. `/notes/:id` — editor: title, todos, Save, Cancel, Delete, Undo, Redo, shortcuts.

## Out of scope

Backend, auth, UI libraries, undo/redo libraries, Pinia persistence plugins, realtime sync, CRDT.

## Stack

Nuxt 4, Vue 3 Composition API, TypeScript strict, Pinia, SCSS, Vitest, Docker + docker-compose.
