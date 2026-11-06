const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const catalog = require('../src/data/storefrontCatalog.json');
const source = JSON.parse(fs.readFileSync(path.join(root,'docs/research/timespace-2026-11-06/수집기록.json'),'utf8').replace(/^\uFEFF/,''));
assert.equal(catalog.records.length, source.records.length);
assert.equal(new Set(catalog.records.map(r=>r.id)).size, source.records.length);
const photos = catalog.records.filter(r=>r.photo);
assert.equal(photos.length,9);
assert.equal(photos.filter(r=>r.photo.sourceUrl).length,6);
assert.deepEqual([...new Set(photos.map(r=>r.floor))].sort(),[1,2,3]);
assert.equal(new Set(photos.map(r=>r.photo.path)).size,9);
assert.equal(photos.filter(r=>r.photo.retouch).length,4);
for(const record of catalog.records) {
  const original=source.records.find(r=>r.id===record.id);
  assert.equal(record.name,original.name);
  assert.equal(record.location,original.location);
  assert.equal(record.floor,original.floor);
  assert.match(record.source.url,/^https:\/\//);
  if(!record.photo)continue;
  assert.equal(record.id,record.photo.recordId);
  const image=fs.readFileSync(path.join(root,'public',record.photo.path));
  assert.equal(image.subarray(0,3).toString('hex'),'ffd8ff');
  assert(image.length>1000);
  assert(record.photo.note && record.photo.credit);
  assert.match(record.photo.presentation.position,/^\d+% \d+%$/);
  assert(record.photo.presentation.scale>=1 && record.photo.presentation.scale<=3);
  if(record.photo.retouch){
    assert.notEqual(record.photo.retouch.path,record.photo.path);
    const edited=fs.readFileSync(path.join(root,'public',record.photo.retouch.path));
    assert.equal(edited.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(edited.readUInt32BE(16),record.photo.retouch.width);
    assert.equal(edited.readUInt32BE(20),record.photo.retouch.height);
    assert(record.photo.retouch.note.includes('AI'));
  }
}
assert.equal(photos.find(r=>r.id==='S01-086').building,'B');
assert.equal(photos.find(r=>r.id==='S01-050').building,'C');
assert.equal(photos.find(r=>r.id==='S01-044').building,'D');
console.log('PASS: all source records preserved, 9 distinct photos, 6 web sources, floors 1–3, valid JPEGs and exact ID/address matching');
