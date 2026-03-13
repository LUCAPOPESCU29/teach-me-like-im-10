export type TopicCategory =
  | "science"
  | "nature"
  | "math"
  | "tech"
  | "history"
  | "economics"
  | "health"
  | "default";

const CATEGORY_KEYWORDS: Record<TopicCategory, string[]> = {
  science: [
    "physics", "chemistry", "biology", "quantum", "atom", "molecule",
    "gravity", "relativity", "electron", "proton", "neutron", "thermodynamics",
    "entropy", "energy", "particle", "wave", "radiation", "nuclear",
    "photon", "force", "mass", "velocity", "acceleration", "magnetism",
    "electricity", "optics", "light", "spectrum", "experiment", "laboratory",
    "reaction", "element", "periodic", "cell", "dna", "gene", "evolution",
    "organism", "ecosystem", "protein", "enzyme",
  ],
  nature: [
    "ocean", "climate", "volcano", "planet", "star", "solar", "moon",
    "earth", "weather", "rain", "wind", "storm", "mountain", "river",
    "forest", "desert", "arctic", "glacier", "coral", "reef",
    "atmosphere", "ozone", "carbon", "greenhouse", "ecosystem",
    "biodiversity", "species", "animal", "plant", "tree", "flower",
    "bird", "fish", "whale", "dolphin", "insect", "butterfly",
    "space", "universe", "galaxy", "constellation", "asteroid", "comet",
    "black hole", "nebula", "supernova",
  ],
  math: [
    "calculus", "algebra", "geometry", "equation", "probability",
    "statistics", "trigonometry", "number", "theorem", "proof",
    "integral", "derivative", "function", "graph", "matrix",
    "vector", "polynomial", "logarithm", "exponent", "fraction",
    "infinity", "pi", "fibonacci", "prime", "set theory",
    "topology", "dimension", "symmetry", "fractal", "algorithm",
  ],
  tech: [
    "computer", "algorithm", "ai", "artificial intelligence", "machine learning",
    "blockchain", "programming", "software", "hardware", "internet",
    "web", "database", "cloud", "server", "network", "cybersecurity",
    "encryption", "robot", "automation", "data", "code", "app",
    "semiconductor", "chip", "processor", "memory", "digital",
    "virtual reality", "augmented", "api", "python", "javascript",
  ],
  history: [
    "war", "revolution", "empire", "ancient", "civilization",
    "medieval", "renaissance", "colonial", "dynasty", "kingdom",
    "pharaoh", "roman", "greek", "viking", "samurai", "silk road",
    "industrial", "democracy", "independence", "constitution",
    "civil rights", "slavery", "archaeology", "artifact", "monument",
    "pyramid", "castle", "battle", "treaty", "emperor",
  ],
  economics: [
    "stock", "market", "inflation", "finance", "trade", "economy",
    "gdp", "bank", "currency", "investment", "tax", "supply",
    "demand", "capitalism", "socialism", "recession", "debt",
    "credit", "interest", "bond", "crypto", "bitcoin", "money",
    "wealth", "poverty", "inequality", "globalization", "tariff",
  ],
  health: [
    "vaccine", "virus", "brain", "medicine", "nutrition", "heart",
    "blood", "immune", "disease", "cancer", "mental health",
    "anxiety", "depression", "sleep", "exercise", "diet",
    "vitamin", "bacteria", "infection", "surgery", "anatomy",
    "organ", "bone", "muscle", "nerve", "hormone", "therapy",
    "pharmaceutical", "drug", "symptom", "diagnosis",
  ],
  default: [],
};

export function getTopicCategory(topic: string): TopicCategory {
  const lower = topic.toLowerCase();
  let bestMatch: TopicCategory = "default";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "default") continue;
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length; // longer matches = more specific = higher score
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category as TopicCategory;
    }
  }

  return bestMatch;
}
