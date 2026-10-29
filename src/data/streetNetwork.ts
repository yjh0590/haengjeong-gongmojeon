import { useEffect, useState } from "react";
import { streetNodes as defaultNodes } from "./streetNodes";
import type { StreetNode, ViewDirection } from "../types/street";

export const NETWORK_KEY = "matmeot-street-network-v2";
export const NETWORK_CHANGED_EVENT = "matmeot-network-changed";
const views: ViewDirection[] = ["forward", "back", "left", "right"];

function validNode(value: unknown): value is StreetNode {
  if (!value || typeof value !== "object") return false;
  const n = value as StreetNode;
  return typeof n.id === "string" && /^[a-zA-Z0-9_-]{1,32}$/.test(n.id) &&
    typeof n.number === "number" && Number.isInteger(n.number) &&
    typeof n.name === "string" && typeof n.subtitle === "string" &&
    !!n.views && typeof n.views === "object" &&
    Object.entries(n.views).every(([key, src]) => views.includes(key as ViewDirection) && (src === undefined || typeof src === "string")) &&
    Array.isArray(n.stores) && n.stores.every((id) => typeof id === "number") &&
    Array.isArray(n.connections) && n.connections.every((c) => c && typeof c.to === "string" && views.includes(c.direction));
}
export function isValidStreetNodes(value: unknown): value is StreetNode[] {
  return Array.isArray(value) && value.length>0 && value.length<=500 && value.every(validNode) &&
    new Set(value.map(n=>n.id)).size===value.length;
}
export function readStreetNodes(): StreetNode[] {
  try {
    const raw = localStorage.getItem(NETWORK_KEY);
    if (!raw) return defaultNodes;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length || !parsed.every(validNode)) return defaultNodes;
    if (new Set(parsed.map((n) => n.id)).size !== parsed.length) return defaultNodes;
    return parsed;
  } catch { return defaultNodes; }
}
export function saveStreetNodes(nodes: StreetNode[]): void {
  if (!nodes.length || !nodes.every(validNode)) throw new Error("촬영 지점 설정을 확인해 주세요.");
  localStorage.setItem(NETWORK_KEY, JSON.stringify(nodes));
  window.dispatchEvent(new Event(NETWORK_CHANGED_EVENT));
}
export function useStreetNodes(): StreetNode[] {
  const [nodes, setNodes] = useState<StreetNode[]>(readStreetNodes);
  useEffect(() => {
    const reload = () => setNodes(readStreetNodes());
    window.addEventListener(NETWORK_CHANGED_EVENT, reload);
    window.addEventListener("focus", reload);
    return () => { window.removeEventListener(NETWORK_CHANGED_EVENT, reload); window.removeEventListener("focus", reload); };
  }, []);
  return nodes;
}
