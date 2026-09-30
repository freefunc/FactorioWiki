import { readRoute } from '../catalog.js';
export const scopes = ['base', 'space'];
export const scopeName = scope => scope === 'base' ? '游戏本体' : '太空时代';
export function catalogPath(scope, category = 'all', type = 'craft') {
  return category === 'all' && type === 'craft' ? `/${scope}/` : `/${scope}/catalog/${category}/${type}/`;
}
export const recipePath = (scope, id) => `/${scope}/recipes/${encodeURIComponent(id)}/`;
export const itemPath = (scope, id) => `/${scope}/items/${encodeURIComponent(id)}/`;
export const guidePath = (scope, id) => `/${scope}/guides/${encodeURIComponent(id)}/`;
export const aboutPath = scope => `/${scope}/about/`;
export const withQuery = (path, query) => query ? `${path}?${new URLSearchParams({ q: query })}` : path;
const guideIds = new Set(['belt-throughput', 'quality-levels', 'recipe-time', 'surface-conditions']);
export function legacyTarget(hash) {
  if (!/^#(?:q|category|scope|type|article|item)=/.test(hash)) return null;
  const r = readRoute(hash);
  if (r.article === 'about') return aboutPath(r.scope);
  if (r.article) return guideIds.has(r.article) ? guidePath(r.scope, r.article) : recipePath(r.scope, r.article);
  if (r.item) return itemPath(r.scope, r.item);
  return withQuery(catalogPath(r.scope, r.category, r.type), r.query);
}
