import { FACADE_KEY, getFacadeAnnotations, type FacadeAnnotation } from "./facadeAnnotations";
import { isValidMapGeometry, readMapGeometry, saveMapGeometry, type MapGeometry } from "./mapGeometry";
import { listDraftPhotos, MAX_PHOTO_BYTES, restoreDraftImage } from "./localStreetPhotos";
import { isValidStreetNodes, readStreetNodes, saveStreetNodes } from "./streetNetwork";
import type { StreetNode, StoreData } from "../types/street";
import { readStoreDraft, saveStoreDraft, validStores } from "./storeDraft";

const FORMAT = "itda-street-editor-backup";
type BackupPhoto = { key: string; name: string; dataUrl: string };
type EditorBackup = {
  format: typeof FORMAT;
  version: 1 | 2;
  stores?: StoreData[];
  createdAt: string;
  geometry: MapGeometry;
  nodes: StreetNode[];
  facades: FacadeAnnotation[];
  photos: BackupPhoto[];
};

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onerror=()=>reject(new Error("사진을 백업 파일로 변환하지 못했어요."));
    r.onload=()=>resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}

function validateFacades(value: unknown, nodes: StreetNode[]): value is FacadeAnnotation[] {
  if (!Array.isArray(value) || value.length>5000) return false;
  const ids = new Set(nodes.map(n=>n.id));
  return value.every((v: FacadeAnnotation)=>v && ids.has(v.nodeId) &&
    ["forward","back","left","right"].includes(v.view) &&
    Number.isSafeInteger(v.storeId) &&
    Array.isArray(v.points) && v.points.length>=3 && v.points.length<=100 &&
    v.points.every(p=>p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x>=0 && p.y>=0 && p.x<=100 && p.y<=100));
}

export async function downloadEditorBackup(): Promise<number> {
  const photos = await listDraftPhotos();
  const assets: BackupPhoto[]=[];
  for (const photo of photos) {
    assets.push({key:photo.key,name:photo.name,dataUrl:await toDataUrl(photo.blob)});
  }
  const backup: EditorBackup = {
    format: FORMAT,version:2,createdAt:new Date().toISOString(),
    stores:readStoreDraft(),
    geometry:readMapGeometry(),nodes:readStreetNodes(),
    facades:getFacadeAnnotations(),photos:assets,
  };
  const url=URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;
  a.download=`itda-editor-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),3000);
  return photos.length;
}

function validPhoto(value: unknown): value is BackupPhoto {
  if (!value || typeof value!=="object") return false;
  const p=value as BackupPhoto;
  return typeof p.key==="string" && (p.key==="__map__:background" || /^[a-zA-Z0-9_-]{1,32}:(forward|back|left|right)$/.test(p.key)) &&
    typeof p.name==="string" && p.name.length<=255 &&
    typeof p.dataUrl==="string" && /^data:image\/(jpeg|png|webp);base64,/.test(p.dataUrl) &&
    p.dataUrl.length<=Math.ceil(MAX_PHOTO_BYTES*4/3)+100;
}

/** Import is intentionally explicit: this is still local browser preview data. */
export async function importEditorBackup(file: File): Promise<number> {
  if (file.size>160*1024*1024) throw new Error("백업 파일은 160MB 이하여야 합니다.");
  const obj: unknown = JSON.parse(await file.text());
  if (!obj || typeof obj!=="object") throw new Error("백업 형식이 올바르지 않습니다.");
  const backup=obj as EditorBackup;
  if (backup.format!==FORMAT || ![1,2].includes(backup.version) || (backup.version===2 && !validStores(backup.stores)) || !isValidMapGeometry(backup.geometry) ||
      !isValidStreetNodes(backup.nodes) || !validateFacades(backup.facades,backup.nodes) ||
      !Array.isArray(backup.photos) || backup.photos.length>300 || !backup.photos.every(validPhoto)) {
    throw new Error("ITDA 백업 파일의 구조가 올바르지 않습니다.");
  }
  const validKeys=new Set(backup.nodes.flatMap(n=>["forward","back","left","right"].map(d=>`${n.id}:${d}`)));
  const restored:{key:string,file:File}[]=[];
  for(const photo of backup.photos){
    if(photo.key!=="__map__:background" && !validKeys.has(photo.key)) throw new Error("존재하지 않는 촬영 지점의 사진이 포함되어 있어요.");
    const match=/^data:(image\/(?:jpeg|png|webp));base64,(.*)$/.exec(photo.dataUrl);
    if(!match) throw new Error("사진 데이터가 손상되었습니다.");
    const raw=atob(match[2]);
    if(raw.length>MAX_PHOTO_BYTES) throw new Error("20MB를 초과한 사진이 포함되어 있어요.");
    const bytes=Uint8Array.from(raw, c=>c.charCodeAt(0));
    restored.push({key:photo.key,file:new File([bytes],photo.name||"restored-photo",{type:match[1]})});
  }
  // All metadata and images are validated before updating browser storage.
  for(const photo of restored) await restoreDraftImage(photo.key,photo.file);
  saveMapGeometry(backup.geometry);
  saveStreetNodes(backup.nodes);
  if (backup.version===2 && backup.stores) saveStoreDraft(backup.stores);
  localStorage.setItem(FACADE_KEY,JSON.stringify(backup.facades));
  window.dispatchEvent(new Event("matmeot-facades-changed"));
  return restored.length;
}
