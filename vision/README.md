# Vision

该目录用于游戏窗口捕获、定时抽帧、固定区域裁剪、英雄装备识别、多帧稳定和人工纠错。

视觉模块不得读取游戏内存或自动操作游戏客户端。

## 第一周状态

已确定 Windows 安卓模拟器、准备阶段商店卡牌图像为首个识别场景。模拟器型号、游戏客户区分辨率、Windows 缩放比例、实际截图及精确坐标待确认，尚未实现窗口捕获或识别。

- [范围与环境记录](../docs/member-b/week1/识别范围与环境记录.md)
- [方案选择说明](../docs/member-b/week1/视觉方案选择.md)
- [`configs/emulator-shop.example.json`](configs/emulator-shop.example.json)：待标定配置样例，不能用于运行捕获。
- [`samples/manifest.example.json`](samples/manifest.example.json)：截图标注格式示例，没有真实样本。

个人原始截图保存到 `data/raw/screenshots/member-b/`（Git 已忽略）。只有脱敏后经人工核对的截图才可以单独加入评审材料；不得把屏幕示意图当作真实截图或实验数据。

## 第二周实机配置

MuMu v6.8.7、1920×1092、DPI 273 的配置见 [`configs/emulator-shop-1920x1092.json`](configs/emulator-shop-1920x1092.json)。该配置已通过 14 张截图的分辨率和区域越界检查，但尚未完成英雄模板识别准确率验证。

识别流程、稳定规则和异常降级见 [`docs/member-b/week2/视觉识别流程图.md`](../docs/member-b/week2/视觉识别流程图.md)。

## 一费卡识别 MVP

已根据 DataJ S18 / 18.4 图鉴的“1费”筛选建立模板库。页面共有 15 条一费卡统计记录，其中阿卡丽重复两条且使用同一头像，因此识别器包含 14 个不同视觉类别。

实现文件：

- `one_cost_manifest.json`：15 条统计记录、14 类视觉模板的名称与来源说明。
- `templates/s18_18_4/one_cost_dataj/`：本地离线原画模板。
- `recognize_one_cost.py`：固定五卡位裁剪、费用颜色过滤、模板相似度与未知类拒识。
- `tests/fixtures/`：只保留商店卡片区域的脱敏实机测试图。

运行识别：

```powershell
& 'D:\Python\python.exe' vision\recognize_one_cost.py `
  'D:\创新实践课程\jcc 截图\Screenshots\你的截图.png'
```

运行测试：

```powershell
& 'D:\Python\python.exe' -m unittest discover -s vision/tests -v
```

当前 MVP 只接受 1920×1092 截图，只识别五个固定商店卡位中的一费卡。非一费卡、相似度不足或第一第二候选差距过小的卡位输出“未知”，交由前端人工修正，避免强行误报。

