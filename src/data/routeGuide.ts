import type { StreetNode } from "../types/street";

/**
 * Returns the fewest *configured directional street-photo hops* to a store.
 * This is not a physical pedestrian route, distance, or accessibility estimate.
 * The last node is the best reachable configured viewpoint for the shop.
 */
export function findStorePhotoRoute(
  from: string,
  storeId: number,
  nodes: StreetNode[],
): string[] | null {
  const byId = new Map(nodes.map(node => [node.id, node]));
  if (!byId.has(from)) return null;
  const targets = new Set(nodes.filter(node => node.stores.includes(storeId)).map(node => node.id));
  if (!targets.size) return null;
  const queue = [from];
  const previous = new Map<string, string | null>([[from, null]]);
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (targets.has(id)) {
      const path: string[] = [];
      let current: string | null = id;
      while (current !== null) {
        path.unshift(current);
        current = previous.get(current) ?? null;
      }
      return path;
    }
    for (const connection of byId.get(id)?.connections ?? []) {
      if (!byId.has(connection.to) || previous.has(connection.to)) continue;
      previous.set(connection.to, id);
      queue.push(connection.to);
    }
  }
  return null;
}

/** Connectivity warnings for editing purposes; all links are directional. */
export function inspectStreetNetwork(nodes: StreetNode[]): string[] {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const messages: string[] = [];
  for (const node of nodes) {
    if (!node.connections.length) messages.push(`${node.number}번 지점: 이동 연결이 없습니다.`);
    for (const link of node.connections) {
      if (!byId.has(link.to)) messages.push(`${node.number}번 지점: 존재하지 않는 ${link.to} 지점을 가리킵니다.`);
      if (link.to === node.id) messages.push(`${node.number}번 지점: 자기 자신에게 이동하도록 설정됐습니다.`);
      if (byId.has(link.to) && !byId.get(link.to)?.connections.some(next => next.to === node.id)) {
        messages.push(`${node.number}번 → ${byId.get(link.to)?.number}번: 돌아오는 연결이 없습니다.`);
      }
    }
  }
  if (nodes.length) {
    const visited = new Set<string>([nodes[0].id]);
    const queue = [nodes[0].id];
    for (let i = 0; i < queue.length; i++) {
      for (const link of byId.get(queue[i])?.connections ?? []) {
        if (!byId.has(link.to) || visited.has(link.to)) continue;
        visited.add(link.to); queue.push(link.to);
      }
    }
    for (const node of nodes.filter(item => !visited.has(item.id))) {
      messages.push(`시작 지점에서 ${node.number}번 지점까지 연결된 경로가 없습니다.`);
    }
  }
  return [...new Set(messages)];
}
