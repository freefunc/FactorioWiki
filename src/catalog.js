export const categories = [
  {id:'all',name:'全部分类'}, {id:'logistics',name:'物流与运输'},
  {id:'production',name:'生产设备'}, {id:'materials',name:'原料与中间产品'},
  {id:'power',name:'能源与电力'}, {id:'science',name:'科技包'},
  {id:'space',name:'太空设施'}, {id:'combat',name:'武器与装备'},
  {id:'fluids',name:'流体处理'}, {id:'mechanics',name:'游戏机制'},
];
export function filterEntries(entries,{query='',category='all',scope='all',type='all'}={}) {
  const words=query.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter(e=>(category==='all'||e.category===category)
    &&(scope==='all'||e.scope===scope)
    &&(type==='items'?e.kind==='item':e.kind!=='item'&&(type==='all'||(type==='recycling'?e.recipeType==='recycling':e.recipeType!=='recycling')))
    && words.every(word=>[e.name,e.id,e.english,e.summary,...(e.aliases||[])].join(' ').normalize('NFKC').toLowerCase().includes(word)));
}
export function readRoute(hash) {
  const p=new URLSearchParams(hash.replace(/^#/,''));
  return {query:p.get('q')||'',category:categories.some(c=>c.id===p.get('category'))?p.get('category'):'all',
    scope:p.get('scope')==='base'?'base':'space',type:['all','recycling','items'].includes(p.get('type'))?p.get('type'):'craft',article:p.get('article'),item:p.get('item')};
}
export function recipesForItem(entries,id) {return entries.filter(e=>e.results.some(r=>r.id===id));}
export function usesForItem(entries,id) {return entries.filter(e=>e.ingredients.some(r=>r.id===id));}
export const quantity = n => new Intl.NumberFormat('zh-CN',{maximumFractionDigits:6}).format(n);
