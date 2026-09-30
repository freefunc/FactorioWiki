import test from 'node:test';
import assert from 'node:assert/strict';
import { legacyTarget, recipePath } from '../src/lib/routes.js';
test('legacy links retain edition, article type and search filters', () => {
  assert.equal(legacyTarget('#scope=base'), '/base/');
  assert.equal(legacyTarget('#article=rocket-part&scope=base'), '/base/recipes/rocket-part/');
  assert.equal(legacyTarget('#item=iron-ore'), '/space/items/iron-ore/');
  assert.equal(legacyTarget('#article=recipe-time'), '/space/guides/recipe-time/');
  assert.equal(legacyTarget('#article=about'), '/space/about/');
  const target = new URL(legacyTarget('#q=绿板&scope=base&category=materials&type=all'), 'http://localhost');
  assert.equal(target.pathname, '/base/catalog/materials/all/');
  assert.equal(target.searchParams.get('q'), '绿板');
});
test('ordinary document anchors stay on the page and identifiers are encoded', () => {
  assert.equal(legacyTarget('#main'), null);
  assert.equal(legacyTarget(''), null);
  assert.equal(recipePath('space', 'a/b?c'), '/space/recipes/a%2Fb%3Fc/');
});
