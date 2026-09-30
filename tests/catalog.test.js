import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filterEntries,readRoute,recipesForItem,usesForItem,categories} from '../src/catalog.js';
import mechanics from '../src/data/mechanics.js';
const data=JSON.parse(readFileSync(new URL('../src/data/catalog.json',import.meta.url)));
const base=data.datasets.base.entries, space=data.datasets.space.entries;
const recipe=(scope,id)=>data.datasets[scope].entries.find(e=>e.id===id);

test('both pinned exports include the full manufacturing and recycling catalogs',()=>{
 assert.equal(data.version,'2.1.20');
 assert.equal(base.length,204);assert.equal(space.length,612);
 assert.equal(space.filter(e=>e.recipeType==='recycling').length,281);
 for(const [scope,ds] of Object.entries(data.datasets)){
  assert.ok(Object.values(ds.mods).every(v=>v==='2.1.20'));
  assert.equal(new Set(ds.entries.map(e=>e.id)).size,ds.entries.length);
  for(const e of ds.entries){
   assert.ok(categories.some(c=>c.id===e.category),e.id);
   assert.equal(e.scope,scope);assert.ok(e.source.includes(data.commit));
   assert.ok(e.seconds>0,e.id);assert.ok(e.ingredients.length&&e.results.length,e.id);
   assert.ok(e.producers.length,e.id);
   for(const part of [...e.ingredients,...e.results]){assert.ok(Number.isFinite(part.amount)&&part.amount>0,e.id);assert.ok(ds.items[part.id],part.id);}
   for(const id of e.producers)assert.ok(ds.items[id],id);
   for(const id of e.locations)assert.ok(ds.locations[id],id);
   assert.ok(ds.icons[e.icon]||ds.icons[ds.items[e.icon]?.icon],e.icon);
  }
 }
});
test('Chinese, aliases, English names and identifiers remain searchable',()=>{
 assert.equal(filterEntries(space,{query:'绿板',type:'craft'})[0].id,'electronic-circuit');
 assert.equal(filterEntries(space,{query:'  ELECTRONIC-CIRCUIT  ',type:'craft'})[0].id,'electronic-circuit');
 assert.equal(filterEntries(base,{query:'蓝瓶'})[0].id,'chemical-science-pack');
 assert.ok(filterEntries(space,{query:'iron plate'}).some(e=>e.id==='iron-plate'));
 assert.equal(filterEntries(space,{query:'not-a-real-recipe'}).length,0);
 assert.ok(filterEntries(space,{category:'production',type:'craft'}).some(e=>e.id==='foundry'));
 assert.ok(filterEntries(space,{type:'recycling'}).every(e=>e.recipeType==='recycling'));
 assert.equal(filterEntries(base,{query:'铸造厂'}).length,0);
});
test('edition switching preserves a shared article and validates incoming route values',()=>{
 const r=readRoute('#scope=base&article=rocket-part&q=%E7%BB%BF%E6%9D%BF&category=materials&type=all');
 assert.equal(r.scope,'base');assert.equal(r.article,'rocket-part');assert.equal(r.query,'绿板');assert.equal(r.type,'all');
 assert.equal(readRoute('#scope=unknown&type=unknown&category=unknown').scope,'space');
 assert.equal(readRoute('#category=unknown').category,'all');
 assert.doesNotThrow(()=>readRoute('#q=%E0%A4%A'));
});
test('known game contracts preserve expansion overrides, multiple outputs and probabilities',()=>{
 assert.equal(recipe('base','rocket-part').ingredients.find(i=>i.id==='processing-unit').amount,10);
 assert.equal(recipe('space','rocket-part').ingredients.find(i=>i.id==='processing-unit').amount,1);
 assert.equal(recipe('space','transport-belt').results[0].amount,2);
 assert.equal(recipe('space','electronic-circuit').ingredients.find(i=>i.id==='copper-cable').amount,3);
 assert.deepEqual(recipe('space','foundry').locations,['vulcanus']);
 assert.equal(recipe('space','uranium-processing').results.find(i=>i.id==='uranium-235').amount,0.007);
 assert.equal(recipe('space','scrap-recycling').results.length,12);
 assert.equal(recipe('space','scrap-recycling').results.find(i=>i.id==='iron-gear-wheel').amount,0.2);
 assert.equal(recipe('space','iron-plate-recycling').results[0].amount,0.25);
});
test('item cross-references use actual outputs, including alternative recipes',()=>{
 assert.ok(recipesForItem(space,'iron-plate').some(r=>r.id==='casting-iron'));
 assert.ok(usesForItem(space,'iron-plate').some(r=>r.id==='electronic-circuit'));
 for(const guide of mechanics)for(const id of guide.related)assert.ok(space.some(e=>e.id===id),id);
});
