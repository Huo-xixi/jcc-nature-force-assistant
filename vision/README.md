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

