# Заметки

SPA на Nuxt 4: список заметок и редактор с ручными undo/redo, черновиками и localStorage.

## Требования

- Node.js 22+ (в Docker используется Node 24)
- npm

## Локальный запуск

```bash
npm install
npm run dev
```

Приложение: http://localhost:3000

## Production preview

```bash
npm run generate
npx serve .output/public -s
```

```bash
npm run test
npm run typecheck
npm run lint
npm run format:check
npm run generate
```

## Docker

```bash
docker compose up --build
```

Приложение: http://localhost:3000

## Возможности

- Две страницы: `/` и `/notes/:id`
- Создание, редактирование и удаление заметок
- Undo/Redo операций (не снапшотов), лимит 50, группировка ввода
- Черновик переживает reload, восстановление только после подтверждения
- Собственные модальные окна с focus trap и Escape
