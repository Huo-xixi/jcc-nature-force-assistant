# 金铲铲之战智能推荐系统 GitHub 协作规范

## 1 仓库方案

- 仓库建议名称：`jcc-nature-force-assistant`
- 仓库可见性：课程开发阶段建议设为 Private，结项后再决定是否公开
- 默认分支：`main`
- 日常集成分支：`develop`
- 两位成员都以 Collaborator 身份加入同一个仓库

## 2 分支结构

| 分支 | 用途 | 负责人 |
| --- | --- | --- |
| `main` | 保存可运行、可演示和可提交的稳定版本 | 两人共同维护 |
| `develop` | 汇总已经基本完成的功能 | 两人共同维护 |
| `feature/data-recommendation` | 数据采集、数据库和推荐算法 | 成员 A |
| `feature/backend-api` | FastAPI 后端接口 | 成员 A |
| `feature/frontend` | Vue 前端页面 | 成员 B |
| `feature/vision` | 实时画面采集和视觉识别 | 成员 B |
| `docs/report` | 项目文档、报告和 PPT 素材 | 按需要创建 |

禁止直接在 `main` 上开发。所有功能先合并到 `develop`，经过集成测试后再合并到 `main`。

## 3 推荐目录结构

```text
jcc-nature-force-assistant/
├─ backend/                 # FastAPI 后端
│  ├─ app/
│  │  ├─ api/              # 接口路由
│  │  ├─ models/           # 数据模型
│  │  ├─ services/         # 推荐和分析逻辑
│  │  └─ main.py
│  ├─ tests/
│  └─ requirements.txt
├─ frontend/                # Vue 前端
│  ├─ src/
│  └─ package.json
├─ vision/                  # 实时视觉识别
│  ├─ capture/              # 窗口捕获与抽帧
│  ├─ recognition/          # 模板匹配或 YOLO
│  ├─ configs/              # 识别区域配置
│  └─ tests/
├─ data/
│  ├─ raw/                  # 原始数据，不直接用于程序
│  ├─ processed/            # 清洗后的 18.4 数据
│  └─ sources/              # 来源和采集记录
├─ docs/                    # 需求、设计、计划和报告
├─ scripts/                 # 初始化、数据导入和启动脚本
├─ .github/
│  ├─ workflows/            # 自动测试
│  ├─ ISSUE_TEMPLATE/
│  └─ pull_request_template.md
├─ .gitignore
├─ README.md
└─ LICENSE
```

## 4 首次建立仓库

由其中一名成员执行：

1. 在 GitHub 创建空仓库 `jcc-nature-force-assistant`。
2. 将另一名成员添加为 Collaborator。
3. 在项目目录初始化 Git。
4. 添加 `.gitignore`、`README.md` 和现有文档。
5. 创建首次提交并推送 `main`。
6. 从 `main` 创建 `develop` 并推送。
7. 在 GitHub 设置中保护 `main` 分支。

推荐命令：

```bash
git init
git add .
git commit -m "chore: initialize project structure"
git branch -M main
git remote add origin <GitHub仓库地址>
git push -u origin main
git switch -c develop
git push -u origin develop
```

不要把真实仓库地址、账号令牌或密码写入文档和代码。

## 5 日常开发流程

### 开始任务

先同步 `develop`，再创建自己的功能分支：

```bash
git switch develop
git pull origin develop
git switch -c feature/功能名称
```

### 开发和提交

每完成一个可说明的修改进行一次提交：

```bash
git add <相关文件>
git commit -m "feat: implement lineup scoring"
git push -u origin feature/功能名称
```

### 合并功能

1. 在 GitHub 创建 Pull Request，目标分支选择 `develop`。
2. 填写改动内容、测试方法、截图和已知问题。
3. 由另一名成员进行代码审查。
4. 自动测试通过并处理审查意见后再合并。
5. 完成阶段版本后，从 `develop` 创建 PR 合并到 `main`。

## 6 提交信息规范

| 类型 | 用途 | 示例 |
| --- | --- | --- |
| `feat` | 新功能 | `feat: add equipment recommendation API` |
| `fix` | 修复问题 | `fix: correct trait score calculation` |
| `data` | 数据更新 | `data: add S18 version 18.4 champions` |
| `test` | 增加或修改测试 | `test: add recommendation ranking cases` |
| `docs` | 文档更新 | `docs: update two-person work plan` |
| `refactor` | 重构但不改变功能 | `refactor: separate scoring service` |
| `chore` | 构建或工程配置 | `chore: configure project dependencies` |

一次提交只解决一个主要问题，避免使用“修改”“更新”“完成”等无法判断内容的提交信息。

## 7 Pull Request 要求

每个 PR 至少说明：

- 本次完成的功能。
- 涉及的模块和文件。
- 本地测试方法与测试结果。
- 接口或数据格式是否发生变化。
- 页面改动的截图或录屏。
- 未解决的问题和后续任务。

合并条件：

1. 另一名成员已审查。
2. 程序可以正常启动。
3. 相关测试通过。
4. 没有提交账号、密钥、大型临时文件和个人配置。
5. 接口变化已经同步更新文档。

## 8 GitHub Issues 和任务管理

每项工作建立一个 Issue，并使用以下标签：

- `backend`：后端功能
- `frontend`：前端功能
- `algorithm`：推荐算法
- `vision`：视觉识别
- `data`：游戏数据
- `documentation`：文档与报告
- `bug`：缺陷
- `P0`：必须完成
- `P1`：建议完成
- `blocked`：当前无法继续

Issue 内容至少包括任务目标、验收标准、负责人和计划完成日期。PR 中使用 `Closes #编号` 关联对应任务。

## 9 分支保护建议

在 GitHub 为 `main` 设置：

- 必须通过 Pull Request 合并。
- 至少需要 1 人审查通过。
- 禁止强制推送。
- 合并前必须解决所有讨论。
- 配置自动测试后，要求检查通过才能合并。

`develop` 可以允许两名成员合并，但仍建议通过 PR 保留审查记录。

## 10 文件管理规则

可以提交：

- 源代码和配置示例
- 清洗后的课程演示数据
- 小型测试图片
- 需求、设计、测试和报告文档
- 启动脚本和依赖清单

不要提交：

- GitHub Token、账号密码和 `.env`
- Python 虚拟环境、`node_modules` 和缓存
- 数据库临时文件和日志
- 完整游戏录屏、大型模型训练缓存
- 未确认许可的大量第三方图片

大型模型权重和演示视频建议通过 GitHub Release、Git LFS 或网盘共享，并在 README 中说明获取方法。

## 11 冲突处理

1. 开始开发前先拉取最新 `develop`。
2. 两人不要同时修改同一个数据文件或核心配置文件。
3. 出现冲突时，由实际理解该模块的人解决，另一人复核。
4. 禁止用强制推送覆盖对方的提交。
5. 无法确定时保留双方修改并共同讨论，不随意删除代码。

## 12 版本发布

建议建立以下里程碑版本：

| 版本 | 目标 | 计划时间 |
| --- | --- | --- |
| `v0.1.0` | 数据库和基础查询可用 | 11 月 15 日 |
| `v0.2.0` | AI 推荐算法和接口可用 | 11 月 29 日 |
| `v0.3.0` | 前后端核心闭环完成 | 12 月 6 日 |
| `v0.4.0` | 实时视觉识别接入 | 12 月 13 日 |
| `v1.0.0` | 测试、文档和汇报版本 | 12 月 27 日 |

每次发布创建 GitHub Release，并附上功能说明、启动方式、已知问题和演示截图。

## 13 两人使用流程示例

成员 A 开发推荐算法：

```text
建立 Issue -> 创建 feature/data-recommendation -> 编码和测试
-> 推送分支 -> 创建 PR 到 develop -> 成员 B 审查 -> 合并
```

成员 B 开发视觉识别：

```text
建立 Issue -> 创建 feature/vision -> 编码和测试
-> 推送分支 -> 创建 PR 到 develop -> 成员 A 审查 -> 合并
```

每周将能够运行的功能合并到 `develop`，阶段检查前再将 `develop` 合并到 `main` 并创建版本标签。

