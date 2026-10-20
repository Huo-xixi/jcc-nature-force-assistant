# Frontend

该目录用于 Vue 前端，包括数据浏览、资源选择、阵容推荐、阵容分析和视觉识别确认页面。

## 第一周交互草图

打开 [`prototypes/week1/index.html`](prototypes/week1/index.html) 即可使用单页演示工作台。操作被简化为“上传截图 → 人工修正英雄 → 生成阵容推荐”，支持直接双击打开，无需安装依赖。

也可在仓库根目录运行：

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory frontend/prototypes/week1
```

浏览器访问 `http://127.0.0.1:4173`。使用后在终端按 Ctrl+C 停止。

本周交付的是 HTML/CSS/JavaScript 交互原型，正式 Vue 3 + Vite + TypeScript 工程尚未初始化。截图可以真实上传并在本地预览；启动 FastAPI 后，页面会调用 `/api/v1/vision/recognize-one-cost` 识别商店中的一费卡。未启动服务时页面会明确报错，不会用模拟结果冒充真实识别；备用演示按钮仍使用固定案例。

检查输入与确认语义：

```powershell
node --test frontend/prototypes/week1/resource-model.test.cjs
```

推荐快照取自成员 A 的 `99a6e39` 后端，固定输入为 `1507 / 2512 / 2502` 和 `bf_sword / tear_of_the_goddess / recurve_bow`，前三名及分数为射箭韦鲁斯 34.20、卡丽蜜儿 30.78、森林妖姬天使 25.80。浏览器只读取自身的 `fixtures.js`，不直接读取后端数据文件。

真实上传时置信度来自本地模板匹配；演示按钮的置信度为模拟值。每个候选英雄都可以下拉改名、取消纳入、删除或人工补录，只有被勾选的英雄才会参与推荐。

第一周交付索引见 [`docs/member-b/week1/README.md`](../docs/member-b/week1/README.md)。

## 第二周设计

- 正式 Vue 路由、组件和 Pinia 状态设计：[`docs/member-b/week2/前端目录与状态设计.md`](../docs/member-b/week2/前端目录与状态设计.md)
- 与 API V1 一致的模拟请求和响应：[`mocks/`](mocks/)
- 第二周交付索引：[`docs/member-b/week2/README.md`](../docs/member-b/week2/README.md)

## Playwright 验证

仓库根目录已经初始化 Playwright 1.64.1。首次拉取后运行 `npm install` 和 `npx playwright install chromium`，随后可执行：

```powershell
npm test                # Chromium 端到端测试
npm run test:unit       # 资源输入与确认逻辑单元测试
npm run test:prototype  # 独立原型冒烟脚本并刷新评审截图
```

