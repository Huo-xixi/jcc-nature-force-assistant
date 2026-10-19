# 金铲铲之战自然之力智能推荐系统

面向《金铲铲之战》S18「自然之力」18.4 版本的实时视觉分析与智能推荐系统。

系统计划通过 OpenCV 获取游戏窗口画面，识别英雄和装备信息，再结合英雄、装备、羁绊与阵容数据，提供阵容推荐、装备分配、阵容短板分析和可解释评分。系统只进行画面分析与决策辅助，不读取游戏内存，不自动控制游戏。

## 核心功能

- 英雄、装备、羁绊与阵容数据查询
- 装备合成与英雄装备推荐
- 根据已有英雄和装备生成 Top K 阵容建议
- 阵容羁绊、前排、输出、控制和续航分析
- 实时画面捕获与英雄装备识别
- 识别结果人工确认与纠错
- 推荐分项评分与自然语言解释

## 技术栈

- 后端：Python、FastAPI、SQLite
- 前端：Vue
- 视觉：OpenCV，必要时使用 YOLO
- 协作：GitHub Issues、Pull Requests、GitHub Actions

## 项目结构

```text
backend/       后端接口与推荐算法
frontend/      Vue 前端
vision/        实时画面采集与视觉识别
data/          原始数据、清洗数据和来源记录
docs/          需求、计划、设计和报告
scripts/       数据导入与项目辅助脚本
```

## 当前进度

- [x] 项目立项
- [x] 需求分析
- [x] 项目实施计划
- [x] 系统总体设计
- [x] 自然之力 18.4 可审计样例数据集（10 套阵容）
- [x] 可解释推荐算法原型
- [ ] 前后端核心流程
- [ ] 实时视觉识别
- [ ] 测试、报告与答辩材料

## 开发流程

日常开发从 `develop` 创建功能分支，通过 Pull Request 合并回 `develop`。阶段版本经过集成测试后再合并到 `main`。

总体方案参见 [系统总体设计](docs/系统总体设计.md)，字段定义参见 [数据字典](docs/数据字典.md)。

第二周设计交付：

- [数据库设计](docs/数据库设计.md)
- [后端 API 接口文档 V1](docs/API接口文档V1.md)
- [用例、功能结构与推荐流程图](docs/第二周设计图.md)
- [界面低保真原型](docs/界面低保真原型.md)
- [第 2 周进度记录](docs/周报/第2周进度记录.md)

## 本地运行

```powershell
python scripts/validate_sample_data.py
python -m unittest discover -s backend/tests -v
pip install -r backend/requirements.txt
python -m uvicorn app.main:app --app-dir backend --reload
```

启动后可访问 `http://127.0.0.1:8000/docs` 调试接口。推荐接口示例输入：

```json
{
  "champion_ids": ["3509", "4500", "1511"],
  "item_ids": ["recurve_bow", "needlessly_large_rod"],
  "top_k": 3
}
```

## 数据与版本

- 目标赛季：S18「自然之力」
- 基准版本：18.4
- 数据策略：保存本地版本快照，后续平衡更新不覆盖历史实验数据
- 数据来源：记录原始页面、采集时间和版本，并在使用前核对网站规则与素材许可

## 项目状态

本项目为课程创新实践项目，目前已完成总体设计、18.4 小样本数据层和推荐后端原型。

