export type Level =
  | "Beginner"
  | "Learning"
  | "Controlled"
  | "Disciplined"
  | "Sharp"
  | "Elite";

const LEVELS: Level[] = [
  "Beginner",
  "Learning",
  "Controlled",
  "Disciplined",
  "Sharp",
  "Elite",
];

export interface ProgressionResult {
  level: Level;
  nextLevel: Level | null;
  percentToNext: number;
  score: number; // 0-100 composite
}

/**
 * Computes a single behavioral score (0–100) from:
 * - bankrollDisciplineScore (weight 0.45)
 * - inverted riskScore (weight 0.35)
 * - winRate contribution (weight 0.20)
 */
export function computeProgressionScore(
  disciplineScore: number,
  riskScore: number,
  winRate: number,
  totalBets: number,
): number {
  if (totalBets < 3) return 0;

  const disciplineContrib = disciplineScore * 0.45;
  const riskContrib = Math.max(0, 100 - riskScore) * 0.35;
  // Win rate above 45% contributes positively; below penalizes slightly
  const winRateContrib = Math.max(0, Math.min(winRate, 65) - 30) * (0.2 / 35) * 100;

  return Math.min(100, Math.max(0, disciplineContrib + riskContrib + winRateContrib));
}

/**
 * Thresholds for each level (min composite score required):
 * Beginner   0–18
 * Learning   18–35
 * Controlled 35–52
 * Disciplined 52–68
 * Sharp      68–82
 * Elite      82–100
 */
const THRESHOLDS = [0, 18, 35, 52, 68, 82, 100];

export function getProgression(score: number): ProgressionResult {
  let levelIndex = 0;
  for (let i = 0; i < THRESHOLDS.length - 1; i++) {
    if (score >= THRESHOLDS[i] && score < THRESHOLDS[i + 1]) {
      levelIndex = i;
      break;
    }
    if (score >= THRESHOLDS[THRESHOLDS.length - 1]) {
      levelIndex = LEVELS.length - 1;
    }
  }

  const level = LEVELS[levelIndex];
  const nextLevel = levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1] : null;

  let percentToNext = 100;
  if (nextLevel) {
    const rangeStart = THRESHOLDS[levelIndex];
    const rangeEnd = THRESHOLDS[levelIndex + 1];
    percentToNext = Math.round(((score - rangeStart) / (rangeEnd - rangeStart)) * 100);
  }

  return { level, nextLevel, percentToNext, score: Math.round(score) };
}

export const LEVEL_COLORS: Record<Level, string> = {
  Beginner: "text-muted-foreground",
  Learning: "text-blue-400",
  Controlled: "text-yellow-400",
  Disciplined: "text-orange-400",
  Sharp: "text-success",
  Elite: "text-success",
};

export const LEVEL_BAR_COLORS: Record<Level, string> = {
  Beginner: "bg-muted-foreground/40",
  Learning: "bg-blue-400",
  Controlled: "bg-yellow-400",
  Disciplined: "bg-orange-400",
  Sharp: "bg-success",
  Elite: "bg-success",
};
