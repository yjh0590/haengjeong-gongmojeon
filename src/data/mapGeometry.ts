import { useEffect, useState } from "react";
export type XY = { x: number; y: number };
export type MapGeometry = { boundary: XY[]; passages: XY[][]; nodes: Record<string, XY>; stores: Record<string, XY> };
export const MAP_KEY = "matmeot-map-geometry-v2";
export const MAP_CHANGED_EVENT = "matmeot-map-changed";
// SVG 개념도 기준의 임시 좌표. 실측 좌표로 사용하지 않는다.
const DEFAULT_GEOMETRY: MapGeometry = {
  boundary: [],
  passages: [],
  nodes: { point1: {x:113,y:290}, point2:{x:164,y:202}, point3:{x:310,y:165}, point4:{x:361,y:274} },
  stores: { "1":{x:81,y:266}, "2":{x:153,y:310}, "3":{x:126,y:175}, "4":{x:207,y:222}, "5":{x:275,y:190}, "6":{x:349,y:141} },
};
const validPoint = (p: unknown): p is XY => !!p && typeof p === "object" &&
  Number.isFinite((p as XY).x) && Number.isFinite((p as XY).y) &&
  (p as XY).x>=0 && (p as XY).x<=500 && (p as XY).y>=0 && (p as XY).y<=374;
const validRecord = (v: unknown): v is Record<string, XY> => !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(validPoint);
export function isValidMapGeometry(value: unknown): value is MapGeometry {
  if (!value || typeof value !== "object") return false;
  const g=value as MapGeometry;
  return Array.isArray(g.boundary) && g.boundary.every(validPoint) &&
    Array.isArray(g.passages) && g.passages.every(path=>Array.isArray(path)&&path.every(validPoint)) &&
    validRecord(g.nodes) && validRecord(g.stores);
}
export function readMapGeometry(): MapGeometry {
  try {
    const raw = localStorage.getItem(MAP_KEY);
    if (!raw) return DEFAULT_GEOMETRY;
    const p: MapGeometry = JSON.parse(raw);
    if (!p || !Array.isArray(p.boundary) || !p.boundary.every(validPoint) || (p.passages!==undefined && (!Array.isArray(p.passages) || !p.passages.every(path=>Array.isArray(path)&&path.every(validPoint)))) || !validRecord(p.nodes) || !validRecord(p.stores)) return DEFAULT_GEOMETRY;
    return { boundary:p.boundary, passages:p.passages||[], nodes:{...DEFAULT_GEOMETRY.nodes,...p.nodes}, stores:{...DEFAULT_GEOMETRY.stores,...p.stores} };
  } catch { return DEFAULT_GEOMETRY; }
}
export function saveMapGeometry(g: MapGeometry) {
  if (!Array.isArray(g.boundary) || !g.boundary.every(validPoint) || !Array.isArray(g.passages) || !g.passages.every(path=>Array.isArray(path)&&path.every(validPoint)) || !validRecord(g.nodes) || !validRecord(g.stores)) throw new Error("지도 좌표가 올바르지 않습니다.");
  localStorage.setItem(MAP_KEY, JSON.stringify(g));
  window.dispatchEvent(new Event(MAP_CHANGED_EVENT));
}
export function useMapGeometry(): MapGeometry {
  const [geometry,setGeometry] = useState(readMapGeometry);
  useEffect(() => {
    const fn=()=>setGeometry(readMapGeometry());
    window.addEventListener(MAP_CHANGED_EVENT,fn); window.addEventListener("focus",fn);
    return()=>{window.removeEventListener(MAP_CHANGED_EVENT,fn);window.removeEventListener("focus",fn);};
  },[]);
  return geometry;
}
export const MAP_BG_KEY = "__map__:background";
