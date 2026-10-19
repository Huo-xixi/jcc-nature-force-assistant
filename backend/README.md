# Backend

该目录用于 FastAPI 接口、SQLite 数据访问、推荐算法与阵容分析服务。

当前子模块：

- `app/api`：接口路由
- `app/models`：数据模型
- `app/services`：推荐与阵容分析逻辑
- `tests`：后端与算法测试

## 运行

在仓库根目录执行：

```powershell
pip install -r backend/requirements.txt
python -m uvicorn app.main:app --app-dir backend --reload
```

接口：

- `GET /health`：服务和数据版本检查
- `GET /api/v1/data/summary`：返回当前数据快照规模
- `POST /api/v1/recommendations`：根据已有英雄和装备返回 Top K 阵容、分项评分和解释

当前推荐权重是可解释的课程基线：英雄匹配 45%、装备适配 25%、羁绊覆盖 20%、公开强度 10%。

SQLite V1 建表设计位于 `app/db/schema.sql`。当前运行时仍读取冻结 JSON；后续导入 SQLite 后会通过相同 Repository 接口切换数据源。

