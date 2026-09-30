import React from 'react';
import { catalogPath, scopeName } from '../lib/routes.js';
export function Icon({ sprite, large = false }) {
  return sprite ? <span className={`icon ${large ? 'large' : ''}`} aria-hidden="true" style={{ '--ix': sprite.x || 0, '--iy': sprite.y || 0 }} /> : <span className={`icon fallback ${large ? 'large' : ''}`} aria-hidden="true">◇</span>;
}
export function ScopeControl({ scope, targets }) {
  return <div className="scope-control" aria-label="游戏版本">{['base', 'space'].map(s => <a key={s} href={targets?.[s] || catalogPath(s)} aria-current={s === scope ? 'true' : undefined}>{scopeName(s)}</a>)}</div>;
}
export function Breadcrumb({ scope, children }) {
  return <div className="breadcrumb"><a href={catalogPath(scope)}>配方目录</a><span>›</span>{children}</div>;
}
