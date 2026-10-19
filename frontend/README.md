# Frontend

该目录用于 Vue 前端，包括数据浏览、资源选择、阵容推荐、阵容分析和视觉识别确认页面。

## 第一周交互草图

打开 [`prototypes/week1/index.html`](prototypes/week1/index.html) 即可查看首页、资源输入、推荐列表、阵容详情和识别确认五个页面。支持直接双击打开，无需安装依赖。

也可在仓库根目录运行：

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory frontend/prototypes/week1
```

浏览器访问 `http://127.0.0.1:4173`。使用后在终端按 Ctrl+C 停止。

本周交付的是 HTML/CSS/JavaScript 交互草图，正式 Vue 3 + Vite + TypeScript 工程尚未初始化。草图只展示固定案例，不调用游戏、后端或识别模型。

检查输入与确认语义：

```powershell
node --test frontend/prototypes/week1/resource-model.test.cjs
```

推荐快照取自成员 A 的 `99a6e39` 后端，固定输入为 `1507 / 2512 / 2502` 和 `bf_sword / tear_of_the_goddess / recurve_bow`，前三名及分数为射箭韦鲁斯 34.20、卡丽蜜儿 30.78、森林妖姬天使 25.80。浏览器只读取自身的 `fixtures.js`，不直接读取后端数据文件。

置信度为模拟值；商店英雄必须由用户核对并明确确认在游戏中已经购入，才允许合并到已有资源。对任意手动输入只生成 API 请求预览，不伪装成已计算推荐。后续 Vue 实现应沿用这些输入语义。

第一周交付索引见 [`docs/member-b/week1/README.md`](../docs/member-b/week1/README.md)。

