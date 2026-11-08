import { STORE_DRAFT_KEY, saveStoreDraft } from "./storeDraft";
import { MAP_KEY, saveMapGeometry } from "./mapGeometry";
import { NETWORK_KEY, saveStreetNodes } from "./streetNetwork";
import { FACADE_KEY } from "./facadeAnnotations";
import { MEDIA_DRAFT_KEY, saveMediaDraft } from "./mediaStorage";
import type { SitePublication } from "./sitePublication";

/** Whether this browser already holds any editor draft (stores, map, photo points, outlines or media links). */
export function hasEditorDrafts(): boolean {
  try { return [STORE_DRAFT_KEY, MAP_KEY, NETWORK_KEY, FACADE_KEY, MEDIA_DRAFT_KEY].some(key => localStorage.getItem(key) !== null); }
  catch { return true; } // Storage blocked: never overwrite anything.
}

/** Replace this browser's editor drafts with a publication, so editing starts from what customers see. */
export function applyPublicationToDrafts(data: SitePublication): void {
  saveStoreDraft(data.stores);
  saveMapGeometry(data.geometry);
  saveStreetNodes(data.nodes);
  localStorage.setItem(FACADE_KEY, JSON.stringify(data.facades));
  saveMediaDraft(data.media || { photos: {} });
  window.dispatchEvent(new Event("matmeot-facades-changed"));
}
