import React from 'react';
import { categories, recipesForItem, usesForItem, quantity } from '../catalog.js';
import { data, guidesFor, sprite, categoryName, scopeTargets } from '../lib/model.js';
import { catalogPath, recipePath, itemPath, guidePath, aboutPath, scopeName } from '../lib/routes.js';
import { Icon, ScopeControl, Breadcrumb } from './UI.jsx';

export function Navigation({ scope, category = 'all', type = 'craft', kind }) {
  const recipes = data.datasets[scope].entries;
  return <nav id="navigation">{categories.map(c => {
    const count = c.id === 'all' ? recipes.length : c.id === 'mechanics' ? guidesFor(scope).length : recipes.filter(e => e.category === c.id).length;
    return count ? <a key={c.id} href={catalogPath(scope, c.id, type)} aria-current={kind === 'catalog' && category === c.id ? 'page' : undefined}><span>{c.name}</span><small>{count}</small></a> : null;
  })}</nav>;
}
function ItemName({ scope, id }) {
  return <a className="item-name" href={itemPath(scope, id)}><Icon sprite={sprite(scope, id)} /><span>{data.datasets[scope].items[id]?.name || id}</span></a>;
}
function Source({ url = data.source }) {
  return <div className="source-line">数据：FactorioLab 游戏导出 · 2.1.20 <a href={url} target="_blank" rel="noreferrer">查看固定版本来源 ↗</a></div>;
}
function Related({ scope, title, entries }) {
  if (!entries.length) return null;
  const links = list => <div className="related-grid">{list.map(e => <a key={e.id} href={recipePath(scope, e.id)}><Icon sprite={sprite(scope, e.icon || e.id)} /><span>{e.name}</span></a>)}</div>;
  return <section className="related-section"><h2>{title}<span>{entries.length}</span></h2>{links(entries.slice(0, 12))}{entries.length > 12 && <details className="more-related"><summary>展开其余 {entries.length - 12} 条</summary>{links(entries.slice(12))}</details>}</section>;
}
function RecipeTable({ scope, entry: e }) {
  const random = e.results.some(p => !Number.isInteger(p.amount));
  const rows = parts => parts.map(p => <tr key={p.id}><td><ItemName scope={scope} id={p.id} /></td><td className="number">{quantity(p.amount)}<small>{p.fluid ? ' 单位' : ' 个'}</small></td></tr>);
  return <section className="recipe-section"><h2>{e.recipeType === 'recycling' ? '回收配方' : e.recipeType === 'launch' ? '火箭发射' : '制造配方'}</h2><div className="recipe-tables"><table><caption>投入原料</caption><tbody>{rows(e.ingredients)}</tbody></table><span className="recipe-arrow" aria-hidden="true">→</span><table><caption>{random ? '平均产出' : '产出'}</caption><tbody>{rows(e.results)}</tbody></table></div>{random && <p className="note">含概率产出。表中数量为长期平均值，不是每次固定获得的数量。</p>}<p className="note">{e.recipeType === 'launch' ? '这是火箭发射的投入与产出，时间为导出数据中的发射周期。' : '表中为基础配方用量，未计入产能、品质和科技加成。实际制造时间还受机器速度影响。'}</p></section>;
}
function Heading({ page, children, subtitle }) {
  return <div className="page-heading"><div><h1>{children}</h1><p>{subtitle}</p></div><ScopeControl scope={page.scope} targets={scopeTargets(page)} /></div>;
}
function Recipe({ page }) {
  const { scope, id } = page, ds = data.datasets[scope];
  const e = ds.entries.find(e => e.id === id), item = ds.items[id];
  const outputs = new Set(e.results.map(r => r.id));
  const uses = ds.entries.filter(r => r.id !== id && r.ingredients.some(p => outputs.has(p.id)));
  const variants = ds.entries.filter(r => r.id !== id && r.recipeType !== 'recycling' && r.results.some(p => outputs.has(p.id)));
  const other = data.datasets[scope === 'base' ? 'space' : 'base'].entries.find(r => r.id === id);
  const different = other && (JSON.stringify(other.ingredients) !== JSON.stringify(e.ingredients) || JSON.stringify(other.results) !== JSON.stringify(e.results) || other.seconds !== e.seconds);
  return <><Breadcrumb scope={scope}>{categoryName(e.category)}</Breadcrumb><Heading page={page} subtitle={<>{e.english} <span className="code-id">{id}</span></>}>{e.name}</Heading>{different && <div className="notice compact">此配方在本体和太空时代中的数值不同。当前显示：{scopeName(scope)}。</div>}
    <div className="article-layout"><article><RecipeTable scope={scope} entry={e} /><section><h2>制造设备</h2><div className="machine-list">{e.producers.map(id => <ItemName key={id} scope={scope} id={id} />)}</div></section>{e.locations.length > 0 && <section><h2>制造地点</h2><div className="location-tags">{e.locations.map(l => <span key={l}>{ds.locations[l] || l}</span>)}</div><p className="note">这里限制的是配方的制造地点，不代表产出建筑只能在这里使用。</p></section>}<Related scope={scope} title="其他生产方式" entries={variants} /><Related scope={scope} title="产出用于" entries={uses} /><Source url={e.source} /></article>
    <aside className="infobox"><h2>{e.name}</h2><div className="infobox-icon"><Icon sprite={sprite(scope, e.icon || id)} large /></div><dl><dt>游戏版本</dt><dd>{scopeName(scope)}</dd><dt>{e.recipeType === 'launch' ? '发射周期' : '基础耗时'}</dt><dd>{quantity(e.seconds)} 秒</dd><dt>分类</dt><dd>{categoryName(e.category)}</dd>{item?.stack && <><dt>堆叠数量</dt><dd>{item.stack}</dd></>}<dt>配方类型</dt><dd>{e.recipeType === 'recycling' ? '回收' : e.recipeType === 'launch' ? '火箭发射' : '制造'}</dd></dl><a className="infobox-link" href={guidePath(scope, 'recipe-time')}>制造速度如何计算？</a></aside></div></>;
}
function Item({ page }) {
  const { scope, id } = page, ds = data.datasets[scope], e = ds.items[id];
  const made = recipesForItem(ds.entries, id), used = usesForItem(ds.entries, id);
  return <><Breadcrumb scope={scope}>物品资料</Breadcrumb><Heading page={page} subtitle={<>{e.english} <span className="code-id">{id}</span></>}><Icon sprite={sprite(scope, id)} /> {e.name}</Heading><article>{e.stack && <p>堆叠数量：<strong>{e.stack}</strong></p>}{made.length ? <Related scope={scope} title="生产与回收配方" entries={made} /> : <div className="notice">该物品没有收录于制造配方中，可能通过采矿、采集、种植或腐烂等方式获得。</div>}<Related scope={scope} title="用于制造" entries={used} /><Source /></article></>;
}
function Guide({ page }) {
  const e = guidesFor(page.scope).find(e => e.id === page.id);
  return <><Breadcrumb scope={page.scope}>游戏机制</Breadcrumb><Heading page={page} subtitle={e.summary}>{e.name}</Heading><article className="prose">{e.sections.map(s => <section key={s.title}><h2>{s.title}</h2><p>{s.text}</p>{s.table && <div className="table-scroll"><table><thead><tr>{s.table[0].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{s.table.slice(1).map((row, i) => <tr key={i}>{row.map((x, j) => <td key={j}>{x}</td>)}</tr>)}</tbody></table></div>}</section>)}<p><a href={e.source} target="_blank" rel="noreferrer">Wube 官方参考资料 ↗</a></p></article></>;
}
function About({ scope }) {
  return <><Breadcrumb scope={scope}>资料说明</Breadcrumb><div className="page-heading"><div><h1>数据来源与收录范围</h1><p>版本固定为 Factorio 2.1.20</p></div></div><article className="prose"><section><h2>配方从哪里来？</h2><p>当前配方、中文名称和物品图标来自开源项目 <a href={data.source} target="_blank" rel="noreferrer">FactorioLab 的游戏导出数据</a>，固定在提交 <code>{data.commit.slice(0, 12)}</code>。其中本体、太空时代、品质和高架铁路的版本均为 2.1.20。FactorioLab 是社区项目，并非 Wube 官方 Wiki。缺失的中文配方名称由本站补充，回收配方统一按物品名标注。</p><p>上一版直接从 <a href={data.officialSource} target="_blank" rel="noreferrer">Wube 官方 factorio-data</a> 选取了 48 个配方。本版已改为整批导入制造、回收与火箭发射记录，不再使用精选清单。</p></section><section><h2>当前收录</h2><table><thead><tr><th>游戏配置</th><th>制造／发射</th><th>回收</th><th>合计</th></tr></thead><tbody>{['base', 'space'].map(s => { const all = data.datasets[s].entries; const n = all.filter(e => e.recipeType === 'recycling').length; return <tr key={s}><td>{s === 'base' ? '本体' : '本体＋太空时代'}</td><td>{all.length - n}</td><td>{n}</td><td>{all.length}</td></tr>; })}</tbody></table><p>本体和太空时代独立展示，存在重叠配方，数量不能简单相加。太空时代包含品质与高架铁路内容。另保留 4 篇机制指南。</p><p>导出数据中的研究消耗、采矿、抽取流体、腐烂、种植和太空航行模型不是制造配方，因此未混入配方目录。第三方模组不在收录范围内。</p></section><section><h2>如何理解数值？</h2><p>含概率产出的配方展示长期平均产量，例如铀处理和回收配方。平均数不表示一次实际制造一定得到这些数量。数据不叠加品质、机器速度、产能或科技增益；不会随游戏更新自动变化。</p><p>制造设备与可制造地点取自导出数据。具体存档、模组或游戏更新可能改变结果，请以游戏内百科为准。</p></section><section><h2>图标与项目许可</h2><p>Factorio、游戏图标和相关内容属于 Wube Software。本网站为非官方中文查询工具。FactorioLab 数据处理项目采用 <a href="/licenses/factoriolab.txt">MIT 许可</a>，版权归 Doug Broad；其许可不改变游戏资产的权利归属。</p><p><a href="https://wiki.factorio.com/Main_Page/zh" target="_blank" rel="noreferrer">访问 Factorio 官方 Wiki ↗</a></p></section></article></>;
}
export default function Wiki({ page }) {
  if (page.kind === 'recipe') return <Recipe page={page} />;
  if (page.kind === 'item') return <Item page={page} />;
  if (page.kind === 'guide') return <Guide page={page} />;
  if (page.kind === 'about') return <About scope={page.scope} />;
  return <><Breadcrumb scope={page.scope}>未找到</Breadcrumb><div className="empty"><h1>当前版本没有这个词条</h1><p>这个词条可能属于另一游戏版本。切换版本或返回目录继续查找。</p><ScopeControl scope={page.scope} /><a href={catalogPath(page.scope)}>返回配方目录</a></div></>;
}
