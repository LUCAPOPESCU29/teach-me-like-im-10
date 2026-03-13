// SM-2 spaced repetition algorithm
// Quality: 0 = again, 3 = good, 5 = easy

export interface SM2Result {
  interval: number;     // days until next review
  easeFactor: number;   // updated ease factor
}

export function calculateNextReview(
  quality: number,        // 0-5 rating
  currentInterval: number, // current interval in days
  currentEase: number      // current ease factor (default 2.5)
): SM2Result {
  let interval: number;
  let easeFactor = currentEase;

  if (quality < 3) {
    // Failed — reset to 1 day
    interval = 1;
  } else {
    if (currentInterval <= 1) {
      interval = 1;
    } else if (currentInterval === 2) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
  }

  // Update ease factor (minimum 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return { interval, easeFactor };
}

export function qualityFromRating(rating: "again" | "good" | "easy"): number {
  switch (rating) {
    case "again": return 1;
    case "good": return 3;
    case "easy": return 5;
  }
}
