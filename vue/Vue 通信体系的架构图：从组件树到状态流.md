这个话题其实比“`props / emit 怎么用`”高一个层级。

真正值得掌握的不是 **Vue 有哪些通信 API**，而是：

> **不同的数据，应该沿着哪条边流动；不同的状态，应该由哪一层拥有；组件之间应该形成什么样的依赖关系。**

复杂项目里，Vue 通信体系最好不要理解成一堆孤立工具，而应该理解成一张：

**“组件树 + 状态层级 + 数据流向 + 副作用边界”架构图。**

---

# 一、先给你一张总架构图

假设一个中大型 Vue3 项目：

```text
                           App
                            │
             ┌──────────────┼──────────────┐
             │              │              │
          Layout          Router         Global
             │              │             State
      ┌──────┼──────┐       │           Pinia
      │      │      │       │              │
   Header   Main   Sidebar   │              │
      │      │      │        │              │
      │   ┌──┴──┐   │        │              │
      │   │     │   │        │              │
      │  Page   │   │        │              │
      │   │     │   │        │              │
      │ Child  Child Child   │              │
      │   │     │   │        │              │
      └───┴─────┴───┴────────┴──────────────┘
```

通信层可以进一步看成：

```text
                ┌────────────────────────┐
                │      Global State      │
                │        Pinia           │
                └───────────┬────────────┘
                            │
                   跨页面 / 跨模块
                            │
                            ▼
        ┌────────────────────────────────────┐
        │             Component Tree         │
        │                                    │
        │  Parent ──props──> Child           │
        │  Parent <─emit──── Child           │
        │                                    │
        │  Ancestor ──provide──> Descendant  │
        │  Ancestor <─inject──── Descendant  │
        │                                    │
        └────────────────────────────────────┘
                            │
                            │
                      composables
                            │
                            ▼
                 Logic / Side Effects
```

这里最关键的一点：

> **Pinia、provide/inject、props/emit、composables 并不是同一层级的替代品。**

它们解决的是不同问题。

---

# 二、先把 Vue 通信分成 6 类

实际项目里，我通常会把 Vue 中的“通信”拆成这 6 类：

| 类型        | 典型工具                        | 解决什么问题        |
| --------- | --------------------------- | ------------- |
| 父子通信      | props / emit                | 明确的父子数据流      |
| 深层组件共享    | provide / inject            | 跨层级依赖传递       |
| 全局共享状态    | Pinia                       | 跨组件、跨页面状态     |
| 逻辑复用      | composables / hooks         | 复用状态逻辑，而非单纯通信 |
| URL 状态    | Vue Router                  | 页面级、可寻址状态     |
| 浏览器/服务端边界 | localStorage / cookie / API | 持久化与外部状态      |

很多混乱，就是因为把这几类东西混成：

> “反正都能把数据传过去。”

实际上架构意义完全不一样。

---

# 三、第一原则：先问“这个状态属于谁？”

复杂 Vue 项目最重要的一句话：

> **状态管理问题，本质上首先是状态所有权问题。**

举个例子：

```vue
<Parent>
  <Child />
</Parent>
```

有个：

```js
const selectedUser = ref(null)
```

你首先不要问：

> 我应该用 Pinia 还是 provide？

而应该问：

> **这个状态到底属于谁？**

如果只有 `Parent` 和 `Child` 使用：

```text
Parent
 └── Child
```

那么：

```text
Parent owns state
      │
      │ props
      ▼
    Child
```

通常非常合理。

---

# 四、最基础的通信：props

```vue
<Child :user="user" />
```

父：

```js
const user = ref({
  name: 'Tom'
})
```

子：

```js
const props = defineProps({
  user: Object
})
```

数据流：

```text
Parent State
      │
      │ props
      ▼
   Child
```

核心特点：

> **单向数据流。**

也就是：

```text
父 → 子
```

而不是：

```text
子直接修改父状态
```

这其实是一个非常重要的架构约束。

---

# 五、为什么 Props 是 Vue 最应该优先使用的通信方式？

因为它最透明。

你看到：

```vue
<UserCard :user="user" />
```

就知道：

```text
UserCard
依赖 user
```

数据依赖关系直接存在于组件调用处。

这带来的好处：

```text
可读性
+
可追踪性
+
可测试性
+
低耦合
```

而如果换成：

```js
inject('user')
```

那么打开 `UserCard.vue`，你可能根本不知道：

> `user` 从哪来的？

所以：

> **能用 props，就不要为了省几行代码而使用全局状态或 provide/inject。**

---

# 六、emit：不是“子组件改父组件”，而是“子组件发事件”

这是一个非常关键的心智模型。

例如：

```vue
<Child @save="handleSave" />
```

子：

```js
emit('save', data)
```

数据流：

```text
Child
 │
 │ event
 ▼
Parent
```

它不是：

```text
Child
 │
 └──> 修改 Parent State
```

而是：

```text
Child
  │
  │ “save happened”
  ▼
Parent
  │
  ▼
决定怎么处理
```

也就是说：

> **emit 传递的是“发生了什么”，而不是“你应该修改哪个状态”。**

这是一个非常好的解耦方式。

---

# 七、props + emit 实际上构成一个非常优雅的闭环

例如：

```text
        Parent
          │
       props ↓
          │
        Child
          │
       emit ↑
          │
        Parent
```

具体：

```text
Parent
  │
  │ :value="count"
  ▼
Child
  │
  │ emit('update:value', newValue)
  ▼
Parent
```

Vue 3 的：

```vue
v-model
```

本质上就是把这类模式进一步封装。

例如：

```vue
<Child v-model="count" />
```

背后可以理解成：

```text
:modelValue
+
update:modelValue
```

所以 `v-model` 本质上还是：

> **props + emit 的语法糖/约定。**

---

# 八、什么时候 Props / Emit 会开始变得难受？

问题通常不是它本身不好，而是：

> **组件层级开始变深。**

例如：

```text
App
 └── Layout
      └── Main
           └── Page
                └── Panel
                     └── Form
                          └── SubmitButton
```

如果 `App` 的数据需要传给：

```text
SubmitButton
```

你可能最终写出：

```text
App
 ↓ props
Layout
 ↓ props
Main
 ↓ props
Page
 ↓ props
Panel
 ↓ props
Form
 ↓ props
SubmitButton
```

这就是：

# Props Drilling

问题非常明显：

```text
中间组件
根本不需要这个数据
```

却不得不接收、继续传递。

这时候就可以考虑：

# provide / inject

---

# 九、provide / inject：解决的是“祖先 → 后代”的依赖传递

例如：

```js
provide('theme', theme)
```

后代：

```js
const theme = inject('theme')
```

数据关系：

```text
Ancestor
   │
   │ provide
   │
   ▼
Injection Context
   │
   ├── Child
   │
   ├── GrandChild
   │
   └── DeepDescendant
         │
         ▼
       inject
```

最大价值：

> **跳过中间组件。**

也就是：

```text
A
│
├── B
│   └── C
│       └── D
│
└── E
```

A 可以直接向 D 提供依赖。

---

# 十、但 provide/inject 不等于“小型 Pinia”

这是一个特别常见的误区。

很多人看到：

```js
provide('user', user)
```

以后就想：

> 那是不是以后全项目都 provide？

不建议。

因为 provide/inject 的模型是：

> **组件树内部的上下文依赖。**

它和 Pinia 的定位不同。

可以这么理解：

```text
provide/inject
    ↓
组件树上下文

Pinia
    ↓
应用级状态容器
```

---

# 十一、什么状态适合 provide/inject？

典型是：

### UI 上下文

例如：

```text
Theme
FormContext
TableContext
ModalContext
Locale
Permission Context
```

比如一个复杂 Form：

```text
Form
 ├── FormItem
 ├── FormItem
 ├── FormItem
 └── FormItem
```

Form 可以：

```js
provide('formContext', {
  validate,
  disabled,
  layout
})
```

所有 FormItem：

```js
inject('formContext')
```

这种架构非常自然。

因为这些数据的语义是：

> **“我是这个组件子树的一部分，所以我继承这个上下文。”**

而不是：

> “我是整个应用的全局状态。”

---

# 十二、一个很实用的判断方式

问自己：

> **这个状态有没有“组件树边界”？**

如果有：

```text
<SomeProvider>
   ↓
   子树
```

很适合：

```text
provide / inject
```

如果没有，而是：

```text
页面 A
页面 B
页面 C
组件 X
组件 Y
```

都需要：

```text
同一个业务状态
```

那么更像：

```text
Pinia
```

---

# 十三、Pinia 的核心定位：应用级状态

Pinia 最适合解决：

```text
多个互不相邻的组件
+
多个页面
+
多个业务模块
```

共享同一份业务状态。

比如：

```text
User Store
Cart Store
Permission Store
Notification Store
Product Store
```

架构：

```text
                 Pinia
            ┌──────┼──────┐
            │      │      │
         Header   Page   Sidebar
            │      │      │
            └──────┼──────┘
                   │
                Components
```

这里非常重要：

> Pinia 是一个“共享状态源”，不是一个“组件通信管道”。

---

# 十四、这是很多项目架构混乱的根源

比如：

```js
// store
const modalVisible = ref(false)
```

然后任何地方：

```js
store.modalVisible = true
```

一开始非常爽。

后来你发现：

```text
A 页面改
B 页面读
C 页面监听
D 页面 reset
E 页面 watch
F 页面又修改
```

最后：

```text
modalVisible
```

变成一个：

# 全局公共变量

这就是过度使用 Pinia。

Pinia 很强，但：

> **强大的工具最容易被滥用。**

---

# 十五、一个非常重要的架构原则：能局部，就不要全局

状态范围通常可以分成：

```text
Local
  ↓
Component
  ↓
Feature / Subtree
  ↓
Page
  ↓
Application
```

对应：

```text
ref/reactive
   ↓
props/emit
   ↓
provide/inject
   ↓
route/query
   ↓
Pinia
```

当然这不是绝对的一一对应，而是一种非常实用的设计参考。

---

# 十六、Composable / Hooks 到底属于什么？

这是另一个经常被误解的东西。

例如：

```js
function useUser() {
  const user = ref(null)

  async function fetchUser() {
    ...
  }

  return {
    user,
    fetchUser
  }
}
```

很多人会认为：

> `useUser()` 是不是另一种状态管理？

不完全是。

更准确地说：

> **Composable 首先解决的是“逻辑复用与状态封装”。**

而不是：

> “组件之间怎么传数据。”

---

# 十七、Composable 和 Pinia 有一个非常关键的区别

例如：

```js
function useCounter() {
  const count = ref(0)

  return {
    count
  }
}
```

每次：

```js
useCounter()
```

可能得到：

```text
实例 A → count A
实例 B → count B
实例 C → count C
```

也就是说：

> **状态可以是实例级的。**

而 Pinia：

```js
useCounterStore()
```

获取的是同一个 store 实例语义下的共享状态。

可以粗略理解：

```text
Composable：

Component A → state A
Component B → state B


Pinia：

Component A ─┐
Component B ─┼→ Store
Component C ─┘
```

---

# 十八、但 Composable 也可以共享状态

例如：

```js
const user = ref(null)

export function useUser() {
  return {
    user
  }
}
```

注意：

```text
user
```

定义在模块顶层。

那么：

```text
Component A
      │
      ├──────┐
      │      │
Component B  │
      │      │
      └──→ shared module state
```

这样也能形成共享。

所以真正的区别不是简单的：

```text
Composable = 局部
Pinia = 全局
```

而是：

> **Pinia 提供了更正式、更结构化、可调试、可组织的应用级状态容器。**

---

# 十九、Router 其实也是 Vue 通信体系的一部分

这个很多人容易漏掉。

比如：

```text
/user/123?tab=orders
```

这里已经携带状态：

```text
userId = 123
tab = orders
```

这是一种：

# URL State

它和普通组件状态不一样。

因为它具有：

```text
可分享
可刷新
可收藏
可回退
可前进
可直接访问
```

所以：

> **凡是“应该存在于页面地址里的状态”，优先考虑 Router，而不是 Pinia。**

例如：

```text
当前筛选条件
当前 tab
分页页码
排序方式
搜索关键词
详情 ID
```

某些情况下非常适合进入 query / params。

---

# 二十、所以复杂项目里，状态其实有“生命周期”

这是理解 Vue 架构非常有帮助的一种方法。

---

## Component State

```text
组件创建
 ↓
状态创建
 ↓
组件卸载
 ↓
状态消失
```

例如：

```js
const visible = ref(false)
```

---

## Route State

```text
URL 存在
 ↓
页面状态存在
 ↓
切换路由
 ↓
状态变化
```

---

## provide/inject

```text
Provider 创建
 ↓
整个组件子树使用
 ↓
Provider 子树销毁
 ↓
依赖关系消失
```

---

## Pinia

```text
App
 ↓
Store
 ↓
多个组件 / 页面
```

生命周期通常比单个组件长。

---

# 二十一、这时候我们可以建立一张“状态分层图”

```text
                    Application State
                          │
                       Pinia
                          │
          ┌───────────────┼────────────────┐
          │               │                │
       UserStore       CartStore      PermissionStore
          │               │                │
          └───────────────┼────────────────┘
                          │
                    Feature / Page
                          │
                ┌─────────┴─────────┐
                │                   │
             provide             local state
                │                   │
                ▼                   ▼
            Component             ref()
              Tree               reactive()
                │
        ┌───────┼────────┐
        │       │        │
      props   emit    inject
        │       │        │
        └───────┼────────┘
                │
              Child
```

这张图比单纯背 API 有价值得多。

---

# 二十二、复杂项目最重要的不是“能不能通信”，而是“通信方向”

这是架构设计的核心。

理想的数据流应该尽量形成：

```text
State
  ↓
View
  ↓
Event
  ↓
State mutation
  ↓
View
```

也就是经典的：

# 单向数据流

例如：

```text
Pinia Store
     │
     ▼
Component
     │
     │ click
     ▼
Action
     │
     ▼
Store mutation
     │
     ▼
Reactive update
     │
     ▼
Component re-render
```

而不是：

```text
A
 ↕
B
 ↕
C
 ↕
D
 ↕
Store
 ↕
A
```

后者非常容易形成：

# Circular Dependency

---

# 二十三、一个成熟项目应该尽量形成“星型”而不是“网状”

糟糕结构：

```text
A ───── B
│ ╲     │
│  ╲    │
C ───── D
 ╲     ╱
   Store
```

所有组件互相知道对方。

成熟结构：

```text
             Store
           /   |   \
          /    |    \
         A     B     C
          \    |    /
           \   |   /
            Page
```

或者：

```text
Parent
  │
  ├──── props ───→ Child
  │
  ←──── emit ─────┘
```

核心思想：

> **尽量减少横向组件之间的直接耦合。**

---

# 二十四、举个真实一点的复杂场景

假设你正在做一个后台系统：

```text
App
 └── AdminLayout
      ├── Sidebar
      ├── Header
      └── Main
           └── UserPage
                ├── SearchBar
                ├── UserTable
                └── UserDialog
```

里面有：

```text
登录用户
权限
菜单
搜索条件
当前用户列表
当前选中用户
Dialog 是否打开
Table loading
```

这时候怎么分？

---

# 二十五、登录用户应该放哪里？

例如：

```text
currentUser
token
permissions
```

显然跨多个页面。

适合：

```text
Pinia
```

例如：

```text
authStore
permissionStore
```

---

# 二十六、Sidebar 菜单应该怎么办？

如果菜单和权限体系高度相关：

```text
permissionStore
```

提供基础数据。

但是：

```text
Sidebar
```

自己的展开状态：

```js
const collapsed = ref(false)
```

完全可以是本地状态。

于是：

```text
权限数据 → Pinia
Sidebar UI 状态 → local ref
```

这就是：

> **同一个功能的数据，也不一定应该全部放进同一种状态管理。**

---

# 二十七、UserPage 的搜索条件呢？

假设搜索：

```text
keyword
status
page
sort
```

如果希望：

```text
刷新后保留
复制 URL 分享
浏览器前进后退恢复
```

最好：

```text
Router Query
```

比如：

```text
/users?keyword=Tom&status=active&page=2
```

而不是全部塞进：

```text
userStore
```

---

# 二十八、UserTable 和 SearchBar 怎么通信？

它们是：

```text
UserPage
 ├── SearchBar
 └── UserTable
```

兄弟组件。

错误思路：

```text
SearchBar → UserTable
```

让兄弟直接依赖。

更自然：

```text
            UserPage
            /      \
           /        \
   SearchBar      UserTable
       │              ▲
       │ emit         │ props
       └──────→ UserPage
                    │
                  state
```

即：

```text
SearchBar
    ↓ emit
UserPage
    ↓ props
UserTable
```

这就是典型：

# 状态提升

---

# 二十九、UserDialog 怎么办？

如果只有：

```text
UserPage
 └── UserDialog
```

可以：

```text
UserPage
   │
   │ :user
   │ :visible
   ▼
UserDialog
   │
   │ emit('save')
   ▼
UserPage
```

完全没必要上 Pinia。

---

# 三十、但如果 Dialog 非常复杂呢？

例如：

```text
UserDialog
 ├── BasicInfo
 ├── RoleSelector
 ├── PermissionTree
 ├── DepartmentSelector
 └── ConfirmSection
```

大量子孙组件都需要：

```text
form
loading
validate
disabled
submit
```

这时候非常适合：

```text
UserDialog
    │
    │ provide
    ▼
 Dialog Context
    │
    ├── BasicInfo inject
    ├── RoleSelector inject
    ├── PermissionTree inject
    └── ConfirmSection inject
```

注意：

> 这种数据其实是 **Feature-local context**，不是全局状态。

所以 `provide/inject` 会比 Pinia 更漂亮。

---

# 三十一、于是一个成熟页面可能同时使用 5 种机制

例如 `UserPage`：

```text
                   Pinia
                     │
                currentUser
                     │
                     ▼
                  Page
              ┌──────┼──────┐
              │      │      │
          Router   local   context
          Query    state   provide
              │      │      │
              ▼      ▼      ▼
         SearchBar Table Dialog
              │      │      │
             emit   props   inject
```

这才是复杂 Vue 项目的正常状态。

不是：

> 一个项目只能选一种通信方式。

而是：

> **不同范围的状态使用不同的通信机制。**

---

# 三十二、这里有一个非常实用的“通信决策树”

以后你遇到一个数据：

```text
这个状态给谁用？
```

从上往下问。

### ① 只有当前组件使用？

```text
ref / reactive
```

---

### ② 父子组件共享？

```text
props / emit
```

---

### ③ 同一组件子树，跨多层？

```text
provide / inject
```

---

### ④ 兄弟组件共享，但本质上属于同一个页面？

```text
提升到共同父组件
```

然后：

```text
props / emit
```

---

### ⑤ 多个页面 / 多个 feature 都需要？

```text
Pinia
```

---

### ⑥ 应该出现在 URL 中？

```text
Vue Router
```

---

### ⑦ 主要是逻辑复用，不是共享业务状态？

```text
Composable
```

这张决策树非常实用。

---

# 三十三、还有一个经常被忽略的问题：Composable 和 Pinia 可以配合

实际上成熟项目里非常常见：

```text
API Layer
    ↓
Composable
    ↓
Pinia
    ↓
Components
```

例如：

```js
function useUserSearch() {
  const loading = ref(false)

  async function search(params) {
    ...
  }

  return {
    loading,
    search
  }
}
```

而 Pinia：

```js
const userStore = defineStore('user', {
  state: () => ({
    users: []
  })
})
```

两者可以分工：

```text
Pinia
负责：
业务共享状态

Composable
负责：
交互逻辑 / 生命周期 / API orchestration
```

当然具体项目也可以由 Store 直接承载 action。

重点不是死记“谁负责 API”，而是避免所有逻辑都塞进 Store。

---

# 三十四、一个常见的坏味道：God Store

例如：

```text
appStore
```

里面：

```text
user
menu
cart
notification
modal
table
search
dialog
theme
loading
```

最后整个应用所有东西都从：

```js
useAppStore()
```

里面拿。

这相当于：

> **把 Pinia 变成全局垃圾桶。**

成熟项目更倾向：

```text
authStore
permissionStore
cartStore
userStore
notificationStore
```

甚至进一步按业务 bounded context 拆分。

---

# 三十五、另一个坏味道：万能 provide

例如：

```js
provide('appState', {
  user,
  cart,
  menu,
  modal,
  notification,
  ...
})
```

这本质上是在：

> **自己手搓一个隐形 Store。**

而且比 Pinia 更难追踪。

provide/inject 更适合：

```text
FormContext
TableContext
ModalContext
ThemeContext
FeatureContext
```

即：

> **有明确组件边界的上下文。**

---

# 三十六、第三种坏味道：滥用 emit

例如：

```text
A
 ↓
B
 ↓
C
 ↓
D
 ↓
E
```

然后：

```text
E emit
D relay
C relay
B relay
A handle
```

一路：

```text
emit('xxx')
```

这种通常说明：

> **组件层级已经开始承担本来应该由更高层状态管理承担的职责。**

这时候应该检查：

```text
是不是状态应该提升？
是不是应该 provide/inject？
是不是应该 Pinia？
是不是应该由 Router 管理？
```

---

# 三十七、Vue3 的通信体系其实可以理解成“几种不同的图边”

这是我认为最值得建立的架构视角。

把组件看成节点：

```text
A
B
C
D
```

Vue 有几种主要“边”。

---

## 树边：Parent → Child

```text
A
│
└── B
```

通信：

```text
props
emit
```

---

## 上下文边：Ancestor → Descendant

```text
A
│
├── B
│   └── C
│       └── D
```

通信：

```text
provide / inject
```

---

## 全局状态边

```text
A ───┐
B ───┤
C ───┼──> Pinia
D ───┘
```

---

## URL 边

```text
Component
    │
    ▼
 Router
    │
    ▼
 URL
```

---

## 逻辑边

```text
Component
     │
     ▼
Composable
     │
     ├── API
     ├── browser API
     ├── timers
     └── reactive logic
```

这样就会发现：

> **Vue 通信体系其实不是“几个 API 的集合”，而是一组不同拓扑结构的数据流通道。**

---

# 三十八、这时候可以把复杂项目画成最终架构图

我比较推荐这样理解：

```text
                              Application
                                   │
                   ┌───────────────┼───────────────┐
                   │               │               │
                 Router          Pinia         App Services
                   │               │               │
             URL / Route      Global State        API
                   │               │               │
                   └───────────────┼───────────────┘
                                   │
                              Page / Feature
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                 Local State   provide/inject   Composables
                    │              │              │
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                             Component Tree
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                   props                       emit
                     │                           │
                     ▼                           │
                   Child ───────────────────────┘
```

这个架构最核心的是：

> **状态向下，事件向上；上下文横跨子树；全局状态由 Store 承载；页面状态进入 Router；可复用逻辑进入 composable。**

---

# 三十九、再进一步：不要只按“数据大小”决定通信方式

例如：

```text
theme
```

数据可能只有：

```js
'light'
```

但它可以服务 100 个组件。

所以是否全局，不是看：

```text
数据大不大
```

而应该看：

```text
作用域
生命周期
所有权
依赖关系
业务边界
```

同样：

```text
大型 form state
```

虽然很复杂，但只服务一个 Dialog。

它反而可能非常适合：

```text
local state + provide/inject
```

而不需要 Pinia。

---

# 四十、一个真正成熟的 Vue 项目，状态可以按照“作用域”分层

这是我最推荐你记住的一版：

```text
                    Global
                      │
                    Pinia
                      │
              ┌───────┴───────┐
              │               │
           Feature          Feature
              │               │
          provide          provide
              │               │
          Component        Component
              │               │
          props/emit       props/emit
              │               │
            Local           Local
```

然后：

```text
Router
```

从旁边横向穿过：

```text
                   Router
                     │
                     ├── Page
                     ├── Query
                     ├── Params
                     └── Navigation state
```

而：

```text
Composable
```

则可以贯穿多个层次：

```text
Local
  │
Feature
  │
Page
  │
Global
```

因为它更像：

> **逻辑组织方式，而非单纯状态作用域。**

---

# 四十一、最后给你一个非常实用的“架构法则”

以后设计 Vue 通信，可以遵循：

> **优先选择“最短、最显式、作用域最小”的通信路径。**

也就是：

```text
Local
  ↓
props / emit
  ↓
provide / inject
  ↓
Pinia
```

不是说层层升级，而是：

> **只有当上一层无法自然表达需求时，才进入下一层。**

例如：

```text
只有 Child 用
→ local

Parent + Child
→ props / emit

跨多层但同一 subtree
→ provide / inject

多个不相关页面共享
→ Pinia

需要 URL 可表达
→ Router

多个组件只是复用同一套逻辑
→ composable
```

---

# 四十二、最终把 Vue 通信体系浓缩成一句话

真正成熟的 Vue3 架构不是：

> “Pinia 负责全局，props 负责父子，emit 负责子父。”

这种说法太浅。

更准确的是：

> **Vue 的通信体系是在用不同的状态作用域和数据流拓扑，表达不同层次的依赖关系。**

可以最终记成：

```text
Local State
    ↓
组件内部状态

props / emit
    ↓
显式父子数据流

provide / inject
    ↓
组件子树上下文

Pinia
    ↓
跨组件 / 跨页面业务状态

Router
    ↓
可寻址的页面状态

Composable
    ↓
逻辑与副作用复用
```

而整个项目最健康的数据流通常接近：

```text
              State Owner
                   │
                   ▼
                 View
                   │
                User Event
                   │
                   ▼
              Intent / Action
                   │
                   ▼
              State Mutation
                   │
                   ▼
              Reactive Update
                   │
                   ▼
                 View
```

也就是：

# **“谁拥有状态，谁负责修改；谁消费状态，谁声明依赖；组件之间尽量单向流动；跨边界时才提升通信层级。”**

这套思维一旦建立起来，以后面对一个陌生 Vue 项目，看它的 `props`、`emit`、`provide`、Pinia store、composable，不再只是看“代码怎么传值”，而是在看**整个应用的状态拓扑图**。
