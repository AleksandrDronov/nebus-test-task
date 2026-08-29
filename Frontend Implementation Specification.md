# Frontend Implementation Specification

## 1. Role of the AI Agent

Ты — senior frontend engineer, реализующий тестовое задание на Nuxt.js 3/4.

Твоя задача — разработать небольшое SPA-приложение для заметок строго в соответствии с данным техническим заданием.

Приоритеты:

1. Корректность бизнес-логики.
2. Соблюдение ограничений ТЗ.
3. Чистая архитектура.
4. Типобезопасность.
5. Тестируемость.
6. Хороший UX.
7. Адаптивность и кросс-браузерность.
8. Минимальная сложность реализации.

Не добавляй функциональность, которой нет в ТЗ, без необходимости.

Если ТЗ не определяет конкретное поведение — выбери наиболее разумное UX-решение и реализуй его последовательно.

---

# 2. Mandatory Technology Stack

Использовать:

- Nuxt.js 3/4
- Vue 3
- Composition API
- TypeScript
- TypeScript `strict`
- Pinia или другой менеджер состояния, совместимый с Nuxt
- SCSS/SASS
- Vitest
- Docker
- docker-compose

Предпочтительно:

- `<script setup lang="ts">`
- composables для переиспользуемой логики
- typed stores
- typed domain models
- небольшие переиспользуемые компоненты

---

# 3. Forbidden Technologies

## UI libraries

Запрещены:

- Vuetify
- PrimeVue
- Element Plus
- Ant Design Vue
- Quasar
- любые другие готовые UI component libraries

Все UI-компоненты реализуются самостоятельно.

Особенно:

- buttons
- inputs
- checkbox
- modal
- confirmation dialog
- todo item
- empty states
- loading/error states

Стилизация:

- SCSS/SASS
- собственные CSS-классы

---

## Undo/Redo libraries

Запрещены библиотеки:

- для undo/redo
- для history management

Undo/redo необходимо реализовать самостоятельно.

---

## Persistence plugins

Запрещены:

- `pinia-plugin-persistedstate`
- аналогичные плагины автоматической синхронизации Pinia/store с storage

Синхронизация состояния с хранилищем должна быть реализована вручную.

---

# 4. Application Structure

Приложение состоит ровно из двух страниц.

## Page 1 — Notes List

Главная страница:

`/`

Отображает:

- список всех заметок;
- название каждой заметки;
- несколько первых Todo.

На главной странице Todo отображаются только для просмотра.

Checkbox Todo на главной странице:

- отображается;
- не должен изменять состояние;
- не должен быть интерактивным.

Действия:

- создать заметку;
- открыть заметку на редактирование;
- удалить заметку.

Удаление требует подтверждения через modal.

---

# 5. Page 2 — Note Editor

Страница:

`/notes/:id`

На странице можно:

- редактировать название;
- редактировать Todo;
- добавлять Todo;
- удалять Todo;
- отмечать Todo;
- сохранять изменения;
- отменять редактирование;
- удалять заметку;
- выполнять undo;
- выполнять redo.

---

# 6. Domain Model

Использовать типизированную модель.

Рекомендуемая структура:

```ts
interface Todo {
  id: string
  text: string
  completed: boolean
}

interface Note {
  id: string
  title: string
  todos: Todo[]
  createdAt: string
  updatedAt: string
}
```

Store:

```ts
interface NotesState {
  notes: Note[]
}
```

Не использовать `any`.

Все публичные функции store/composables должны иметь явные типы там, где это улучшает читаемость и предотвращает ошибки.

---

# 7. Store Architecture

Store отвечает за:

- получение списка заметок;
- создание заметки;
- получение заметки по ID;
- обновление заметки;
- удаление заметки;
- persistence;
- восстановление состояния после reload.

Store не должен содержать UI-логику modal/dialog.

Рекомендуемое разделение:

```text
stores/
  notes.ts

composables/
  useNoteEditor.ts
  useUndoRedo.ts
  usePersistence.ts
  useConfirmDialog.ts
```

Допустима другая структура, если она проще и лучше соответствует архитектуре проекта.

---

# 8. Editing Architecture

Очень важно разделять:

### Persisted note

Оригинальная версия заметки, сохранённая в store.

### Draft

Текущая редактируемая версия.

### History

История изменений draft.

До нажатия `Save` изменения не должны изменять сохранённую версию заметки.

Пример:

```text
Store note
    ↓
create draft
    ↓
User edits draft
    ↓
History records operations
    ↓
Save
    ↓
Draft → Store
```

При отмене:

```text
Draft changes
    ↓
discard
    ↓
original Store note remains unchanged
```

---

# 9. Undo / Redo

Undo/redo реализовать самостоятельно.

## Основное правило

Не хранить 50 полных копий заметки.

Запрещён подход:

```ts
history.push(clone(note))
```

где каждая запись содержит полный snapshot заметки.

История должна хранить операции/patches/deltas.

Например:

```ts
type HistoryOperation =
  | {
      type: 'set-title'
      before: string
      after: string
    }
  | {
      type: 'set-todo-text'
      todoId: string
      before: string
      after: string
    }
  | {
      type: 'toggle-todo'
      todoId: string
      before: boolean
      after: boolean
    }
  | {
      type: 'add-todo'
      todo: Todo
      index: number
    }
  | {
      type: 'remove-todo'
      todo: Todo
      index: number
    }
```

Допускается другая реализация, если она:

- не хранит 50 полных snapshots;
- корректно выполняет undo;
- корректно выполняет redo;
- сохраняет необходимые данные для обратной операции.

---

# 10. History Semantics

## Text input

Непрерывный ввод текста в одном поле = одна history operation.

Не создавать history entry на каждый символ.

Плохо:

```text
H
He
Hel
Hell
Hello
```

Хорошо:

```text
"" → "Hello"
```

Фиксация происходит:

- по `blur`;
- или после небольшой паузы ввода.

Можно использовать debounce.

Рекомендуемая задержка:

```text
300–500 ms
```

---

# 11. Atomic Operations

Следующие действия создают отдельную history operation:

- checkbox toggle;
- add Todo;
- remove Todo.

Например:

```text
toggle Todo
→ one history entry
```

Добавление:

```text
add Todo
→ one history entry
```

Удаление:

```text
remove Todo
→ one history entry
```

---

# 12. Redo Branch

Если пользователь сделал:

```text
A
B
C
undo
undo
```

состояние:

```text
A
```

После нового изменения:

```text
D
```

redo-ветка должна быть полностью удалена.

То есть:

```text
A → B → C
       ↑
      undo
       ↓
A → B

new change D

A → B → D
```

Redo `C` после появления `D` невозможен.

---

# 13. History Limit

Максимум:

```text
50 operations
```

При превышении лимита удалять самые старые операции.

Пример:

```text
51 operations
```

Хранить:

```text
operations 2...51
```

---

# 14. History Lifetime

История существует только во время текущей сессии редактирования.

При:

### Save

History очищается.

### Cancel editing

History очищается.

### Opening another note

History текущего редактора не должна переноситься на другую заметку.

---

# 15. Keyboard Shortcuts

На странице редактирования должны работать:

### Undo

```text
Ctrl + Z
```

### Redo

```text
Ctrl + Shift + Z
```

Также корректно учитывать `Cmd` на macOS.

То есть:

```text
Meta + Z
Meta + Shift + Z
```

---

# 16. Native Text Editing

Глобальный undo не должен ломать нативный undo внутри текстовых полей.

Для `input` / `textarea`:

- не перехватывать Ctrl/Cmd+Z без необходимости;
- не ломать стандартное поведение браузера;
- history приложения должна работать для зафиксированных изменений.

Необходимо продумать разграничение:

```text
editing text inside input
        ↓
native browser undo
```

и

```text
application-level history
        ↓
Ctrl/Cmd + Z outside native text undo
```

Если поле имеет активное нативное undo-состояние, приложение не должно безусловно перехватывать комбинацию.

---

# 17. Draft Persistence

Данные должны переживать reload страницы.

Но persistence не должен выполняться на каждый символ.

Не делать:

```ts
watch(text, () => localStorage.setItem(...))
```

без debounce.

Использовать:

- debounce;
- batching;
- сохранение по значимым изменениям.

---

# 18. Storage Schema Version

Persisted data обязательно должна иметь версию схемы.

Пример:

```ts
interface StoragePayload {
  version: number
  notes: Note[]
}
```

Например:

```ts
const STORAGE_VERSION = 1
```

При изменении модели в будущем должна существовать возможность миграции.

Архитектура должна позволять:

```text
version 1
    ↓ migration
version 2
```

---

# 19. Draft Recovery

Незасохранённое редактирование должно переживать случайный reload.

Необходимо различать:

```text
saved notes
```

и

```text
unsaved draft
```

Draft должен содержать минимум:

```ts
interface DraftPayload {
  version: number
  noteId: string
  draft: Note
  updatedAt: string
}
```

После возврата на страницу редактирования необходимо определить наличие актуального draft.

Если найден draft:

показать пользователю confirmation modal:

```text
Найдено незавершённое редактирование.
Восстановить черновик?
```

Действия:

- Restore
- Discard

Не восстанавливать draft автоматически без выбора пользователя.

---

# 20. Draft Validity

Draft должен быть связан с конкретной заметкой:

```text
noteId
```

Если заметка больше не существует:

- не пытаться применить draft;
- удалить/игнорировать draft;
- корректно обработать ситуацию.

---

# 21. Direct URL to Non-existent Note

Обязательный edge case:

```text
/notes/non-existent-id
```

Если заметки нет:

приложение не должно падать.

Допустимые варианты:

### Вариант A

Показать страницу:

```text
Заметка не найдена
```

и кнопку:

```text
Вернуться к заметкам
```

### Вариант B

Сделать redirect на `/`.

Предпочтительно:

```text
Not found state
+
link/button back to notes
```

---

# 22. Empty Title

Пустой title должен обрабатываться осмысленно.

Рекомендуемое поведение:

При сохранении:

- trim title;
- если title пустой — показать validation message;
- не сохранять заметку.

Например:

```text
Название заметки не может быть пустым.
```

---

# 23. Empty Todo Text

Пустой Todo также должен обрабатываться осмысленно.

Рекомендуемое поведение:

- при добавлении создать Todo;
- пользователь может редактировать его;
- при попытке сохранить Todo с пустым/whitespace-only текстом — либо удалить пустой Todo, либо показать validation.

Выбрать один подход и использовать его последовательно.

Предпочтительно:

```text
empty Todo is not saved
```

---

# 24. Delete Note

Удаление заметки всегда требует подтверждения.

Нельзя использовать:

```js
alert()
confirm()
```

или другие browser dialogs.

Только собственный modal.

Пример:

```text
Удалить заметку?

Это действие нельзя отменить.

[Отмена] [Удалить]
```

---

# 25. Cancel Editing

При нажатии:

```text
Cancel
```

если есть несохранённые изменения:

показать confirmation modal.

Например:

```text
Отменить редактирование?

Все несохранённые изменения будут потеряны.

[Продолжить редактирование] [Отменить изменения]
```

Если изменений нет:

- modal не нужен;
- можно сразу перейти назад.

---

# 26. Delete While Editing in Another Tab

Edge case:

Tab A:

```text
/notes/123
```

Tab B:

```text
/notes/123
```

Tab B удаляет заметку.

Tab A не должен ломаться.

При попытке сохранить из Tab A:

- проверить существование оригинальной заметки;
- корректно обработать отсутствие;
- не выбрасывать необработанную ошибку.

Возможное UX:

```text
Заметка была удалена в другой вкладке.
Сохранение невозможно.
```

После этого предложить:

```text
Вернуться к списку
```

---

# 27. Cross-tab Synchronization

Не обязательно реализовывать полноценную real-time синхронизацию между вкладками.

Но приложение обязано корректно переживать конфликт удаления.

Можно использовать:

```text
storage event
```

если это упрощает решение.

Не добавлять сложную синхронизацию без необходимости.

---

# 28. Modal Requirements

Все confirmation dialogs — собственные компоненты.

Modal обязан поддерживать:

- focus trap;
- Escape;
- keyboard navigation;
- focus restoration;
- правильный `role="dialog"`;
- `aria-modal="true"`;
- доступный заголовок.

При открытии:

```text
focus → modal
```

При закрытии:

```text
focus → trigger element
```

---

# 29. Modal Keyboard Behavior

Минимально:

```text
Tab
Shift + Tab
Enter
Escape
```

должны работать предсказуемо.

Escape:

- закрывает modal;
- если modal требует подтверждения — должен вести к безопасному действию;
- не должен неожиданно удалять данные.

---

# 30. Reusable Components

Переиспользуемые элементы обязательно вынести в компоненты.

Рекомендуемая структура:

```text
components/
  AppButton.vue
  AppModal.vue
  AppCheckbox.vue
  NoteCard.vue
  TodoItem.vue
  TodoList.vue
  ConfirmDialog.vue
  EmptyState.vue
```

Названия могут быть другими.

Не создавать компоненты исключительно ради чрезмерной декомпозиции.

---

# 31. Recommended Project Structure

```text
.
├── components/
│   ├── AppButton.vue
│   ├── AppCheckbox.vue
│   ├── AppModal.vue
│   ├── ConfirmDialog.vue
│   ├── EmptyState.vue
│   ├── NoteCard.vue
│   ├── TodoItem.vue
│   └── TodoList.vue
│
├── composables/
│   ├── useConfirmDialog.ts
│   ├── useNoteEditor.ts
│   ├── usePersistence.ts
│   └── useUndoRedo.ts
│
├── pages/
│   ├── index.vue
│   └── notes/
│       └── [id].vue
│
├── stores/
│   └── notes.ts
│
├── types/
│   ├── note.ts
│   └── history.ts
│
├── utils/
│   ├── storage.ts
│   ├── history.ts
│   └── validation.ts
│
├── assets/
│   └── styles/
│       ├── _variables.scss
│       ├── _mixins.scss
│       └── main.scss
│
├── tests/
│   ├── history/
│   └── stores/
│
├── Dockerfile
├── docker-compose.yaml
├── package.json
├── nuxt.config.ts
└── tsconfig.json
```

Структура может быть изменена, если итоговая архитектура становится проще.

---

# 32. UI Requirements

UI должен быть:

- аккуратным;
- современным;
- минималистичным;
- адаптивным;
- удобным на desktop и mobile.

Не использовать UI framework.

Обязательны:

- hover states;
- focus states;
- disabled states;
- визуальное состояние completed Todo;
- понятные destructive actions;
- responsive layout.

---

# 33. Accessibility

Использовать семантический HTML.

Например:

```html
<main>
<section>
<form>
<button>
<label>
<input>
```

Для интерактивных элементов:

- keyboard accessible;
- visible focus;
- accessible labels.

Не использовать `<div>` как кнопку.

Checkbox должен быть настоящим:

```html
<input type="checkbox">
```

либо корректно реализованным доступным control.

---

# 34. Main Page Behavior

На `/`:

```text
Notes
+
[Create note]

Note card
├── title
├── todo preview
├── Edit
└── Delete
```

Todo preview:

- отображать несколько Todo;
- не позволять изменять checkbox;
- длинный текст корректно сокращать.

Количество отображаемых Todo выбрать разумно.

---

# 35. Note Creation

Создание новой заметки должно использовать editor page.

Рекомендуемый flow:

```text
Create
 ↓
create temporary/new note ID
 ↓
/notes/:id
 ↓
edit
 ↓
Save
```

Не добавлять пустую заметку в persisted store до сохранения, если это приводит к появлению мусорных заметок.

Предпочтительно иметь draft/new-note state.

---

# 36. Save

При сохранении:

1. Валидировать данные.
2. Проверить, существует ли исходная заметка.
3. Сохранить draft в store.
4. Persist store.
5. Очистить draft.
6. Очистить history.
7. Перейти на `/`.

---

# 37. Cancel

При cancel:

1. Проверить наличие изменений.
2. Если изменений нет — выйти.
3. Если есть — показать confirmation modal.
4. При подтверждении:
   - удалить draft;
   - очистить history;
   - discard changes;
   - перейти на `/`.

---

# 38. Delete From Editor

При delete:

1. Открыть confirmation modal.
2. При подтверждении удалить note.
3. Удалить draft.
4. Очистить history.
5. Перейти на `/`.

---

# 39. Change Detection

Не считать history автоматически признаком unsaved changes, если это приводит к неправильным состояниям.

Должно существовать надёжное понятие:

```ts
isDirty
```

Например:

```text
draft !== original
```

При:

```text
edit → undo
```

если draft снова совпадает с original:

```text
isDirty = false
```

---

# 40. Undo / Redo State

Editor должен предоставлять:

```ts
canUndo
canRedo
```

UI:

```text
Undo
Redo
```

Disabled state:

```text
canUndo === false
```

и

```text
canRedo === false
```

---

# 41. History API

Рекомендуемый интерфейс:

```ts
interface HistoryManager<T> {
  execute(operation: Operation<T>): void
  undo(): void
  redo(): void
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>
  clear(): void
}
```

Можно использовать другой API.

Главное:

- история изолирована;
- легко тестируется;
- не зависит от Vue components;
- не зависит от DOM;
- не зависит от localStorage.

---

# 42. Persistence API

Рекомендуемый интерфейс:

```ts
interface StorageAdapter<T> {
  load(): T | null
  save(data: T): void
  remove(): void
}
```

Для SSR учитывать, что:

```text
localStorage
```

существует только в browser.

Не обращаться к `localStorage` во время SSR.

---

# 43. Error Handling

Не использовать:

```js
alert()
```

Ошибки должны обрабатываться через UI.

Не допускать:

```text
Unhandled Promise Rejection
```

или runtime exceptions при обычных пользовательских сценариях.

---

# 44. Testing

Использовать Vitest.

Компонентные тесты не требуются.

Обязательно протестировать:

## History

- initial state;
- execute;
- undo;
- redo;
- multiple undo;
- multiple redo;
- new change clears redo;
- 50-step limit;
- text input grouped into one operation;
- add Todo;
- remove Todo;
- toggle Todo;
- edit Todo;
- edit title;
- history clear.

## Store

- create note;
- read note;
- update note;
- delete note;
- persistence;
- reload/load;
- schema version;
- missing note;
- invalid persisted data;
- deleted note scenario.

---

# 45. Important History Tests

Обязательно проверить сценарий:

```text
initial
  ↓
change A
  ↓
change B
  ↓
undo
  ↓
new change C
```

Ожидание:

```text
redo B → impossible
```

Также:

```text
change title 10 times continuously
```

Ожидание:

```text
1 history entry
```

А:

```text
toggle
add
remove
```

должны создать:

```text
3 history entries
```

---

# 46. Persistence Tests

Проверить:

```text
store
 ↓
save
 ↓
reload
 ↓
load
```

Данные должны сохраниться.

Также проверить:

```text
persisted schema version
```

и некорректные данные.

Приложение не должно падать при повреждённом storage.

---

# 47. TypeScript Rules

Использовать:

```json
{
  "strict": true
}
```

Запрещено:

```ts
any
```

без крайней необходимости.

Не использовать бессмысленные type assertions:

```ts
foo as SomeType
```

если тип можно корректно вывести.

Domain types должны быть единым источником истины.

---

# 48. Code Quality

Не писать монолитные компоненты.

Если файл становится слишком большим:

- выделить composable;
- выделить domain utility;
- выделить component.

Но не создавать абстракции без реальной необходимости.

Предпочитать простой код:

```text
explicit > magic
```

```text
simple > over-engineered
```

---

# 49. Comments

Комментарии писать только там, где они объясняют:

- почему решение необходимо;
- сложную часть undo/redo;
- browser/SSR limitation;
- необычное решение.

Не писать комментарии вида:

```ts
// set title
title.value = value
```

---

# 50. Git

История коммитов должна отражать процесс разработки.

Не делать один огромный commit.

Рекомендуемый порядок:

```text
chore: initialize Nuxt project
feat: add notes domain and store
feat: implement notes list
feat: implement note editor
feat: implement todo management
feat: implement undo redo
feat: add draft persistence
feat: add confirmation modals
test: add history tests
test: add store tests
style: improve responsive UI
chore: add Docker configuration
```

Названия могут отличаться.

---

# 51. Docker

В репозитории обязательно:

```text
Dockerfile
docker-compose.yaml
```

Команда:

```bash
docker-compose up
```

должна запускать рабочую копию приложения.

Проверить:

```bash
docker-compose up --build
```

и убедиться, что приложение доступно локально.

---

# 52. Final Validation

Перед завершением работы AI agent обязан проверить:

### Build

```bash
npm run build
```

### Tests

```bash
npm run test
```

или соответствующую Vitest-команду.

### Typecheck

```bash
npm run typecheck
```

если script существует.

### Lint

```bash
npm run lint
```

если подключён ESLint.

### Docker

```bash
docker-compose up --build
```

---

# 53. Manual QA Checklist

Проверить вручную:

## Notes

- [ ] список заметок отображается;
- [ ] создание заметки работает;
- [ ] редактирование работает;
- [ ] удаление требует подтверждения;
- [ ] Todo preview не интерактивен.

## Editor

- [ ] title редактируется;
- [ ] Todo добавляется;
- [ ] Todo удаляется;
- [ ] Todo редактируется;
- [ ] checkbox работает;
- [ ] Save работает;
- [ ] Cancel работает;
- [ ] Delete работает.

## History

- [ ] Ctrl/Cmd+Z;
- [ ] Ctrl/Cmd+Shift+Z;
- [ ] undo;
- [ ] redo;
- [ ] redo очищается после нового изменения;
- [ ] максимум 50 операций;
- [ ] текст группируется.

## Persistence

- [ ] данные переживают reload;
- [ ] draft переживает reload;
- [ ] предлагается восстановить draft;
- [ ] draft можно discard.

## Edge cases

- [ ] несуществующая заметка;
- [ ] пустой title;
- [ ] пустой Todo;
- [ ] удаление заметки в другой вкладке;
- [ ] повреждённый storage.

## Accessibility

- [ ] modal focus trap;
- [ ] Escape;
- [ ] Tab;
- [ ] Shift+Tab;
- [ ] Enter;
- [ ] focus restoration;
- [ ] keyboard navigation.

## Responsive

- [ ] desktop;
- [ ] tablet;
- [ ] mobile.

---

# 54. Definition of Done

Задача считается завершённой только если:

- Nuxt SPA работает;
- существует ровно две страницы приложения;
- UI написан без UI-библиотек;
- SCSS/SASS используется для стилизации;
- state management реализован;
- persistence реализован вручную;
- schema version присутствует;
- draft recovery реализован;
- undo/redo реализован вручную;
- history не хранит 50 полных snapshots;
- history ограничена 50 операциями;
- text changes группируются;
- redo branch очищается после нового изменения;
- Save/Cancel очищают history;
- confirmation dialogs реализованы собственным modal;
- modal имеет focus trap;
- Escape и keyboard navigation работают;
- Ctrl/Cmd+Z и Ctrl/Cmd+Shift+Z работают;
- native text undo не сломан;
- edge cases обработаны;
- Vitest tests написаны для history и store;
- приложение адаптивно;
- TypeScript strict включён;
- Dockerfile существует;
- docker-compose.yaml существует;
- `docker-compose up` запускает приложение;
- проект имеет осмысленную историю Git-коммитов.

---

# 55. Agent Development Rules

Во время разработки:

1. Сначала изучи существующую структуру проекта.
2. Не переписывай существующий код без необходимости.
3. Перед изменением архитектуры проверь, нет ли уже подходящего composable/store/utility.
4. Не добавляй зависимость, если задача решается стандартными средствами Vue/Nuxt.
5. Не устанавливай UI-библиотеки.
6. Не устанавливай undo/redo библиотеки.
7. Не устанавливай persistence plugins.
8. Все новые зависимости должны иметь обоснование.
9. После каждого крупного этапа запускай тесты/typecheck.
10. Не считать задачу завершённой, пока не выполнен Definition of Done.

---

# 56. Implementation Priority

Если приходится выбирать между красивым UI и корректной логикой:

```text
business logic > data integrity > accessibility > tests > responsive UI > visual polish
```

Особое внимание уделить:

```text
Undo/Redo
Draft Recovery
Persistence
Concurrent deletion
Keyboard handling
```

Именно эти части являются наиболее важными техническими аспектами задания.

---

# 57. Do Not Overengineer

Не создавать:

- backend;
- API;
- authentication;
- сложную DI-систему;
- event bus;
- глобальную архитектуру enterprise-level;
- полноценный CRDT;
- сложную realtime synchronization;
- ненужные библиотеки.

Приложение должно оставаться небольшим и понятным.

Цель — показать качественную frontend-разработку, а не количество абстракций.

---

# 58. Source of Truth

Данная спецификация основана на предоставленном техническом задании.

Если между этой спецификацией и исходным ТЗ возникает противоречие, приоритет имеет исходное ТЗ.

Если поведение не описано:

1. выбрать простой UX;
2. сохранить data integrity;
3. не усложнять архитектуру;
4. обеспечить тестируемость;
5. документировать важное архитектурное решение.

# End of Specification