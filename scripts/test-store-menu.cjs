const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(filename) {
  const full = path.resolve(filename);
  if (cache.has(full)) return cache.get(full);
  const exports = {};
  cache.set(full, exports);
  const output = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('exports', 'require', output)(exports, name => name.startsWith('.')
    ? load(path.resolve(path.dirname(full), `${name}.ts`)) : require(name));
  return exports;
}
const { stores } = load('src/data/stores.ts');
const { storeMenuItems } = load('src/data/storeMenuItems.ts');
const { validStores } = load('src/data/storeDraft.ts');
assert(validStores(stores), 'Existing publications must remain compatible');
assert.deepEqual(storeMenuItems(stores[0]), [{name: stores[0].menu, price: stores[0].price}]);
const menus = [{name: '첫 메뉴', price: '9,000원'}, {name: '두 번째 메뉴', price: '12,000원'}];
const updated = {...stores[0], menuItems: menus};
assert(validStores([updated]));
assert.deepEqual(storeMenuItems(updated), menus);
assert.deepEqual(storeMenuItems({...stores[0], menuItems: []}), storeMenuItems(stores[0]));
for (const invalid of [null, '메뉴', [{name: 1, price: '1,000원'}], [{name: 'a', price: '1'.repeat(151)}], Array(51).fill(menus[0])]) {
  assert.equal(validStores([{...stores[0], menuItems: invalid}]), false, JSON.stringify(invalid));
}
assert.deepEqual(JSON.parse(JSON.stringify(updated)).menuItems, menus);
console.log('PASS: legacy publication compatibility, multiple menu prices, JSON persistence and invalid imports');
