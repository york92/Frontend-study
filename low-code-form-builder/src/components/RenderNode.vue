<script setup>
import { computed } from 'vue'
import { isVisible } from '../schema/logic'
import FieldBox from './FieldBox.vue'
import FieldControl from './FieldControl.vue'

const props = defineProps({ node: Object, model: Object, errors: Object })
const visible = computed(() => isVisible(props.node, props.model))
</script>

<template>
  <div v-if="visible" class="rnode" :style="{ gridColumn: 'span ' + (node.props.width || 12) }">
    <template v-if="node.children">
      <div v-if="node.type === 'card'" class="rcard">
        <div class="card-h">{{ node.props.title }}</div>
        <div class="cgrid"><RenderNode v-for="c in node.children" :key="c.id" :node="c" :model="model" :errors="errors" /></div>
      </div>
      <div v-else class="cgrid"><RenderNode v-for="c in node.children" :key="c.id" :node="c" :model="model" :errors="errors" /></div>
    </template>
    <hr v-else-if="node.type === 'divider'" class="hr" />
    <FieldBox v-else :node="node" :error="errors[node.props.field]">
      <FieldControl v-model="model[node.props.field]" :node="node" />
    </FieldBox>
  </div>
</template>
