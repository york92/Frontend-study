可以。这个问题其实非常适合从**“Vue3 到底把一次状态变化变成一次 DOM 更新时，做了多少次优化”**来理解。

如果你已经有前端开发经验，我建议不要把 Vue3 的性能理解成几个零散 API（`ref`、`computed`、`v-memo`、`nextTick`）。真正值得掌握的是下面这条完整链路：

> **响应式系统 → effect → scheduler → job queue → component update → render → compiler hints → VNode diff → DOM patch**

Vue3 的“快”不是某一个算法特别神奇，而是**整条渲染管线都在减少不必要的工作**。

---

# 一、先给结论：Vue3 到底快在哪里？

可以把 Vue3 的性能优化体系粗略概括成：

```text
                用户修改状态
                     │
                     ▼
              Reactive Trigger
                     │
                     ▼
                Scheduler
                     │
          ┌──────────┴──────────┐
          │                     │
     去重 / 批量更新          调度优先级
          │                     │
          └──────────┬──────────┘
                     ▼
              Component Update
                     │
                     ▼
              Render Function
                     │
                     ▼
            Compiler Optimization
          ┌──────────┼──────────┐
          │          │          │
       Static     PatchFlags   Block Tree
       Hoist                   DynamicChildren
          │          │          │
          └──────────┼──────────┘
                     ▼
                  VNode
                     │
                     ▼
                Fast Diff
                     │
                     ▼
                 DOM Patch
```

其中最重要的几个关键词：

**Scheduler、批量更新、依赖追踪、Patch Flags、Static Hoisting、Block Tree、Diff、DOM 最小化更新。**

而且有一个非常重要的认知：

> **Vue3 的性能优化重点，不只是“让一次更新更快”，更重要的是“让很多根本不需要发生的更新不要发生”。**

---

# 二、先从最原始的问题开始：为什么 Vue 需要 Scheduler？

假设：

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div>{{ count }}</div>
</template>
```

执行：

```js
count.value++
```

最粗暴的实现可能是：

```text
count.value++
      ↓
触发 effect
      ↓
重新 render
      ↓
diff
      ↓
patch DOM
```

但是现实中的代码往往是：

```js
count.value++
count.value++
count.value++
count.value++
```

如果每一次都立即：

```text
state change
    ↓
render
    ↓
DOM patch
```

那就是：

```text
+1 → render → DOM
+1 → render → DOM
+1 → render → DOM
+1 → render → DOM
```

这显然很浪费。

因为用户真正关心的是：

> **最终结果是多少？**

而不是中间这几个状态。

所以 Vue 会引入：

# Scheduler

把更新从：

```text
同步立即执行
```

变成：

```text
状态变化
   ↓
把更新任务放入队列
   ↓
任务去重
   ↓
批量执行
   ↓
一次 render
   ↓
一次 DOM patch
```

也就是：

```text
count.value++
count.value++
count.value++
count.value++

        ↓

      Job Queue

        ↓

     render 一次
```

这就是 Vue 性能体系里非常关键的一层。

---

# 三、Scheduler 的本质：把“状态变化”变成“更新任务”

理解 Vue Scheduler，先记住一个概念：

> **响应式系统负责发现“应该更新”，Scheduler 负责决定“什么时候更新”。**

这两个职责是不同的。

例如：

```js
const state = reactive({
  count: 0
})
```

组件 render：

```js
effect(() => {
  renderComponent(state.count)
})
```

当：

```js
state.count++
```

发生时：

```text
Proxy.set
   ↓
trigger()
   ↓
找到依赖 effect
   ↓
不是直接执行 effect
   ↓
scheduler()
```

于是：

```text
Reactive System
      │
      │ “这个 effect 需要重新执行”
      ▼
 Scheduler
      │
      │ “先别执行，放队列”
      ▼
   Job Queue
```

这是一个非常漂亮的架构分层。

---

# 四、为什么 Scheduler 可以大幅减少开销？

假设：

```js
state.a++
state.b++
state.c++
```

而模板：

```vue
<div>
  {{ state.a }}
  {{ state.b }}
  {{ state.c }}
</div>
```

如果同步更新：

```text
a 改变
 ↓
render
 ↓
diff
 ↓
patch

b 改变
 ↓
render
 ↓
diff
 ↓
patch

c 改变
 ↓
render
 ↓
diff
 ↓
patch
```

总共 3 次。

Scheduler 之后：

```text
a 改变 ─┐
b 改变 ─┼──→ Job Queue
c 改变 ─┘
             ↓
          去重
             ↓
          render
             ↓
          patch
```

只需要一次。

---

# 五、Vue 的更新队列为什么必须“去重”？

例如：

```js
state.count++

state.count++
state.count++
```

理论上可能触发三次：

```text
updateComponent
updateComponent
updateComponent
```

但实际上：

```text
Set / job dedupe
```

会把相同 job 合并。

概念上类似：

```js
const queue = new Set()

queue.add(updateComponent)
queue.add(updateComponent)
queue.add(updateComponent)
```

最终：

```text
queue = {
    updateComponent
}
```

所以：

> **Vue Scheduler 的第一大优化：去重。**

---

# 六、第二大优化：批量更新

Vue 并不是每次：

```js
queueJob(job)
```

之后立即：

```js
flushJobs()
```

而是通过 microtask 等机制把多个同步状态变化合并起来。

概念上可以理解为：

```js
if (!isFlushPending) {
    isFlushPending = true

    Promise.resolve().then(flushJobs)
}
```

于是：

```js
state.a++
state.b++
state.c++
```

这些同步代码执行完之后：

```text
当前 Call Stack
      ↓
microtask
      ↓
flushJobs()
```

于是多个状态变化被压缩成一次更新周期。

---

# 七、这就是 nextTick 的本质之一

很多前端开发者知道：

```js
await nextTick()
```

但不一定真正理解它。

例如：

```js
state.count++

console.log(el.textContent)

await nextTick()

console.log(el.textContent)
```

前面的：

```js
console.log()
```

可能看到旧 DOM。

因为：

```text
state.count++
      ↓
scheduler queue
      ↓
当前同步代码继续执行
      ↓
microtask
      ↓
flushJobs
      ↓
render
      ↓
patch DOM
```

所以：

```js
await nextTick()
```

实际上是在等待：

> **Vue 当前这轮异步更新队列完成。**

这也是为什么 `nextTick` 不是“让浏览器下一帧再执行”。

它和：

```js
requestAnimationFrame()
```

不是一个概念。

---

# 八、Scheduler 解决了“什么时候更新”，但还不够

现在我们已经解决：

> 不要更新太多次。

但是还有一个问题：

> **每次更新的时候，Vue 到底要检查多少东西？**

假设：

```vue
<div>
  <header>网站标题</header>

  <main>
    <p>{{ user.name }}</p>
    <p>{{ user.age }}</p>
  </main>

  <footer>版权信息</footer>
</div>
```

当：

```js
user.name = 'Tom'
```

发生时。

传统 Virtual DOM 思路可能是：

```text
重新 render
      ↓
生成新的 VNode Tree
      ↓
新旧 VNode Tree Diff
      ↓
找出变化
```

问题来了：

```text
header
main
  p
  p
footer
```

这么多东西里面，真正变化的可能只有：

```html
<p>Tom</p>
```

那么：

> 为什么我要反复检查那些静态内容？

这就进入 Vue3 非常核心的一组优化：

# Compiler Optimization

---

# 九、Vue3 为什么特别强调“编译器优化”？

这是 Vue3 和很多人印象中的 Vue2 一个非常重要的区别。

Vue3 的架构可以理解成：

```text
Vue 2：

Template
   ↓
Render Function
   ↓
Runtime Diff
   ↓
DOM
```

Vue3：

```text
Template
   ↓
Compiler
   ↓
带优化信息的 Render Function
   ↓
Runtime
   ↓
只重点处理 Dynamic Parts
   ↓
DOM
```

也就是说：

> **Vue3 不再把所有优化压力都丢给 Runtime。**

而是：

> **编译阶段提前分析模板，把运行时可以省掉的工作直接标记出来。**

这是 Vue3 性能提升非常重要的原因。

---

# 十、Patch Flags：Vue3 最值得理解的优化之一

看一个模板：

```vue
<div>
  Hello
  {{ name }}
</div>
```

编译器知道：

```text
"Hello" 是静态的
name 是动态的
```

所以 Runtime 没必要每次都把整个：

```html
<div>Hello Tom</div>
```

重新当成一个完全未知的东西来处理。

Vue3 会给动态节点打上：

# Patch Flag

例如概念上：

```js
createElementVNode(
  "div",
  null,
  "Hello " + name,
  PatchFlags.TEXT
)
```

这里：

```js
PatchFlags.TEXT
```

告诉 Runtime：

> **这个节点只有 TEXT 可能变化。**

于是 patch 时：

```text
Patch Element
    ↓
发现 patchFlag = TEXT
    ↓
只比较 text
    ↓
更新 textContent
```

而不是：

```text
props
class
style
events
children
attrs
text
……
全部重新检查
```

---

# 十一、Patch Flags 到底是什么？

可以把它理解成：

> **编译器提前给 Runtime 写的一张“更新说明书”。**

例如：

```text
TEXT
CLASS
STYLE
PROPS
FULL_PROPS
HYDRATE_EVENTS
CHILDREN
```

不同 flag 表示不同类型的动态内容。

比如：

```vue
<div :class="className">
  Hello
</div>
```

编译器可以告诉 Runtime：

```text
这个节点：
class 是动态的
其他东西大概率不用管
```

于是 patch：

```text
patchElement
    ↓
patchFlag = CLASS
    ↓
只处理 class
```

---

# 十二、这其实改变了 Virtual DOM 的工作模式

传统思维：

> Virtual DOM = 每次重新创建整棵树，然后 Diff。

Vue3 更准确的理解应该是：

> **Virtual DOM + 编译器提供的静态/动态信息 + 定向 Patch。**

所以 Vue3 的 VDOM 已经不是：

```text
完全不知道哪里变了
```

而是：

```text
编译器：
“我大概知道哪里会变。”
```

Runtime：

```text
“那我就重点检查那里。”
```

---

# 十三、Static Hoisting：静态节点为什么不需要反复创建？

例如：

```vue
<div>
  <h1>Vue 3</h1>

  <p>{{ message }}</p>

  <footer>
    Copyright 2026
  </footer>
</div>
```

这里：

```html
<h1>Vue 3</h1>
```

和：

```html
<footer>Copyright 2026</footer>
```

完全静态。

如果每次 render 都：

```js
createVNode(...)
createVNode(...)
createVNode(...)
```

也是浪费。

所以 Vue3 编译器会进行：

# Static Hoisting

也就是把静态 VNode 提升出去。

概念上：

```js
const _hoisted_1 = createElementVNode(
  "h1",
  null,
  "Vue 3"
)

const _hoisted_2 = createElementVNode(
  "footer",
  null,
  "Copyright 2026"
)
```

render：

```js
function render() {
    return createElementVNode("div", null, [
        _hoisted_1,
        createElementVNode("p", null, message.value),
        _hoisted_2
    ])
}
```

于是每次 render：

```text
静态 VNode
    ↓
直接复用
```

不用重新创建。

---

# 十四、Block Tree：Vue3 更狠的一步

Patch Flags 已经很厉害。

但是 Vue3 还进一步：

# Block Tree

这是理解 Vue3 性能非常关键的一步。

假设：

```vue
<div>
  <h1>Hello</h1>

  <p>{{ message }}</p>

  <span>{{ count }}</span>

  <footer>Static</footer>
</div>
```

真正动态的只有：

```text
p
span
```

传统 Diff：

```text
div
├── h1
├── p
├── span
└── footer
```

可能需要遍历很多节点。

Block Tree 的思路：

```text
div Block
│
├── dynamicChildren
│      ├── p
│      └── span
│
├── static h1
└── static footer
```

也就是说：

> **Runtime 可以直接跳到动态节点集合。**

---

# 十五、所以 Block Tree 的核心思想是什么？

一句话：

> **把“整棵 VNode Tree 的 Diff”变成“动态节点子集的 Diff”。**

这非常重要。

传统：

```text
O(整棵树)
```

优化之后更接近：

```text
O(动态节点数量)
```

当然，这不是严格意义上所有情况下都能简单写成这样的 Big-O，因为实际 Diff 还受到 children 类型、key、组件结构等影响。

但作为理解模型非常准确。

---

# 十六、这时候可以重新理解 Vue3 的“快”

到现在，我们已经有：

### 第一层：Reactive

知道：

```text
谁依赖了谁
```

### 第二层：Scheduler

知道：

```text
什么时候更新
```

### 第三层：Compiler

知道：

```text
哪些地方可能更新
```

### 第四层：Patch Flags

知道：

```text
更新的是 text / class / style / props ...
```

### 第五层：Block Tree

知道：

```text
重点检查哪些动态节点
```

### 第六层：Diff

进一步减少：

```text
节点创建 / 删除 / 移动
```

### 第七层：DOM Patch

最终：

```text
尽量只操作真正变化的 DOM
```

这才是完整的 Vue3 性能体系。

---

# 十七、再往下：Vue3 的 Diff 到底快在哪里？

如果 children 是：

```vue
<ul>
  <li v-for="item in list" :key="item.id">
    {{ item.name }}
  </li>
</ul>
```

假设：

```text
旧：

A B C D

新：

D A B C
```

如果没有 key：

```text
Vue 很难知道：
D 是原来的 D 被移动过来了
```

有 key：

```text
A → id=1
B → id=2
C → id=3
D → id=4
```

Vue 可以建立映射：

```text
1 → A
2 → B
3 → C
4 → D
```

然后判断：

```text
哪些复用
哪些新增
哪些删除
哪些移动
```

这就是 keyed diff。

---

# 十八、最长递增子序列 LIS 又是什么？

这里是 Vue3 Diff 里面比较“硬核”的部分。

继续：

```text
旧：
A B C D E

新：
A C D B E
```

Vue 发现：

```text
A
C
D
B
E
```

对应旧索引：

```text
1 3 4 2 5
```

其中：

```text
1 3 4 5
```

是一个最长递增子序列。

这些节点：

```text
A C D E
```

其实可以保持原来的 DOM 顺序。

真正需要移动的只有：

```text
B
```

于是：

```text
不是：
A → 移
B → 移
C → 移
D → 移
E → 移

而是：
B → 移
```

这就是 LIS 的价值：

> **尽量复用已有 DOM，并最小化 DOM Move。**

---

# 十九、为什么 DOM 操作特别贵？

很多人会说：

> JavaScript 快了，所以页面快。

其实前端性能经常真正卡的是：

```text
DOM
Style
Layout
Paint
Composite
```

尤其：

```text
Layout / Reflow
```

可能触发浏览器后续渲染流程。

所以 Vue 的目标不是：

> JavaScript 跑得多快。

而是：

> **尽可能少让浏览器做 DOM 工作。**

所以 Vue3 的优化最终都指向一个目标：

```text
减少：
VNode 创建
+
VNode Diff
+
DOM 创建
+
DOM 删除
+
DOM 更新
+
DOM Move
```

---

# 二十、把整个浏览器渲染过程串起来

这时候我们可以把 Vue 放到浏览器里看。

例如：

```js
count.value++
```

整个链路：

```text
JavaScript
   │
   ▼
Reactive Trigger
   │
   ▼
Scheduler
   │
   ▼
Job Queue
   │
   ▼
Component Update
   │
   ▼
Render Function
   │
   ▼
VNode
   │
   ▼
Patch / Diff
   │
   ▼
DOM API
   │
   ▼
Style Recalculation
   │
   ▼
Layout
   │
   ▼
Paint
   │
   ▼
Composite
```

Vue真正能控制的是：

```text
Reactive
Scheduler
Render
VNode
Diff
DOM Patch
```

浏览器接管之后：

```text
Style
Layout
Paint
Composite
```

所以：

> **Vue性能优化和浏览器渲染性能优化，其实是两套上下游系统。**

---

# 二十一、这也是为什么“减少 DOM 更新”比“减少一点 JS”重要

假设：

```text
JS 执行：2ms
DOM Patch：1ms
```

没什么。

但如果：

```text
JS：2ms
Layout：20ms
Paint：10ms
```

你把 Vue 的 JS 优化：

```text
2ms → 1ms
```

意义可能远不如：

```text
减少一次 Layout
```

所以现代前端性能优化经常需要：

```text
Framework Performance
+
Browser Rendering Performance
```

一起考虑。

---

# 二十二、组件更新还有一个非常重要的问题

假设：

```vue
<App>
  <Header />
  <Main />
  <Sidebar />
  <Footer />
</App>
```

当：

```js
Main
```

里面的数据发生变化。

理想情况：

```text
Main update
```

而不是：

```text
App update
 ↓
Header update
 ↓
Main update
 ↓
Sidebar update
 ↓
Footer update
```

这就是：

# 组件级更新隔离

Vue 的响应式依赖追踪能够帮助 Vue 判断：

```text
这个组件的 render effect
依赖哪些响应式数据
```

所以状态变化时：

```text
state.foo
   ↓
找到依赖它的 effect
   ↓
对应组件 update
```

而不是整个应用重跑。

---

# 二十三、这里要特别理解“响应式粒度”

Vue3：

```js
const count = ref(0)
```

组件 render：

```js
return h('div', count.value)
```

那么：

```text
count
 ↓
render effect
```

建立依赖。

如果：

```js
const user = reactive({
    name: 'Tom',
    age: 20
})
```

render：

```js
user.name
```

那么 Vue3 的 Proxy 能够做到更细粒度的依赖追踪。

概念上：

```text
user.name
    ↓
effect A

user.age
    ↓
effect B
```

所以：

```js
user.name = 'Jerry'
```

并不意味着：

```text
所有使用 user 的地方
```

都必须更新。

---

# 二十四、computed 又是另一层性能优化

例如：

```js
const total = computed(() => {
    return price.value * count.value
})
```

如果：

```text
price
count
```

都没有变化：

```js
total.value
```

不需要重新计算。

这叫：

# Lazy Evaluation + Cache

所以：

```text
computed
```

不是简单的：

```text
函数
```

而是一个：

```text
带依赖追踪
+
缓存
+
惰性求值
```

的响应式节点。

---

# 二十五、所以 Vue3 的响应式系统实际上形成了一张依赖图

可以想象：

```text
price ──────┐
            │
            ▼
         computed
            │
count ──────┘
            │
            ▼
       component effect
            │
            ▼
           DOM
```

当：

```js
price.value++
```

发生：

```text
price
 ↓
computed dirty
 ↓
component effect
 ↓
scheduler
 ↓
render
 ↓
patch
```

这就是 Vue 的：

> **Fine-grained Reactivity + Scheduled Rendering**

---

# 二十六、这也是 Vue 和 React 性能哲学很有意思的区别

当然不能简单说谁快谁慢，因为实际性能高度依赖应用结构。

但架构思想可以粗略对比：

|      | Vue3                         | React                        |
| ---- | ---------------------------- | ---------------------------- |
| 响应式  | Reactive dependency tracking | State-driven rendering       |
| 更新发现 | Dependency tracking          | Re-render / Fiber scheduling |
| 更新调度 | Scheduler                    | Fiber Scheduler              |
| 模板优化 | Compiler                     | JSX + Compiler 逐步增强          |
| 静态节点 | Static Hoisting              | 依赖具体优化机制                     |
| 动态节点 | Patch Flags / Block Tree     | Fiber reconciliation         |
| Diff | VNode Diff                   | Fiber reconciliation         |
| 更新粒度 | 响应式依赖 + 组件                   | Fiber / component            |
| 核心思想 | 尽量少算                         | 可中断、可调度地算                    |

尤其值得注意：

> React 的核心竞争力之一是 **Fiber + Concurrent Rendering**。

Vue3 的优势之一则是：

> **Compiler + Fine-grained Reactivity + Runtime Optimization。**

所以两者“快”的路径不完全一样。

---

# 二十七、Vue3 的 Scheduler 还有一个更深层的问题：更新顺序

现实应用不是：

```text
只有一个 update
```

而可能是：

```text
父组件 update
子组件 update
watch
watchPostEffect
computed
```

所以 Scheduler 还需要处理：

```text
执行顺序
优先级
递归更新
插入新 job
post flush callbacks
```

可以粗略理解成：

```text
                    Scheduler
                       │
          ┌────────────┼─────────────┐
          │            │             │
       component      pre          post
         jobs         flush        flush
          │            │             │
          └────────────┼─────────────┘
                       ▼
                   flushJobs
```

这也是为什么 Vue 的 Scheduler 源码看起来比：

```js
queue.push(job)
```

复杂很多。

它实际上承担了：

> **整个响应式系统与渲染系统之间的“交通调度”。**

---

# 二十八、watch 的 flush 又和 Scheduler 有关系

例如：

```js
watch(source, callback, {
    flush: 'pre'
})
```

或者：

```js
flush: 'post'
```

或者：

```js
flush: 'sync'
```

它们实际上是在告诉 Vue：

> **这个副作用应该插入更新流程的哪个位置？**

粗略理解：

```text
sync
 ↓
立即执行

pre
 ↓
组件更新之前

component update
 ↓
render + patch

post
 ↓
DOM 更新之后
```

所以：

```js
flush: 'post'
```

特别适合需要读取更新后 DOM 的场景。

---

# 二十九、这就解释了 Vue3 的一个核心架构思想

Vue3 并不是：

```text
state
 ↓
DOM
```

而是：

```text
              Reactive Graph
                    │
                    ▼
                Scheduler
                    │
                    ▼
             Component Effect
                    │
                    ▼
                 Render
                    │
                    ▼
             Compiler Hints
                    │
                    ▼
                  VNode
                    │
                    ▼
               Optimized Diff
                    │
                    ▼
                 DOM Patch
```

每一层都在削减工作量。

---

# 三十、Vue3 性能优化可以总结成“四个问题”

这是我比较推荐你在面试或者学习源码时使用的框架。

## 问题一：谁需要更新？

靠：

```text
Reactive Dependency Tracking
```

---

## 问题二：什么时候更新？

靠：

```text
Scheduler
Job Queue
Batching
Deduplication
```

---

## 问题三：更新什么？

靠：

```text
Compiler
Patch Flags
Static Hoisting
Block Tree
Dynamic Children
```

---

## 问题四：怎么最少地更新 DOM？

靠：

```text
VNode Diff
Keyed Diff
LIS
DOM Patch
```

所以：

> **Vue3 的性能优化体系，本质就是：减少“更新次数” × 减少“每次更新的计算量” × 减少“最终 DOM 操作”。**

---

# 三十一、如果把它变成一个公式

可以粗略理解成：

```text
页面更新成本
≈
更新次数
×
每次更新的计算量
+
DOM 操作成本
+
浏览器渲染成本
```

Vue3 在每一项都下手：

### 减少更新次数

```text
Scheduler
Batching
Deduplication
Computed Cache
```

### 减少计算量

```text
Dependency Tracking
Patch Flags
Static Hoisting
Block Tree
Dynamic Children
```

### 减少 DOM 操作

```text
Keyed Diff
LIS
精准 Patch
DOM Reuse
```

### 减少浏览器渲染成本

Vue 本身不能完全控制，但通过：

```text
减少 DOM Mutation
```

间接降低：

```text
Style
Layout
Paint
```

---

# 三十二、所以不要把 Vue3 性能理解成“Proxy 比 defineProperty 快”

这是一个非常典型的误区。

Vue3 的 Proxy 确实解决了 Vue2 响应式系统的一些问题，例如：

```text
新增属性
删除属性
数组操作
Map / Set
```

但：

> **Vue3 性能提升绝不是因为 Proxy 本身。**

真正大的变化是：

```text
Proxy
+
Reactive Dependency Tracking
+
Scheduler
+
Compiler Optimization
+
Patch Flags
+
Block Tree
+
Static Hoisting
+
Optimized Diff
```

它是一个系统工程。

---

# 三十三、如果你准备深入 Vue3 源码，建议按这个顺序读

你如果是前端开发者，我**不建议一上来啃整个 runtime-core**。

按照这个顺序会舒服很多：

```text
① reactive
     ↓
② effect
     ↓
③ track / trigger
     ↓
④ scheduler
     ↓
⑤ component update
     ↓
⑥ render
     ↓
⑦ patch
     ↓
⑧ diff
     ↓
⑨ compiler
     ↓
⑩ patch flags / block tree
```

其中最值得重点吃透的是：

```text
effect
   ↓
scheduler
   ↓
component update
   ↓
render
   ↓
patch
```

这一条线吃透以后，你会突然发现：

> **Vue3 源码其实不是“各种 API 拼在一起”，而是一条非常完整的状态 → 更新 → DOM 的流水线。**

---

# 三十四、最终建立一张“Vue3 性能地图”

你可以把下面这张图直接当成学习 Vue3 源码的脑图：

```text
                         Vue 3 Performance
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
        Reactivity                            Rendering
              │                                   │
       ┌──────┴──────┐                    ┌───────┴────────┐
       │             │                    │                │
     track        trigger              Compiler          Runtime
       │             │                    │                │
       │          scheduler               │                │
       │             │             ┌──────┼───────┐        │
       │          queue             │      │       │        │
       │             │           Hoist  Flags   Blocks      │
       │             │                              │       │
       └─────────────┼──────────────────────────────┘       │
                     │                                      │
                     ▼                                      ▼
               Component Effect                         VNode
                     │                                      │
                     ▼                                      ▼
                   Render                                  Diff
                                                            │
                                               ┌────────────┼──────────┐
                                               │            │          │
                                             Keyed         LIS       Patch
                                               │            │          │
                                               └────────────┼──────────┘
                                                            │
                                                            ▼
                                                           DOM
                                                            │
                                                            ▼
                                                     Browser Pipeline
                                                            │
                                          ┌─────────────────┼──────────────┐
                                          │                 │              │
                                        Style            Layout          Paint
```

**这张图里最核心的一句话就是：**

> **Vue3 并不是单纯把“渲染速度”做快，而是在整个更新生命周期里不断回答四个问题：谁更新、什么时候更新、更新什么、如何用最少的成本更新。**

