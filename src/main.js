import './style.css';
import data from './data/recipes.json';
import mechanics from './data/mechanics.js';
import { categories, filterEntries, readRoute } from './catalog.js';

const entries = [...data.entries, ...mechanics];
const byId = new Map(entries.map(entry => [entry.id, entry]));
const extraNames = { 'iron-ore': '铁矿石', 'copper-ore': '铜矿石', stone: '石矿', coal: '煤', water: '水', 'petroleum-gas': '石油气', 'sulfuric-acid': '硫酸', lubricant: '润滑油', 'solid-fuel': '固体燃料', 'low-density-structure': '轻质结构', 'flying-robot-frame': '机器人构架', rail: '铁轨', 'productivity-module': '产能插件', 'tungsten-carbide': '碳化钨', 'refined-concrete': '精制混凝土', 'holmium-plate': '钬板', nutrients: '营养素', 'pentapod-egg': '五足虫卵', landfill: '填海料', 'lithium-plate': '锂板', 'tungsten-plate': '钨板', 'molten-iron': '熔融铁', 'holmium-solution': '钬溶液', 'copper-plate': '铜板', 'carbon': '碳', 'light-oil': '轻油', 'heavy-oil': '重油' };
let state = readRoute(location.hash);
const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const categoryName = id => categories.find(c => c.id === id)?.name || '';
const nameFor = id => byId.get(id)?.name || extraNames[id] || id;
const symbol = category => categories.find(c => c.id === category)?.symbol || '◇';
const scopeLabel = scope => scope === 'space' ? '太空时代' : '本体';
function routeLink(patch) {
  const next = { ...state, ...patch };
  const params = new URLSearchParams();
  if (next.query) params.set('q', next.query);
  if (next.category !== 'all') params.set('category', next.category);
  if (next.scope !== 'all') params.set('scope', next.scope);
  if (next.article) params.set('article', next.article);
  return '#' + params.toString();
}
const articleLink = id => esc(routeLink({ article: id }));

document.querySelector('#app').innerHTML = `
  <aside class="sidebar" aria-label="主导航">
    <a class="brand" href="#"><span class="brand-mark">F<span>·</span></span><span>FACTORIO<span class="brand-sub">异星工厂 · 中文 WIKI</span></span></a>
    <div class="edition">资料版本 <strong>2.1.20</strong></div>
    <p class="nav-label">知识库 / KNOWLEDGE BASE</p>
    <nav id="category-nav"></nav>
    <div class="sidebar-bottom"><span class="small-label">THE FACTORY MUST GROW</span><p>从第一块铁板，<br>到群星之间。</p><a href="https://github.com/wube/factorio-data/tree/${data.commit}" target="_blank" rel="noreferrer">官方原型数据 ↗</a><span class="community-note">非官方社区资料站</span></div>
  </aside>
  <div class="workspace">
    <header class="topbar"><div class="breadcrumb">资料库 <span>/</span> <span id="crumb">全部词条</span></div><div class="topbar-right"><span class="version-chip">FACTORIO 2.1</span><a href="#article=about">关于资料</a></div></header>
    <main id="main" tabindex="-1"></main>
    <footer><span>FACTORIO WIKI <span class="footer-divider">/</span> 中文资料库</span><span>数据快照 2.1.20 · 非官方 · Wube Software 游戏</span></footer>
  </div>`;

function navigation() {
  document.querySelector('#category-nav').innerHTML = categories.map(c => `<a class="nav-item ${state.category === c.id && !state.article ? 'active' : ''}" href="${esc(routeLink({category:c.id,article:null}))}" ${state.category === c.id && !state.article ? 'aria-current="page"' : ''}><span class="nav-symbol" aria-hidden="true">${c.symbol}</span><span>${c.name}</span><span class="nav-count">${c.id === 'all' ? entries.length : entries.filter(e => e.category === c.id).length}</span></a>`).join('');
}

function card(entry) {
  return `<a class="entry-card" href="${articleLink(entry.id)}"><div class="card-top"><span class="item-symbol ${entry.category}" aria-hidden="true">${symbol(entry.category)}</span><span class="scope ${entry.scope}">${scopeLabel(entry.scope)}</span></div><h3>${esc(entry.name)}</h3><p class="entry-id">${esc(entry.id)}</p><p class="entry-summary">${esc(entry.summary)}</p><div class="card-bottom"><span>${categoryName(entry.category)}</span><span>${entry.kind === 'recipe' ? `${entry.ingredients.length} 项原料 <b>·</b> ${entry.seconds} 秒` : '机制指南'}</span></div></a>`;
}

function renderResults() {
  const results = filterEntries(entries, state);
  document.querySelector('#result-count').textContent = results.length;
  document.querySelector('#result-title').textContent = state.query ? '搜索结果' : categoryName(state.category);
  document.querySelector('#results').innerHTML = results.length ? results.map(card).join('') : `<div class="empty"><span aria-hidden="true">⌕</span><h3>没有找到匹配的词条</h3><p>试试中文名、英文标识或“绿板”等常用简称。</p><button id="reset-search" class="solid-button">清除搜索与筛选</button></div>`;
  document.querySelector('#reset-search')?.addEventListener('click', () => { location.hash = ''; });
  document.querySelector('#clear-search').hidden = !state.query;
}

function renderCatalog() {
  document.title = `${state.query ? state.query + ' · ' : ''}异星工厂 Wiki · Factorio 2.1`;
  document.querySelector('#main').innerHTML = `
    <section class="intro"><div><p class="eyebrow">工程师的随身资料库 <span>01 / INDEX</span></p><h1>让每一条产线，<br class="mobile-break">都有据可查<span class="title-dot">.</span></h1><p class="intro-description">物品、配方与游戏机制。从基础自动化，到太空时代。</p></div><div class="index-stamp"><strong>${entries.length}</strong><span>精选词条</span></div></section>
    <section class="search-section" aria-label="搜索和筛选"><div class="search-box"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜索物品、配方或机制，例如：电子电路" aria-label="搜索词条" value="${esc(state.query)}" autocomplete="off"><button id="clear-search" aria-label="清除搜索" ${!state.query ? 'hidden' : ''}>×</button><kbd aria-hidden="true">/</kbd></div><div class="search-hints"><span>常用查询</span>${['电子电路','传送带','铸造厂','品质等级'].map(q=>`<button class="quick-search" data-query="${q}">${q}</button>`).join('')}</div></section>
    <div class="version-note"><span class="note-mark" aria-hidden="true">i</span><p>基于官方 <strong>2.1.20</strong> 原型整理 <span>·</span> 配方附来源，区分本体与太空时代</p><a href="#article=about">资料说明</a></div>
    <section class="catalog-section" aria-label="词条目录"><div class="catalog-toolbar"><h2><span id="result-title"></span><span id="result-count" class="count-badge" role="status" aria-live="polite"></span></h2><div class="scope-tabs" role="group" aria-label="内容范围">${[['all','全部内容'],['base','游戏本体'],['space','太空时代']].map(([id,label])=>`<button data-scope="${id}" class="scope-tab ${state.scope===id?'selected':''}" aria-pressed="${state.scope===id}">${label}</button>`).join('')}</div></div><div id="results" class="card-grid"></div></section>`;
  renderResults();
  document.querySelector('#search').addEventListener('input', event => {
    state.query = event.target.value;
    history.replaceState(null, '', routeLink({}));
    renderResults();
  });
  document.querySelector('#clear-search').addEventListener('click', () => {
    const input = document.querySelector('#search'); input.value = ''; input.dispatchEvent(new Event('input')); input.focus();
  });
  document.querySelectorAll('.quick-search').forEach(button => button.addEventListener('click', () => {
    location.hash = routeLink({ query: button.dataset.query, category:'all', scope:'all' });
  }));
  document.querySelectorAll('[data-scope]').forEach(button => button.addEventListener('click', () => {
    location.hash = routeLink({scope:button.dataset.scope});
  }));
}

function ingredientRow(item) {
  return `<li><span>${byId.has(item.id) ? `<a href="${articleLink(item.id)}">${esc(nameFor(item.id))}</a>` : esc(nameFor(item.id))}${item.fluid ? '<span class="fluid-tag">流体</span>' : ''}</span><strong>${item.amount}<span>${item.fluid ? ' 单位' : ' 个'}</span></strong></li>`;
}

function renderArticle(entry) {
  document.title = `${entry.name} · 异星工厂 Wiki`;
  const related = entry.kind === 'recipe' ? entries.filter(other => other.kind === 'recipe' && other.ingredients.some(i => i.id === entry.id)) : entry.related.map(id => byId.get(id));
  document.querySelector('#main').innerHTML = `<a class="back-link" href="${esc(routeLink({article:null}))}">‹ 返回词条目录</a><article class="article"><header class="article-header"><div class="article-kicker"><span>${categoryName(entry.category)}</span><span class="scope ${entry.scope}">${scopeLabel(entry.scope)}</span></div><h1>${esc(entry.name)}</h1><p class="entry-id">${entry.id}</p><p class="article-lead">${esc(entry.summary)}</p></header>${entry.kind === 'recipe' ? `
    <div class="recipe-meta"><div><span>基础制造时间</span><strong>${entry.seconds}<small> 秒</small></strong><p>${entry.timeDefault ? '原型默认值' : '原型 energy_required'}</p></div><div><span>配方版本</span><strong>2.1.20</strong><p>单次投入与产出</p></div><div><span>数据范围</span><strong class="meta-text">${scopeLabel(entry.scope)}</strong><p>未计入品质与产能加成</p></div></div>
    <section><h2>制造配方</h2><div class="recipe-flow"><div class="recipe-panel"><h3>投入原料 <span>INPUT</span></h3><ul>${entry.ingredients.map(ingredientRow).join('')}</ul></div><span class="flow-arrow" aria-hidden="true">→</span><div class="recipe-panel output"><h3>产出物品 <span>OUTPUT</span></h3><ul>${entry.results.map(ingredientRow).join('')}</ul></div></div><p class="explanation">基础耗时不等于机器实际生产时间。<a href="${articleLink('recipe-time')}">了解制造速度的计算方式</a>。</p></section>
    ${entry.conditions.length ? `<section class="condition-panel"><h2>地表制造条件</h2>${entry.conditions.map(c=>`<p><strong>${({'pressure':'压力','magnetic-field':'磁场'})[c.property] || esc(c.property)}</strong> <code>${esc(c.property)}</code><span>${c.min===c.max ? `= ${c.min}` : [c.min!==null?`≥ ${c.min}`:'', c.max!==null?`≤ ${c.max}`:''].filter(Boolean).join('，')}</span></p>`).join('')}<p class="explanation">这些是制造此配方的条件，不代表建筑的放置或运行限制。</p></section>` : ''}` : entry.sections.map(section=>`<section class="prose-section"><h2>${esc(section.title)}</h2><p>${esc(section.text)}</p>${section.table?`<div class="table-wrap"><table><thead><tr>${section.table[0].map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${section.table.slice(1).map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}</section>`).join('')}
    ${related.length?`<section><h2>${entry.kind==='recipe'?'用于制造':'相关词条'}</h2><div class="related-links">${related.map(e=>`<a href="${articleLink(e.id)}">${esc(e.name)}</a>`).join('')}</div></section>`:''}
    <section class="source-panel"><div><span class="eyebrow">SOURCE / 可核实来源</span><p>Wube 官方 ${entry.id==='recipe-time'?'原型文档':'数据仓库'} · 2.1.20</p></div><a href="${esc(entry.source)}" target="_blank" rel="noreferrer">查看原始定义 ↗</a></section></article>`;
}

function renderAbout() {
  document.title = '资料说明 · 异星工厂 Wiki';
  document.querySelector('#main').innerHTML = `<a class="back-link" href="#">‹ 返回词条目录</a><article class="article"><header class="article-header"><p class="eyebrow">ABOUT / 资料说明</p><h1>每一条数据，都有出处。</h1><p class="article-lead">面向 Factorio 2.1 的非官方中文资料库。</p></header><section class="prose-section"><h2>版本与来源</h2><p>当前收录 ${data.entries.length} 个精选物品配方和 ${mechanics.length} 篇机制指南。配方数据来自 Wube 官方 factorio-data 仓库的 2.1.20 标签，发布于 2026 年 9 月 22 日。每个词条均附原始定义链接，固定到同一提交，便于复核。</p><p><a href="https://github.com/wube/factorio-data/tree/${data.commit}" target="_blank" rel="noreferrer">查看固定版本的官方数据 ↗</a></p></section><section class="prose-section"><h2>收录范围</h2><p>覆盖本体与太空时代的常用配方；当前是精选资料集，并非完整游戏数据库。中文名称与说明由本站整理，不代表官方本地化文本。物品原料暂未建有独立词条时，仅显示其名称。</p></section><section class="prose-section"><h2>数值的使用边界</h2><p>配方展示基础原型中的单次投入、产出、时间与地表条件。未计算品质、插件、机器速度、科技加成、随机产物与第三方模组；也不执行 Lua 数据加载阶段。太空时代可能扩展可制造配方的机器类别，此站暂不列出完整机器兼容性。生产规划请结合游戏内百科及当前存档配置核对。</p></section><section class="prose-section"><h2>名称与版权</h2><p>Factorio、异星工厂及相关游戏内容属于 Wube Software。本项目是独立的非官方资料站，与 Wube Software 无隶属关系。界面未使用游戏贴图。</p></section></article>`;
}

function render() {
  state = readRoute(location.hash);
  navigation();
  const entry = byId.get(state.article);
  document.querySelector('#crumb').textContent = state.article === 'about' ? '资料说明' : entry?.name || categoryName(state.category);
  if (state.article === 'about') renderAbout();
  else if (entry) renderArticle(entry);
  else if (state.article) document.querySelector('#main').innerHTML = `<div class="empty"><h1>词条尚未收录</h1><p>可返回目录搜索现有资料。</p><a class="solid-button" href="#">返回目录</a></div>`;
  else renderCatalog();
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0,0); document.querySelector('#main').focus({preventScroll:true}); });
window.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const search = document.querySelector('#search'); if (search) { event.preventDefault(); search.focus(); }
  }
});
render();
