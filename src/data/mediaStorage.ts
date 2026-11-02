/**
 * Server media are publicly addressable once uploaded. A URL is only included
 * in the consumer site after explicit /catalog publication.
 * This browser-local manifest is a DRAFT; upload never publishes it.
 */
import { useEffect, useState } from "react";
import type { AdminSession } from "./sitePublication";
import type { ViewDirection } from "../types/street";

export const MEDIA_BUCKET = "itda-media";
export const MEDIA_DRAFT_KEY = "itda-media-draft-v49";
export const MEDIA_CHANGE_EVENT = "itda-media-draft-changed";
export const MAX_REMOTE_PHOTO_BYTES = 20 * 1024 * 1024;
export type PublishedMedia = { map?: string; photos: Record<string, string> };
const projectUrl = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const publicKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "");
const allowedTypes: Record<string, string> = {"image/jpeg":"jpg", "image/png":"png", "image/webp":"webp"};
const nodePattern = "[A-Za-z0-9_-]{1,32}";
const directionPattern = "(?:forward|back|left|right)";
const keyRegex = new RegExp(`^${nodePattern}:${directionPattern}$`);
const pathRegex = new RegExp(`^(?:maps/[A-Za-z0-9_-]{1,100}\\.(?:jpg|png|webp)|street/${nodePattern}/${directionPattern}/[A-Za-z0-9_-]{1,100}\\.(?:jpg|png|webp))$`);

export function validMediaPath(path: unknown): path is string {
  return typeof path === "string" && path.length <= 240 && pathRegex.test(path);
}
export function validPublishedMedia(value: unknown): value is PublishedMedia {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as PublishedMedia;
  if (v.map !== undefined && (!validMediaPath(v.map) || !v.map.startsWith("maps/"))) return false;
  if (!v.photos || typeof v.photos !== "object" || Array.isArray(v.photos)) return false;
  const photos = Object.entries(v.photos);
  return photos.length <= 2000 && photos.every(([key, path]) => {
    if (!keyRegex.test(key) || !validMediaPath(path)) return false;
    const [node, direction] = key.split(":");
    return path.startsWith(`street/${node}/${direction}/`);
  });
}
export function readMediaDraft(): PublishedMedia {
  try {
    const raw = localStorage.getItem(MEDIA_DRAFT_KEY);
    if (!raw) return {photos:{}};
    const data: unknown = JSON.parse(raw);
    return validPublishedMedia(data) ? data : {photos:{}};
  } catch { return {photos:{}}; }
}
export function saveMediaDraft(media: PublishedMedia): void {
  if (!validPublishedMedia(media)) throw new Error("사진 등록 정보에 잘못된 값이 있습니다.");
  localStorage.setItem(MEDIA_DRAFT_KEY, JSON.stringify(media));
  window.dispatchEvent(new Event(MEDIA_CHANGE_EVENT));
}
export function useMediaDraft(): PublishedMedia {
  const [media, setMedia] = useState(readMediaDraft);
  useEffect(() => {
    const reload = () => setMedia(readMediaDraft());
    window.addEventListener(MEDIA_CHANGE_EVENT, reload);
    window.addEventListener("storage", reload);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener(MEDIA_CHANGE_EVENT, reload);
      window.removeEventListener("storage", reload);
      window.removeEventListener("focus", reload);
    };
  }, []);
  return media;
}
export function setPhotoMediaPath(nodeId: string, view: ViewDirection, path: string | null): void {
  const key = `${nodeId}:${view}`;
  if (!keyRegex.test(key)) throw new Error("촬영 지점 또는 방향이 유효하지 않습니다.");
  const draft = readMediaDraft();
  const next = {...draft.photos};
  if (path) next[key] = path;
  else delete next[key];
  saveMediaDraft({...draft, photos:next});
}
export function setMapMediaPath(path: string | null): void {
  const draft = readMediaDraft();
  const next: PublishedMedia = {photos:draft.photos};
  if (path) next.map = path;
  saveMediaDraft(next);
}
/** Returns only a URL under our dedicated public Storage bucket. */
export function publicMediaUrl(path?: string): string | undefined {
  if (!validMediaPath(path) || !/^https:\/\/[\w-]+\.supabase\.co$/.test(projectUrl)) return undefined;
  return `${projectUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

async function uploadFile(file: File, prefix: string, session: AdminSession): Promise<string> {
  if (!allowedTypes[file.type]) throw new Error("JPG·PNG·WEBP 이미지만 업로드할 수 있어요.");
  if (!file.size || file.size > MAX_REMOTE_PHOTO_BYTES) throw new Error("20MB 이하의 이미지를 준비해 주세요.");
  if (!/^https:\/\/[\w-]+\.supabase\.co$/.test(projectUrl) || !publicKey.startsWith("sb_publishable_"))
    throw new Error("Supabase 환경변수 설정을 확인해 주세요.");
  // Unique immutable names prevent replacing an image used by a previous publication.
  const filename = `${Date.now()}-${crypto.randomUUID().replace(/-/g, "")}.${allowedTypes[file.type]}`;
  const objectPath = `${prefix}/${filename}`;
  const storagePath = objectPath.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${projectUrl}/storage/v1/object/${MEDIA_BUCKET}/${storagePath}`, {
    method:"POST",
    headers:{ apikey:publicKey, Authorization:`Bearer ${session.token}`, "Content-Type":file.type, "cache-control":"3600", "x-upsert":"false" },
    body:file,
  });
  if (!response.ok) {
    let detail = `사진 업로드에 실패했습니다 (${response.status}).`;
    try {
      const error = await response.json() as {message?:string;error?:string};
      detail = error.message || error.error || detail;
    } catch { /* status is enough */ }
    throw new Error(`${detail} Supabase Storage 버킷과 RLS 정책을 확인해 주세요.`);
  }
  return objectPath;
}
export async function uploadStreetPhoto(file: File, nodeId: string, view: ViewDirection, session: AdminSession): Promise<string> {
  if (!new RegExp(`^${nodePattern}$`).test(nodeId) || !["forward","back","left","right"].includes(view))
    throw new Error("촬영 지점이 올바르지 않습니다.");
  const path = await uploadFile(file, `street/${nodeId}/${view}`, session);
  setPhotoMediaPath(nodeId, view, path);
  return path;
}
export async function uploadMapImage(file: File, session: AdminSession): Promise<string> {
  const path = await uploadFile(file, "maps", session);
  setMapMediaPath(path);
  return path;
}
