import type { SitePublication } from './sitePublication';
import { timespaceStorePositions, timespaceStores } from './timespaceStores';

/** User-supplied field photos. Coordinates illustrate the connection, not a surveyed position. */
export const cStreetTour: SitePublication = {
  version: 1,
  stores: [
    {id:9101,name:'대빵 오락실',building:'C동',floor:1,unit:'122호',type:'멋',category:'오락실',description:'거리 입구 왼쪽에서 만나는 오락실입니다.',menu:'오락·게임',price:'현장 확인',tags:['오락실','거리 입구'],walking:'위치는 안내도 참고',aiScore:0,storefrontImage:'/street/c-block/arcade.jpg'},
    {id:9102,name:'오봉집',building:'C동',floor:1,unit:'120·121호',type:'맛',category:'한식',description:'오락실 오른쪽에 있는 오봉집입니다.',menu:'직화낙지 · 보쌈',price:'현장 확인',tags:['한식','식사'],walking:'위치는 안내도 참고',aiScore:0,storefrontImage:'/street/c-block/obong.jpg'},
    {id:9103,name:'세븐일레븐',building:'C동',floor:1,unit:'119호',type:'맛',category:'편의점',description:'오봉집 오른쪽에 있는 편의점입니다.',menu:'편의점 상품',price:'상품별 상이',tags:['편의점','간식'],walking:'위치는 안내도 참고',aiScore:0,storefrontImage:'/street/c-block/seven-eleven.jpg'},
  ],
  nodes: [
    {id:'c-entry',number:1,name:'C동 거리 입구',subtitle:'오락실 앞 · 거리 진입부',views:{forward:'/street/c-block/entrance.jpg'},stores:[9101,9102,9103],viewStores:{forward:[]},connections:[{direction:'forward',to:'c-street',arrivalView:'forward',label:'거리 안으로 들어가기'}]},
    {id:'c-street',number:2,name:'C동 거리',subtitle:'같은 촬영 지점 · 앞과 뒤 방향',views:{forward:'/street/c-block/street-forward.jpg',back:'/street/c-block/street-back-retouched.png'},stores:[9101,9102,9103],viewStores:{forward:[],back:[],left:[9101,9102,9103],right:[]},connections:[]},
  ],
  // Schematic positions on the street between the C block and the opposite row (timespace-schematic.svg).
  geometry: {boundary:[],passages:[],nodes:{'c-entry':{x:258,y:214},'c-street':{x:290,y:178}},stores:{'9101':{x:232,y:195},'9102':{x:250,y:172},'9103':{x:268,y:149}}},
  facades: [],
};

/** Customer site dataset: the C-block photo tour plus the photo-verified A-D block stores on floors 1-3. */
export const timespaceSite: SitePublication = {
  ...cStreetTour,
  stores: [...cStreetTour.stores, ...timespaceStores],
  geometry: {...cStreetTour.geometry, stores: {...cStreetTour.geometry.stores, ...timespaceStorePositions}},
};

/**
 * Replace the old test dataset (sample stores, photo points, uploaded test photos, outlines, map pins)
 * with the Timespace site dataset. Only the map background is kept, and earlier edits to those
 * stores themselves win over the defaults.
 */
export function replaceWithCStreetTour(existing: SitePublication): SitePublication {
  const edited = new Map(existing.stores.map(store => [store.id, store]));
  const photos = Object.fromEntries(Object.entries(existing.media?.photos || {}).filter(([key]) => cStreetTour.nodes.some(node => key.startsWith(`${node.id}:`))));
  return {
    version: 1,
    stores: timespaceSite.stores.map(store => edited.get(store.id) || {...store, tags: [...store.tags]}),
    nodes: cStreetTour.nodes.map(node => ({...node, stores: [...node.stores], viewStores: Object.fromEntries(Object.entries(node.viewStores || {}).map(([view, ids]) => [view, [...ids]]))})),
    geometry: {boundary: [], passages: [], nodes: {...timespaceSite.geometry.nodes}, stores: {...timespaceSite.geometry.stores}},
    facades: [],
    ...(existing.media ? {media: {...(existing.media.map ? {map: existing.media.map} : {}), photos}} : {}),
  };
}

/** Append once; refuse collisions so existing administrator edits are never overwritten. */
export function appendCStreetTour(existing: SitePublication): SitePublication {
  if (existing.stores.some(store => cStreetTour.stores.some(item => item.id === store.id)) ||
      existing.nodes.some(node => cStreetTour.nodes.some(item => item.id === node.id))) {
    throw new Error('C동 촬영 자료의 ID가 이미 초안에 있습니다. 기존 가게와 촬영 지점에서 수정해 주세요.');
  }
  const nextNumber = Math.max(0,...existing.nodes.map(node => node.number));
  return {...existing,stores:[...existing.stores,...cStreetTour.stores],nodes:[...existing.nodes,...cStreetTour.nodes.map((node,index)=>({...node,number:nextNumber+index+1}))],geometry:{...existing.geometry,nodes:{...existing.geometry.nodes,...cStreetTour.geometry.nodes},stores:{...existing.geometry.stores,...cStreetTour.geometry.stores}}};
}
