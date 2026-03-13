export interface MathCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  topics: string[];
}

export const MATH_CATEGORIES: MathCategory[] = [
  {
    id: "numbers",
    title: "Numbers & Arithmetic",
    icon: "\u{1F522}",
    color: "#60a5fa",
    description: "The building blocks of all mathematics",
    topics: ["Prime Numbers", "Fractions & Decimals", "Percentages", "Exponents", "Negative Numbers", "Order of Operations", "Divisibility Rules", "Ratios & Proportions", "Square Roots"],
  },
  {
    id: "algebra",
    title: "Algebra",
    icon: "\u{1D465}",
    color: "#a78bfa",
    description: "Letters, equations, and the language of math",
    topics: ["Variables & Expressions", "Linear Equations", "Quadratic Equations", "Functions", "Polynomials", "Logarithms", "Inequalities", "Systems of Equations", "Absolute Value", "Sequences & Series"],
  },
  {
    id: "geometry",
    title: "Geometry",
    icon: "\u{1F4D0}",
    color: "#34d399",
    description: "Shapes, space, and the world around us",
    topics: ["Triangles", "Pythagorean Theorem", "Circles & Pi", "Area & Volume", "Coordinate Geometry", "Symmetry", "Angles", "3D Shapes", "Tessellations"],
  },
  {
    id: "statistics",
    title: "Statistics & Probability",
    icon: "\u{1F3B2}",
    color: "#fbbf24",
    description: "Making sense of data and chance",
    topics: ["Mean, Median & Mode", "Probability", "Combinations & Permutations", "Normal Distribution", "Bayes' Theorem", "Standard Deviation", "Correlation", "Expected Value"],
  },
  {
    id: "calculus",
    title: "Calculus",
    icon: "\u{221E}",
    color: "#f472b6",
    description: "The mathematics of change and motion",
    topics: ["Limits", "Derivatives", "Integrals", "Chain Rule", "Infinite Series", "L'Hopital's Rule", "Taylor Series", "Differential Equations"],
  },
  {
    id: "fun",
    title: "Fun Math",
    icon: "\u{2728}",
    color: "#fb923c",
    description: "The beautiful and surprising side of math",
    topics: ["Fibonacci Sequence", "The Golden Ratio", "Infinity", "Game Theory", "Fractals", "Euler's Identity", "Magic Squares", "Paradoxes in Math", "Binary Numbers"],
  },
];

const DAILY_MATH_TOPICS = [
  "Prime Numbers", "Pythagorean Theorem", "Fibonacci Sequence", "Probability",
  "Fractions & Decimals", "Quadratic Equations", "Circles & Pi", "Derivatives",
  "The Golden Ratio", "Mean, Median & Mode", "Exponents", "Linear Equations",
  "Area & Volume", "Infinity", "Combinations & Permutations", "Logarithms",
  "Triangles", "Game Theory", "Variables & Expressions", "Normal Distribution",
  "Negative Numbers", "Polynomials", "Coordinate Geometry", "Integrals",
  "Fractals", "Percentages", "Functions", "Limits", "Bayes' Theorem",
  "Euler's Identity", "Order of Operations", "Ratios & Proportions",
  "Square Roots", "Inequalities", "Systems of Equations", "Absolute Value",
  "Sequences & Series", "Symmetry", "Angles", "3D Shapes", "Tessellations",
  "Standard Deviation", "Correlation", "Expected Value", "Divisibility Rules",
  "L'Hopital's Rule", "Taylor Series", "Differential Equations",
  "Magic Squares", "Paradoxes in Math", "Binary Numbers",
];

export function getDailyMathTopic(): string {
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % DAILY_MATH_TOPICS.length;
  return DAILY_MATH_TOPICS[dayIndex];
}
