import type { StoreData } from '../types/street';
export type NextStop = {store:StoreData;reason:string;detail:string};
export function nextStops(current:StoreData,stores:StoreData[],limit=3):NextStop[]{
 const cafe=(s:StoreData)=>/카페|차|디저트/.test(s.category), food=(s:StoreData)=>s.type==='맛'&&!cafe(s), culture=(s:StoreData)=>/문화|공예|체험|사진|서점/.test(s.category);
 return stores.filter(s=>s.id!==current.id).map(store=>{
  let score=0,reason='다른 취향도 둘러봐요',detail=store.category;
  if(food(current)&&cafe(store)){score+=7;reason='식사 다음엔, 커피 한 잔';detail='식사와 다른 경험으로 이어져요';}
  else if(cafe(current)&&culture(store)){score+=7;reason='쉬었다면, 작은 경험 하나';detail='사진·책·체험으로 산책을 이어가요';}
  else if(current.type==='멋'&&cafe(store)){score+=6;reason='둘러본 뒤 잠깐 쉬어 가요';detail='천천히 머물 수 있는 다음 자리';}
  else if(current.type!==store.type){score+=4;reason='맛에서 멋으로, 멋에서 맛으로';detail='다른 종류의 가게를 함께 발견해요';}
  if(store.building===current.building){score+=2;}
  if(store.floor===current.floor){score+=1;}
  return {store,reason,detail,score};
 }).sort((a,b)=>b.score-a.score||a.store.id-b.store.id).slice(0,Math.max(0,limit)).map(({store,reason,detail})=>({store,reason,detail}));
}
