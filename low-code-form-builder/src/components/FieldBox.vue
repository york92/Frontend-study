<script setup>
import { computed } from 'vue'
import { state } from '../store/builder'

defineProps({ node: Object, error: String })
const left = computed(() => state.form.settings?.labelPosition === 'left')
</script>

<template>
  <div class="fbox" :class="{ left, bad: !!error }">
    <label class="flabel"><span v-if="node.props.required" class="req">*</span>{{ node.props.label }}</label>
    <div class="fbody">
      <slot />
      <div v-if="error" class="ferr" role="alert">{{ error }}</div>
    </div>
  </div>
</template>
