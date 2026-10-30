// Run after `npm install`: npm run test:route
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/data/routeGuide.ts', 'utf8');
const output = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
const routeExports = {};
new Function('exports', 'require', output)(routeExports, require);
const {findStorePhotoRoute, inspectStreetNetwork} = routeExports;
const node = (id, number, stores, connections) => ({id, number, name:id, subtitle:'demo',views:{},stores,connections});
const link = (to, direction='forward') => ({to, direction, label:`${to}`});
const nodes = [
  node('a',1,[],[link('b'),link('c','right')]),
  node('b',2,[],[link('a','back'),link('d')]),
  node('c',3,[],[link('a','left')]),
  node('d',4,[5],[link('b','back')]),
  node('island',5,[6],[]),
];
assert.deepEqual(findStorePhotoRoute('a',5,nodes), ['a','b','d']);
assert.deepEqual(findStorePhotoRoute('b',5,nodes), ['b','d']);
assert.deepEqual(findStorePhotoRoute('d',5,nodes), ['d']);
assert.equal(findStorePhotoRoute('a',6,nodes), null);
assert.equal(findStorePhotoRoute('a',42,nodes), null);
assert.equal(findStorePhotoRoute('missing',5,nodes), null);
assert( inspectStreetNetwork(nodes).some(m => m.includes('연결된 경로가 없습니다')) );
assert( inspectStreetNetwork(nodes).some(m => m.includes('이동 연결이 없습니다')) );
assert.deepEqual(inspectStreetNetwork(nodes.slice(0,4)), []);
console.log('PASS: directed photo-point routing, unreachable nodes, self and disconnected checks');
