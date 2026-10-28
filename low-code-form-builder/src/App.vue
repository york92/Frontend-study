<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { state, init, undo, redo, save, removeNode } from './store/builder'
import Toolbar from './components/Toolbar.vue'
import ComponentPanel from './components/ComponentPanel.vue'
import Canvas from './components/Canvas.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import FormRenderer from './components/FormRenderer.vue'
import JsonView from './components/JsonView.vue'

function onKey(e) {
  const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)
  const mod = e.ctrlKey || e.metaKey
  const k = e.key.toLowerCase()
  if (mod && k === 's') { e.preventDefault(); save() }
  else if (mod && k === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo() }
  else if (!typing && state.mode === 'edit' && state.selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
    e.preventDefault(); removeNode(state.selectedId)
  }
}
onMounted(() => { init(); window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="app">
    <Toolbar />
    <div v-if="state.loading" class="loading">加载中…</div>
    <div v-else class="body">
      <template v-if="state.mode === 'edit'">
        <ComponentPanel />
        <Canvas />
        <ConfigPanel />
      </template>
      <div v-else-if="state.mode === 'preview'" class="stage">
        <div class="sheet" :class="state.device">
          <FormRenderer :form="state.form" :form-id="state.formId" />
        </div>
      </div>
      <JsonView v-else />
    </div>
    <div v-if="state.toast" class="toast">{{ state.toast }}</div>
  </div>
</template>
