<script setup>
import { computed } from 'vue'
import { REGISTRY } from '../schema/registry'
import { initialValue } from '../schema/logic'
import { state, find, startDrag, endDrag, dropAt, duplicateNode, removeNode } from '../store/builder'
import FieldBox from './FieldBox.vue'
import FieldControl from './FieldControl.vue'

const props = defineProps({ node: Object })
const def = computed(() => REGISTRY[props.node.type])
const isC = computed(() => def.value.container)
const selected = computed(() => state.selectedId === props.node.id)
const over = computed(() => (state.over.id === props.node.id ? state.over.pos : null))
const inline = computed(() => (props.node.props.width || 12) < 12)

function onDragStart(e) {
  e.stopPropagation()
  e.dataTransfer.setData('text/plain', props.node.id)
  e.dataTransfer.effectAllowed = 'move'
  startDrag({ kind: 'move', id: props.node.id })
}
function onDragOver(e) {
  if (!state.dragging) return
  e.preventDefault(); e.stopPropagation()
  if (isC.value) { state.over = { id: props.node.id, pos: 'in' }; return }
  const r = e.currentTarget.getBoundingClientRect()
  const ratio = inline.value ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height
  state.over = { id: props.node.id, pos: ratio < 0.5 ? 'before' : 'after' }
}
function onDrop(e) {
  if (!state.dragging) return
  e.preventDefault(); e.stopPropagation()
  if (isC.value) return dropAt(props.node.id, -1)
  const loc = find(props.node.id)
  dropAt(loc.parent?.id ?? null, state.over.pos === 'before' ? loc.index : loc.index + 1)
}
</script>

<template>
  <div class="cnode" :class="[`t-${node.type}`, { sel: selected, cont: isC, h: inline, 'ov-in': over === 'in', 'ov-before': over === 'before', 'ov-after': over === 'after' }]"
    :style="{ gridColumn: 'span ' + (node.props.width || 12) }" draggable="true"
    @click.stop="state.selectedId = node.id" @dragstart="onDragStart" @dragend="endDrag" @dragover="onDragOver" @drop="onDrop">
    <template v-if="selected">
      <span class="tag">{{ def.label }}<template v-if="node.props.field"> · {{ node.props.field }}</template></span>
      <span class="tools">
        <button @click.stop="duplicateNode(node.id)">复制</button>
        <button @click.stop="removeNode(node.id)">删除</button>
      </span>
    </template>
    <div v-if="node.type === 'card'" class="card-h">{{ node.props.title }}</div>
    <div v-if="isC" class="cgrid">
      <CanvasNode v-for="c in node.children" :key="c.id" :node="c" />
      <div v-if="!node.children.length" class="empty">拖拽组件到此处</div>
    </div>
    <hr v-else-if="node.type === 'divider'" class="hr" />
    <FieldBox v-else :node="node">
      <FieldControl :node="node" :model-value="initialValue(node)" disabled />
    </FieldBox>
  </div>
</template>
