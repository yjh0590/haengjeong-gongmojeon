import type { SitePublication } from './sitePublication';

/** User-supplied field photos. Coordinates illustrate the connection, not a surveyed position. */
export const cStreetTour: SitePublication = {
  version: 1,
  stores: [
    {id:9101,name:'대빵 오락실',building:'C동',floor:1,type:'멋',category:'오락실',description:'거리 입구 왼쪽에서 만나는 오락실입니다.',menu:'오락·게임',price:'현장 확인',tags:['오락실','거리 입구'],walking:'위치는 안내도 참고',aiScore:0,storefrontImage:'/street/c-block/arcade.jpg'},
    {id:9102,name:'오봉집',building:'C동',floor:1,type:'맛',category:'한식',description:'오락실 오른쪽에 있는 오봉집입니다.',menu:'직화낙지 · 보쌈',price:'현장 확인',tags:['한식','식사'],walking:'위치는 안내도 참고',aiScore:0,storefrontImage:'/street/c-block/obong.jpg'},
    {id:9103,name:'세븐일레븐',building:'C동',floor:1,type:'맛',category:'편의점',description:'오봉집 오른쪽에 있는 편의점입니다.',menu:'편의점 상품',price:'상품별 상이',tags:['편의점','간식'],walking:'위치는 안내도 참고',aiScore:0,storefrontImage:'/street/c-block/seven-eleven.jpg'},
  ],
  nodes: [
    {id:'c-entry',number:1,name:'C동 거리 입구',subtitle:'오락실 앞 · 거리 진입부',views:{forward:'/street/c-block/entrance.jpg'},stores:[9101,9102,9103],viewStores:{forward:[]},connections:[{direction:'forward',to:'c-street',arrivalView:'forward',label:'거리 안으로 들어가기'}]},
    {id:'c-street',number:2,name:'C동 거리',subtitle:'같은 촬영 지점 · 앞과 뒤 방향',views:{forward:'/street/c-block/street-forward.jpg',back:'/street/c-block/street-back-retouched.png'},stores:[9101,9102,9103],viewStores:{forward:[],back:[],left:[9101,9102,9103],right:[]},connections:[]},
  ],
  geometry: {boundary:[],passages:[],nodes:{'c-entry':{x:176,y:288},'c-street':{x:225,y:224}},stores:{'9101':{x:158,y:257},'9102':{x:181,y:237},'9103':{x:202,y:215}}},
  facades: [],
};

/**
 * Replace every photo point (and its uploaded photos, outlines and map pins) with the C-block tour.
 * Stores, map background, boundary and passages are kept; existing C-block store edits win over defaults.
 */
export function replaceWithCStreetTour(existing: SitePublication): SitePublication {
  const keptIds = new Set(existing.stores.map(store => store.id));
  const stores = [...existing.stores, ...cStreetTour.stores.filter(store => !keptIds.has(store.id))];
  const photos = Object.fromEntries(Object.entries(existing.media?.photos || {}).filter(([key]) => cStreetTour.nodes.some(node => key.startsWith(`${node.id}:`))));
  return {
    ...existing,
    stores,
    nodes: cStreetTour.nodes.map(node => ({...node, stores: [...node.stores], viewStores: Object.fromEntries(Object.entries(node.viewStores || {}).map(([view, ids]) => [view, [...ids]]))})),
    geometry: {...existing.geometry, nodes: {...cStreetTour.geometry.nodes}, stores: {...cStreetTour.geometry.stores, ...existing.geometry.stores}},
    facades: [],
    ...(existing.media ? {media: {...existing.media, photos}} : {}),
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
