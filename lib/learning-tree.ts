export interface TreeCategory {
  id: string;
  name: string;
  color: string;
}

export interface LearningTreeNode {
  id: string;
  name: string;
  categoryId: string;
  tier: number;
}

export interface LearningTreeEdge {
  from: string;
  to: string;
  type: "prerequisite" | "builds-on" | "related";
}

export interface LearningTreeData {
  categories: TreeCategory[];
  nodes: LearningTreeNode[];
  edges: LearningTreeEdge[];
}

// Layout
const TREE_W = 1400;
const TREE_H = 700;
const PAD_X = 130;
const PAD_Y = 50;

export { TREE_W, TREE_H };

export interface LayoutNode {
  id: string;
  node: LearningTreeNode;
  x: number;
  y: number;
}

export function computeDynamicLayout(nodes: LearningTreeNode[]): LayoutNode[] {
  const tiers = new Map<number, LearningTreeNode[]>();
  for (const node of nodes) {
    const list = tiers.get(node.tier) || [];
    list.push(node);
    tiers.set(node.tier, list);
  }

  const tierKeys = [...tiers.keys()].sort((a, b) => a - b);
  const tierCount = tierKeys.length;
  if (tierCount === 0) return [];

  const tierSpacing = tierCount > 1 ? (TREE_W - 2 * PAD_X) / (tierCount - 1) : 0;
  const layoutNodes: LayoutNode[] = [];

  for (let ti = 0; ti < tierKeys.length; ti++) {
    const tier = tierKeys[ti];
    const tierNodes = tiers.get(tier)!;
    const x = tierCount > 1 ? PAD_X + ti * tierSpacing : TREE_W / 2;
    const count = tierNodes.length;
    const usableH = TREE_H - 2 * PAD_Y;
    const spacing = count > 1 ? usableH / (count - 1) : 0;
    const startY = count > 1 ? PAD_Y : TREE_H / 2;

    for (let i = 0; i < tierNodes.length; i++) {
      layoutNodes.push({
        id: tierNodes[i].id,
        node: tierNodes[i],
        x,
        y: startY + i * spacing,
      });
    }
  }

  return layoutNodes;
}

export function edgePath(fromX: number, fromY: number, toX: number, toY: number): string {
  const midX = (fromX + toX) / 2;
  return `M ${fromX + 22} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX - 22} ${toY}`;
}

// Helpers
export function getEdgesFrom(nodeId: string, edges: LearningTreeEdge[]): LearningTreeEdge[] {
  return edges.filter((e) => e.from === nodeId);
}

export function getEdgesTo(nodeId: string, edges: LearningTreeEdge[]): LearningTreeEdge[] {
  return edges.filter((e) => e.to === nodeId);
}

export function getCategoryById(id: string, categories: TreeCategory[]): TreeCategory | undefined {
  return categories.find((c) => c.id === id);
}

// Cache
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function computeTreeCacheKey(slugs: string[], prefix: string): string {
  const sorted = [...slugs].sort().join("|");
  return `${prefix}${hashString(sorted)}`;
}

export function getCachedTree(key: string): LearningTreeData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.categories && parsed.nodes && parsed.edges) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setCachedTree(key: string, data: LearningTreeData): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full
  }
}
