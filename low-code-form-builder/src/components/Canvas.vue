<script setup>
import { state, dropAt, endDrag } from '../store/builder'
import CanvasNode from './CanvasNode.vue'

function onOver(e) {
  if (!state.dragging) return
  e.preventDefault()
  state.over = { id: '__root', pos: 'in' }
}
function onDrop(e) {
  if (!state.dragging) return
  e.preventDefault()
  dropAt(null, -1)
}
</script>

<template>
  <main class="stage" @click="state.selectedId = null">
    <div class="sheet" :class="[state.device, { 'ov-in': state.over.id === '__root' }]" @dragover="onOver" @drop="onDrop" @dragend="endDrag">
      <input v-model="state.form.title" class="title-in" aria-label="表单标题" @input="state.dirty = true" />
      <input v-model="state.form.description" class="desc-in" placeholder="表单描述（可选）" aria-label="表单描述" @input="state.dirty = true" />
      <div class="cgrid root">
        <CanvasNode v-for="n in state.form.children" :key="n.id" :node="n" />
        <div v-if="!state.form.children.length" class="empty big">从左侧拖入组件，或点击组件开始搭建</div>
      </div>
      <div class="foot">
        <button class="btn p" disabled>{{ state.form.settings.submitText }}</button>
        <button class="btn" disabled>重置</button>
      </div>
    </div>
  </main>
</template>
