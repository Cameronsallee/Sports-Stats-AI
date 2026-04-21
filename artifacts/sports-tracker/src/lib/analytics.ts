/* ─── Types ─────────────────────────────────────────────────────────── */
export interface BetItem {
  id: number;
  sport: string;
  betType: string;
  odds: number;
  stake: number;
  result?: string | null;
  profitLoss?: number | null;
  createdAt: string;
}

export interface SegmentPerf {
  label: string;
  count: number;
  wins: number;
  losses: number;
  winRate: number;
  roi: number;
  profitLoss: number;
  totalStaked: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function groupBy<T>(arr: T[], fn: (x: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, x) => {
    const k = fn(x);
    (acc[k] ??= []).push(x);
    return acc;
  }, {});
}

function completedOnly(bets: BetItem[]): BetItem[] {
  return bets.filter(b => b.result === "Win" || b.result === "Loss");
}

function segmentFrom(bets: BetItem[]): Omit<SegmentPerf, "label"> {
  const done = completedOnly(bets);
  const wins = done.filter(b => b.result === "Win").length;
  const losses = done.filter(b => b.result === "Loss").length;
  const staked = done.reduce((s, b) => s + b.stake, 0);
  const pl = done.reduce((s, b) => s + (b.profitLoss ?? 0), 0);
  return {
    count: done.length,
    wins,
    losses,
    winRate: done.length > 0 ? (wins / done.length) * 100 : 0,
    roi: staked > 0 ? (pl / staked) * 100 : 0,
    profitLoss: pl,
    totalStaked: staked,
  };
}

function toSegments(
  grouped: Record<string, BetItem[]>,
  minCount = 1,
): SegmentPerf[] {
  return Object.entries(grouped)
    .map(([label, bets]) => ({ label, ...segmentFrom(bets) }))
    .filter(s => s.count >= minCount)
    .sort((a, b) => b.roi - a.roi);
}

/* ─── Time of day ────────────────────────────────────────────────────── */
function timeBucket(dateStr: string): string {
  const h = new Date(dateStr).getHours();
  if (h >= 5 && h < 12) return "Morning (5am–12pm)";
  if (h >= 12 && h < 17) return "Afternoon (12–5pm)";
  if (h >= 17 && h < 22) return "Evening (5–10pm)";
  return "Late Night (10pm–5am)";
}

export function getTimeOfDayPerf(bets: BetItem[]): SegmentPerf[] {
  return toSegments(groupBy(bets, b => timeBucket(b.createdAt)));
}

/* ─── Bet type ───────────────────────────────────────────────────────── */
export function getBetTypePerf(bets: BetItem[]): SegmentPerf[] {
  return toSegments(groupBy(bets, b => b.betType));
}

/* ─── Sport ──────────────────────────────────────────────────────────── */
export function getSportPerf(bets: BetItem[]): SegmentPerf[] {
  return toSegments(groupBy(bets, b => b.sport));
}

/* ─── Odds range ─────────────────────────────────────────────────────── */
function oddsBucket(odds: number): string {
  if (odds <= -201) return "Heavy Fav (≤ -200)";
  if (odds <= -111) return "Favorite (-111 to -200)";
  if (odds <= 110) return "Near Pick'em (±110)";
  if (odds <= 250) return "Underdog (+111 to +250)";
  return "Big Dog (> +250)";
}
const ODDS_ORDER = [
  "Heavy Fav (≤ -200)",
  "Favorite (-111 to -200)",
  "Near Pick'em (±110)",
  "Underdog (+111 to +250)",
  "Big Dog (> +250)",
];

export function getOddsRangePerf(bets: BetItem[]): SegmentPerf[] {
  const segs = toSegments(groupBy(bets, b => oddsBucket(b.odds)));
  segs.sort((a, b) => ODDS_ORDER.indexOf(a.label) - ODDS_ORDER.indexOf(b.label));
  return segs;
}

/* ─── Stake size ─────────────────────────────────────────────────────── */
function stakeBucket(stake: number, avg: number): string {
  if (stake < avg * 0.6) return "Small (< 60% avg)";
  if (stake <= avg * 1.4) return "Standard (60–140% avg)";
  return "Large (> 140% avg)";
}

export function getStakeSizePerf(bets: BetItem[]): SegmentPerf[] {
  const done = completedOnly(bets);
  if (done.length === 0) return [];
  const avg = done.reduce((s, b) => s + b.stake, 0) / done.length;
  return toSegments(groupBy(done, b => stakeBucket(b.stake, avg)));
}

/* ─── Streak behavior ────────────────────────────────────────────────── */
export interface StreakBehavior {
  afterWin: { bets: number; winRate: number; avgStakeChangePct: number; roi: number };
  afterLoss: { bets: number; winRate: number; avgStakeChangePct: number; roi: number };
}

export function getStreakBehavior(bets: BetItem[]): StreakBehavior {
  const sorted = [...completedOnly(bets)].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const afterWin: BetItem[] = [];
  const afterLoss: BetItem[] = [];
  const wChanges: number[] = [];
  const lChanges: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const chg = prev.stake > 0 ? ((curr.stake - prev.stake) / prev.stake) * 100 : 0;
    if (prev.result === "Win") { afterWin.push(curr); wChanges.push(chg); }
    else { afterLoss.push(curr); lChanges.push(chg); }
  }

  const calc = (list: BetItem[], changes: number[]) => {
    const wins = list.filter(b => b.result === "Win").length;
    const staked = list.reduce((s, b) => s + b.stake, 0);
    const pl = list.reduce((s, b) => s + (b.profitLoss ?? 0), 0);
    return {
      bets: list.length,
      winRate: list.length > 0 ? (wins / list.length) * 100 : 0,
      avgStakeChangePct:
        changes.length > 0 ? changes.reduce((s, v) => s + v, 0) / changes.length : 0,
      roi: staked > 0 ? (pl / staked) * 100 : 0,
    };
  };

  return { afterWin: calc(afterWin, wChanges), afterLoss: calc(afterLoss, lChanges) };
}

/* ─── Weekly breakdown ───────────────────────────────────────────────── */
export interface WeeklyData {
  weekLabel: string;
  bets: number;
  wins: number;
  losses: number;
  profitLoss: number;
  roi: number;
}

export function getWeeklyBreakdown(bets: BetItem[]): WeeklyData[] {
  const now = new Date();
  return Array.from({ length: 4 }, (_, i) => 3 - i)
    .map(w => {
      const start = new Date(now);
      start.setDate(now.getDate() - (w + 1) * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(now.getDate() - w * 7);
      end.setHours(23, 59, 59, 999);

      const wb = bets.filter(b => {
        const d = new Date(b.createdAt);
        return d >= start && d <= end;
      });
      const done = completedOnly(wb);
      const staked = done.reduce((s, b) => s + b.stake, 0);
      const pl = done.reduce((s, b) => s + (b.profitLoss ?? 0), 0);
      const wins = done.filter(b => b.result === "Win").length;
      return {
        weekLabel: w === 0 ? "This Week" : w === 1 ? "Last Week" : `${w + 1}W Ago`,
        bets: wb.length,
        wins,
        losses: done.length - wins,
        profitLoss: pl,
        roi: staked > 0 ? (pl / staked) * 100 : 0,
      };
    })
    .filter(w => w.bets > 0);
}

/* ─── Edge Score ─────────────────────────────────────────────────────── */
export type EdgeGrade = "F" | "D" | "C" | "B" | "A" | "S";

export interface EdgeScore {
  score: number;
  grade: EdgeGrade;
  components: {
    roi: number;       // 0–35
    winRate: number;   // 0–25
    discipline: number; // 0–25
    patterns: number;  // 0–15
  };
  trend: "up" | "down" | "flat";
}

export function computeEdgeScore(bets: BetItem[]): EdgeScore {
  const done = completedOnly(bets);
  const empty: EdgeScore = {
    score: 0,
    grade: "F",
    components: { roi: 0, winRate: 0, discipline: 0, patterns: 0 },
    trend: "flat",
  };
  if (done.length < 3) return empty;

  const staked = done.reduce((s, b) => s + b.stake, 0);
  const pl = done.reduce((s, b) => s + (b.profitLoss ?? 0), 0);
  const wins = done.filter(b => b.result === "Win").length;
  const wr = (wins / done.length) * 100;
  const roi = staked > 0 ? (pl / staked) * 100 : 0;

  // ROI score: 0–35, range maps -30% → +25%
  const roiScore = Math.max(0, Math.min(35, ((roi + 30) / 55) * 35));

  // Win rate score: 0–25, range maps 30% → 65%
  const wrScore = Math.max(0, Math.min(25, ((wr - 30) / 35) * 25));

  // Discipline: coefficient of variation of stake sizes (lower = more disciplined)
  const avgStake = staked / done.length;
  const variance = done.reduce((s, b) => s + Math.pow(b.stake - avgStake, 2), 0) / done.length;
  const cv = avgStake > 0 ? Math.sqrt(variance) / avgStake : 1;
  const disciplineScore = Math.max(0, Math.min(25, (1 - Math.min(cv, 1)) * 25));

  // Pattern score: reward betting in profitable contexts
  const timeSegs = getTimeOfDayPerf(bets);
  const typeSegs = getBetTypePerf(bets);
  const bestROI = Math.max(
    ...timeSegs.map(s => s.roi),
    ...typeSegs.map(s => s.roi),
    -99,
  );
  const patternScore = bestROI > 0 ? Math.min(15, bestROI * 0.4) : 3;

  const score = Math.round(
    Math.min(100, Math.max(0, roiScore + wrScore + disciplineScore + patternScore)),
  );

  let grade: EdgeGrade = "F";
  if (score >= 85) grade = "S";
  else if (score >= 70) grade = "A";
  else if (score >= 55) grade = "B";
  else if (score >= 40) grade = "C";
  else if (score >= 25) grade = "D";

  // Trend: compare last 5 bets vs all-time
  const recent = done.slice(-5);
  const recentROI =
    recent.length > 0
      ? (recent.reduce((s, b) => s + (b.profitLoss ?? 0), 0) /
          recent.reduce((s, b) => s + b.stake, 0)) *
        100
      : 0;
  const trend: EdgeScore["trend"] =
    Math.abs(recentROI - roi) < 3 ? "flat" : recentROI > roi ? "up" : "down";

  return {
    score,
    grade,
    components: {
      roi: Math.round(roiScore),
      winRate: Math.round(wrScore),
      discipline: Math.round(disciplineScore),
      patterns: Math.round(patternScore),
    },
    trend,
  };
}

/* ─── Optimal comparison ─────────────────────────────────────────────── */
export interface OptimalComparison {
  missedProfit: number;
  bestContext: string;
  bestROI: number;
  worstContext: string;
  worstROI: number;
  insight: string;
}

export function getOptimalComparison(bets: BetItem[]): OptimalComparison | null {
  const typeSegs = getBetTypePerf(bets).filter(s => s.count >= 3);
  const timeSegs = getTimeOfDayPerf(bets).filter(s => s.count >= 3);
  const all = [...typeSegs, ...timeSegs];

  const profitable = all.filter(s => s.roi > 0).sort((a, b) => b.roi - a.roi);
  const losing = all.filter(s => s.roi < -5).sort((a, b) => a.roi - b.roi);
  if (profitable.length === 0 || losing.length === 0) return null;

  const best = profitable[0];
  const worst = losing[0];
  const missedProfit = Math.abs((worst.totalStaked * worst.roi) / 100);

  return {
    missedProfit,
    bestContext: best.label,
    bestROI: best.roi,
    worstContext: worst.label,
    worstROI: worst.roi,
    insight: `Your ${best.label} bets generate ${best.roi.toFixed(1)}% ROI. Your ${worst.label} bets lose ${Math.abs(worst.roi).toFixed(1)}% on every dollar.`,
  };
}

/* ─── Post-bet context insight ───────────────────────────────────────── */
export interface PostBetContext {
  timeBucket: string;
  timeROI: number | null;
  timeWR: number | null;
  betTypeROI: number | null;
  betTypeWR: number | null;
  oddsROI: number | null;
  isLateNight: boolean;
  isChasingSignal: boolean;
  warningMessages: string[];
  positiveMessages: string[];
}

export function getPostBetContext(
  historicalBets: BetItem[],
  newBet: { betType: string; odds: number; createdAt: string },
  recentStreak: number,
): PostBetContext {
  const h = new Date(newBet.createdAt).getHours();
  const tb = timeBucket(newBet.createdAt);
  const ob = oddsBucket(newBet.odds);

  const timeSegs = getTimeOfDayPerf(historicalBets);
  const typeSegs = getBetTypePerf(historicalBets);
  const oddsSegs = getOddsRangePerf(historicalBets);

  const ts = timeSegs.find(s => s.label === tb && s.count >= 3);
  const tys = typeSegs.find(s => s.label === newBet.betType && s.count >= 3);
  const os = oddsSegs.find(s => s.label === ob && s.count >= 3);

  const warnings: string[] = [];
  const positives: string[] = [];
  const isLate = h >= 22 || h < 5;
  const isChasing = recentStreak <= -2;

  if (isLate) warnings.push("Late-night betting has lower decision quality. Proceed with discipline.");
  if (isChasing) warnings.push(`You are on a ${Math.abs(recentStreak)}-loss streak. Avoid chasing losses with inflated stakes.`);
  if (ts && ts.roi < -10) warnings.push(`Your ${tb} bets have ${ts.roi.toFixed(1)}% ROI. This is a weak time window for you.`);
  if (tys && tys.roi < -10) warnings.push(`${newBet.betType} bets are your worst-performing type at ${tys.roi.toFixed(1)}% ROI.`);

  if (ts && ts.roi > 5) positives.push(`${tb} is your strongest window — ${ts.roi.toFixed(1)}% ROI across ${ts.count} bets.`);
  if (tys && tys.roi > 5) positives.push(`${newBet.betType} bets are working for you: ${tys.roi.toFixed(1)}% ROI.`);
  if (os && os.roi > 5) positives.push(`This odds range (${ob}) has ${os.roi.toFixed(1)}% ROI in your history.`);

  return {
    timeBucket: tb,
    timeROI: ts?.roi ?? null,
    timeWR: ts?.winRate ?? null,
    betTypeROI: tys?.roi ?? null,
    betTypeWR: tys?.winRate ?? null,
    oddsROI: os?.roi ?? null,
    isLateNight: isLate,
    isChasingSignal: isChasing,
    warningMessages: warnings,
    positiveMessages: positives,
  };
}

/* ─── Auto-generated insights ────────────────────────────────────────── */
export interface AutoInsight {
  type: "warning" | "positive" | "neutral";
  headline: string;
  detail: string;
}

export function generateAutoInsights(bets: BetItem[]): AutoInsight[] {
  const insights: AutoInsight[] = [];
  const done = completedOnly(bets);
  if (done.length < 5) return insights;

  // Time of day
  const timeSegs = getTimeOfDayPerf(bets).filter(s => s.count >= 3);
  const bestTime = timeSegs[0];
  const worstTime = timeSegs[timeSegs.length - 1];
  if (bestTime && bestTime.roi > 5)
    insights.push({
      type: "positive",
      headline: `${bestTime.label} is your edge window`,
      detail: `${bestTime.roi.toFixed(1)}% ROI across ${bestTime.count} bets. Schedule more plays in this window.`,
    });
  if (worstTime && worstTime.roi < -10 && worstTime !== bestTime)
    insights.push({
      type: "warning",
      headline: `${worstTime.label} bets are eroding your bankroll`,
      detail: `${worstTime.roi.toFixed(1)}% ROI. Consider avoiding bets during this period.`,
    });

  // Bet type
  const typeSegs = getBetTypePerf(bets).filter(s => s.count >= 3);
  const bestType = typeSegs[0];
  const worstType = typeSegs[typeSegs.length - 1];
  if (bestType && bestType.roi > 8)
    insights.push({
      type: "positive",
      headline: `${bestType.label} is your highest-ROI bet type`,
      detail: `${bestType.roi.toFixed(1)}% ROI on ${bestType.count} bets. This is where your edge lives.`,
    });
  if (worstType && worstType.roi < -10 && worstType !== bestType)
    insights.push({
      type: "warning",
      headline: `${worstType.label} bets are consistently losing`,
      detail: `${worstType.roi.toFixed(1)}% ROI. Reducing these plays would improve overall performance.`,
    });

  // Streak behavior
  const streak = getStreakBehavior(bets);
  if (streak.afterLoss.avgStakeChangePct > 20 && streak.afterLoss.bets >= 3)
    insights.push({
      type: "warning",
      headline: "You increase stake size after losses",
      detail: `Average stake increase of +${streak.afterLoss.avgStakeChangePct.toFixed(0)}% after a loss. This is a loss-chasing pattern.`,
    });
  if (streak.afterWin.avgStakeChangePct > 30 && streak.afterWin.bets >= 3)
    insights.push({
      type: "warning",
      headline: "You over-extend after wins",
      detail: `+${streak.afterWin.avgStakeChangePct.toFixed(0)}% average stake increase after wins. Overconfidence risk detected.`,
    });

  // Odds range
  const oddsSegs = getOddsRangePerf(bets).filter(s => s.count >= 3);
  const bestOdds = oddsSegs.sort((a, b) => b.roi - a.roi)[0];
  if (bestOdds && bestOdds.roi > 8)
    insights.push({
      type: "positive",
      headline: `${bestOdds.label} is your strongest odds range`,
      detail: `${bestOdds.roi.toFixed(1)}% ROI. Focus bet selection in this range.`,
    });

  return insights.slice(0, 5);
}
