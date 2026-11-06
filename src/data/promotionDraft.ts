import type { StoreData } from '../types/street';
import { storeMenuItems } from './storeMenuItems';
import { koreanDate } from './publicPromotions';
export type PromotionPurpose = 'menu' | 'visit' | 'welcome';
export type PromotionDraft = { version: 1; storeId: number; purpose: PromotionPurpose; benefit: string; title: string; streetCopy: string; snsCopy: string; shortScript: string; endsOn: string };
export const PROMOTION_DRAFT_KEY = 'itda-owner-edit-drafts-v1';
const purposes = ['menu','visit','welcome'];
export function promotionDateBounds(now = new Date()) { return { min: koreanDate(now), max: koreanDate(new Date(now.getTime() + 90 * 86400000)) }; }
export function emptyPromotionDraft(storeId: number, now = new Date()): PromotionDraft { return {version:1,storeId,purpose:'menu',benefit:'',title:'',streetCopy:'',snsCopy:'',shortScript:'',endsOn:koreanDate(new Date(now.getTime()+7*86400000))}; }
export function validPromotionDraft(value: unknown): value is PromotionDraft {
 if(!value||typeof value!=='object')return false;const d=value as PromotionDraft;
 return d.version===1&&Number.isSafeInteger(d.storeId)&&d.storeId>0&&purposes.includes(d.purpose)&&
 typeof d.benefit==='string'&&d.benefit.length<=90&&typeof d.title==='string'&&d.title.length<=120&&
 typeof d.streetCopy==='string'&&d.streetCopy.length<=450&&typeof d.snsCopy==='string'&&d.snsCopy.length<=2000&&typeof d.shortScript==='string'&&d.shortScript.length<=2000&&
 typeof d.endsOn==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.endsOn);
}
export function promotionDraftError(draft:PromotionDraft, now=new Date()):string|null {
 if(!validPromotionDraft(draft)||!draft.title.trim()||!draft.streetCopy.trim())return '소식 제목과 거리 노출 문구를 입력해 주세요.';
 const date=new Date(draft.endsOn+'T00:00:00Z'),bounds=promotionDateBounds(now);
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==draft.endsOn||draft.endsOn<bounds.min||draft.endsOn>bounds.max)return '종료일은 오늘부터 90일 이내의 올바른 날짜로 선택해 주세요.';
 return null;
}
export function createPromotionDraft(store:StoreData,purpose:PromotionPurpose,benefit:string,now=new Date()):PromotionDraft {
 const menu=storeMenuItems(store)[0];const details=`${menu.name} · ${menu.price}`;const location=`${store.building} ${store.floor}층${store.unit?' '+store.unit:''}`;
 const titles={menu:`${store.name}의 ${menu.name}`,visit:`산책길에 만나는 ${store.name}`,welcome:`${store.name}을 소개해요`};
 const opening={menu:`${details}. ${store.name}에서 만나보세요.`,visit:`동네를 둘러보는 날, ${store.name}의 ${menu.name}도 살펴보세요.`,welcome:`${location}에서 만나는 ${store.name}. ${details}부터 확인해 보세요.`};
 const title=titles[purpose].slice(0,120),extra=benefit.trim().slice(0,90),streetCopy=(opening[purpose]+(extra?' '+extra:'')).slice(0,450);
 return {...emptyPromotionDraft(store.id,now),purpose,benefit:extra,title,streetCopy,snsCopy:`${streetCopy}\n\n${location}\n#동네발견 #송도타임스페이스`.slice(0,2000),shortScript:`[처음] ${store.name}을 소개합니다.\n[메뉴] ${details}\n[위치] ${location}\n[마무리] 가게 정보를 확인하고 방문해 주세요.`.slice(0,2000)};
}
export function readPromotionDraft(storeId:number):PromotionDraft|null { try{const drafts=JSON.parse(localStorage.getItem(PROMOTION_DRAFT_KEY)||'{}');const draft=drafts[String(storeId)];return validPromotionDraft(draft)&&draft.storeId===storeId?draft:null;}catch{return null;} }
export function savePromotionDraft(draft:PromotionDraft){if(!validPromotionDraft(draft))throw Error('초안의 문구 길이와 날짜를 확인해 주세요.');let drafts:Record<string,PromotionDraft>={};try{const parsed=JSON.parse(localStorage.getItem(PROMOTION_DRAFT_KEY)||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){for(const value of Object.values(parsed)){if(validPromotionDraft(value))drafts[String(value.storeId)]=value;}};}catch{/* Recover only this editable draft, never auth data. */}localStorage.setItem(PROMOTION_DRAFT_KEY,JSON.stringify({...drafts,[draft.storeId]:draft}));}
