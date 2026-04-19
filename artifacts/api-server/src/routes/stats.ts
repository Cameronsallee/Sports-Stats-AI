import { Router } from "express";
import { db, betsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const bets = await db
    .select()
    .from(betsTable)
    .where(eq(betsTable.userId, userId));

  const totalBets = bets.length;
  const wins = bets.filter((b) => b.result === "win").length;
  const losses = bets.filter((b) => b.result === "loss").length;
  const pushes = bets.filter((b) => b.result === "push").length;
  const pending = bets.filter(
    (b) => !b.result || b.result === "pending"
  ).length;

  const settledBets = bets.filter((b) => b.result === "win" || b.result === "loss");
  const winRate = settledBets.length > 0 ? wins / settledBets.length : 0;

  const totalStaked = parseFloat(
    bets.reduce((sum, b) => sum + b.stake, 0).toFixed(2)
  );
  const totalProfitLoss = parseFloat(
    bets.reduce((sum, b) => sum + (b.profitLoss ?? 0), 0).toFixed(2)
  );
  const roi = totalStaked > 0 ? parseFloat((totalProfitLoss / totalStaked).toFixed(4)) : 0;

  const avgOdds =
    totalBets > 0
      ? parseFloat((bets.reduce((sum, b) => sum + b.odds, 0) / totalBets).toFixed(3))
      : 0;
  const avgStake =
    totalBets > 0
      ? parseFloat((totalStaked / totalBets).toFixed(2))
      : 0;

  const sportMap = new Map<
    string,
    { totalBets: number; wins: number; losses: number; profitLoss: number }
  >();

  for (const bet of bets) {
    const entry = sportMap.get(bet.sport) || {
      totalBets: 0,
      wins: 0,
      losses: 0,
      profitLoss: 0,
    };
    entry.totalBets++;
    if (bet.result === "win") entry.wins++;
    if (bet.result === "loss") entry.losses++;
    entry.profitLoss += bet.profitLoss ?? 0;
    sportMap.set(bet.sport, entry);
  }

  const bySport = Array.from(sportMap.entries()).map(([sport, data]) => {
    const settled = data.wins + data.losses;
    return {
      sport,
      totalBets: data.totalBets,
      wins: data.wins,
      losses: data.losses,
      profitLoss: parseFloat(data.profitLoss.toFixed(2)),
      winRate: settled > 0 ? parseFloat((data.wins / settled).toFixed(4)) : 0,
    };
  });

  const sortedBets = [...bets].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  let recentStreak = 0;
  for (let i = sortedBets.length - 1; i >= 0; i--) {
    const bet = sortedBets[i];
    if (bet.result !== "win" && bet.result !== "loss") break;
    if (recentStreak === 0) {
      recentStreak = bet.result === "win" ? 1 : -1;
    } else if (recentStreak > 0 && bet.result === "win") {
      recentStreak++;
    } else if (recentStreak < 0 && bet.result === "loss") {
      recentStreak--;
    } else {
      break;
    }
  }

  res.json({
    totalBets,
    wins,
    losses,
    pushes,
    pending,
    winRate,
    totalStaked,
    totalProfitLoss,
    roi,
    avgOdds,
    avgStake,
    bySport,
    recentStreak,
  });
});

export default router;
