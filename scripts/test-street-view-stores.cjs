const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/data/streetViewStores.ts', 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const viewExports = {};
new Function('exports', output)(viewExports);
const { storesForStreetView, streetStorePage } = viewExports;
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
  .map(store => store.id), [1, 2, 3, 4, 5, 6]);
const linked = storesForStreetView(stores, facades, 'a', 'forward', [6, 4, 2, 6, 99]);
assert.deepEqual(linked.map(store => store.id), [6, 4, 2, 1]);
assert.deepEqual(streetStorePage(linked, 0).stores.map(store => store.id), [6, 4, 2]);
assert.deepEqual(streetStorePage(linked, 1).stores.map(store => store.id), [1]);
assert.equal(streetStorePage(linked, 99).page, 1);
assert.equal(streetStorePage(linked, -3).page, 0);
assert.equal(streetStorePage(linked, NaN).page, 0);
assert.deepEqual(streetStorePage([], 4), { page: 0, pageCount: 0, stores: [] });
assert.deepEqual(storesForStreetView(stores.slice(1), [], 'a', 'left', [1, 2, 3]).map(store => store.id), [2, 3]);
const many = Array.from({ length: 37 }, (_, i) => ({ id: i + 1 }));
const all = storesForStreetView(many, [], 'a', 'left', many.map(store => store.id));
assert.equal(all.length, 37);
assert.equal(streetStorePage(all, 12).stores[0].id, 37);
const spatial = [facade(1, 'forward'), facade(2, 'forward')].map((entry, i) => ({ ...entry, points: [{ x: i ? 10 : 80, y: 1 }] }));
assert.deepEqual(storesForStreetView(stores, spatial, 'a', 'forward').map(store => store.id), [2, 1]);
console.log('PASS: directional associations, legacy outlines, spatial order, filters, 37 stores and three-card pagination boundaries');

const networkOutput = ts.transpileModule(fs.readFileSync('src/data/streetNetwork.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const network = {};
new Function('exports', 'require', networkOutput)(network, name => name === 'react' ? {} : { streetNodes: [] });
const validNode = { id: 'a', number: 1, name: 'a', subtitle: '', views: {}, stores: [1, 2], connections: [] };
assert(network.isValidStreetNodes([validNode]), 'Legacy nodes remain compatible');
assert(network.isValidStreetNodes([{...validNode, viewStores: { left: [2, 1] }}]));
for (const invalid of [null, [], {left: [1, 1]}, {left: [99]}, {up: [1]}, {left: '1'}, {left: [NaN]}]) {
  assert.equal(network.isValidStreetNodes([{...validNode, viewStores: invalid}]), false);
}
const originalNodes = [{...validNode, viewStores: {left: [1, 2]}}, {...validNode, id: 'b', stores: [], viewStores: {}}];
const moved = network.moveStoreToPhotoPoint(originalNodes, 1, 'b');
assert.deepEqual(moved[0].viewStores.left, [2]);
assert.deepEqual(moved[1].stores, [1]);
assert(network.isValidStreetNodes(moved));
assert.deepEqual(originalNodes[0].viewStores.left, [1, 2], 'Reassignment must not mutate the current draft');
assert.deepEqual(JSON.parse(JSON.stringify(originalNodes))[0].viewStores.left, [1, 2]);
console.log('PASS: legacy node compatibility, directional metadata validation, JSON persistence and map reassignment');
