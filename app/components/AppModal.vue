<script setup lang="ts">
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const props = defineProps<{
  open: boolean
  title: string
  titleId?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const dialogRef = ref<HTMLElement | null>(null)
const generatedTitleId = useId()
const titleDomId = computed(() => props.titleId ?? generatedTitleId)
let previousFocus: HTMLElement | null = null

const getFocusable = (): HTMLElement[] => {
  if (!dialogRef.value) {
    return []
  }

  return [...dialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter((element) => {
    return element.tabIndex !== -1 && !element.hasAttribute('disabled')
  })
}

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key !== 'Tab' || !dialogRef.value) {
    return
  }

  const nodes = getFocusable()

  if (nodes.length === 0) {
    event.preventDefault()
    return
  }

  const first = nodes[0]
  const last = nodes[nodes.length - 1]

  if (!first || !last) {
    return
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
    return
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      await nextTick()
      const autofocus = dialogRef.value?.querySelector<HTMLElement>('[data-autofocus]')
      const fallback = getFocusable()[0]
      ;(autofocus ?? fallback)?.focus()
      return
    }

    previousFocus?.focus()
    previousFocus = null
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="app-modal"
    >
      <div
        class="app-modal__backdrop"
        @click="emit('close')"
      />
      <div
        ref="dialogRef"
        class="app-modal__dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleDomId"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <h2
          :id="titleDomId"
          class="app-modal__title"
        >
          {{ title }}
        </h2>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.app-modal {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 16px;
}

.app-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(28, 22, 16, 0.42);
}

.app-modal__dialog {
  position: relative;
  width: min(440px, 100%);
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow);
}

.app-modal__title {
  margin: 0 0 12px;
  font-size: 1.25rem;
}
</style>
