<script setup>
import { ref, watch } from 'vue'
import { state, replaceForm, toast } from '../store/builder'

const text = ref('')
const err = ref('')
watch(() => state.form, () => { text.value = JSON.stringify(state.form, null, 2) }, { immediate: true, deep: true })

function apply() {
  try {
    const o = JSON.parse(text.value)
    if (!Array.isArray(o.children)) throw new Error('缺少 children 数组')
    replaceForm(o); err.value = ''; toast('已应用 Schema')
  } catch (e) { err.value = 'JSON 无效：' + e.message }
}
async function copy() { await navigator.clipboard.writeText(text.value); toast('已复制') }
function download() {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text.value], { type: 'application/json' }))
  a.download = `${state.form.title || 'form'}.json`
  a.click(); URL.revokeObjectURL(a.href)
}
</script>

<template>
  <section class="jsonv">
    <div class="jbar">
      <b>表单 Schema（可直接编辑）</b>
      <div class="sp"></div>
      <span v-if="err" class="ferr">{{ err }}</span>
      <button class="btn" @click="copy">复制</button>
      <button class="btn" @click="download">下载</button>
      <button class="btn p" @click="apply">应用到画布</button>
    </div>
    <textarea v-model="text" spellcheck="false" aria-label="Schema JSON"></textarea>
  </section>
</template>
