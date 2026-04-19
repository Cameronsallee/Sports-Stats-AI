import { Router } from "express";
import { db, bankrollTable, betsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateBankrollBody } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;

  let [bankroll] = await db
    .select()
    .from(bankrollTable)
    .where(eq(bankrollTable.userId, userId))
    .limit(1);

  if (!bankroll) {
    [bankroll] = await db
      .insert(bankrollTable)
      .values({ userId, startingBankroll: 0, currentBankroll: 0 })
      .returning();
  }

  const userBets = await db
    .select()
    .from(betsTable)
    .where(eq(betsTable.userId, userId));

  const totalProfitLoss = parseFloat(
    userBets.reduce((sum, bet) => sum + (bet.profitLoss ?? 0), 0).toFixed(2)
  );

  res.json({
    userId: bankroll.userId,
    startingBankroll: bankroll.startingBankroll,
    currentBankroll: bankroll.currentBankroll,
    totalProfitLoss,
  });
});

router.put("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = UpdateBankrollBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { startingBankroll } = parsed.data;

  const userBets = await db
    .select()
    .from(betsTable)
    .where(eq(betsTable.userId, userId));

  const totalProfitLoss = userBets.reduce(
    (sum, bet) => sum + (bet.profitLoss ?? 0),
    0
  );

  const currentBankroll = parseFloat((startingBankroll + totalProfitLoss).toFixed(2));

  const existing = await db
    .select()
    .from(bankrollTable)
    .where(eq(bankrollTable.userId, userId))
    .limit(1);

  let bankroll;
  if (existing.length === 0) {
    [bankroll] = await db
      .insert(bankrollTable)
      .values({ userId, startingBankroll, currentBankroll })
      .returning();
  } else {
    [bankroll] = await db
      .update(bankrollTable)
      .set({ startingBankroll, currentBankroll })
      .where(eq(bankrollTable.userId, userId))
      .returning();
  }

  res.json({
    userId: bankroll.userId,
    startingBankroll: bankroll.startingBankroll,
    currentBankroll: bankroll.currentBankroll,
    totalProfitLoss: parseFloat(totalProfitLoss.toFixed(2)),
  });
});

export default router;
