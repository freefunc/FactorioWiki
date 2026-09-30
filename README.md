# 异星工厂 2.1 中文 Wiki

一个可直接运行的中文资料查询站，覆盖 Factorio 本体与「太空时代」扩展。首版包含 **48 个精选物品配方、4 篇机制指南**，不是完整游戏数据库。

## 本地开发

需要 Node.js 20.19+ 或 22.12+（建议当前 LTS）。

```sh
npm ci
npm run dev
```

默认打开 `http://localhost:5173`。

```sh
npm test
npm run build
npm run preview
```

构建产物在 `dist/`，可部署到任意静态网站托管平台。不需要服务端、账号或 API 密钥。

## 已实现

- 中文名称、英文标识与常用俗称搜索（绿板、红板、蓝瓶等）。
- 分类导航，以及本体 / 太空时代筛选。
- 物品详情、投入与产出、基础耗时、地表制造条件。
- 原料词条跳转、下游配方索引、可分享的 hash 地址。
- 每条资料附官方来源；手机布局、键盘焦点和 `/` 搜索快捷键。

## 数据与版本

数据固定于 Wube 官方 [factorio-data 2.1.20](https://github.com/wube/factorio-data/tree/2.1.20)，提交 `40ec3dbe6f88a96899bbd2fefbd6800cac6c1e71`。该版本更新日志日期为 2026-09-22。网站不会自动获取新版本。

- `src/data/recipes.json`：可追溯到原始文件行号的配方快照。
- `scripts/import-recipes.py`：精选列表与固定版本导入器。
- `src/data/mechanics.js`：机制说明、依据与关联词条。
- `src/catalog.js`：搜索、筛选和地址解析。
- `src/main.js`、`src/style.css`：界面与响应式样式。

复现数据导入：

```sh
git clone --depth 1 --branch 2.1.20 https://github.com/wube/factorio-data.git /tmp/factorio-data-2.1.20
python3 scripts/import-recipes.py /tmp/factorio-data-2.1.20
npm test
```

导入器校验提交 SHA，仅读取精选配方中的字面量字段，不执行 Lua 或完整的游戏模组加载流程。遇到不支持的随机原料/产出格式时会失败，避免默默生成错误数据。基础时间缺省值为 0.5 秒，界面明确标记。

当前不模拟品质、插件、科技、机器速度与第三方模组，也不列出完整机器兼容性。太空时代会在加载过程中追加部分制造类别，故不应将基础原型的类别当成全部可用机器。增加新配方或升级版本时，必须检查 `data-updates` 等加载阶段是否会覆盖字段。首版未收录原型在太空时代中被覆盖的火箭组件配方。

中文名称与说明为本站整理，并非官方本地化文本。界面不打包游戏贴图。Factorio 及相关游戏内容属于 Wube Software，本项目是非官方资料站。现有 `LICENSE` 保留用于项目代码，不代表授予游戏资产的权利。

## 后续扩展

可逐步补充科技解锁、物品堆叠量、机器属性与完整物品库。如果需要可靠的全量模组数据，应改用 Factorio 实际加载模组后的数据导出，避免把文本解析器当作 Lua 运行环境。
