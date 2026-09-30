import data from '../data/catalog.json';
import mechanics from '../data/mechanics.js';
import { categories } from '../catalog.js';
import { scopes, catalogPath, recipePath, itemPath, guidePath, aboutPath } from './routes.js';
export { data };
export const guidesFor = scope => mechanics.filter(e => scope === 'space' || e.scope === 'base');
export const categoryName = id => categories.find(c => c.id === id)?.name || '其他';
export function sprite(scope, id) {
  const d = data.datasets[scope];
  return d.icons[id] || d.icons[d.items[id]?.icon] || null;
}
export function summariesFor(scope) {
  return [...data.datasets[scope].entries, ...guidesFor(scope)].map(e => ({
    id: e.id, name: e.name, english: e.english, category: e.category, kind: e.kind,
    recipeType: e.recipeType, aliases: e.aliases, summary: e.summary,
    sprite: sprite(scope, e.icon || e.id),
    href: e.kind === 'guide' ? guidePath(scope, e.id) : recipePath(scope, e.id),
  }));
}
export function scopeTargets(page) {
  return Object.fromEntries(scopes.map(scope => {
    const ds = data.datasets[scope];
    if (page.kind === 'recipe') return [scope, ds.entries.some(e => e.id === page.id) ? recipePath(scope, page.id) : `/${scope}/unavailable/`];
    if (page.kind === 'item') return [scope, ds.items[page.id] ? itemPath(scope, page.id) : `/${scope}/unavailable/`];
    if (page.kind === 'guide') return [scope, guidesFor(scope).some(e => e.id === page.id) ? guidePath(scope, page.id) : `/${scope}/unavailable/`];
    return [scope, catalogPath(scope, page.category || 'all', page.type || 'craft')];
  }));
}
export function staticPages() {
  const pages = [];
  for (const scope of scopes) {
    for (const category of categories) for (const type of ['craft', 'recycling', 'all']) {
      pages.push({ path: catalogPath(scope, category.id, type), kind: 'catalog', scope, category: category.id, type, title: `${category.id === 'all' ? '物品与配方' : category.name} · ${scope === 'base' ? '本体' : '太空时代'}` });
    }
    for (const e of data.datasets[scope].entries) pages.push({ path: recipePath(scope, e.id), kind: 'recipe', scope, id: e.id, title: e.name });
    for (const e of Object.values(data.datasets[scope].items)) pages.push({ path: itemPath(scope, e.id), kind: 'item', scope, id: e.id, title: e.name });
    for (const e of guidesFor(scope)) pages.push({ path: guidePath(scope, e.id), kind: 'guide', scope, id: e.id, category: 'mechanics', title: e.name });
    pages.push({ path: aboutPath(scope), kind: 'about', scope, title: '数据来源与收录范围' });
    pages.push({ path: `/${scope}/unavailable/`, kind: 'missing', scope, title: '当前版本没有这个词条' });
  }
  return pages;
}
