import React from 'react';
import properties from '../data/properties.json';
import { data, sprite } from '../lib/model.js';
import { itemPath } from '../lib/routes.js';
import { quantity } from '../catalog.js';
import { Icon } from './UI.jsx';
const types = {physical:'物理',fire:'火焰',laser:'激光',explosion:'爆炸',acid:'酸液',electric:'电击',poison:'毒素',impact:'撞击'};
const value = x => typeof x === 'number' ? quantity(x) : x;
export function damageText(effects, modifier = 1) {
  if (!effects?.length) return '复杂攻击效果，详见游戏内百科';
  return effects.map(d => `${quantity(d.amount * modifier)} ${d.type}${d.count ? ` × ${d.count}（每次射击的弹丸数）` : ''}${d.radius ? `（范围半径 ${quantity(d.radius)} 格）` : ''}${d.line ? '（沿直线命中）' : ''}`).join('；');
}
export default function Properties({ scope, id, linked = false }) {
  const item = data.datasets[scope].items[id], card = properties.datasets[scope][id];
  if (!item || !card) return null;
  const combat = card.combat;
  return <section className="property-card" aria-label={`${item.name}的物品属性`}>
    <div className="property-heading"><h2><Icon sprite={sprite(scope, id)} /> {item.name} · 物品属性</h2>{linked && <a href={itemPath(scope,id)}>查看物品资料 →</a>}</div>
    <p className="note property-baseline">2.1.20 · 普通品质 · 未计入科技、插件与敌人抗性</p>
    <dl className="property-grid">{card.rows.map((r,i)=><div key={i}><dt>{r.label}</dt><dd>{value(r.value)}{r.unit}</dd></div>)}</dl>
    {!card.hasSpecificProperties && <p className="note">已列出当前收录的基础资料；更多专属属性暂未收录。</p>}
    {combat && <div className="property-combat"><h3>攻击与伤害</h3>{combat.ammo.length ? <>
      <p className="note">伤害由装填的弹药决定。下表已计入本武器的基础伤害倍率（{quantity(combat.modifier)} ×），未计入科技加成和目标抗性。</p>
      <div className="table-scroll"><table><thead><tr><th>适用弹药</th><th>基础伤害效果</th></tr></thead><tbody>{combat.ammo.map(ammo=><tr key={ammo}><td><a className="item-name" href={itemPath(scope,ammo)}><Icon sprite={sprite(scope,ammo)} /><span>{data.datasets[scope].items[ammo].name}</span></a></td><td>{damageText(properties.datasets[scope][ammo]?.combat?.damage,combat.modifier)}</td></tr>)}</tbody></table></div>
    </> : <p className="damage-value">{damageText(combat.damage,combat.modifier)}</p>}
      <p className="note">数值按单次命中效果列出，不是每秒伤害。多弹丸不保证全部命中；持续燃烧、连锁与其他复杂效果未汇总成总伤害。</p>
    </div>}
    {card.resistances?.length>0 && <details className="property-resistances"><summary>伤害抗性</summary><div className="table-scroll"><table><thead><tr><th>伤害类型</th><th>固定减伤</th><th>百分比减伤</th></tr></thead><tbody>{card.resistances.map((r,i)=><tr key={i}><td>{types[r.type]||r.type}</td><td>{r.decrease??0}</td><td>{r.percent??0}%</td></tr>)}</tbody></table></div></details>}
    <div className="property-sources">属性来源：{card.sources.map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer">{url.includes('wube/')?'Wube 官方原型':'FactorioLab 导出'}{card.sources.length>1?` ${i+1}`:''} ↗</a>)}</div>
  </section>;
}
