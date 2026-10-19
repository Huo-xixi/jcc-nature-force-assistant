# 后端 API 接口文档 V1

## 1. 约定

- 基础地址：`http://127.0.0.1:8000`
- 业务前缀：`/api/v1`
- 数据格式：UTF-8 JSON
- 当前赛季：`S18`
- 当前版本：`18.4`
- ID：前后端只传稳定 ID，中文名称仅用于显示。
- 重复的英雄 ID 按一次处理；装备 ID 可重复，表示持有多个相同散件。

接口状态：`已实现` 表示当前后端可调用；`V1 约定` 表示字段已经冻结、将在基础查询阶段实现，前端可以据此制作模拟数据。

## 2. 接口清单

| 状态 | 方法 | 路径 | 用途 |
| --- | --- | --- | --- |
| 已实现 | GET | `/health` | 服务与数据快照检查 |
| 已实现 | GET | `/api/v1/data/summary` | 数据规模和版本摘要 |
| 已实现 | POST | `/api/v1/recommendations` | 生成 Top K 阵容推荐 |
| V1 约定 | GET | `/api/v1/versions` | 查询版本 |
| V1 约定 | GET | `/api/v1/champions` | 查询英雄列表 |
| V1 约定 | GET | `/api/v1/champions/{id}` | 查询英雄详情 |
| V1 约定 | GET | `/api/v1/items` | 查询装备列表 |
| V1 约定 | GET | `/api/v1/items/compose` | 两件散件正向合成 |
| V1 约定 | GET | `/api/v1/items/{id}/recipe` | 成装反向拆解 |
| V1 约定 | GET | `/api/v1/traits` | 查询羁绊 |
| V1 约定 | GET | `/api/v1/lineups` | 查询阵容模板 |
| V1 约定 | POST | `/api/v1/lineups/analyze` | 分析用户阵容 |
| V1 约定 | POST | `/api/v1/vision/confirm` | 提交人工确认后的识别结果 |

## 3. 已实现接口

### 3.1 健康检查

`GET /health`

```json
{
  "status": "ok",
  "dataset": "jcc-s18-18.4-pilot"
}
```

### 3.2 数据摘要

`GET /api/v1/data/summary`

```json
{
  "dataset_id": "jcc-s18-18.4-pilot",
  "season": "S18",
  "version": "18.4",
  "champions": 41,
  "traits": 27,
  "items": 32,
  "lineups": 10
}
```

### 3.3 阵容推荐

`POST /api/v1/recommendations`

请求：

```json
{
  "champion_ids": ["1507", "2512", "2502"],
  "item_ids": ["bf_sword", "tear_of_the_goddess", "recurve_bow"],
  "top_k": 3
}
```

响应：

```json
[
  {
    "lineup_id": "dataj_110_varus",
    "lineup_name": "射箭韦鲁斯",
    "score": 34.2,
    "breakdown": {
      "champion_match": 16.88,
      "item_fit": 5.0,
      "trait_coverage": 7.5,
      "meta_strength": 4.82
    },
    "missing_core_champions": ["慎", "蕾欧娜", "洛"],
    "craftable_recommended_items": ["朔极之矛", "巨人捕手"],
    "explanation": [
      "已拥有阵容中的 3/8 名英雄。",
      "英雄个人羁绊尚未完整核验，本项暂按阵容成员覆盖率估算。",
      "现有装备可直接满足或合成 2/10 件推荐成装。"
    ]
  }
]
```

参数约束：

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `champion_ids` | string[] | 默认空数组；未知 ID 不计分 |
| `item_ids` | string[] | 默认空数组；保留重复项 |
| `top_k` | integer | 1–10，默认 3 |

## 4. 查询接口 V1 约定

### 4.1 英雄列表

`GET /api/v1/champions?version=18.4&cost=2&trait_id=berserker&q=狼`

```json
{
  "items": [
    {
      "id": "2508",
      "name": "沃里克",
      "cost": 2,
      "trait_ids": ["berserker"],
      "role_tags": ["melee_carry"],
      "version": "18.4"
    }
  ],
  "total": 1
}
```

### 4.2 装备正向合成

`GET /api/v1/items/compose?component_a=bf_sword&component_b=tear_of_the_goddess`

```json
{
  "result": {
    "id": "spear_of_shojin",
    "name": "朔极之矛",
    "component_ids": ["bf_sword", "tear_of_the_goddess"]
  }
}
```

找不到合法组合时返回 `404 ITEM_RECIPE_NOT_FOUND`。

### 4.3 阵容列表

`GET /api/v1/lineups?version=18.4&tier=S`

每项至少返回阵容 ID、名称、梯度、英雄 ID、主要羁绊和统计快照。详情中的来源 URL 只用于“数据来源”展示，不由前端实时抓取。

## 5. 视觉确认接口 V1 约定

`POST /api/v1/vision/confirm`

```json
{
  "frame_time": "2026-11-30T20:30:00+08:00",
  "source": "game_window",
  "champions": [
    {"id": "1507", "name": "韦鲁斯", "confidence": 0.93, "confirmed": true}
  ],
  "items": [
    {"id": "bf_sword", "name": "暴风大剑", "confidence": 0.89, "confirmed": true}
  ]
}
```

后端只接收 `confirmed=true` 的记录，并转换为推荐请求；低置信度结果必须先由前端确认，不自动进入推荐。

## 6. 错误响应

```json
{
  "error": {
    "code": "UNKNOWN_CHAMPION_ID",
    "message": "存在当前版本无法识别的英雄 ID。",
    "details": {"ids": ["unknown"]}
  }
}
```

| HTTP 状态 | 使用场景 |
| --- | --- |
| 400 | 参数组合无效、跨版本输入 |
| 404 | 版本或实体不存在 |
| 422 | 字段类型、范围不符合 Schema |
| 500 | 未处理的服务端错误 |

错误信息不得包含本地绝对路径、调用栈、账号或密钥。

## 7. 接口冻结规则

1. V1 发布后不删除字段、不改变字段含义。
2. 新字段优先设计为可选字段，保证成员 B 的模拟数据仍能使用。
3. 破坏性变更必须升级 `/api/v2`。
4. OpenAPI 页面由 FastAPI 自动生成，地址为 `/docs`。
5. 接口实现与文档不一致时，以自动化测试和本文件同步修改后的版本为准。
