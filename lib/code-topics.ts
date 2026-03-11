export interface CodeCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  topics: string[];
}

export const CODE_CATEGORIES: CodeCategory[] = [
  {
    id: "fundamentals",
    title: "Programming Basics",
    icon: "\u{1F9F1}",
    color: "#4ade80",
    description: "The building blocks every programmer needs",
    topics: [
      "Variables & Data Types",
      "If Statements & Conditions",
      "Loops",
      "Functions",
      "Arrays & Lists",
      "Strings",
      "Objects & Dictionaries",
      "Error Handling",
      "Input & Output",
    ],
  },
  {
    id: "web",
    title: "Web Development",
    icon: "\u{1F310}",
    color: "#38bdf8",
    description: "Building websites and web apps",
    topics: [
      "HTML Basics",
      "CSS Styling",
      "JavaScript",
      "React",
      "APIs & Fetch",
      "Responsive Design",
      "Authentication",
      "Databases",
    ],
  },
  {
    id: "concepts",
    title: "Computer Science",
    icon: "\u{1F9E0}",
    color: "#a78bfa",
    description: "The theory behind the code",
    topics: [
      "Algorithms",
      "Big O Notation",
      "Recursion",
      "Data Structures",
      "Binary & Bits",
      "Sorting Algorithms",
      "Search Algorithms",
      "Graph Theory",
    ],
  },
  {
    id: "python",
    title: "Python",
    icon: "\u{1F40D}",
    color: "#fbbf24",
    description: "The world's most popular beginner language",
    topics: [
      "Python Basics",
      "List Comprehensions",
      "Classes & OOP",
      "File Handling",
      "Decorators",
      "Lambda Functions",
      "Modules & Packages",
      "Virtual Environments",
    ],
  },
  {
    id: "tools",
    title: "Developer Tools",
    icon: "\u{1F6E0}\u{FE0F}",
    color: "#f472b6",
    description: "The tools every developer uses daily",
    topics: [
      "Git & Version Control",
      "Terminal & Command Line",
      "VS Code Tips",
      "Package Managers",
      "Docker Basics",
      "Testing Your Code",
      "Debugging",
      "CI/CD Pipelines",
    ],
  },
  {
    id: "fun",
    title: "Fun Projects",
    icon: "\u{1F680}",
    color: "#fb923c",
    description: "Cool things you can build with code",
    topics: [
      "Build a Chat Bot",
      "Make a Game",
      "Web Scraping",
      "Build an API",
      "Automate Boring Tasks",
      "Build a CLI Tool",
      "Machine Learning Basics",
      "Build a Portfolio Site",
    ],
  },
];

const DAILY_CODE_TOPICS = [
  "Variables & Data Types", "Recursion", "JavaScript", "Git & Version Control",
  "Algorithms", "Python Basics", "React", "CSS Styling", "Functions",
  "Data Structures", "APIs & Fetch", "Loops", "Big O Notation",
  "HTML Basics", "Classes & OOP", "Terminal & Command Line", "Arrays & Lists",
  "Error Handling", "Sorting Algorithms", "Testing Your Code",
  "List Comprehensions", "Responsive Design", "Binary & Bits",
  "Debugging", "Docker Basics", "Lambda Functions", "Graph Theory",
  "Build a Chat Bot", "Objects & Dictionaries", "Authentication",
];

export function getDailyCodeTopic(): string {
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % DAILY_CODE_TOPICS.length;
  return DAILY_CODE_TOPICS[dayIndex];
}
