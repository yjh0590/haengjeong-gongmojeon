const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  const full = path.resolve(file);
  if (cache.has(full)) return cache.get(full);
  const exports = {};
  cache.set(full, exports);
  const js = ts.transpileModule(fs.readFileSync(full, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  new Function('exports', 'require', js)(exports, name => name.startsWith('.') ? load(path.resolve(path.dirname(full), name + '.ts')) : require(name));
  return exports;
}
const {cStreetTour: tour, appendCStreetTour} = load('src/data/cStreetTour.ts');
const {validStores} = load('src/data/storeDraft.ts');
const {isValidStreetNodes} = load('src/data/streetNetwork.ts');
const {storesForStreetView, streetStorePage, streetSideView} = load('src/data/streetViewStores.ts');
const {validStorefrontImage} = load('src/data/storefrontImage.ts');
assert(validStores(tour.stores));
assert(isValidStreetNodes(tour.nodes));
const street = tour.nodes.find(node => node.id === 'c-street');
assert.deepEqual(Object.keys(street.views).sort(), ['back', 'forward']);
assert.equal(tour.nodes[0].connections[0].to, street.id);
assert.equal(tour.nodes[0].connections[0].arrivalView, 'forward');
assert.deepEqual(storesForStreetView(tour.stores, [], street.id, streetSideView('forward','left'), street.viewStores.left).map(store => store.name), ['대빵 오락실', '오봉집', '세븐일레븐']);
assert.deepEqual(storesForStreetView(tour.stores, [], street.id, 'back', street.viewStores.back), []);
assert.equal(streetSideView('back','right'),'left');
assert.equal(streetSideView('forward','right'),'right');
assert.equal(streetSideView('back','left'),'right');
assert.equal(streetSideView('left','left'),'back');
assert.equal(streetSideView('right','right'),'back');
assert.deepEqual(storesForStreetView(tour.stores, [], street.id, streetSideView('back','left'), street.viewStores.right), []);
assert.deepEqual(storesForStreetView(tour.stores, [], street.id, 'forward', street.viewStores.forward), []);
const expanded = [...tour.stores, {...tour.stores[0], id: 9104}];
assert.equal(streetStorePage(expanded, 1).stores[0].id, 9104);
for (const src of [...tour.stores.map(store => store.storefrontImage), ...tour.nodes.flatMap(node => Object.values(node.views))]) {
  assert(validStorefrontImage(src));
  const bytes = fs.readFileSync(path.join('public', src));
  assert(src.endsWith('.png') ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' : bytes.subarray(0, 2).toString('hex') === 'ffd8');
}
for (const invalid of ['javascript:alert(1)', 'data:image/png;base64,test', '//example.com/x.jpg', '/street/../secret.jpg', 'https://user:password@example.com/a.jpg']) {
  assert(!validStorefrontImage(invalid));
  assert(!validStores([{...tour.stores[0], storefrontImage: invalid}]));
}
assert(validStorefrontImage('https://example.com/photo.jpg'));
assert(validStores(tour.stores.map(({storefrontImage: _photo, ...legacy}) => legacy)));
const original = {version:1,stores:[{...tour.stores[0],id:1,name:'기존 가게'}],nodes:[{...tour.nodes[0],id:'existing',number:8}],geometry:{boundary:[],passages:[],stores:{'1':{x:1,y:2}},nodes:{existing:{x:3,y:4}}},facades:[]};
const before = JSON.stringify(original), combined = appendCStreetTour(original);
assert.equal(JSON.stringify(original), before);
assert.deepEqual(combined.stores[0], original.stores[0]);
assert.deepEqual(combined.geometry.nodes.existing, {x:3,y:4});
assert.deepEqual(combined.nodes.slice(1).map(node => node.number), [9,10]);
assert.throws(() => appendCStreetTour(combined), /이미 초안/);
assert.throws(() => appendCStreetTour({...original,stores:[tour.stores[0]]}), /이미 초안/);
const {replaceWithCStreetTour, timespaceSite} = load('src/data/cStreetTour.ts');
const published = {...original, nodes:[{...tour.nodes[0],id:'test-d',name:'D동',number:1}], geometry:{...original.geometry,nodes:{'test-d':{x:5,y:6}}}, facades:[{nodeId:'test-d',storeId:1,view:'forward',points:[{x:1,y:1},{x:2,y:2},{x:3,y:1}]}], media:{map:'maps/bg.png',photos:{'test-d:forward':'photos/test.jpg'}}};
const publishedBefore = JSON.stringify(published), replaced = replaceWithCStreetTour(published);
assert.equal(JSON.stringify(published), publishedBefore);
assert.deepEqual(replaced.nodes.map(node => node.id), ['c-entry', 'c-street']);
assert.deepEqual(replaced.nodes.map(node => node.number), [1, 2]);
assert.deepEqual(replaced.media, {map:'maps/bg.png', photos:{}});
assert.deepEqual(replaced.facades, []);
assert.deepEqual(Object.keys(replaced.geometry.nodes).sort(), ['c-entry', 'c-street']);
assert.deepEqual(replaced.stores.slice(0, 3).map(store => store.id), [9101, 9102, 9103]);
assert.deepEqual(replaced.stores, timespaceSite.stores);
assert.deepEqual(replaced.geometry, timespaceSite.geometry);
// Site dataset: 3 tour stores + 25 photo-verified A-D stores, each with a real photo and a map slot.
const catalogJson = require('../src/data/storefrontCatalog.json');
const {timespaceStores, timespaceStoreLinks} = load('src/data/timespaceStores.ts');
assert.equal(timespaceSite.stores.length, 28);
assert(validStores(timespaceSite.stores));
assert.deepEqual(Object.keys(timespaceStoreLinks).length, 28);
for (const store of timespaceSite.stores) {
  assert(timespaceSite.geometry.stores[String(store.id)], `map slot for ${store.name}`);
  assert(fs.existsSync(path.join('public', store.storefrontImage)), `photo for ${store.name}`);
}
for (const [recordId, storeId] of Object.entries(timespaceStoreLinks)) {
  const record = catalogJson.records.find(r => r.id === recordId), store = timespaceSite.stores.find(s => s.id === storeId);
  assert(record && store && store.building === record.building + '동' && store.floor === record.floor, recordId);
}
const pins = Object.values(timespaceSite.geometry.stores);
for (const store of timespaceSite.stores) for (const other of timespaceSite.stores) {
  if (store.id < other.id && store.floor === other.floor) {
    const a = timespaceSite.geometry.stores[store.id], b = timespaceSite.geometry.stores[other.id];
    assert(Math.hypot(a.x - b.x, a.y - b.y) >= 20, `pins too close: ${store.name} / ${other.name}`);
  }
}
assert(pins.every(p => p.x >= 0 && p.x <= 500 && p.y >= 0 && p.y <= 374));
assert.equal(timespaceStores.filter(s => s.building === 'C동' && s.floor === 1).length, 2);
// Sourced details: every entry belongs to a listed store, cites an https source, and reaches the store data.
const {details} = require('../src/data/timespaceStoreDetails.json');
for (const [recordId, d] of Object.entries(details)) {
  const store = timespaceSite.stores.find(s => s.id === timespaceStoreLinks[recordId]);
  assert(store, `detail for unlisted record ${recordId}`);
  assert(d.source.startsWith('https://') && d.summary, recordId);
  assert(store.description.startsWith(d.summary), recordId);
  for (const item of d.items) assert(store.menuItems.some(m => m.name === item.name && m.price === (item.price || '현장 확인')), item.name);
}
assert(validStores(replaced.stores) && isValidStreetNodes(replaced.nodes));
const edited = replaceWithCStreetTour({...published, stores:[...published.stores, {...tour.stores[1], name:'오봉집 수정'}]});
assert.equal(edited.stores.find(store => store.id === 9102).name, '오봉집 수정');
assert.equal(edited.stores.filter(store => store.id === 9102).length, 1);
console.log('PASS actual photo assets, same-point front/back, entrance link, three-card expansion, safe photo URLs, legacy data and non-destructive admin import');
