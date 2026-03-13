import { MATH_CATEGORIES } from "./math-topics";

export interface MathTreeNode {
  id: string;
  name: string;
  categoryId: string;
  tier: number;
  description: string;
  prerequisites: string[];
}

export interface MathTreeEdge {
  from: string;
  to: string;
}

export interface LayoutNode {
  id: string;
  node: MathTreeNode;
  x: number;
  y: number;
}

// 30 key math concepts across 6 tiers
export const MATH_TREE_NODES: MathTreeNode[] = [
  // Tier 0 — Foundations
  { id: "order-of-operations", name: "Order of Operations", categoryId: "numbers", tier: 0, description: "The rules that tell you which calculation to do first — PEMDAS/BODMAS", prerequisites: [] },
  { id: "negative-numbers", name: "Negative Numbers", categoryId: "numbers", tier: 0, description: "Numbers below zero — essential for debt, temperature, and algebra", prerequisites: [] },
  { id: "divisibility-rules", name: "Divisibility Rules", categoryId: "numbers", tier: 0, description: "Quick tricks to tell if a number divides evenly into another", prerequisites: [] },
  { id: "fractions-decimals", name: "Fractions & Decimals", categoryId: "numbers", tier: 0, description: "Parts of a whole — the foundation for ratios, percentages, and beyond", prerequisites: [] },

  // Tier 1 — Building Blocks
  { id: "prime-numbers", name: "Prime Numbers", categoryId: "numbers", tier: 1, description: "Numbers divisible only by 1 and themselves — the atoms of math", prerequisites: ["divisibility-rules"] },
  { id: "percentages", name: "Percentages", categoryId: "numbers", tier: 1, description: "Fractions out of 100 — used everywhere from shopping to statistics", prerequisites: ["fractions-decimals"] },
  { id: "ratios-proportions", name: "Ratios & Proportions", categoryId: "numbers", tier: 1, description: "Comparing quantities and scaling them up or down", prerequisites: ["fractions-decimals"] },
  { id: "exponents", name: "Exponents", categoryId: "numbers", tier: 1, description: "Repeated multiplication — powers that make numbers grow fast", prerequisites: ["order-of-operations"] },
  { id: "angles", name: "Angles", categoryId: "geometry", tier: 1, description: "Measuring turns and corners — the starting point of geometry", prerequisites: [] },
  { id: "variables-expressions", name: "Variables & Expressions", categoryId: "algebra", tier: 1, description: "Using letters to represent unknown numbers — the door to algebra", prerequisites: ["order-of-operations", "negative-numbers"] },

  // Tier 2 — Core Skills
  { id: "square-roots", name: "Square Roots", categoryId: "numbers", tier: 2, description: "The reverse of squaring — what number times itself gives you this?", prerequisites: ["exponents"] },
  { id: "linear-equations", name: "Linear Equations", categoryId: "algebra", tier: 2, description: "Solving for x in straight-line relationships", prerequisites: ["variables-expressions"] },
  { id: "inequalities", name: "Inequalities", categoryId: "algebra", tier: 2, description: "When math isn't exactly equal — greater than, less than, and ranges", prerequisites: ["variables-expressions", "negative-numbers"] },
  { id: "triangles", name: "Triangles", categoryId: "geometry", tier: 2, description: "Three-sided shapes with powerful properties used everywhere", prerequisites: ["angles"] },
  { id: "circles-pi", name: "Circles & Pi", categoryId: "geometry", tier: 2, description: "The perfectly round shape and its magical constant 3.14159...", prerequisites: ["ratios-proportions"] },
  { id: "area-volume", name: "Area & Volume", categoryId: "geometry", tier: 2, description: "Measuring flat space and 3D space inside shapes", prerequisites: ["triangles", "circles-pi"] },
  { id: "probability", name: "Probability", categoryId: "statistics", tier: 2, description: "The math of chance — how likely is something to happen?", prerequisites: ["fractions-decimals", "ratios-proportions"] },

  // Tier 3 — Intermediate
  { id: "pythagorean-theorem", name: "Pythagorean Theorem", categoryId: "geometry", tier: 3, description: "a² + b² = c² — the most famous equation in geometry", prerequisites: ["triangles", "square-roots"] },
  { id: "quadratic-equations", name: "Quadratic Equations", categoryId: "algebra", tier: 3, description: "Equations with x² that create parabolas — curves everywhere in nature", prerequisites: ["linear-equations", "exponents"] },
  { id: "functions", name: "Functions", categoryId: "algebra", tier: 3, description: "Math machines — put a number in, get a number out", prerequisites: ["linear-equations"] },
  { id: "systems-of-equations", name: "Systems of Equations", categoryId: "algebra", tier: 3, description: "Solving multiple equations at once to find where they agree", prerequisites: ["linear-equations"] },
  { id: "mean-median-mode", name: "Mean, Median & Mode", categoryId: "statistics", tier: 3, description: "Three ways to find the 'middle' of a set of numbers", prerequisites: ["fractions-decimals"] },
  { id: "combinations-permutations", name: "Combinations & Permutations", categoryId: "statistics", tier: 3, description: "Counting the ways to arrange or choose things", prerequisites: ["probability", "exponents"] },

  // Tier 4 — Advanced
  { id: "coordinate-geometry", name: "Coordinate Geometry", categoryId: "geometry", tier: 4, description: "Where algebra meets geometry — plotting shapes on a grid", prerequisites: ["pythagorean-theorem", "linear-equations"] },
  { id: "logarithms", name: "Logarithms", categoryId: "algebra", tier: 4, description: "The reverse of exponents — how many times do you multiply?", prerequisites: ["exponents", "functions"] },
  { id: "polynomials", name: "Polynomials", categoryId: "algebra", tier: 4, description: "Expressions with multiple terms and powers of x", prerequisites: ["quadratic-equations"] },
  { id: "sequences-series", name: "Sequences & Series", categoryId: "algebra", tier: 4, description: "Patterns in numbers and what happens when you add them all up", prerequisites: ["functions"] },

  // Tier 5 — Calculus
  { id: "limits", name: "Limits", categoryId: "calculus", tier: 5, description: "What happens as you get infinitely close — the gateway to calculus", prerequisites: ["functions", "sequences-series"] },
  { id: "derivatives", name: "Derivatives", categoryId: "calculus", tier: 5, description: "Measuring how fast things change — the slope at any point", prerequisites: ["limits", "polynomials"] },
  { id: "integrals", name: "Integrals", categoryId: "calculus", tier: 5, description: "Adding up infinite tiny pieces — area under curves and beyond", prerequisites: ["derivatives", "area-volume"] },
];

export function buildEdges(nodes: MathTreeNode[]): MathTreeEdge[] {
  const edges: MathTreeEdge[] = [];
  for (const node of nodes) {
    for (const prereq of node.prerequisites) {
      edges.push({ from: prereq, to: node.id });
    }
  }
  return edges;
}

export function getUnlockedBy(nodeId: string, nodes: MathTreeNode[]): MathTreeNode[] {
  return nodes.filter((n) => n.prerequisites.includes(nodeId));
}

export function getPrerequisitesOf(nodeId: string, nodes: MathTreeNode[]): MathTreeNode[] {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return [];
  return nodes.filter((n) => node.prerequisites.includes(n.id));
}

export function getCategoryColor(categoryId: string): string {
  const cat = MATH_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.color ?? "#ffffff";
}

export function getCategoryIcon(categoryId: string): string {
  const cat = MATH_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.icon ?? "?";
}

export function getCategoryName(categoryId: string): string {
  const cat = MATH_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.title ?? "";
}

// Layout constants
const TREE_W = 1400;
const TREE_H = 700;
const TIER_COUNT = 6;
const PAD_X = 130;
const PAD_Y = 50;
const TIER_SPACING = (TREE_W - 2 * PAD_X) / (TIER_COUNT - 1);

export { TREE_W, TREE_H };

export function computeTreeLayout(nodes: MathTreeNode[]): LayoutNode[] {
  // Group by tier
  const tiers = new Map<number, MathTreeNode[]>();
  for (const node of nodes) {
    const list = tiers.get(node.tier) || [];
    list.push(node);
    tiers.set(node.tier, list);
  }

  const layoutNodes: LayoutNode[] = [];

  for (const [tier, tierNodes] of tiers) {
    const x = PAD_X + tier * TIER_SPACING;
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
