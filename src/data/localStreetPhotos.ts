import { useCallback, useEffect, useState } from "react";
import type { ViewDirection } from "../types/street";

/** Local preview only. No remote upload or public publishing happens here. */
const DB_NAME = "matmeot-street-photo-drafts";
const STORE = "photos";
export const PHOTO_CHANGED_EVENT = "matmeot-photo-changed";
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export type LocalStreetPhoto = { key: string; blob: Blob; name: string; updatedAt: string };
export type PhotoUrls = Record<string, string>;

export const photoKey = (nodeId: string, view: ViewDirection) => `${nodeId}:${view}`;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("이 브라우저에서는 사진 임시 저장을 지원하지 않습니다.")); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("사진 저장소를 열지 못했습니다."));
  });
}
async function transact<T>(mode: IDBTransactionMode, method: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = method(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("사진 저장 중 오류가 발생했습니다."));
    transaction.onerror = () => reject(transaction.error || new Error("사진 저장 중 오류가 발생했습니다."));
    transaction.oncomplete = () => db.close();
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error("사진 저장이 취소됐습니다.")); };
  });
}
export async function listDraftPhotos(): Promise<LocalStreetPhoto[]> {
  return transact("readonly", (store) => store.getAll());
}
export async function saveDraftPhoto(nodeId: string, view: ViewDirection, file: File): Promise<void> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("JPG·PNG·WEBP 사진만 등록할 수 있어요.");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("사진은 20MB 이하로 준비해 주세요.");
  await transact("readwrite", (store) => store.put({ key: photoKey(nodeId, view), blob: file, name: file.name, updatedAt: new Date().toISOString() }));
  window.dispatchEvent(new Event(PHOTO_CHANGED_EVENT));
}
export async function deleteDraftPhoto(nodeId: string, view: ViewDirection): Promise<void> {
  await transact("readwrite", (store) => store.delete(photoKey(nodeId, view)));
  window.dispatchEvent(new Event(PHOTO_CHANGED_EVENT));
}
/** Restore a previously exported local preview asset. Never publishes to the server. */
export async function restoreDraftImage(key: string, file: File): Promise<void> {
  if (key === "__map__:background") return saveDraftMap(file);
  const match = /^([a-zA-Z0-9_-]{1,32}):(forward|back|left|right)$/.exec(key);
  if (!match) throw new Error("백업의 사진 식별자가 올바르지 않습니다.");
  return saveDraftPhoto(match[1], match[2] as ViewDirection, file);
}
export async function saveDraftMap(file: File): Promise<void> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("JPG·PNG·WEBP 지도 이미지가 필요해요.");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("지도 이미지가 20MB를 초과합니다.");
  await transact("readwrite", (store) => store.put({ key: "__map__:background", blob: file, name: file.name, updatedAt: new Date().toISOString() }));
  window.dispatchEvent(new Event(PHOTO_CHANGED_EVENT));
}
export async function deleteDraftMap(): Promise<void> {
  await transact("readwrite", (store) => store.delete("__map__:background"));
  window.dispatchEvent(new Event(PHOTO_CHANGED_EVENT));
}
export function useDraftPhotoUrls(): { urls: PhotoUrls; loading: boolean; reload: () => void } {
  const [urls, setUrls] = useState<PhotoUrls>({});
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((prev) => prev + 1), []);
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    void listDraftPhotos().then((photos) => {
      if (cancelled) return;
      const next: PhotoUrls = {};
      photos.forEach((photo) => {
        const url = URL.createObjectURL(photo.blob);
        created.push(url);
        next[photo.key] = url;
      });
      setUrls(next);
    }).catch(() => { if (!cancelled) setUrls({}); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; created.forEach((url) => URL.revokeObjectURL(url)); };
  }, [version]);
  useEffect(() => {
    window.addEventListener(PHOTO_CHANGED_EVENT, reload);
    window.addEventListener("focus", reload);
    return () => { window.removeEventListener(PHOTO_CHANGED_EVENT, reload); window.removeEventListener("focus", reload); };
  }, [reload]);
  return { urls, loading, reload };
}
