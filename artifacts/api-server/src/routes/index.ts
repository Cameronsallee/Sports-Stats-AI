import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import betsRouter from "./bets";
import bankrollRouter from "./bankroll";
import statsRouter from "./stats";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/bets", betsRouter);
router.use("/bankroll", bankrollRouter);
router.use("/stats", statsRouter);
router.use("/insights", insightsRouter);

export default router;
