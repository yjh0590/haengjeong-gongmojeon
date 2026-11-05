const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/data/streetViewStores.ts', 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const viewExports = {};
new Function('exports', output)(viewExports);
const { storesForStreetView } = viewExports;
const stores = [1, 2, 3, 4, 5, 6].map(id => ({ id }));
const facade = (storeId, view, nodeId = 'a') => ({ storeId, view, nodeId, points: [] });
const facades = [
  facade(1, 'forward'), facade(2, 'right'), facade(3, 'back'), facade(4, 'left'),
  facade(5, 'forward', 'b'), facade(99, 'forward'), facade(1, 'forward'),
];
for (const [view, id] of [['forward', 1], ['right', 2], ['back', 3], ['left', 4]]) {
  assert.deepEqual(storesForStreetView(stores, facades, 'a', view).map(store => store.id), [id]);
}
assert.deepEqual(storesForStreetView(stores, facades, 'b', 'forward').map(store => store.id), [5]);
assert.deepEqual(storesForStreetView(stores, facades, 'b', 'left'), []);
assert.deepEqual(storesForStreetView(stores, [], 'a', 'forward'), []);
// The caller's floor, building, search and favorite filters must remain effective.
assert.deepEqual(storesForStreetView(stores.slice(1), facades, 'a', 'forward'), []);
assert.deepEqual(storesForStreetView(stores, stores.map(store => facade(store.id, 'right')), 'a', 'right')
  .map(store => store.id), [1, 2, 3]);
console.log('PASS: four directions, photo points, missing links, duplicates, filtered stores and three-card limit');
