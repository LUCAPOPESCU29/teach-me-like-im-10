export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
}

export interface BadgeCheckData {
  totalXP: number;
  streakCount: number;
  topicsExplored: number;
  maxLevelReached: number;
  quizAced: boolean;       // scored 100% on any quiz
  teachBackPassed: boolean; // scored 80+ on teach back
  languagesUsed: number;
  topicsInOneDay: number;
  allFiveLevels: boolean;  // completed all 5 levels on any topic
}

const BADGE_DEFINITIONS: Omit<Badge, "earned">[] = [
  {
    id: "first_steps",
    name: "First Steps",
    description: "Complete your first level",
    icon: "👶",
    color: "#4ade80",
  },
  {
    id: "quiz_ace",
    name: "Quiz Ace",
    description: "Score 100% on a quiz",
    icon: "🎯",
    color: "#06b6d4",
  },
  {
    id: "deep_diver",
    name: "Deep Diver",
    description: "Complete all 5 levels on a topic",
    icon: "🤿",
    color: "#8b5cf6",
  },
  {
    id: "bookworm",
    name: "Bookworm",
    description: "Explore 10 different topics",
    icon: "📚",
    color: "#f59e0b",
  },
  {
    id: "scholar",
    name: "Scholar",
    description: "Explore 25 different topics",
    icon: "🎓",
    color: "#ec4899",
  },
  {
    id: "streak_5",
    name: "On Fire",
    description: "Reach a 5-day streak",
    icon: "🔥",
    color: "#ef4444",
  },
  {
    id: "streak_30",
    name: "Unstoppable",
    description: "Reach a 30-day streak",
    icon: "⚡",
    color: "#f97316",
  },
  {
    id: "polyglot",
    name: "Polyglot",
    description: "Learn in 2 or more languages",
    icon: "🌍",
    color: "#14b8a6",
  },
  {
    id: "speed_learner",
    name: "Speed Learner",
    description: "Explore 3 topics in one day",
    icon: "🚀",
    color: "#a855f7",
  },
  {
    id: "teacher",
    name: "Teacher",
    description: "Score 80+ on Teach It Back",
    icon: "📝",
    color: "#6366f1",
  },
];

export function checkBadges(data: BadgeCheckData): Badge[] {
  return BADGE_DEFINITIONS.map((badge) => ({
    ...badge,
    earned: isBadgeEarned(badge.id, data),
  }));
}

function isBadgeEarned(id: string, data: BadgeCheckData): boolean {
  switch (id) {
    case "first_steps":
      return data.totalXP > 0;
    case "quiz_ace":
      return data.quizAced;
    case "deep_diver":
      return data.allFiveLevels;
    case "bookworm":
      return data.topicsExplored >= 10;
    case "scholar":
      return data.topicsExplored >= 25;
    case "streak_5":
      return data.streakCount >= 5;
    case "streak_30":
      return data.streakCount >= 30;
    case "polyglot":
      return data.languagesUsed >= 2;
    case "speed_learner":
      return data.topicsInOneDay >= 3;
    case "teacher":
      return data.teachBackPassed;
    default:
      return false;
  }
}
