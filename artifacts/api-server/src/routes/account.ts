import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, bankrollTable, betsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod/v4";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";
import { rateLimit } from "../middlewares/rate-limit";
import { generateToken, hashToken } from "../lib/tokens";
import { logger } from "../lib/logger";

const router = Router();

router.get("/subscription", authMiddleware, async (req: AuthRequest, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const now = new Date();
  const onTrial = user.trialEndsAt ? user.trialEndsAt > now : false;
  const tier =
    user.subscriptionTier === "pro" || onTrial ? "pro" : "free";

  res.json({
    tier,
    status: user.subscriptionStatus,
    onTrial,
    trialEndsAt: user.trialEndsAt,
    currentPeriodEnd: user.currentPeriodEnd,
    emailVerified: user.emailVerified,
  });
});

router.get("/export", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const bets = await db.select().from(betsTable).where(eq(betsTable.userId, userId));
  const bankroll = await db.select().from(bankrollTable).where(eq(bankrollTable.userId, userId));

  res.setHeader("Content-Disposition", `attachment; filename="betpulse-export-${Date.now()}.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    user: user ? { email: user.email, createdAt: user.createdAt } : null,
    bankroll,
    bets,
  });
});

const DeleteSchema = z.object({ password: z.string().min(1) });

router.post("/delete", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = DeleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  await db.delete(betsTable).where(eq(betsTable.userId, user.id));
  await db.delete(bankrollTable).where(eq(bankrollTable.userId, user.id));
  await db.delete(usersTable).where(eq(usersTable.id, user.id));

  res.json({ ok: true });
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post("/change-password", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = PasswordChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));
  res.json({ ok: true });
});

const ForgotSchema = z.object({ email: z.string().email() });

router.post(
  "/forgot-password",
  rateLimit({ windowMs: 15 * 60_000, max: 5, keyPrefix: "forgot" }),
  async (req, res) => {
    const parsed = ForgotSchema.safeParse(req.body);
    if (!parsed.success) {
      res.json({ ok: true });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (user) {
      const { raw, hash } = generateToken();
      const expires = new Date(Date.now() + 60 * 60_000);
      await db
        .update(usersTable)
        .set({ passwordResetToken: hash, passwordResetExpires: expires })
        .where(eq(usersTable.id, user.id));

      logger.info({ userId: user.id, resetToken: raw }, "Password reset requested");
      // TODO: send email via Resend once RESEND_API_KEY is configured
    }

    res.json({ ok: true });
  },
);

const ResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post(
  "/reset-password",
  rateLimit({ windowMs: 15 * 60_000, max: 10, keyPrefix: "reset" }),
  async (req, res) => {
    const parsed = ResetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const tokenHash = hashToken(parsed.data.token);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(
        and(eq(usersTable.passwordResetToken, tokenHash), gt(usersTable.passwordResetExpires, new Date())),
      )
      .limit(1);

    if (!user) {
      res.status(400).json({ error: "Reset link is invalid or expired" });
      return;
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await db
      .update(usersTable)
      .set({ passwordHash: newHash, passwordResetToken: null, passwordResetExpires: null })
      .where(eq(usersTable.id, user.id));

    res.json({ ok: true });
  },
);

export default router;
