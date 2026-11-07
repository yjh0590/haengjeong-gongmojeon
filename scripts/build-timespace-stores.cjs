// Generates src/data/timespaceStores.ts from the researched storefront catalog and timespaceBoardStores.json.
// Only photo-verified stores on floors 1-3 of blocks A-D are included (the app's store model
// supports floors 1-3). Stores already in the C-block photo tour are linked, not duplicated.
// Map positions are slots inside each block's buildings on timespace-map.svg, not surveyed locations.
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../src/data/storefrontCatalog.json');
// Facts read from each store's public source page (menus, hours); see the file's note.
const { details } = require('../src/data/timespaceStoreDetails.json');
const sourceLabel = d => d.sourceDate ? `${d.sourceDate.slice(0, 7).replace('-', '.')} 자료 기준` : '매장 안내 자료 기준';
// Every store here is in Timespace, so drop branch suffixes from the display name (the catalog keeps the full name).
// Names as written on the storefront sign where the registry spelling differs (registry record stays as collected).
const signNames = require('../src/data/storeSignNames.json').names;
const displayName = name => name.replace(/\s*(\((?:타임스페이스점|송도점)\)|송도타임스페이스점|인천송도타임스페이스|인천타임스페이스점|인천대입구역점|타임스페이스점|송도점)$/, '').trim() || name;
function describe(r) {
  const d = details[r.id];
  if (!d) return {
    description: `간판 사진과 공개 주소로 확인한 ${r.category} 가게예요. 메뉴와 영업시간은 현장 확인이 필요해요.`,
    menu: r.category, price: '현장 확인',
  };
  const items = d.items.map(item => ({ name: item.name, price: item.price || '현장 확인' }));
  const priced = d.items.find(item => item.price);
  return {
    description: `${d.summary}.${d.hours ? ` 영업 ${d.hours}.` : ''} ${sourceLabel(d)}`,
    menu: items.length ? items.map(item => item.name).slice(0, 3).join(' · ') : r.category,
    price: priced ? `${priced.name} ${priced.price} (${d.sourceDate ? d.sourceDate.slice(0, 7).replace('-', '.') + ' 기준' : '안내 기준'})` : '현장 확인',
    ...(items.length ? { menuItems: items } : {}),
  };
}

const tourIds = { 'S06-001': 9101, 'S01-178': 9102, 'S01-059': 9103 };
// Photographed stores left out of the app, with the reason. Their research records stay in the catalog.
const excluded = { 'S02-133': '2026년 4월 현장 안내판 D동 1층 목록에 없음 (피카 에스프레소 바)' };
// Stores from the April 2026 directory board without storefront photos yet (see timespaceBoardStores.json).
const board = require('../src/data/timespaceBoardStores.json');
const foodCategories = ['베이커리', '카페', '닭발·한식', '일식·오마카세', '양갈비', '철판요리', '스테이크', '고깃집', '와인·다이닝', '돈카츠', '경양식', '피자', '한식', '편의점'];

// Slots inside each block's two buildings, in pixels of the 826x662 source map that timespace-map.svg traces and
// pads 59px on the left. D = top-left pair, A = top-right, C = bottom-left, B = bottom-right.
// Street-facing spots come first; C's first two sit beside the photographed B/C street (tour stores).
const blockSlots = {
  A: [[455, 250], [690, 240], [520, 110], [730, 150], [600, 110], [455, 200], [680, 280], [760, 120], [560, 140]],
  B: [[460, 380], [640, 400], [455, 500], [600, 500], [520, 380], [440, 440], [630, 440], [450, 560], [590, 560]],
  C: [[340, 560], [340, 470], [300, 400], [124, 400], [124, 520], [300, 520], [90, 460], [270, 460], [160, 580]],
  D: [[110, 250], [250, 250], [110, 160], [300, 140], [343, 250], [70, 200], [160, 120], [250, 180], [343, 220]],
};
const toMap = ([x, y]) => ({ x: Math.round((x + 59) * 500 / 885), y: Math.round(y * 374 / 662) });
const blocks = Object.fromEntries(Object.entries(blockSlots).map(([block, list]) => [block, list.map(toMap)]));
const slots = block => blocks[block];
// "205, 206, 207, 208" -> "205~208호"; shorter lists keep "307·308호".
function unitText(rooms) {
  if (!rooms || /미확인|미기재/.test(rooms)) return undefined;
  const parts = rooms.split(/,\s*/);
  const numbers = parts.map(Number);
  const consecutive = numbers.every((n, i) => Number.isInteger(n) && (i === 0 || n === numbers[i - 1] + 1));
  return parts.length >= 3 && consecutive ? `${parts[0]}~${parts[parts.length - 1]}호` : `${parts.join('·')}호`;
}

const rows = catalog.records.filter(r => r.photo && blocks[r.building] && [1, 2, 3].includes(r.floor));
const used = {};
/** Next free map slot of a block on a floor. C-block 1F street-side slots are taken by the photo tour stores. */
function nextSlot(building, floor) {
  const key = `${building}${floor}`;
  const offset = key === 'C1' ? 2 : 0;
  const slot = slots(building)[offset + (used[key] = (used[key] ?? -1) + 1)];
  if (!slot) throw new Error(`No map slot left for ${key}`);
  return slot;
}
const stores = [];
const links = {};
const positions = {};
let nextId = 9201;
for (const r of rows) {
  if (tourIds[r.id]) { links[r.id] = tourIds[r.id]; continue; }
  if (excluded[r.id]) continue;
  const slot = nextSlot(r.building, r.floor);
  const id = nextId++;
  const unit = unitText(r.rooms);
  stores.push({
    id, name: signNames[r.id] || displayName(r.name), building: `${r.building}동`, floor: r.floor, ...(unit ? { unit } : {}),
    type: foodCategories.includes(r.category) ? '맛' : '멋', category: r.category,
    ...describe(r),
    storefrontImage: r.photo.retouch?.path || r.photo.path,
    tags: [r.category, `${r.building}동 ${r.floor}층`],
    walking: '위치는 안내 지도 참고 · 동 안 대략 위치', aiScore: 0,
  });
  links[r.id] = id;
  positions[id] = slot;
}

// Board stores start at 9301 so photographed stores keep their ids (saved favourites point at ids).
let boardId = 9301;
for (const b of board.stores) {
  if (links[b.catalogId]) throw new Error(`${b.name} is already in the app`);
  const id = boardId++;
  const unit = unitText(b.rooms);
  stores.push({
    id, name: b.name, building: `${b.building}동`, floor: b.floor, ...(unit ? { unit } : {}),
    type: b.type, category: b.category,
    // Short like the other cards; where the location was confirmed is listed on the admin dashboard.
    description: b.hours
      ? `${b.summary}. 영업 ${b.hours}. ${b.hoursAsOf}`
      : `${b.summary}. 메뉴·가격·영업시간은 현장 확인이 필요해요. 2026.04 현장 안내판 기준`,
    menu: b.category, price: '현장 확인',
    ...(b.photo ? { storefrontImage: b.photo } : {}),
    tags: [b.category, `${b.building}동 ${b.floor}층`, ...(b.photo ? [] : ['사진 추후 업데이트'])],
    walking: '위치는 안내 지도 참고 · 동 안 대략 위치', aiScore: 0,
  });
  links[b.catalogId] = id;
  positions[id] = nextSlot(b.building, b.floor);
}

const banner = '// Generated by scripts/build-timespace-stores.cjs from src/data/storefrontCatalog.json. Do not edit by hand.\n';
const body = `${banner}import type { StoreData } from "../types/street";

/** Timespace stores (blocks A-D, floors 1-3) beyond the C-block photo tour: photo-verified stores, then stores from the April 2026 directory board whose photos come later (ids 9301+). */
export const timespaceStores: StoreData[] = ${JSON.stringify(stores, null, 2)};

/** Map positions (timespace-map.svg in a 500x374 box), not surveyed. */
export const timespaceStorePositions: Record<string, {x: number; y: number}> = ${JSON.stringify(positions, null, 2)};

/** Catalog record id -> app store id, including the three C-block tour stores. */
export const timespaceStoreLinks: Record<string, number> = ${JSON.stringify(links, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, '../src/data/timespaceStores.ts'), body);
console.log(`Wrote ${stores.length} stores (${board.stores.length} from the directory board, +${Object.keys(tourIds).length} linked tour stores; ${Object.keys(excluded).length} excluded).`);
