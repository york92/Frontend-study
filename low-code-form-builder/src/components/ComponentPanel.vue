<script setup>
import { GROUPS, REGISTRY } from '../schema/registry'
import { startDrag, endDrag, addToSelection } from '../store/builder'

const items = (g) => Object.values(REGISTRY).filter((d) => d.group === g)
function onDragStart(e, type) {
  e.dataTransfer.setData('text/plain', type)
  e.dataTransfer.effectAllowed = 'copy'
  startDrag({ kind: 'new', type })
}
</script>

<template>
  <aside class="side">
    <div class="side-h">组件库</div>
    <div class="muted small">拖拽到画布，或点击添加到当前选中位置</div>
    <template v-for="g in GROUPS" :key="g.key">
      <div class="grp">{{ g.label }}</div>
      <div class="pgrid">
        <button v-for="d in items(g.key)" :key="d.type" class="cmp" draggable="true"
          @dragstart="onDragStart($event, d.type)" @dragend="endDrag" @click="addToSelection(d.type)">
          <i>{{ d.icon }}</i>{{ d.label }}
        </button>
      </div>
    </template>
  </aside>
</template>
