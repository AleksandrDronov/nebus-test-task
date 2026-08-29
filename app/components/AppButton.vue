<script setup lang="ts">
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  {
    variant: 'primary',
    disabled: false,
    type: 'button'
  }
)
</script>

<template>
  <button class="app-button" :class="`app-button--${variant}`" :type :disabled>
    <slot />
  </button>
</template>

<style scoped lang="scss">
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.app-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-button--primary {
  background: var(--color-accent);
  color: #fff;
}

.app-button--primary:hover:not(:disabled) {
  background: var(--color-accent-strong);
}

.app-button--secondary {
  background: var(--color-surface);
  border-color: var(--color-line);
  color: var(--color-ink);
}

.app-button--ghost {
  background: transparent;
  color: var(--color-ink);
}

.app-button--ghost:hover:not(:disabled) {
  background: rgba(28, 22, 16, 0.06);
}

.app-button--danger {
  background: var(--color-danger);
  color: #fff;
}

.app-button--danger:hover:not(:disabled) {
  background: var(--color-danger-strong);
}
</style>
