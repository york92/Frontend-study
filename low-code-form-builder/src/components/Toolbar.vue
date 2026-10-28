<script setup>
import { state, openForm, createForm, undo, redo, save, publish, toast } from '../store/builder'
import { resetMock } from '../api'

async function onSwitch(e) {
  if (state.dirty && !confirm('当前有未保存的修改，确认切换表单？')) { e.target.value = state.formId; return }
  await openForm(e.target.value)
}
async function onCreate() {
  if (state.dirty && !confirm('当前有未保存的修改，确认新建？')) return
  await createForm()
}
function onReset() {
  if (!confirm('将清空 localStorage 中的 Mock 数据并恢复为 mockData.json，确认？')) return
  resetMock(); location.reload()
}
</script>

<template>
  <header class="top">
    <div class="logo"><i></i>表单搭建器</div>
    <select class="ctl form-sel" :value="state.formId" @change="onSwitch" aria-label="选择表单">
      <option v-for="f in state.forms" :key="f.id" :value="f.id">{{ f.title }}{{ f.status === 'published' ? ' · 已发布' : '' }}</option>
    </select>
    <button class="btn" @click="onCreate">新建</button>
    <div class="seg">
      <button v-for="[k, l] in [['edit', '编辑'], ['preview', '预览'], ['json', 'JSON']]" :key="k" :class="{ on: state.mode === k }" @click="state.mode = k">{{ l }}</button>
    </div>
    <div class="sp"></div>
    <div class="seg" v-if="state.mode !== 'json'">
      <button v-for="[k, l] in [['desktop', '桌面'], ['tablet', '平板'], ['mobile', '手机']]" :key="k" :class="{ on: state.device === k }" @click="state.device = k">{{ l }}</button>
    </div>
    <span v-if="state.dirty" class="dirty">未保存</span>
    <button class="btn" :disabled="!state.undoStack.length" @click="undo">撤销</button>
    <button class="btn" :disabled="!state.redoStack.length" @click="redo">重做</button>
    <button class="btn" @click="save">保存</button>
    <button class="btn p" @click="publish">发布</button>
    <button class="btn ghost" title="恢复 mockData.json 初始数据" @click="onReset">重置 Mock</button>
  </header>
</template>
