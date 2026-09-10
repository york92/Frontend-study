可以。下面我直接按**真实前端面试场景**整理成一套《CSS 前端面试 100 题》。

我会刻意避免“只背定义”的形式，而是尽量采用：

> **面试官怎么问 → 核心答案 → 继续追问 → 示例 / 易错点**

这样更适合你拿来真正复习。

---

# 《CSS 前端面试 100 题》

## 第一部分：CSS 基础与盒模型

---

## 01. 什么是 CSS？CSS 的作用是什么？

### 核心答案

CSS（Cascading Style Sheets）用于描述 HTML 元素的：

```text
样式
布局
颜色
字体
尺寸
动画
响应式行为
```

HTML 负责：

```text
结构
```

CSS 负责：

```text
表现
```

JavaScript 负责：

```text
行为
```

可以简单理解为：

```text
HTML  → 页面是什么
CSS   → 页面长什么样
JS    → 页面怎么动
```

### 面试追问

**为什么叫 Cascading？**

因为 CSS 存在层叠机制：

```text
来源
+
!important
+
specificity
+
源码顺序
```

共同决定最终生效的样式。

---

# 02. CSS 有哪些引入方式？

主要三种。

### 行内

```html
<div style="color:red"></div>
```

### 内部样式

```html
<style>
  .box {
    color: red;
  }
</style>
```

### 外部样式

```html
<link rel="stylesheet" href="style.css">
```

一般项目优先使用：

```text
外部 CSS
```

便于：

```text
复用
缓存
维护
模块化
```

---

# 03. CSS 选择器有哪些？

常见：

```css
* {}

div {}

.box {}

#app {}

input[type="text"] {}

:hover {}

::before {}
```

主要分类：

```text
通配选择器
标签选择器
类选择器
ID选择器
属性选择器
伪类
伪元素
后代选择器
子选择器
相邻兄弟
通用兄弟
```

---

# 04. CSS 选择器优先级如何计算？

常见优先级从高到低：

```text
!important
↓
内联样式
↓
ID
↓
class / 属性 / 伪类
↓
标签 / 伪元素
↓
通配符
↓
继承
```

可以记成：

```text
!important
    ↓
  style
    ↓
   ID
    ↓
class
    ↓
 tag
```

---

# 05. 什么是 specificity？

Specificity 就是：

> 选择器权重。

例如：

```css
#app .box div {}
```

大概：

```text
ID      1
class   1
tag     1
```

也就是：

```text
0,1,1,1
```

而：

```css
.box div {}
```

是：

```text
0,0,1,1
```

因此前者优先级更高。

---

# 06. 什么是 CSS 层叠？

最终样式并不是简单：

> 后写的覆盖先写的。

而是综合考虑：

```text
Cascade Origin
Specificity
Source Order
Importance
Inheritance
Layers
```

现代 CSS 又加入：

```css
@layer
```

帮助管理大型项目中的 CSS 优先级。

---

# 07. CSS 中哪些属性可以继承？

比较典型的：

```text
color
font-family
font-size
line-height
text-align
visibility
```

通常不能直接继承：

```text
margin
padding
width
height
border
position
```

可以显式：

```css
color: inherit;
```

---

# 08. `inherit`、`initial`、`unset` 有什么区别？

### inherit

继承父元素。

```css
color: inherit;
```

### initial

恢复 CSS 属性默认初始值。

```css
margin: initial;
```

### unset

根据属性是否可继承决定：

```text
可继承 → inherit
不可继承 → initial
```

还有现代 CSS：

```css
revert
revert-layer
```

它们用于回退层叠来源或层。

---

# 09. 什么是盒模型？

一个元素可以理解为：

```text
margin
  ↓
border
  ↓
padding
  ↓
content
```

结构：

```text
┌────────────── margin ──────────────┐
│ ┌──────────── border ────────────┐ │
│ │ ┌────────── padding ─────────┐ │ │
│ │ │ ┌──────── content ───────┐ │ │ │
│ │ │ └────────────────────────┘ │ │ │
│ │ └────────────────────────────┘ │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

---

# 10. `content-box` 和 `border-box` 的区别？

默认：

```css
box-sizing: content-box;
```

如果：

```css
width: 200px;
padding: 20px;
border: 10px solid;
```

实际宽度：

```text
200 + 40 + 20
= 260px
```

如果：

```css
box-sizing: border-box;
```

则：

```text
总宽度 = 200px
```

现代项目经常：

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

---

# 第二部分：尺寸、margin、padding

---

# 11. width 和 height 有哪些相关属性？

```css
width
height

min-width
max-width

min-height
max-height
```

典型：

```css
.container {
  width: 100%;
  max-width: 1200px;
}
```

---

# 12. margin 的作用是什么？

控制：

> 元素与外部其他元素之间的空间。

例如：

```css
margin: 20px;
```

四方向：

```css
margin-top
margin-right
margin-bottom
margin-left
```

---

# 13. padding 和 margin 有什么区别？

简单记：

```text
padding → 内边距
margin  → 外边距
```

例如：

```text
┌───────────────┐
│    margin     │
│ ┌───────────┐ │
│ │  padding  │ │
│ │  content  │ │
│ └───────────┘ │
└───────────────┘
```

---

# 14. 什么是 margin collapse？

垂直方向相邻 block 元素：

```css
.box1 {
  margin-bottom: 30px;
}

.box2 {
  margin-top: 20px;
}
```

不一定得到：

```text
50px
```

可能发生合并：

```text
30px
```

这叫：

> Margin Collapsing。

---

# 15. 如何避免 margin collapse？

可以创建新的格式化上下文，例如：

```css
.parent {
  display: flow-root;
}
```

或者：

```css
.parent {
  overflow: hidden;
}
```

也可以通过边框、padding 等方式改变边界关系。

---

# 第三部分：display 与文档流

---

# 16. `display:none`、`visibility:hidden`、`opacity:0` 有什么区别？

这是必考题。

| 属性                  | 占据空间 | 可见 | 一般可交互 |
| ------------------- | ---: | -: | ----: |
| `display:none`      |    ❌ |  ❌ |     ❌ |
| `visibility:hidden` |    ✅ |  ❌ |     ❌ |
| `opacity:0`         |    ✅ |  ❌ |     ✅ |

`opacity: 0` 最容易踩坑。

因为它：

```text
看不到
但元素还存在
```

仍可能响应：

```text
点击
鼠标事件
键盘焦点
```

---

# 17. block、inline、inline-block 有什么区别？

### block

```text
独占一行
可以设置 width / height
```

例如：

```html
<div></div>
```

### inline

```text
不独占一行
width / height 不按 block 方式工作
```

例如：

```html
<span></span>
```

### inline-block

```text
横向排列
同时可以设置宽高
```

---

# 18. 什么是文档流？

普通文档流中：

```text
block
```

通常从上到下排列。

而：

```text
inline
```

按照文本排版方向排列。

脱离正常文档流的典型情况：

```text
position:absolute
position:fixed
float
```

---

# 19. 什么是 BFC？

BFC：

> Block Formatting Context，块级格式化上下文。

可以理解为：

> 一个独立的布局区域。

某些情况下可以建立 BFC：

```css
display: flow-root;
```

以及一些特定的：

```text
overflow
float
position
flex
grid
```

布局场景。

---

# 20. BFC 有什么用？

经典用途：

### 防止 margin collapse

### 包住 float

### 创建独立布局区域

### 防止布局互相干扰

例如：

```css
.parent {
  display: flow-root;
}
```

让父元素正确包含浮动子元素。

---

# 第四部分：定位

---

# 21. position 有哪些值？

```css
static
relative
absolute
fixed
sticky
```

---

# 22. relative 有什么特点？

```css
position: relative;
```

特点：

```text
仍然占据原来的布局空间
```

同时可以：

```css
top
right
bottom
left
```

偏移视觉位置。

更重要用途：

> 为 absolute 子元素建立定位参考。

---

# 23. absolute 相对于谁定位？

通常：

> 最近的非 `static` 定位祖先。

例如：

```css
.parent {
  position: relative;
}

.child {
  position: absolute;
  top: 0;
  right: 0;
}
```

child 会以 parent 作为主要定位参考。

---

# 24. absolute 会脱离文档流吗？

会。

例如：

```css
.child {
  position: absolute;
}
```

它不再占据普通文档流中的位置。

所以其他元素会按照它“不存在”时的布局进行排列。

---

# 25. fixed 和 absolute 有什么区别？

### absolute

通常参考：

```text
定位祖先 / containing block
```

### fixed

通常和：

```text
viewport
```

相关。

典型：

```css
.back-top {
  position: fixed;
  right: 20px;
  bottom: 20px;
}
```

不过现代 CSS 中，某些祖先建立特定 containing block 后，fixed 的行为可能会受到影响。

---

# 26. sticky 是什么？

```css
position: sticky;
top: 0;
```

可以理解成：

```text
正常参与布局
        ↓
滚动到阈值
        ↓
像 fixed 一样暂时粘住
        ↓
离开指定滚动容器后结束
```

经常用于：

```text
导航栏
表头
侧边目录
```

---

# 27. 为什么 `position: sticky` 有时候不生效？

高频坑。

常见原因：

```text
没有设置 top / left 等阈值
父级滚动容器不符合预期
overflow 影响滚动容器
容器高度不足
```

例如：

```css
.title {
  position: sticky;
  top: 0;
}
```

通常必须有明确的：

```css
top
```

---

# 28. z-index 为什么有时候不生效？

因为：

> z-index 不是简单地全局比较数字。

它受到：

```text
stacking context
```

影响。

比如父元素已经处于较低层叠上下文：

```css
.parent {
  z-index: 1;
}
```

即使：

```css
.child {
  z-index: 999999;
}
```

也不能简单跨越父级层叠上下文。

---

# 29. 什么是 stacking context？

层叠上下文。

可以理解为：

> 一个独立进行 z-index 排序的“层”。

可能创建 stacking context 的情况包括某些：

```text
position + z-index
opacity < 1
transform
filter
isolation
```

等。

---

# 30. top/left 和 transform 有什么区别？

例如移动：

```css
left: 100px;
```

与：

```css
transform: translateX(100px);
```

不是一回事。

`top/left` 更偏向：

> 定位 / 布局系统。

`transform` 更偏向：

> 视觉变换。

做高频动画时：

```css
transform
opacity
```

通常更加合适。

---

# 第五部分：Flexbox

---

# 31. Flex 是什么？

Flex 是：

> 一维布局模型。

例如：

```css
.container {
  display: flex;
}
```

主要解决：

```text
水平布局
垂直布局
空间分配
对齐
```

---

# 32. Flex 的主轴和交叉轴是什么？

默认：

```css
flex-direction: row;
```

那么：

```text
主轴 → 水平
交叉轴 → 垂直
```

如果：

```css
flex-direction: column;
```

则：

```text
主轴 → 垂直
交叉轴 → 水平
```

---

# 33. justify-content 和 align-items 有什么区别？

默认 row：

```text
justify-content
→ 主轴

align-items
→ 交叉轴
```

所以：

```css
display: flex;

justify-content: center;
align-items: center;
```

就是经典：

> 水平 + 垂直居中。

---

# 34. align-content 和 align-items 有什么区别？

这个非常容易错。

### align-items

控制：

> 一条 flex line 内子项的对齐。

### align-content

控制：

> 多行 flex line 整体如何排列。

所以：

```css
flex-wrap: wrap;
```

多行时 `align-content` 才更加有意义。

---

# 35. `flex-wrap` 是什么？

```css
flex-wrap: nowrap;
```

默认不换行。

```css
flex-wrap: wrap;
```

空间不足就换行。

---

# 36. flex-grow 是干什么的？

控制：

> 剩余空间如何分配。

比如：

```css
.a {
  flex-grow: 1;
}

.b {
  flex-grow: 2;
}
```

剩余空间大致：

```text
1 : 2
```

分配。

---

# 37. flex-shrink 是干什么的？

控制：

> 空间不足时元素如何收缩。

默认通常是：

```css
flex-shrink: 1;
```

也就是：

> 默认允许缩小。

---

# 38. flex-basis 是什么？

```css
flex-basis: 200px;
```

表示：

> flex 项目在主轴方向上的初始尺寸。

可以把它理解成：

```text
“参与 flex 空间计算前的基准尺寸”
```

---

# 39. `flex:1` 到底是什么意思？

这是超级高频题。

```css
flex: 1;
```

通常可以近似理解为：

```css
flex-grow: 1;
flex-shrink: 1;
flex-basis: 0%;
```

所以多个元素：

```css
.item {
  flex: 1;
}
```

可以实现：

```text
均分剩余空间
```

---

# 40. Flex 为什么有时候“明明设置了 width 却被压缩”？

因为：

```css
flex-shrink: 1;
```

允许子项收缩。

例如：

```css
.item {
  width: 300px;
}
```

如果容器只有：

```text
200px
```

由于：

```text
flex-shrink
```

可能发生压缩。

可以：

```css
flex-shrink: 0;
```

禁止缩小。

---

# 第六部分：Grid

---

# 41. Grid 和 Flex 最大区别是什么？

非常推荐这样回答：

```text
Flex → 一维布局
Grid → 二维布局
```

Flex 更适合：

```text
一行
或者一列
```

Grid 更适合：

```text
行 + 列
```

例如后台管理系统 Dashboard：

```text
┌────┬────┬────┐
│ A  │ B  │ C  │
├────┼────┼────┤
│ D  │ E  │ F  │
└────┴────┴────┘
```

Grid 非常合适。

---

# 42. `grid-template-columns` 是什么？

定义列。

```css
grid-template-columns:
  200px
  1fr
  300px;
```

表示：

```text
200px | 剩余 | 300px
```

---

# 43. `fr` 是什么？

`fr`：

> fraction，剩余空间份额。

例如：

```css
grid-template-columns: 1fr 2fr;
```

剩余空间：

```text
1 : 2
```

---

# 44. repeat() 有什么用？

```css
grid-template-columns:
  repeat(3, 1fr);
```

相当于：

```css
1fr 1fr 1fr
```

非常适合：

```text
卡片
Dashboard
列表
```

---

# 45. minmax() 有什么作用？

```css
grid-template-columns:
  repeat(
    3,
    minmax(200px, 1fr)
  );
```

表示：

```text
最小 200px
最大自动伸展
```

---

# 46. auto-fit 和 auto-fill 有什么区别？

典型：

```css
repeat(
  auto-fit,
  minmax(200px, 1fr)
)
```

常用于：

> 自动响应式卡片。

`auto-fit` 会尽可能让现有轨道填充空间。

`auto-fill` 更侧重：

> 尽可能创建满足条件的轨道。

实际业务中 `auto-fit` 使用非常常见。

---

# 47. Grid 如何实现页面布局？

例如：

```css
.layout {
  display: grid;

  grid-template-columns:
    240px
    1fr;

  grid-template-rows:
    64px
    1fr;
}
```

这是后台管理系统非常典型的布局结构。

---

# 48. Grid 中 grid-column 是什么？

例如：

```css
.item {
  grid-column: 1 / 3;
}
```

表示：

```text
从第 1 条 grid line
跨到第 3 条 grid line
```

因此实际跨：

```text
2 列
```

这是面试很容易考的小细节。

---

# 49. Grid 如何实现卡片自动换行？

例如：

```css
.cards {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(240px, 1fr)
    );

  gap: 20px;
}
```

这已经成为现代 CSS 非常经典的响应式写法。

---

# 50. Flex 和 Grid 如何选择？

可以这样判断：

```text
一维 → Flex
二维 → Grid
```

进一步：

```text
内容驱动 → Flex
布局驱动 → Grid
```

例如：

导航栏：

```text
Flex
```

后台 Dashboard：

```text
Grid
```

---

# 第七部分：文字与字体

---

# 51. line-height 有什么作用？

控制：

> 行框高度 / 行间距。

例如：

```css
line-height: 1.5;
```

相比写死：

```css
line-height: 24px;
```

相对单位更适合响应式字体。

---

# 52. 单行文字如何垂直居中？

传统方式：

```css
height: 40px;
line-height: 40px;
```

但现代开发更推荐：

```css
display: flex;
align-items: center;
```

因为 Flex 对复杂场景更可靠。

---

# 53. em 和 rem 的区别？

### em

相对于当前上下文的字体大小。

### rem

相对于：

```html
<html>
```

也就是 root font-size。

例如：

```css
html {
  font-size: 16px;
}

.box {
  font-size: 2rem;
}
```

结果：

```text
32px
```

---

# 54. px、%、em、rem、vw、vh 怎么选？

可以大概这样：

```text
px
→ 精确尺寸

%
→ 相对父容器

em
→ 相对当前字体上下文

rem
→ 相对 root font-size

vw
→ viewport 宽度

vh
→ viewport 高度
```

现代移动端还建议了解：

```text
dvh
svh
lvh
```

---

# 55. `white-space` 有什么作用？

控制：

> 空白和换行处理方式。

最常用：

```css
white-space: nowrap;
```

表示：

> 不换行。

---

# 56. 如何实现单行文字省略？

经典答案：

```css
.text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

三个属性通常缺一不可。

---

# 57. 如何实现多行文字省略？

常见：

```css
.text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
```

现代 CSS 也在持续标准化 line-clamp 能力。

---

# 58. word-break 和 overflow-wrap 有什么区别？

### word-break

更偏向：

> 单词 / 字符在哪里断开。

例如：

```css
word-break: break-all;
```

### overflow-wrap

更偏向：

> 单词太长导致溢出时是否允许断开。

典型：

```css
overflow-wrap: break-word;
```

---

# 59. font-weight 的常见值是什么？

常见：

```text
400
500
600
700
```

其中通常：

```text
400 → normal
700 → bold
```

现代设计系统经常使用：

```text
500 / 600
```

作为中等 / 半粗字体。

---

# 60. text-align: center 是否可以让元素本身水平居中？

这是陷阱题。

```css
text-align: center;
```

主要控制：

> 内容 / 行内内容的对齐。

不是：

> block 自身的位置。

block 水平居中常见：

```css
width: 300px;
margin: 0 auto;
```

或者父级：

```css
display: flex;
justify-content: center;
```

---

# 第八部分：背景、边框、阴影

---

# 61. background-size: cover 和 contain 有什么区别？

### cover

```text
保证容器铺满
可能裁剪图片
```

### contain

```text
保证图片完整
可能出现空白区域
```

经典：

```css
img {
  object-fit: cover;
}
```

---

# 62. background-position 有什么作用？

指定：

> 背景图位置。

例如：

```css
background-position: center;
background-position: center top;
background-position: 20px 30px;
```

---

# 63. border 和 outline 有什么区别？

一个重要区别：

```text
border → 参与盒模型
outline → 不参与盒模型
```

所以 outline 常用于：

```css
:focus {
  outline: 2px solid blue;
}
```

---

# 64. border-radius 可以做圆形吗？

可以。

```css
width: 100px;
height: 100px;
border-radius: 50%;
```

得到圆形。

但前提是：

```text
宽高相等
```

否则得到椭圆。

---

# 65. box-shadow 有哪些参数？

基本结构：

```css
box-shadow:
  offset-x
  offset-y
  blur-radius
  spread-radius
  color;
```

例如：

```css
box-shadow:
  0
  10px
  30px
  rgba(0,0,0,.15);
```

---

# 66. box-shadow 可以有多个吗？

可以：

```css
box-shadow:
  0 0 10px red,
  0 0 20px blue,
  0 0 30px green;
```

甚至可以利用：

```text
box-shadow
```

画复杂 CSS 图形。

---

# 67. 如何使用 CSS 实现渐变？

### 线性渐变

```css
background:
  linear-gradient(
    90deg,
    red,
    blue
  );
```

### 径向渐变

```css
background:
  radial-gradient(
    circle,
    white,
    blue
  );
```

### 锥形渐变

```css
background:
  conic-gradient(
    red,
    yellow,
    blue,
    red
  );
```

---

# 第九部分：Transform、Transition、Animation

---

# 68. transform 有什么作用？

进行二维 / 三维视觉变换。

例如：

```css
transform: translateX(100px);
transform: translateY(20px);
transform: scale(1.2);
transform: rotate(45deg);
transform: skew(20deg);
```

---

# 69. transform-origin 是什么？

定义：

> transform 的变换中心。

例如：

```css
transform-origin: left top;
```

旋转：

```css
transform: rotate(90deg);
```

就会围绕左上角旋转。

---

# 70. transition 和 animation 有什么区别？

### transition

更适合：

> 状态变化之间的过渡。

例如：

```css
.button {
  transition: transform .3s;
}

.button:hover {
  transform: scale(1.1);
}
```

### animation

更适合：

> 独立、连续、复杂动画。

例如：

```css
@keyframes loading {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(360deg);
  }
}
```

---

# 71. animation 有哪些核心属性？

```css
animation-name
animation-duration
animation-delay
animation-iteration-count
animation-direction
animation-fill-mode
animation-play-state
animation-timing-function
```

例如：

```css
animation:
  loading
  1s
  linear
  infinite;
```

---

# 72. animation-fill-mode 是什么？

控制：

> 动画执行前后，元素是否保留动画状态。

常见：

```css
animation-fill-mode: none;
animation-fill-mode: forwards;
animation-fill-mode: backwards;
animation-fill-mode: both;
```

最常见的是：

```css
forwards
```

表示：

> 动画结束后停留在最后一个关键帧。

---

# 73. animation-timing-function 是什么？

控制：

> 动画速度曲线。

例如：

```css
linear
ease
ease-in
ease-out
ease-in-out
```

也可以：

```css
cubic-bezier(...)
```

---

# 74. 为什么动画更推荐 transform 和 opacity？

因为：

```text
top
left
width
height
```

变化可能涉及：

```text
layout
```

甚至触发后续：

```text
paint
composite
```

而：

```text
transform
opacity
```

在很多场景更适合走 compositor 阶段。

所以动画通常优先：

```css
transform
opacity
```

但不能简单认为：

> transform 永远 GPU 加速、永远更快。

真正性能还要结合具体渲染场景分析。

---

# 第十部分：响应式与现代 CSS

---

# 75. 什么是媒体查询？

```css
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
```

根据：

```text
viewport
设备环境
用户偏好
```

改变样式。

---

# 76. calc() 有什么作用？

允许混合计算：

```css
width: calc(100% - 40px);
```

例如后台布局：

```css
height: calc(100vh - 64px);
```

---

# 77. min()、max()、clamp() 是什么？

### min

```css
width: min(100%, 1200px);
```

取最小值。

### max

```css
width: max(300px, 50%);
```

取最大值。

### clamp

```css
font-size:
  clamp(
    16px,
    2vw,
    32px
  );
```

表示：

```text
最小值
理想值
最大值
```

---

# 78. CSS 变量是什么？

```css
:root {
  --primary-color: #409eff;
  --radius: 8px;
}
```

使用：

```css
.button {
  color: var(--primary-color);
  border-radius: var(--radius);
}
```

好处：

```text
主题切换
设计系统
统一维护
动态修改
```

---

# 79. CSS 变量和 Sass 变量有什么区别？

例如 Sass：

```scss
$color: red;
```

属于：

> 编译时变量。

CSS：

```css
--color: red;
```

属于：

> 运行时自定义属性。

所以 CSS 变量可以：

```javascript
element.style.setProperty(
  '--color',
  'red'
);
```

动态修改。

这对 Vue / React 项目非常有用。

---

# 80. `:is()`、`:where()`、`:not()` 有什么区别？

例如：

```css
:is(h1, h2, h3) {}
```

可以简化多个选择器。

`:not()`：

```css
button:not(.disabled)
```

表示：

> 不是 `.disabled` 的 button。

`:where()`：

```css
:where(h1, h2, h3)
```

和 `:is()` 类似，但核心区别是：

> `:where()` 的 specificity 为 0。

---

# 第十一部分：高级选择器

---

# 81. `:has()` 是什么？

现代 CSS 的重要能力。

```css
.card:has(img) {
  padding: 0;
}
```

可以理解为：

> 匹配“包含某种后代结构”的元素。

例如：

```css
form:has(input:invalid) {
  border: 1px solid red;
}
```

以前很多场景需要 JS，现在 CSS 可以直接描述。

---

# 82. 伪类和伪元素有什么区别？

### 伪类

```css
:hover
:focus
:nth-child()
```

描述：

> 元素某种状态 / 条件。

### 伪元素

```css
::before
::after
::first-letter
```

描述：

> 元素的一部分或虚拟子内容。

---

# 83. ::before 和 ::after 为什么经常需要 content？

通常：

```css
.box::before {
  content: "";
}
```

因为它们是生成内容的伪元素。

例如：

```css
.box::before {
  content: "";
  position: absolute;
}
```

可以用于：

```text
装饰
遮罩
图标
小三角
动画
```

---

# 84. `:nth-child()` 和 `:nth-of-type()` 有什么区别？

例如：

```css
p:nth-child(2)
```

表示：

> p 必须是父元素的第二个子元素。

而：

```css
p:nth-of-type(2)
```

表示：

> 第二个 p。

这是非常容易被问到的细节。

---

# 第十二部分：图片与媒体

---

# 85. object-fit 是什么？

常用于：

```html
<img>
<video>
```

例如：

```css
img {
  width: 300px;
  height: 200px;
  object-fit: cover;
}
```

---

# 86. object-fit: cover 和 contain 有什么区别？

和 background：

```text
cover / contain
```

思路类似。

### cover

```text
填满容器
允许裁剪
```

### contain

```text
完整显示
允许留白
```

---

# 87. aspect-ratio 是什么？

例如：

```css
.video {
  width: 100%;
  aspect-ratio: 16 / 9;
}
```

表示：

> 宽高比保持 16:9。

适合：

```text
视频
图片
卡片
Banner
```

---

# 第十三部分：交互和视觉

---

# 88. opacity 是什么？

```css
opacity: 0.5;
```

范围：

```text
0 ~ 1
```

例如：

```css
opacity: 0;
```

完全透明。

---

# 89. filter 是什么？

例如：

```css
filter: blur(5px);
filter: grayscale(100%);
filter: brightness(.8);
filter: contrast(1.2);
```

可以用于：

```text
图片
模糊
灰度
亮度
对比度
```

---

# 90. filter 和 backdrop-filter 有什么区别？

### filter

作用于：

> 元素自身的渲染内容。

### backdrop-filter

作用于：

> 元素背后的内容。

例如玻璃拟态：

```css
.glass {
  background: rgb(255 255 255 / 20%);
  backdrop-filter: blur(20px);
}
```

---

# 91. pointer-events 有什么用？

例如：

```css
pointer-events: none;
```

表示：

> 鼠标指针事件不由该元素接收。

常用于：

```text
透明遮罩
装饰层
鼠标穿透
```

---

# 92. user-select 是什么？

控制文本选择。

```css
user-select: none;
```

可以让用户：

> 无法拖选该元素中的文字。

常用于：

```text
按钮
拖拽组件
游戏 UI
自定义控件
```

---

# 93. cursor 有哪些常见值？

```css
cursor: default;
cursor: pointer;
cursor: text;
cursor: not-allowed;
cursor: grab;
cursor: grabbing;
```

最常见：

```css
cursor: pointer;
```

---

# 第十四部分：CSS 性能

---

# 94. 什么是 reflow 和 repaint？

这是高级前端面试重点。

### Reflow

也叫：

```text
Layout
```

浏览器重新计算：

```text
尺寸
位置
布局
```

例如修改：

```text
width
height
margin
padding
top
left
```

可能引起布局计算。

### Repaint

重新绘制：

```text
颜色
背景
阴影
```

---

# 95. 如何减少强制同步布局？

例如代码：

```javascript
element.style.width = '100px';

console.log(element.offsetWidth);
```

前面修改布局，后面立即读取：

```text
offsetWidth
```

浏览器可能需要强制同步计算布局。

大规模 DOM 操作时尤其需要注意。

---

# 96. CSS 性能优化有哪些思路？

常见方向：

```text
减少复杂选择器
减少 DOM
避免频繁触发布局
动画优先 transform / opacity
合理使用 will-change
合理使用 contain
使用 content-visibility
避免过度阴影 / filter
```

---

# 97. will-change 是什么？

```css
will-change: transform;
```

告诉浏览器：

> 这个元素可能即将发生变化。

适合：

```text
动画
拖拽
高频变化元素
```

但不能滥用。

例如：

```css
* {
  will-change: transform;
}
```

就是非常糟糕的做法。

---

# 98. content-visibility 是什么？

例如：

```css
.content {
  content-visibility: auto;
}
```

浏览器可以对远离当前视口、暂时不需要绘制的内容减少工作。

适合：

```text
超长页面
长列表
复杂内容区域
```

特别适合大页面性能优化。

---

# 第十五部分：现代 CSS 与综合题

---

# 99. 什么是 Container Query？

传统响应式：

```css
@media
```

主要依赖：

> viewport 宽度。

Container Query 则可以根据：

> 父容器尺寸

决定组件如何表现。

例如：

```css
.card-wrapper {
  container-type: inline-size;
}
```

然后：

```css
@container (min-width: 500px) {
  .card {
    display: grid;
  }
}
```

这对于现代组件化 UI 非常重要。

---

# 100. 面试官让你“从零做一个响应式后台管理系统”，你怎么做？

这是最终综合题。

我会这样组织答案。

---

## 第一层：整体布局

```text
Sidebar
Header
Main
```

使用：

```css
display: grid;
```

或者：

```css
display: flex;
```

例如：

```css
.layout {
  display: grid;

  grid-template-columns:
    240px
    1fr;

  grid-template-rows:
    64px
    1fr;

  min-height: 100vh;
}
```

---

## 第二层：内容布局

Dashboard：

```css
.dashboard {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(240px, 1fr)
    );

  gap: 20px;
}
```

---

## 第三层：移动端

使用：

```css
@media
```

例如：

```css
@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }
}
```

---

## 第四层：固定 / 粘性区域

例如：

```css
.header {
  position: sticky;
  top: 0;
}
```

---

## 第五层：层级

Modal：

```css
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
}
```

---

## 第六层：设计系统

```css
:root {
  --primary: #409eff;
  --text: #303133;
  --border: #e5e7eb;
  --radius: 8px;
  --space: 16px;
}
```

---

## 第七层：动画

例如：

```css
.button {
  transition:
    transform .2s,
    opacity .2s;
}

.button:hover {
  transform: translateY(-2px);
}
```

---

# 最值得你重点背的 20 道

如果临近面试，没有时间全部复习，优先吃透下面这些：

```text
01  CSS specificity
02  盒模型
03  box-sizing
04  margin collapse
05  BFC
06  display:none / visibility / opacity
07  position
08  absolute 定位参考
09  sticky 原理
10  stacking context
11  z-index
12  Flex 主轴 / 交叉轴
13  flex:1
14  flex-grow / shrink / basis
15  Flex vs Grid
16  单行/多行文字省略
17  em vs rem
18  transform / transition / animation
19  reflow / repaint
20  will-change / content-visibility
```

---

# 再往上一层：真正的 CSS 面试知识树

建议你把 CSS 的学习顺序理解成：

```text
                    CSS
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
      属性                      规则
        │                         │
 margin/padding/etc        specificity
        │                         │
        ↓                         ↓
     盒模型                      Cascade
        │                         │
        ↓                         ↓
     文档流                 stacking context
        │                         │
   ┌────┼────┐                    │
   ↓    ↓    ↓                    │
 block float position             │
            │                     │
            ↓                     ↓
        Flex / Grid          z-index
            │
            ↓
       响应式布局
            │
            ↓
       Transform
            │
            ↓
     Transition / Animation
            │
            ↓
       浏览器渲染
            │
       ┌────┴────┐
       ↓         ↓
     Layout    Paint
                 │
                 ↓
              Composite
                 │
                 ↓
             性能优化
```

真正到了中高级前端面试，面试官往往不是单独问：

> “你知道 `display:flex` 吗？”

而是会不断追问：

```text
为什么？
↓
底层规则是什么？
↓
为什么这个属性不生效？
↓
换一种布局方案呢？
↓
有没有性能问题？
↓
浏览器底层做了什么？
```

因此，**CSS 面试最值得形成的一套能力不是“背属性”，而是从一个 CSS 属性一路追到浏览器布局和渲染机制。**
