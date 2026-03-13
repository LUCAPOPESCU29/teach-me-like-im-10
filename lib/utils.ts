export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export function getLanguageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "English";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function unslugify(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const LEVEL_META = [
  {
    level: 1,
    label: "The Basics",
    emoji: "🌱",
    color: "#4ade80",
    buttonText: "Go Deeper →",
  },
  {
    level: 2,
    label: "Going Deeper",
    emoji: "🌿",
    color: "#fbbf24",
    buttonText: "Keep Going →",
  },
  {
    level: 3,
    label: "The Full Picture",
    emoji: "🌲",
    color: "#f97316",
    buttonText: "Almost There →",
  },
  {
    level: 4,
    label: "Expert Territory",
    emoji: "🔬",
    color: "#f43f5e",
    buttonText: "Final Dive →",
  },
  {
    level: 5,
    label: "The Frontier",
    emoji: "🚀",
    color: "#a855f7",
    buttonText: "",
  },
] as const;
