<script setup>
import { reactive, ref, watch } from 'vue'
import { initModel, validate, collect } from '../schema/logic'
import { submitForm } from '../api'
import { toast } from '../store/builder'
import RenderNode from './RenderNode.vue'

const props = defineProps({ form: Object, formId: String })
const model = reactive({})
const errors = ref({})
const result = ref(null)
const busy = ref(false)

function reset() {
  Object.keys(model).forEach((k) => delete model[k])
  initModel(props.form.children, model)
  errors.value = {}
  result.value = null
}
watch(() => props.form, reset, { immediate: true })

async function onSubmit() {
  errors.value = validate(props.form.children, model)
  if (Object.keys(errors.value).length) return toast('请检查标红的字段')
  busy.value = true
  try {
    const rec = await submitForm(props.formId, collect(props.form.children, model))
    result.value = rec
    toast(props.form.settings.successMessage || '提交成功')
  } finally { busy.value = false }
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit" @reset.prevent="reset">
    <h2 class="title">{{ form.title }}</h2>
    <p v-if="form.description" class="muted">{{ form.description }}</p>
    <div class="cgrid root">
      <RenderNode v-for="n in form.children" :key="n.id" :node="n" :model="model" :errors="errors" />
    </div>
    <div class="foot">
      <button class="btn p" type="submit" :disabled="busy">{{ form.settings.submitText }}</button>
      <button class="btn" type="reset">重置</button>
    </div>
    <div v-if="result" class="result">
      <b>Mock 后端已收到（{{ result.id }}）：</b>
      <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
    </div>
  </form>
</template>
