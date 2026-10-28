import { reactive } from 'vue'
import { REGISTRY, createNode, uid } from '../schema/registry'
import * as api from '../api'

const blankSettings = () => ({ labelPosition: 'top', submitText: '提交', successMessage: '提交成功' })
const blank = () => ({ id: uid('form'), title: '未命名表单', description: '', settings: blankSettings(), children: [] })

export const state = reactive({
  loading: true,
  forms: [], formId: null, meta: { status: 'draft', updatedAt: '' },
  form: blank(),
  selectedId: null,
  mode: 'edit', // edit | preview | json
  device: 'desktop', // desktop | tablet | mobile
  dragging: null, // { kind: 'new', type } | { kind: 'move', id }
  over: { id: null, pos: null },
  undoStack: [], redoStack: [],
  dirty: false, toast: '',
})

/* ---------- 树查找 ---------- */
function walk(list, parent, fn) {
  for (let i = 0; i < list.length; i++) {
    if (fn(list[i], parent, i, list)) return true
    if (list[i].children && walk(list[i].children, list[i], fn)) return true
  }
  return false
}
export function find(id) {
  let r = null
  walk(state.form.children, null, (node, parent, index, list) => {
    if (node.id === id) { r = { node, parent, index, list }; return true }
  })
  return r
}
export function allFields() {
  const out = []
  walk(state.form.children, null, (n) => { if (!n.children && n.props.field) out.push({ id: n.id, field: n.props.field, label: n.props.label }) })
  return out
}
const isDescendant = (node, id) => !!node.children && node.children.some((c) => c.id === id || isDescendant(c, id))
function containerOf(parentId) {
  if (!parentId) return { list: state.form.children, childW: 12 }
  const { node } = find(parentId)
  return { list: node.children, childW: REGISTRY[node.type].childW }
}

/* ---------- 历史记录 ---------- */
function snapshot() {
  state.undoStack.push(JSON.stringify(state.form))
  if (state.undoStack.length > 50) state.undoStack.shift()
  state.redoStack = []
  state.dirty = true
}
export function undo() {
  if (!state.undoStack.length) return
  state.redoStack.push(JSON.stringify(state.form))
  state.form = JSON.parse(state.undoStack.pop())
  state.selectedId = null; state.dirty = true
}
export function redo() {
  if (!state.redoStack.length) return
  state.undoStack.push(JSON.stringify(state.form))
  state.form = JSON.parse(state.redoStack.pop())
  state.selectedId = null; state.dirty = true
}

/* ---------- 节点操作 ---------- */
function place(node, parentId, index) {
  const { list, childW } = containerOf(parentId)
  node.props.width = childW
  list.splice(index < 0 ? list.length : index, 0, node)
}
export function addNode(type, parentId = null, index = -1) {
  snapshot()
  const node = createNode(type)
  place(node, parentId, index)
  state.selectedId = node.id
}
export function addToSelection(type) {
  const s = state.selectedId && find(state.selectedId)
  if (!s) return addNode(type)
  if (REGISTRY[s.node.type].container) return addNode(type, s.node.id)
  addNode(type, s.parent?.id ?? null, s.index + 1)
}
export function moveNode(id, parentId, index) {
  const src = find(id)
  if (!src || id === parentId || (parentId && isDescendant(src.node, parentId))) return
  const target = containerOf(parentId).list
  snapshot()
  src.list.splice(src.index, 1)
  let idx = index
  if (idx >= 0 && target === src.list && src.index < idx) idx--
  place(src.node, parentId, idx)
  state.selectedId = id
}
export function removeNode(id) {
  const s = find(id)
  if (!s) return
  snapshot()
  s.list.splice(s.index, 1)
  if (state.selectedId === id || (s.node.children && isDescendant(s.node, state.selectedId))) state.selectedId = null
}
export function duplicateNode(id) {
  const s = find(id)
  if (!s) return
  snapshot()
  const copy = JSON.parse(JSON.stringify(s.node))
  const reid = (n) => {
    n.id = uid()
    if (n.props.field) n.props.field = `${n.props.field}_${Math.random().toString(36).slice(2, 5)}`
    n.children?.forEach(reid)
  }
  reid(copy)
  s.list.splice(s.index + 1, 0, copy)
  state.selectedId = copy.id
}

let lastEdit = { id: '', key: '', t: 0 }
export function updateProp(id, key, value) {
  const s = find(id)
  if (!s) return
  const now = Date.now()
  if (lastEdit.id !== id || lastEdit.key !== key || now - lastEdit.t > 1000) snapshot()
  lastEdit = { id, key, t: now }
  s.node.props[key] = value
  state.dirty = true
}

/* ---------- 拖拽 ---------- */
export const startDrag = (d) => { state.dragging = d }
export function endDrag() { state.dragging = null; state.over = { id: null, pos: null } }
export function dropAt(parentId, index) {
  const d = state.dragging
  if (!d) return
  d.kind === 'new' ? addNode(d.type, parentId, index) : moveNode(d.id, parentId, index)
  endDrag()
}

/* ---------- 表单级 ---------- */
let timer
export function toast(msg) {
  state.toast = msg
  clearTimeout(timer)
  timer = setTimeout(() => (state.toast = ''), 2200)
}
export function replaceForm(obj) {
  snapshot()
  obj.settings = { ...blankSettings(), ...(obj.settings || {}) }
  state.form = obj
  state.selectedId = null
}

export async function init() {
  state.forms = await api.listForms()
  await openForm(state.forms[0].id)
  state.loading = false
}
export async function openForm(id) {
  const r = await api.getForm(id)
  r.schema.settings = { ...blankSettings(), ...(r.schema.settings || {}) }
  state.formId = r.id
  state.meta = { status: r.status, updatedAt: r.updatedAt }
  state.form = r.schema
  state.selectedId = null
  state.undoStack = []; state.redoStack = []
  state.dirty = false
}
export async function createForm() {
  const r = await api.createForm()
  state.forms = await api.listForms()
  await openForm(r.id)
}
export async function save() {
  const r = await api.saveForm({ id: state.formId, schema: JSON.parse(JSON.stringify(state.form)) })
  state.meta = { status: r.status, updatedAt: r.updatedAt }
  state.forms = await api.listForms()
  state.dirty = false
  toast('已保存')
}
export async function publish() {
  await save()
  const r = await api.publishForm(state.formId)
  state.meta.status = r.status
  state.forms = await api.listForms()
  toast('已发布（Mock）')
}
