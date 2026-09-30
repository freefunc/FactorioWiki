import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterEntries, readRoute, categories } from '../src/catalog.js';
import mechanics from '../src/data/mechanics.js';

const data = JSON.parse(readFileSync(new URL('../src/data/recipes.json', import.meta.url)));
const entries = [...data.entries, ...mechanics];

test('Chinese names, nicknames and normalized English identifiers are searchable', () => {
  assert.equal(filterEntries(entries, { query: '绿板' })[0].id, 'electronic-circuit');
  assert.equal(filterEntries(entries, { query: '  ELECTRONIC-CIRCUIT  ' })[0].id, 'electronic-circuit');
  assert.equal(filterEntries(entries, { query: '蓝瓶' })[0].id, 'chemical-science-pack');
  assert.equal(filterEntries(entries, { query: 'this-is-not-an-item' }).length, 0);
});

test('category and expansion filters compose with search', () => {
  const results = filterEntries(entries, { category: 'production', scope: 'space' });
  assert.ok(results.some(e => e.id === 'foundry'));
  assert.ok(results.every(e => e.category === 'production' && e.scope === 'space'));
  assert.equal(filterEntries(entries, { query: '铸造厂', scope: 'base' }).length, 0);
});

test('hash routes preserve Chinese queries and reject unknown filters', () => {
  assert.deepEqual(readRoute('#q=%E7%BB%BF%E6%9D%BF&scope=space&category=materials&article=foundry'), {
    query: '绿板', scope: 'space', category: 'materials', article: 'foundry',
  });
  assert.equal(readRoute('#category=unknown&scope=unknown').category, 'all');
  assert.doesNotThrow(() => readRoute('#q=%E0%A4%A'));
});

test('curated dataset has unique IDs, traceable sources and valid quantities', () => {
  assert.equal(new Set(entries.map(e => e.id)).size, entries.length);
  for (const entry of entries) {
    assert.ok(categories.some(c => c.id === entry.category));
    assert.ok(['base', 'space'].includes(entry.scope));
    assert.ok(new URL(entry.source).protocol === 'https:');
    if (entry.kind === 'recipe') {
      assert.ok(entry.source.includes(data.commit));
      assert.ok(entry.seconds > 0);
      assert.ok(entry.ingredients.length && entry.results.length);
      for (const item of [...entry.ingredients, ...entry.results]) assert.ok(item.amount > 0);
    } else {
      for (const id of entry.related) assert.ok(entries.some(e => e.id === id));
    }
  }
});

test('known recipe contracts preserve multi-output quantities and surface restrictions', () => {
  const belt = entries.find(e => e.id === 'transport-belt');
  assert.equal(belt.results[0].amount, 2);
  const circuit = entries.find(e => e.id === 'electronic-circuit');
  assert.equal(circuit.ingredients.find(i => i.id === 'copper-cable').amount, 3);
  const foundry = entries.find(e => e.id === 'foundry');
  assert.deepEqual(foundry.conditions, [{property:'pressure', min:4000, max:4000}]);
});
