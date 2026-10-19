# Data

该目录保存 S18「自然之力」版本化数据。

- `raw`：原始采集数据，仅用于清洗和核对
- `processed`：程序读取的规范化数据
- `sources`：数据来源、采集时间和许可说明

数据记录至少包含 `season`、`version`、`id`、`name`、`source_url` 和 `collected_at`。

当前样例快照位于 `processed/s18_18_4`。运行以下命令检查 JSON 格式、ID 唯一性、跨表引用、配方和版本一致性：

```powershell
python scripts/validate_sample_data.py
```

来源登记在 `sources/s18_18_4_sources.json`。当前数据仅用于算法联调，扩充数据时应新建或更新对应版本快照，并保留来源记录。

