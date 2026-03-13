export interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  topics: { slug: string; name: string }[];
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "space",
    title: "Space Journey",
    description: "From our solar system to the edge of the universe",
    icon: "🚀",
    color: "#8b5cf6",
    topics: [
      { slug: "solar-system", name: "Solar System" },
      { slug: "black-holes", name: "Black Holes" },
      { slug: "stars-and-galaxies", name: "Stars and Galaxies" },
      { slug: "the-big-bang", name: "The Big Bang" },
      { slug: "dark-matter-and-dark-energy", name: "Dark Matter and Dark Energy" },
    ],
  },
  {
    id: "life-science",
    title: "Life Science",
    description: "How living things work, from cells to ecosystems",
    icon: "🧬",
    color: "#10b981",
    topics: [
      { slug: "cells", name: "Cells" },
      { slug: "dna-and-genetics", name: "DNA and Genetics" },
      { slug: "evolution", name: "Evolution" },
      { slug: "the-human-brain", name: "The Human Brain" },
      { slug: "ecosystems", name: "Ecosystems" },
    ],
  },
  {
    id: "world-history",
    title: "World History",
    description: "Key moments that shaped our world",
    icon: "🏛️",
    color: "#f59e0b",
    topics: [
      { slug: "ancient-egypt", name: "Ancient Egypt" },
      { slug: "the-roman-empire", name: "The Roman Empire" },
      { slug: "the-renaissance", name: "The Renaissance" },
      { slug: "the-industrial-revolution", name: "The Industrial Revolution" },
      { slug: "world-war-2", name: "World War 2" },
    ],
  },
  {
    id: "math-foundations",
    title: "Math Foundations",
    description: "Build your math intuition step by step",
    icon: "📐",
    color: "#06b6d4",
    topics: [
      { slug: "fractions-and-decimals", name: "Fractions and Decimals" },
      { slug: "algebra", name: "Algebra" },
      { slug: "geometry", name: "Geometry" },
      { slug: "probability", name: "Probability" },
      { slug: "calculus", name: "Calculus" },
    ],
  },
  {
    id: "tech-world",
    title: "Tech World",
    description: "How computers and the internet actually work",
    icon: "💻",
    color: "#3b82f6",
    topics: [
      { slug: "how-computers-work", name: "How Computers Work" },
      { slug: "the-internet", name: "The Internet" },
      { slug: "programming", name: "Programming" },
      { slug: "artificial-intelligence", name: "Artificial Intelligence" },
      { slug: "cybersecurity", name: "Cybersecurity" },
    ],
  },
  {
    id: "economics-101",
    title: "Economics 101",
    description: "Understanding money, markets, and trade",
    icon: "💰",
    color: "#eab308",
    topics: [
      { slug: "supply-and-demand", name: "Supply and Demand" },
      { slug: "inflation", name: "Inflation" },
      { slug: "the-stock-market", name: "The Stock Market" },
      { slug: "cryptocurrency", name: "Cryptocurrency" },
      { slug: "global-trade", name: "Global Trade" },
    ],
  },
  {
    id: "psychology",
    title: "How We Think",
    description: "Explore the mysteries of the human mind",
    icon: "🧠",
    color: "#ec4899",
    topics: [
      { slug: "memory", name: "Memory" },
      { slug: "emotions", name: "Emotions" },
      { slug: "cognitive-biases", name: "Cognitive Biases" },
      { slug: "dreams", name: "Dreams" },
      { slug: "consciousness", name: "Consciousness" },
    ],
  },
  {
    id: "art-and-creativity",
    title: "Art & Creativity",
    description: "The stories behind great art and music",
    icon: "🎨",
    color: "#f43f5e",
    topics: [
      { slug: "color-theory", name: "Color Theory" },
      { slug: "music-theory", name: "Music Theory" },
      { slug: "photography", name: "Photography" },
      { slug: "architecture", name: "Architecture" },
      { slug: "film-making", name: "Film Making" },
    ],
  },
];
