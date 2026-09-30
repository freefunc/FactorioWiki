import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const props=JSON.parse(fs.readFileSync(new URL('../src/data/properties.json',import.meta.url)));
const catalog=JSON.parse(fs.readFileSync(new URL('../src/data/catalog.json',import.meta.url)));
const row=(scope,id,label)=>props.datasets[scope][id].rows.find(r=>r.label===label)?.value;
test('official storage capacities are distinct from item stacks',()=>{
  for(const scope of ['base','space']) {
    assert.equal(row(scope,'wooden-chest','储物容量'),16);
    assert.equal(row(scope,'iron-chest','储物容量'),32);
    assert.equal(row(scope,'steel-chest','储物容量'),48);
    assert.equal(row(scope,'steel-chest','生命值'),350);
    assert.equal(catalog.datasets[scope].items['steel-chest'].stack,50);
    assert.equal(row(scope,'storage-tank','流体容量'),25000);
  }
});
test('gun rate, ammunition damage and shotgun pellets remain separate',()=>{
  const p=props.datasets.base;
  assert.equal(row('base','submachine-gun','射程'),18);
  assert.equal(row('base','submachine-gun','基础射速'),10);
  assert.deepEqual(p['submachine-gun'].combat.ammo,['firearm-magazine','piercing-rounds-magazine','uranium-rounds-magazine']);
  for(const [id,damage] of [['firearm-magazine',5],['piercing-rounds-magazine',8],['uranium-rounds-magazine',24]]) assert.equal(p[id].combat.damage[0].amount,damage);
  assert.equal(p['shotgun-shell'].combat.damage[0].count,12);
  assert.equal(p['shotgun-shell'].combat.damage[0].amount,8);
  assert.equal(p['shotgun-shell'].combat.damage[0].radius,undefined);
  assert.equal(p['combat-shotgun'].combat.modifier,1.5);
});
test('turrets use their own attack source and expansion-only data stays scoped',()=>{
  const p=props.datasets.space;
  assert.deepEqual(p['laser-turret'].combat.ammo,[]);
  assert.equal(p['laser-turret'].combat.damage[0].amount*p['laser-turret'].combat.modifier,20);
  assert.deepEqual(p['tesla-turret'].combat.ammo,[]);
  assert.deepEqual(p['flamethrower-turret'].combat.ammo,[]);
  assert.equal(row('space','railgun','射程'),40);
  assert.equal(p['railgun-ammo'].combat.damage[0].amount,10000);
  assert.equal(props.datasets.base.railgun,undefined);
  assert.equal(row('space','rocket-silo','回收栏'),20);
  assert.equal(row('base','rocket-silo','回收栏'),0);
});
test('every property card and ammunition link has a scoped item and pinned source',()=>{
  assert.equal(props.version,catalog.version);
  for(const scope of ['base','space']) {
    assert.deepEqual(Object.keys(props.datasets[scope]).sort(),Object.keys(catalog.datasets[scope].items).sort());
    for(const [id,card] of Object.entries(props.datasets[scope])) {
      assert.ok(catalog.datasets[scope].items[id]);
      assert.ok(card.sources.length);
      for(const url of card.sources) assert.ok(url.includes(props.revision)||url.includes(catalog.commit));
      for(const id of card.combat?.ammo||[]) assert.ok(props.datasets[scope][id]?.combat);
    }
  }
});

test('raw materials, fluids, modules and equipment have type-specific cards',()=>{
  assert.equal(row('space','iron-ore','物品堆叠上限'),50);
  assert.equal(row('space','coal','燃料热值'),4);
  assert.equal(row('space','water','物品类型'),'流体');
  assert.equal(row('space','water','物品堆叠上限'),undefined);
  assert.equal(row('space','steam','收录温度'),500);
  assert.equal(row('base','steam','收录温度'),165);
  assert.equal(row('space','speed-module-3','速度效果'),'+50');
  assert.equal(row('space','quality-module-3','品质概率加成'),'+2.5');
  assert.equal(row('space','power-armor-mk2','装备网格'),'10 × 10');
});
