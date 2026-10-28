/**
 * Mock 后端：数据源为 public/mockData.json。
 * 浏览器无法写文件，因此首次读取后写入 localStorage，之后的增删改都落在 localStorage。
 * 接入真实后端时，保持下列函数签名不变，把内部换成 fetch/axios 请求即可。
 */
const KEY = 'lowcode-form-builder:mock-db'
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const clone = (o) => JSON.parse(JSON.stringify(o))
let db = null

const persist = () => localStorage.setItem(KEY, JSON.stringify(db))

async function load() {
  if (db) return db
  const saved = localStorage.getItem(KEY)
  if (saved) return (db = JSON.parse(saved))
  const res = await fetch(`${import.meta.env.BASE_URL}mockData.json`)
  db = await res.json()
  persist()
  return db
}

const pick = ({ id, title, status, updatedAt }) => ({ id, title, status, updatedAt })

export async function listForms() {
  await delay()
  return (await load()).forms.map(pick)
}

export async function getForm(id) {
  await delay()
  const f = (await load()).forms.find((x) => x.id === id)
  if (!f) throw new Error('表单不存在')
  return clone(f)
}

export async function createForm() {
  await delay()
  const d = await load()
  const id = 'form_' + Date.now().toString(36)
  const form = {
    id, title: '未命名表单', status: 'draft', updatedAt: new Date().toISOString(),
    schema: {
      id, title: '未命名表单', description: '',
      settings: { labelPosition: 'top', submitText: '提交', successMessage: '提交成功' },
      children: [],
    },
  }
  d.forms.unshift(form)
  persist()
  return clone(form)
}

export async function saveForm({ id, schema }) {
  await delay()
  const f = (await load()).forms.find((x) => x.id === id)
  f.schema = clone(schema)
  f.title = schema.title
  f.updatedAt = new Date().toISOString()
  persist()
  return clone(f)
}

export async function publishForm(id) {
  await delay()
  const f = (await load()).forms.find((x) => x.id === id)
  f.status = 'published'
  persist()
  return clone(f)
}

export async function submitForm(formId, data) {
  await delay()
  const d = await load()
  const rec = { id: 'sub_' + Date.now().toString(36), formId, data: clone(data), createdAt: new Date().toISOString() }
  d.submissions.push(rec)
  persist()
  return rec
}

export async function listSubmissions(formId) {
  await delay()
  return clone((await load()).submissions.filter((s) => s.formId === formId))
}

export function resetMock() {
  localStorage.removeItem(KEY)
  db = null
}
