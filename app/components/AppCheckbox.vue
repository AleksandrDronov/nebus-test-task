<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  disabled?: boolean
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const handleChange = (event: Event): void => {
  if (props.disabled) {
    event.preventDefault()
    return
  }

  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<template>
  <input
    class="app-checkbox"
    type="checkbox"
    :checked="modelValue"
    :disabled="disabled"
    :aria-label="label"
    @change="handleChange"
  />
</template>

<style scoped lang="scss">
.app-checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.app-checkbox:disabled {
  cursor: default;
}
</style>
