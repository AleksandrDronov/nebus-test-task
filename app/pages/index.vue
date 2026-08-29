<script setup lang="ts">
import { CREATE_NOTE_BUTTON_ID } from '~/utils/list-focus'

const { notes, handleCreate, handleDelete } = useNotesList()
</script>

<template>
  <div class="page">
    <header class="page__header">
      <h1>Все заметки</h1>
      <AppButton v-if="notes.length > 0" :id="CREATE_NOTE_BUTTON_ID" @click="handleCreate"
        >Создать заметку</AppButton
      >
    </header>

    <main>
      <EmptyState
        v-if="notes.length === 0"
        title="Пока нет заметок"
        message="Создайте первую заметку, чтобы начать список дел."
      >
        <AppButton :id="CREATE_NOTE_BUTTON_ID" @click="handleCreate">Создать заметку</AppButton>
      </EmptyState>

      <ul v-else class="notes-grid" aria-label="Список заметок">
        <li v-for="note in notes" :key="note.id">
          <NoteCard :note @remove="handleDelete(note.id)" />
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped lang="scss">
.page__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
