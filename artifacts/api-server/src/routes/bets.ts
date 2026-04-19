import { Router } from "express";
import { db, betsTable, bankrollTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { CreateBetBody, UpdateBetBody, ListBetsQueryParams } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

function calcProfitLoss(result: string | null | undefined, odds: number, stake: number): number | null {
  if (result === "win") return parseFloat((stake * (odds - 1)).toFixed(2));
  if (result === "loss") return parseFloat((-stake).toFixed(2));
  if (result === "push") return 0;
  return null;
}

async function updateBankroll(userId: number) {
  const userBets = await db
    .select()
    .from(betsTable)
    .where(and(eq(betsTable.userId, userId)));

  const totalProfitLoss = userBets.reduce(
    (sum, bet) => sum + (bet.profitLoss ?? 0),
    0
  );

  const [bankroll] = await db
    .select()
    .from(bankrollTable)
    .where(eq(bankrollTable.userId, userId))
    .limit(1);

  if (bankroll) {
    await db
      .update(bankrollTable)
      .set({ currentBankroll: parseFloat((bankroll.startingBankroll + totalProfitLoss).toFixed(2)) })
      .where(eq(bankrollTable.userId, userId));
  }
}

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const queryParsed = ListBetsQueryParams.safeParse(req.query);

  let query = db
    .select()
    .from(betsTable)
    .where(eq(betsTable.userId, userId))
    .orderBy(desc(betsTable.createdAt));

  const bets = await query;

  let filtered = bets;
  if (queryParsed.success) {
    if (queryParsed.data.sport) {
      filtered = filtered.filter((b) => b.sport === queryParsed.data.sport);
    }
    if (queryParsed.data.result) {
      filtered = filtered.filter((b) => b.result === queryParsed.data.result);
    }
  }

  res.json(filtered.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
  })));
});

router.post("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = CreateBetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { sport, betType, teams, odds, stake, result, notes } = parsed.data;
  const profitLoss = calcProfitLoss(result, odds, stake);

  const [bet] = await db
    .insert(betsTable)
    .values({ userId, sport, betType, teams, odds, stake, result: result ?? null, profitLoss, notes: notes ?? null })
    .returning();

  await updateBankroll(userId);

  res.status(201).json({ ...bet, createdAt: bet.createdAt.toISOString() });
});

router.get("/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [bet] = await db
    .select()
    .from(betsTable)
    .where(and(eq(betsTable.id, id), eq(betsTable.userId, userId)))
    .limit(1);

  if (!bet) {
    res.status(404).json({ error: "Bet not found" });
    return;
  }

  res.json({ ...bet, createdAt: bet.createdAt.toISOString() });
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateBetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [existing] = await db
    .select()
    .from(betsTable)
    .where(and(eq(betsTable.id, id), eq(betsTable.userId, userId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Bet not found" });
    return;
  }

  const updates = parsed.data;
  const finalOdds = updates.odds ?? existing.odds;
  const finalStake = updates.stake ?? existing.stake;
  const finalResult = "result" in updates ? updates.result : existing.result;
  const profitLoss = calcProfitLoss(finalResult, finalOdds, finalStake);

  const [updated] = await db
    .update(betsTable)
    .set({ ...updates, profitLoss })
    .where(and(eq(betsTable.id, id), eq(betsTable.userId, userId)))
    .returning();

  await updateBankroll(userId);

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(betsTable)
    .where(and(eq(betsTable.id, id), eq(betsTable.userId, userId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Bet not found" });
    return;
  }

  await db
    .delete(betsTable)
    .where(and(eq(betsTable.id, id), eq(betsTable.userId, userId)));

  await updateBankroll(userId);

  res.status(204).send();
});

export default router;
