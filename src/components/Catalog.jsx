import React, { useEffect, useRef, useState } from 'react';
import { categories, filterEntries } from '../catalog.js';
import { catalogPath, aboutPath, scopeName, withQuery } from '../lib/routes.js';
import { Icon, ScopeControl } from './UI.jsx';
export default function Catalog({ scope, category = 'all', type = 'craft', entries }) {
  const [query, setQuery] = useState('');
  const input = useRef(null);
  useEffect(() => {
    const sync = () => setQuery(new URLSearchParams(location.search).get('q') || '');
    const keyboard = e => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault(); input.current?.focus();
      }
    };
    sync(); window.addEventListener('popstate', sync); window.addEventListener('keydown', keyboard);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('keydown', keyboard); };
  }, []);
  function updateQuery(value) {
    setQuery(value);
    const url = new URL(location.href);
    if (value) url.searchParams.set('q', value); else url.searchParams.delete('q');
    history.replaceState(null, '', url.pathname + url.search);
  }
  const result = filterEntries(entries, { query, category, type });
  const total = entries.filter(e => e.kind === 'recipe').length;
  const recycling = entries.filter(e => e.recipeType === 'recycling').length;
  return <>
    <div className="page-heading"><div><h1>物品与配方</h1><p>Factorio 2.1 · 中文配方查询</p></div><ScopeControl scope={scope} targets={Object.fromEntries(['base', 'space'].map(s => [s, withQuery(catalogPath(s, category, type), query)]))} /></div>
    <div className="notice"><strong>{scopeName(scope)} · 2.1.20</strong><span>{total - recycling} 条制造／发射配方{recycling > 0 && `，${recycling} 条回收配方`}。点击物品查看原料、产出和制造设备。</span><a href={aboutPath(scope)}>数据说明</a></div>
    <form className="search-form" role="search" method="get" onSubmit={e => e.preventDefault()}>
      <label className="sr-only" htmlFor="search">搜索物品或配方</label><span aria-hidden="true">⌕</span>
      <input ref={input} id="search" name="q" type="search" placeholder="搜索物品或配方，如：绿板、火箭组件、iron plate" value={query} onChange={e => updateQuery(e.target.value)} autoComplete="off" />
      <button id="clear-search" type="button" aria-label="清除搜索" hidden={!query} onClick={() => { updateQuery(''); input.current?.focus(); }}>×</button><kbd>/</kbd>
    </form>
    <noscript><p className="note">即时搜索需要 JavaScript。分类导航、配方筛选和详情可直接浏览。</p></noscript>
    <div className="filter-row"><div className="recipe-tabs" aria-label="配方类型">{[['craft', '制造配方'], ['recycling', '回收配方'], ['all', '全部配方']].map(([id, label]) => <a key={id} href={withQuery(catalogPath(scope, category, id), query)} aria-current={type === id ? 'true' : undefined}>{label}</a>)}</div><span id="result-count" role="status" aria-live="polite">{result.length} 条结果</span></div>
    <div id="results">{result.length ? categories.filter(c => c.id !== 'all').map(c => {
      const group = result.filter(e => e.category === c.id);
      if (!group.length) return null;
      return <section className="catalog-group" key={c.id}><h2>{c.name}<span>{group.length}</span></h2>{c.id === 'mechanics' ? <div className="guide-list">{group.map(e => <a key={e.id} href={e.href}><strong>{e.name}</strong><span>{e.summary}</span></a>)}</div> : <div className="item-grid">{group.map(e => <a key={e.id} className="entry-tile" href={e.href} title={`${e.name} · ${e.id}`}><Icon sprite={e.sprite} /><span>{e.name}</span></a>)}</div>}</section>;
    }) : <div className="empty"><h2>没有找到匹配的词条</h2><p>试试中文名、英文名或常用简称，也可以切换游戏版本。</p><a href={catalogPath(scope, 'all', 'all')}>清除搜索和分类筛选</a></div>}</div>
  </>;
}
