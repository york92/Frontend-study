/** 与 UI 无关的纯逻辑：初始值、显隐条件、校验、取值收集。 */
export const RULES = {
  phone: { re: /^1[3-9]\d{9}$/, msg: '请输入正确的手机号' },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: '请输入正确的邮箱' },
  url: { re: /^https?:\/\/\S+$/, msg: '请输入正确的网址' },
}

export function initialValue(node) {
  const p = node.props
  switch (node.type) {
    case 'switch': return p.defaultValue === 'true'
    case 'rate': return Number(p.defaultValue) || 0
    case 'number': return p.defaultValue === '' || p.defaultValue == null ? '' : Number(p.defaultValue)
    case 'checkbox':
    case 'upload': return []
    default: return p.defaultValue ?? ''
  }
}

export function isVisible(node, model) {
  const c = node.props.visibleWhen
  if (!c || !c.field) return true
  return String(model[c.field] ?? '') === String(c.value ?? '')
}

const isEmpty = (node, v) =>
  v === undefined || v === null || v === '' ||
  (Array.isArray(v) && !v.length) ||
  (node.type === 'rate' && v === 0) ||
  (node.type === 'switch' && v === false)

export function initModel(children, model = {}) {
  for (const n of children) {
    if (n.children) initModel(n.children, model)
    else if (n.props.field) model[n.props.field] = initialValue(n)
  }
  return model
}

export function validate(children, model, errors = {}) {
  for (const n of children) {
    if (!isVisible(n, model)) continue
    if (n.children) { validate(n.children, model, errors); continue }
    const p = n.props
    if (!p.field) continue
    const v = model[p.field]
    if (p.required && isEmpty(n, v)) errors[p.field] = `请填写${p.label}`
    else if (!isEmpty(n, v)) {
      const rule = RULES[p.rules]
      if (rule && !rule.re.test(String(v))) errors[p.field] = rule.msg
      else if (n.type === 'number' && p.min != null && p.min !== '' && v < p.min) errors[p.field] = `不能小于 ${p.min}`
      else if (n.type === 'number' && p.max != null && p.max !== '' && v > p.max) errors[p.field] = `不能大于 ${p.max}`
    }
  }
  return errors
}

export function collect(children, model, out = {}) {
  for (const n of children) {
    if (!isVisible(n, model)) continue
    if (n.children) collect(n.children, model, out)
    else if (n.props.field) out[n.props.field] = model[n.props.field]
  }
  return out
}
