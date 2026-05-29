const STORAGE_KEY = "tmi10_easter_eggs";

export type EasterEggId =
  | "konami_code"
  | "meaning_of_life"
  | "rickroll"
  | "hello_world"
  | "meta_self_reference";

export function getDiscoveredEggs(): EasterEggId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markEggDiscovered(id: EasterEggId): boolean {
  const eggs = getDiscoveredEggs();
  if (eggs.includes(id)) return false;
  eggs.push(id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eggs));
  } catch {}
  return true;
}

export function isEggDiscovered(id: EasterEggId): boolean {
  return getDiscoveredEggs().includes(id);
}

export const EASTER_EGG_SLUGS: Record<string, EasterEggId> = {
  "meaning-of-life": "meaning_of_life",
  "the-meaning-of-life": "meaning_of_life",
  rickroll: "rickroll",
  "hello-world": "hello_world",
  "teach-me-like-im-10": "meta_self_reference",
};
