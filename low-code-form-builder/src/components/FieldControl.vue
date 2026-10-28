<script setup>
import { computed } from 'vue'

const props = defineProps({ node: Object, modelValue: null, disabled: Boolean })
const emit = defineEmits(['update:modelValue'])

const p = computed(() => props.node.props)
const off = computed(() => props.disabled || p.value.readonly)
const val = computed({
  get: () => props.modelValue ?? '',
  set: (v) => emit('update:modelValue', v),
})
const arr = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))
const opts = computed(() => p.value.options || [])

function toggle(o) {
  const next = arr.value.includes(o) ? arr.value.filter((x) => x !== o) : [...arr.value, o]
  emit('update:modelValue', next)
}
function onFile(e) { emit('update:modelValue', [...e.target.files].map((f) => f.name)) }
</script>

<template>
  <input v-if="node.type === 'input'" v-model="val" class="ctl" :placeholder="p.placeholder" :disabled="off" />
  <textarea v-else-if="node.type === 'textarea'" v-model="val" class="ctl ta" rows="3" :placeholder="p.placeholder" :disabled="off"></textarea>
  <input v-else-if="node.type === 'number'" v-model.number="val" type="number" class="ctl" :placeholder="p.placeholder" :min="p.min" :max="p.max" :disabled="off" />
  <select v-else-if="node.type === 'select'" v-model="val" class="ctl" :disabled="off">
    <option value="" disabled>{{ p.placeholder || '请选择' }}</option>
    <option v-for="o in opts" :key="o" :value="o">{{ o }}</option>
  </select>
  <div v-else-if="node.type === 'radio'" class="opts">
    <label v-for="o in opts" :key="o"><input v-model="val" type="radio" :name="node.id" :value="o" :disabled="off" />{{ o }}</label>
  </div>
  <div v-else-if="node.type === 'checkbox'" class="opts">
    <label v-for="o in opts" :key="o"><input type="checkbox" :checked="arr.includes(o)" :disabled="off" @change="toggle(o)" />{{ o }}</label>
  </div>
  <button v-else-if="node.type === 'switch'" type="button" class="sw" :class="{ on: !!modelValue }" role="switch"
    :aria-checked="!!modelValue" :aria-label="p.label" :disabled="off" @click="emit('update:modelValue', !modelValue)"></button>
  <input v-else-if="node.type === 'date'" v-model="val" type="date" class="ctl" :disabled="off" />
  <label v-else-if="node.type === 'upload'" class="ctl upload">
    <input type="file" multiple hidden :disabled="off" @change="onFile" />
    <span>{{ arr.length ? arr.join('、') : '点击上传文件' }}</span><span aria-hidden="true">↑</span>
  </label>
  <div v-else-if="node.type === 'rate'" class="rate">
    <button v-for="n in Number(p.max) || 5" :key="n" type="button" :class="{ on: n <= (modelValue || 0) }"
      :aria-label="`${n} 星`" :disabled="off" @click="emit('update:modelValue', modelValue === n ? 0 : n)">★</button>
  </div>
</template>
