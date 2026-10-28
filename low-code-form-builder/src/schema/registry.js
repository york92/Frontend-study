/** 组件注册表：新增组件时在此登记，并在 FieldControl.vue 中补充渲染分支。 */
let seq = 0
const rnd = (n = 4) => Math.random().toString(36).slice(2, 2 + n)
export const uid = (p = 'n') => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}${rnd(3)}`

export const GROUPS = [
  { key: 'layout', label: '布局' },
  { key: 'basic', label: '基础控件' },
]

const BASE = ['label', 'field', 'placeholder', 'defaultValue', 'width', 'required', 'readonly', 'rules', 'visibleWhen']
const SIMPLE = ['label', 'field', 'width', 'required', 'readonly', 'visibleWhen']
const OPTS = ['label', 'field', 'options', 'defaultValue', 'width', 'required', 'readonly', 'visibleWhen']

const ctl = (type, label, icon, config = BASE, defaults = {}) => ({ type, label, icon, group: 'basic', container: false, config, defaults })
const box = (type, label, icon, childW, config, defaults = {}) => ({ type, label, icon, group: 'layout', container: true, childW, config, defaults })

export const REGISTRY = {
  row2: box('row2', '两列栅格', '2', 6, ['width', 'visibleWhen']),
  row3: box('row3', '三列栅格', '3', 4, ['width', 'visibleWhen']),
  card: box('card', '分组卡片', '卡', 12, ['title', 'width', 'visibleWhen'], { title: '分组标题' }),
  divider: { type: 'divider', label: '分割线', icon: '—', group: 'layout', container: false, config: ['width', 'visibleWhen'], defaults: {} },

  input: ctl('input', '单行文本', 'T', BASE, { placeholder: '请输入' }),
  textarea: ctl('textarea', '多行文本', '¶', BASE, { placeholder: '请输入' }),
  number: ctl('number', '数字', '#', ['label', 'field', 'placeholder', 'defaultValue', 'min', 'max', 'width', 'required', 'readonly', 'visibleWhen'], { placeholder: '请输入数字' }),
  select: ctl('select', '下拉选择', '▾', ['label', 'field', 'placeholder', ...OPTS.slice(2)], { placeholder: '请选择', options: ['选项一', '选项二', '选项三'] }),
  radio: ctl('radio', '单选组', '◉', OPTS, { options: ['选项一', '选项二'] }),
  checkbox: ctl('checkbox', '多选组', '☑', ['label', 'field', 'options', 'width', 'required', 'readonly', 'visibleWhen'], { options: ['选项一', '选项二'] }),
  switch: ctl('switch', '开关', '开', SIMPLE),
  date: ctl('date', '日期', '日', SIMPLE),
  upload: ctl('upload', '文件上传', '↑', SIMPLE),
  rate: ctl('rate', '评分', '★', ['label', 'field', 'max', 'width', 'required', 'readonly', 'visibleWhen'], { max: 5 }),
}

export function createNode(type) {
  const d = REGISTRY[type]
  const props = { width: 12, ...JSON.parse(JSON.stringify(d.defaults)) }
  if (!d.container && type !== 'divider') {
    Object.assign(props, { label: d.label, field: `${type}_${rnd(4)}`, required: false, readonly: false, rules: '', visibleWhen: null })
  }
  const node = { id: uid(), type, props }
  if (d.container) node.children = []
  return node
}
