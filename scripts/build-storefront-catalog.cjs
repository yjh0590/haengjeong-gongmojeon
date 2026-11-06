// Derive the read-only photo directory without touching administrator publications.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = path.join(root, 'docs/research/timespace-2026-11-06');
const read = name => JSON.parse(fs.readFileSync(path.join(base, name), 'utf8').replace(/^\uFEFF/, ''));
const research = read('수집기록.json');
const manifest = read('간판사진_매칭.json');
const ids = new Set(research.records.map(record => record.id));
const photos = new Map();
for (const photo of manifest.photos) {
  if (!ids.has(photo.recordId) || photos.has(photo.recordId)) throw Error(`Invalid photo match: ${photo.recordId}`);
  if (!photo.path.startsWith('/street/') || photo.path.includes('..')) throw Error('Unsafe image path');
  if (!fs.existsSync(path.join(root, 'public', photo.path))) throw Error(`Missing photo: ${photo.path}`);
  photos.set(photo.recordId, photo);
}
const records = research.records.map(record => ({
  id: record.id, name: record.name, category: photos.get(record.id)?.category || record.category,
  building: record.building, floor: record.floor, rooms: record.rooms,
  location: record.location, basis: record.basis, notes: record.notes,
  source: research.sources[record.source], photo: photos.get(record.id) || null,
}));
fs.writeFileSync(path.join(root, 'src/data/storefrontCatalog.json'), JSON.stringify({collectedOn:research.collectedOn, records}, null, 2) + '\n');
console.log(`Catalog: ${records.length} source records, ${photos.size} matched storefront photos`);
