<script setup lang="ts">
const { isOpen, title, message, confirmLabel, cancelLabel, danger, handleConfirm, handleCancel } =
  useConfirmDialog()
</script>

<template>
  <ConfirmDialog
    :open="isOpen"
    :title="title"
    :message="message"
    :confirm-label="confirmLabel"
    :cancel-label="cancelLabel"
    :danger="danger"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>
