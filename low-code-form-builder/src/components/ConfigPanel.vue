<script setup>
import { ref, computed } from 'vue'
import { REGISTRY } from '../schema/registry'
import { state, find, allFields, updateProp } from '../store/builder'

const tab = ref('field')
const node = computed(() => (state.selectedId ? find(state.selectedId)?.node : null))
const def = computed(() => node.value && REGISTRY[node.value.type])
const p = computed(() => node.value?.props || {})
const others = computed(() => allFields().filter((f) => f.id !== node.value?.id))

const F = {
  label: { t: 'text', l: '标签' }, field: { t: 'text', l: '字段标识' }, title: { t: 'text', l: '标题' },
  placeholder: { t: 'text', l: '占位提示' }, defaultValue: { t: 'text', l: '默认值' },
  min: { t: 'number', l: '最小值' }, max: { t: 'number', l: '最大值' },
  width: { t: 'seg', l: '栅格宽度' }, options: { t: 'lines', l: '选项（每行一个，失焦生效）' },
  required: { t: 'switch', l: '必填' }, readonly: { t: 'switch', l: '只读' },
  rules: { t: 'rules', l: '校验规则' }, visibleWhen: { t: 'cond', l: '显隐条件' },
}
const WIDTHS = [[4, '1/3'], [6, '1/2'], [12, '整行']]
const RULE_OPTS = [['', '无'], ['phone', '手机号格式'], ['email', '邮箱格式'], ['url', '网址格式']]

const set = (k, v) => updateProp(node.value.id, k, v)
const setNum = (k, v) => set(k, v === '' ? '' : Number(v))
function setCond(part, v) {
  const cur = { field: '', value: '', ...(p.value.visibleWhen || {}) }
  cur[part] = v
  set('visibleWhen', cur.field ? cur : null)
}
const setForm = (k, v) => { state.form[k] = v; state.dirty = true }
const setSetting = (k, v) => { state.form.settings[k] = v; state.dirty = true }
</script>

<template>
  <aside class="cfg">
    <div class="tabs">
      <button v-for="[k, l] in [['field', '字段属性'], ['form', '表单属性'], ['events', '事件']]" :key="k" :class="{ on: tab === k }" @click="tab = k">{{ l }}</button>
    </div>

    <template v-if="tab === 'field'">
      <div v-if="!node" class="muted">在画布中选中一个组件以配置其属性。</div>
      <template v-else>
        <div class="muted cf">已选中：{{ def.label }}</div>
        <template v-for="k in def.config" :key="node.id + k">
          <div v-if="F[k].t === 'switch'" class="line">
            <span>{{ F[k].l }}</span>
            <button type="button" class="sw" :class="{ on: !!p[k] }" role="switch" :aria-checked="!!p[k]" :aria-label="F[k].l" @click="set(k, !p[k])"></button>
          </div>
          <div v-else class="cf">
            <label class="lab">{{ F[k].l }}</label>
            <input v-if="F[k].t === 'text'" class="ctl" :value="p[k] ?? ''" @input="set(k, $event.target.value)" />
            <input v-else-if="F[k].t === 'number'" type="number" class="ctl" :value="p[k] ?? ''" @input="setNum(k, $event.target.value)" />
            <div v-else-if="F[k].t === 'seg'" class="sg">
              <button v-for="[w, l] in WIDTHS" :key="w" :class="{ on: p.width === w }" @click="set('width', w)">{{ l }}</button>
            </div>
            <textarea v-else-if="F[k].t === 'lines'" class="ctl ta" rows="4" :value="(p.options || []).join('\n')"
              @change="set('options', $event.target.value.split('\n').map((s) => s.trim()).filter(Boolean))"></textarea>
            <select v-else-if="F[k].t === 'rules'" class="ctl" :value="p.rules || ''" @change="set('rules', $event.target.value)">
              <option v-for="[v, l] in RULE_OPTS" :key="v" :value="v">{{ l }}</option>
            </select>
            <template v-else-if="F[k].t === 'cond'">
              <select class="ctl" :value="p.visibleWhen?.field || ''" @change="setCond('field', $event.target.value)">
                <option value="">始终显示</option>
                <option v-for="f in others" :key="f.id" :value="f.field">{{ f.label }}（{{ f.field }}）</option>
              </select>
              <input class="ctl" style="margin-top: 6px" placeholder="当其值等于…（开关填 true / false）"
                :value="p.visibleWhen?.value ?? ''" :disabled="!p.visibleWhen" @input="setCond('value', $event.target.value)" />
            </template>
          </div>
        </template>
      </template>
    </template>

    <template v-else-if="tab === 'form'">
      <div class="cf"><label class="lab">表单标题</label><input class="ctl" :value="state.form.title" @input="setForm('title', $event.target.value)" /></div>
      <div class="cf"><label class="lab">表单描述</label><textarea class="ctl ta" rows="3" :value="state.form.description" @input="setForm('description', $event.target.value)"></textarea></div>
      <div class="cf"><label class="lab">标签位置</label>
        <div class="sg">
          <button :class="{ on: state.form.settings.labelPosition === 'top' }" @click="setSetting('labelPosition', 'top')">顶部</button>
          <button :class="{ on: state.form.settings.labelPosition === 'left' }" @click="setSetting('labelPosition', 'left')">左侧</button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="cf"><label class="lab">提交按钮文案</label><input class="ctl" :value="state.form.settings.submitText" @input="setSetting('submitText', $event.target.value)" /></div>
      <div class="cf"><label class="lab">提交成功提示</label><input class="ctl" :value="state.form.settings.successMessage" @input="setSetting('successMessage', $event.target.value)" /></div>
      <div class="cf"><label class="lab">提交接口（Mock）</label><div class="ctl ro">POST /api/forms/{{ state.formId }}/submissions</div></div>
      <div class="muted small">预览模式下提交会调用 src/api 的 submitForm，数据写入 localStorage。</div>
    </template>
  </aside>
</template>
