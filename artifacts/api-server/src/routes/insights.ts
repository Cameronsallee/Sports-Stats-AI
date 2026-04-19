import { Router } from "express";
import { db, betsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";
import OpenAI from "openai";

const router = Router();
router.use(authMiddleware);

const openai = new OpenAI({
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"],
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
});

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const bets = await db
    .select()
    .from(betsTable)
    .where(eq(betsTable.userId, userId))
    .orderBy(desc(betsTable.createdAt));

  if (bets.length < 3) {
    const empty = {
      riskScore: 0,
      tiltDetected: false,
      tiltExplanation: "Not enough data yet. Add at least 3 bets to get insights.",
      chasingLosses: false,
      chasingLossesExplanation: "Not enough data yet.",
      overconfidence: false,
      overconfidenceExplanation: "Not enough data yet.",
      bankrollDisciplineScore: 100,
      improvementRules: [
        "Track at least 10 bets before analyzing patterns.",
        "Record odds, stake, and result consistently.",
        "Include notes about why you placed each bet.",
      ],
      summary: "Add at least 3 bets to receive AI behavior analysis.",
      generatedAt: new Date().toISOString(),
    };
    res.json(empty);
    return;
  }

  const betSummary = bets.slice(0, 50).map((b, i) => ({
    index: i + 1,
    sport: b.sport,
    betType: b.betType,
    odds: b.odds,
    stake: b.stake,
    result: b.result ?? "pending",
    profitLoss: b.profitLoss ?? 0,
    date: b.createdAt.toISOString().split("T")[0],
  }));

  const totalPL = bets.reduce((s, b) => s + (b.profitLoss ?? 0), 0);
  const wins = bets.filter((b) => b.result === "win").length;
  const losses = bets.filter((b) => b.result === "loss").length;
  const avgStake = bets.reduce((s, b) => s + b.stake, 0) / bets.length;

  const prompt = `You are a brutally honest sports betting behavior analyst. Analyze this bettor's history and provide a JSON response only — no markdown, no explanation outside of JSON.

Bet history (most recent first, max 50 bets):
${JSON.stringify(betSummary, null, 2)}

Summary: ${bets.length} total bets, ${wins} wins, ${losses} losses, Total P&L: ${totalPL.toFixed(2)}, Average stake: ${avgStake.toFixed(2)}

Return ONLY this JSON structure:
{
  "riskScore": <integer 0-100, higher = more risky behavior>,
  "tiltDetected": <boolean>,
  "tiltExplanation": <string, 1-2 sentences, direct and analytical>,
  "chasingLosses": <boolean>,
  "chasingLossesExplanation": <string, 1-2 sentences>,
  "overconfidence": <boolean>,
  "overconfidenceExplanation": <string, 1-2 sentences>,
  "bankrollDisciplineScore": <integer 0-100, higher = better discipline>,
  "improvementRules": [<exactly 3 specific, actionable rule strings>],
  "summary": <string, 2-3 sentences overall behavioral assessment, coach-like tone>
}

Rules:
- NEVER suggest picks, teams, or which bets to place
- Only analyze behavior patterns: stake sizing, chasing, tilt, discipline
- Be direct and slightly critical — sugarcoating doesn't help bettors improve
- Base all observations on the actual data provided`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  const insights = {
    riskScore: typeof parsed["riskScore"] === "number" ? parsed["riskScore"] : 50,
    tiltDetected: Boolean(parsed["tiltDetected"]),
    tiltExplanation: String(parsed["tiltExplanation"] ?? ""),
    chasingLosses: Boolean(parsed["chasingLosses"]),
    chasingLossesExplanation: String(parsed["chasingLossesExplanation"] ?? ""),
    overconfidence: Boolean(parsed["overconfidence"]),
    overconfidenceExplanation: String(parsed["overconfidenceExplanation"] ?? ""),
    bankrollDisciplineScore: typeof parsed["bankrollDisciplineScore"] === "number" ? parsed["bankrollDisciplineScore"] : 50,
    improvementRules: Array.isArray(parsed["improvementRules"])
      ? (parsed["improvementRules"] as string[]).slice(0, 3)
      : ["Track your bets consistently.", "Size stakes proportionally to bankroll.", "Avoid betting when emotional."],
    summary: String(parsed["summary"] ?? ""),
    generatedAt: new Date().toISOString(),
  };

  res.json(insights);
});

export default router;
