# 低代码表单搭建平台（Vue 3 版）

基于 Vue 3 + Vite 的可配置表单搭建器：左侧**组件库**、中间**画布**（拖拽编辑）、右侧**属性配置**，并支持**多端预览**、**JSON Schema 导入导出**。后端以 `public/mockData.json` 模拟。

## 快速开始

```bash
npm install
npm run dev        # 浏览器自动打开 http://localhost:5173
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览构建产物
```

环境要求：Node.js ≥ 18。

## 目录结构

```
├── index.html
├── package.json / vite.config.js
├── public/mockData.json        # Mock 数据源（表单、提交记录）
├── docs/
│   ├── 01-方案设计.md          # 架构、Schema、数据流、扩展点
│   ├── 02-模块功能.md          # 各文件/模块职责说明
│   └── 03-使用说明.md          # 操作指南、快捷键、FAQ
└── src/
    ├── main.js / App.vue / styles.css
    ├── api/index.js            # Mock API（可替换为真实后端）
    ├── schema/registry.js      # 组件注册表 + 节点工厂
    ├── schema/logic.js         # 初始值 / 显隐 / 校验 / 取值收集
    ├── store/builder.js        # 全局状态与编辑操作（含撤销重做、拖拽）
    └── components/             # Toolbar / ComponentPanel / Canvas / CanvasNode
                                # ConfigPanel / FormRenderer / RenderNode
                                # FieldControl / FieldBox / JsonView
```

## 功能一览

- 布局组件：两列栅格、三列栅格、分组卡片（可嵌套）、分割线
- 基础控件：单行/多行文本、数字、下拉、单选组、多选组、开关、日期、文件上传、评分
- 拖拽新增 / 拖拽排序（含跨容器）、点击添加、复制、删除、撤销/重做
- 属性配置：标签、字段标识、占位、默认值、栅格宽度、必填、只读、选项、校验规则、显隐条件
- 表单属性：标题、描述、标签位置；事件：提交按钮文案、成功提示
- 预览：桌面 / 平板 / 手机三种宽度，真实校验与提交（写入 Mock）
- JSON：查看、编辑、复制、下载、应用回画布
- 保存 / 发布（Mock），多表单切换与新建
