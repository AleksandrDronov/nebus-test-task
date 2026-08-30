<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink } from '#components'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    disabled?: boolean
    type?: 'button' | 'submit'
    to?: RouteLocationRaw
  }>(),
  {
    variant: 'primary',
    disabled: false,
    type: 'button',
    to: undefined
  }
)

const isLink = computed(() => props.to !== undefined)
const rootComponent = computed(() => (isLink.value ? NuxtLink : 'button'))

const rootAttrs = computed(() => {
  if (isLink.value) {
    return {
      to: props.to,
      'aria-disabled': props.disabled ? true : undefined,
      tabindex: props.disabled ? -1 : undefined
    }
  }

  return {
    type: props.type,
    disabled: props.disabled
  }
})

const handleClick = (event: MouseEvent) => {
  if (!isLink.value || !props.disabled) {
    return
  }

  event.preventDefault()
}
</script>

<template>
  <component
    :is="rootComponent"
    class="app-button"
    :class="`app-button--${variant}`"
    v-bind="rootAttrs"
    @click="handleClick"
  >
    <slot />
  </component>
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
  text-decoration: none;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.app-button:hover:not(:disabled):not([aria-disabled='true']) {
  transform: translateY(-1px);
}

.app-button:disabled,
.app-button[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
}

.app-button--primary {
  background: var(--color-accent);
  color: #fff;
}

.app-button--primary:hover:not(:disabled):not([aria-disabled='true']) {
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

.app-button--ghost:hover:not(:disabled):not([aria-disabled='true']) {
  background: rgba(28, 22, 16, 0.06);
}

.app-button--danger {
  background: var(--color-danger);
  color: #fff;
}

.app-button--danger:hover:not(:disabled):not([aria-disabled='true']) {
  background: var(--color-danger-strong);
}
</style>
