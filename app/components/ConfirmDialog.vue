<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <AppModal :open :title @close="emit('cancel')">
    <p class="confirm-dialog__message">
      {{ message }}
    </p>
    <div class="confirm-dialog__actions">
      <AppButton variant="secondary" data-autofocus @click="emit('cancel')">
        {{ cancelLabel }}
      </AppButton>
      <AppButton :variant="danger ? 'danger' : 'primary'" @click="emit('confirm')">
        {{ confirmLabel }}
      </AppButton>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.confirm-dialog__message {
  margin: 0 0 20px;
  color: var(--color-muted);
  line-height: 1.5;
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
