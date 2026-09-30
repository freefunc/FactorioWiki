# 异星工厂 2.1 中文 Wiki

简化 Wiki 风格的中文配方查询站。数据固定于 **Factorio 2.1.20**：本体 204 条制造／发射记录，太空时代 331 条制造记录和 281 条回收记录。两个游戏配置单独显示，数量有重叠，不可相加。

## 开发与检查

Node.js 22.12+（建议 24 LTS），`npm ci`，`npm run dev`。

- `npm test`：数据完整性、配方差异、概率产出、中文搜索和物品关联。
- `npm run build`：生成 `dist/`。Sites 项目标识与静态目录见 `.openai/hosting.json`。
- `npm run check:static`：构建后检查全部静态页面的本地链接、资源及预渲染正文。
- `npm run preview`：预览构建产物。

## React 与静态生成

采用 **Astro + React SSG**，构建输出为纯静态文件，不需要 Node 服务端。`src/pages/[...path].astro` 在构建时为两个版本的配方、物品、分类筛选及机制指南生成独立 HTML。

- `src/components/Wiki.jsx`：React 详情页组件，只在构建时渲染，不加载浏览器端 React。
- `src/components/Catalog.jsx`：预渲染目录，使用 React island 增强即时搜索；浏览器只收到当前游戏配置的搜索摘要，完整配方数据留在构建端。
- `src/layouts/Layout.astro`：公共页面、样式和旧链接兼容。
- `/base/`、`/space/`：两个版本的目录；`/base/recipes/rocket-part/` 等是真实静态详情路径。
- `/space/catalog/materials/recycling/` 等分类／类型组合也预生成；搜索通过 `?q=绿板` 保留和分享。
- 无 JavaScript 时仍可浏览目录、分类、配方、上下游关联及机制指南；即时搜索与旧 hash 链接跳转需要 JavaScript。
- 根路径默认显示太空时代，兼容原有 `#scope=base`、`#article=...`、`#item=...` 和搜索链接。

受限环境可设置 `ASTRO_TELEMETRY_DISABLED=1` 避免 Astro 写入用户配置目录。

## 数据来源与复现

配方、中文本地化和图标来自 [FactorioLab](https://github.com/factoriolab/factoriolab/tree/b74bcd7dd53af83c68384373932689fffe402fe8) 的游戏导出，固定提交 `b74bcd7dd53af83c68384373932689fffe402fe8`。

- 本体：`public/data/2.1/`。
- 太空时代（含品质、高架铁路）：`public/data/2x1/`。
- 两份导出的组件版本均为 `2.1.20`。
- `scripts/import-catalog.py` 验证提交及组件版本，批量导入制造设备支持的全部配方，并复制图标和 MIT 许可。
- 上游研究消耗、采矿、抽取流体、腐烂、种植、太空航行等计算模型不属于制造配方，不混入目录。`rocket-silo` 的本体太空科技包记录单独标记为发射。
- 概率产物为长期平均产量；不表示单次必然产量。未叠加产能、品质、科技或机器速度。
- 中文名称优先使用上游本地化；少量缺失名称由本站补充，回收配方按物品中文名组合。

复现：

```sh
git clone --filter=blob:none --no-checkout https://github.com/factoriolab/factoriolab.git /tmp/factoriolab-source
git -C /tmp/factoriolab-source sparse-checkout init --cone
git -C /tmp/factoriolab-source sparse-checkout set public/data/2.1 public/data/2x1
git -C /tmp/factoriolab-source checkout b74bcd7dd53af83c68384373932689fffe402fe8
python3 scripts/import-catalog.py /tmp/factoriolab-source
npm test
npm run build
```

## 所有物品的资料卡

`src/data/properties.json` 覆盖本体 203 个、太空时代 304 个物品与流体（两个配置有重叠）。目录新增“物品资料”入口，可浏览没有制造配方的资源。每项都有基础资料卡，按类型补充属性。这是版本固定的属性资料，普通品质、未计入科技与插件增益。来源是 Wube 官方 `factorio-data` 的同一 2.1.20 提交；生产机器和传送带的部分参数复用 FactorioLab 导出。

```sh
git clone https://github.com/wube/factorio-data.git /tmp/factorio-official
git -C /tmp/factorio-official checkout 40ec3dbe6f88a96899bbd2fefbd6800cac6c1e71
node scripts/import-properties.mjs /tmp/factorio-official
```

导入器使用 Lua AST 提取明确的字面量和简单数值表达式，处理直接的本体属性覆盖，不执行完整游戏数据阶段。不猜测无法解析的函数生成字段；这不是完整游戏原型转储。激光束构造器的基础伤害单独提取，原子弹、连锁与持续效果不汇总总伤害。资料卡提供逐条来源链接；覆盖生命值、储物／流体容量、生产参数、射程、射速、弹药、伤害及抗性。

枪械伤害由弹药效果和武器倍率组成，弹丸数与单枚伤害分开显示；电力／流体炮塔使用自身的攻击数据。储物格数与物品每格堆叠上限分开显示。属性组件仅静态渲染，不向目录搜索客户端发送属性数据。

## 历史数据与机制指南

旧版 `src/data/recipes.json` 与 `scripts/import-recipes.py` 保留作 48 个精选配方的原始追溯与搜索别名来源；它们不再是前端完整目录。该旧版及 4 篇机制指南基于 [Wube 官方 factorio-data 2.1.20](https://github.com/wube/factorio-data/tree/40ec3dbe6f88a96899bbd2fefbd6800cac6c1e71)。

页面提供本体／太空时代切换、制造／回收筛选、中文及英文搜索、物品上下游关联。旧 `#article=...` 链接仍可使用；省略版本时默认太空时代。

## 许可

本站为非官方资料站。Factorio 与游戏图标属于 Wube Software。FactorioLab 项目采用 MIT 许可，版权归 Doug Broad，许可副本保存在 `public/licenses/factoriolab.txt`。项目根目录的 LICENSE 不授予游戏资产权利。
