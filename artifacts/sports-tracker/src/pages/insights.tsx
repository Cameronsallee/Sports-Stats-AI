import { useGetInsights, getGetInsightsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain, AlertOctagon, TrendingDown, Target, Activity,
  ShieldCheck, ShieldAlert, ShieldX, ArrowRight, Zap,
  ListChecks
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */
type VerdictConfig = {
  icon: React.ReactNode;
  headline: string;
  sub: string;
  style: string;
  leftBar: string;
};

/* ─── Verdict ────────────────────────────────────────────────────── */
function getVerdict(
  riskScore: number,
  disciplineScore: number,
  tiltDetected: boolean,
  chasingLosses: boolean,
  overconfidence: boolean,
): VerdictConfig {
  const critical = (tiltDetected ? 1 : 0) + (chasingLosses ? 1 : 0);
  if (critical >= 2 || riskScore > 75) {
    return {
      icon: <ShieldX className="w-5 h-5 shrink-0" />,
      headline: "WARNING — LOSING BEHAVIORAL PATTERNS DETECTED",
      sub: "Multiple high-risk behaviors identified. Immediate correction required.",
      style: "bg-loss/[0.06] border-loss/25 text-loss",
      leftBar: "bg-loss",
    };
  }
  if (tiltDetected || chasingLosses || riskScore > 55) {
    return {
      icon: <ShieldAlert className="w-5 h-5 shrink-0" />,
      headline: "CAUTION — BEHAVIORAL RISK IDENTIFIED",
      sub: "Emerging risk patterns detected. Address these before they compound.",
      style: "bg-yellow-400/[0.05] border-yellow-400/20 text-yellow-400",
      leftBar: "bg-yellow-400",
    };
  }
  if (overconfidence) {
    return {
      icon: <ShieldAlert className="w-5 h-5 shrink-0" />,
      headline: "OVERCONFIDENCE BIAS — MANAGE YOUR STAKES",
      sub: "You are winning, but showing signs of overconfidence. Protect your edge.",
      style: "bg-yellow-400/[0.05] border-yellow-400/20 text-yellow-400",
      leftBar: "bg-yellow-400",
    };
  }
  if (disciplineScore >= 75 && riskScore < 40) {
    return {
      icon: <ShieldCheck className="w-5 h-5 shrink-0" />,
      headline: "STRONG — YOUR DISCIPLINE IS YOUR EDGE",
      sub: "Consistent bankroll discipline. No critical behavioral flags. Stay the course.",
      style: "bg-success/[0.05] border-success/20 text-success",
      leftBar: "bg-success",
    };
  }
  return {
    icon: <ShieldCheck className="w-5 h-5 shrink-0" />,
    headline: "NEUTRAL — WITHIN ACCEPTABLE RANGE",
    sub: "No critical flags detected. Continue logging bets to sharpen your behavioral profile.",
    style: "bg-white/[0.03] border-white/10 text-white/70",
    leftBar: "bg-white/20",
  };
}

/* ─── One action recommendation ─────────────────────────────────── */
function getOneAction(
  riskScore: number,
  disciplineScore: number,
  tiltDetected: boolean,
  chasingLosses: boolean,
  overconfidence: boolean,
): string {
  if (tiltDetected && chasingLosses)
    return "Stop betting for 24 hours. Your decision-making is compromised. Do not place any bet until you have reviewed your last 5 losses and identified the pattern causing your behavior.";
  if (tiltDetected)
    return "Do not place any bets for the next 24 hours. Allow your decision-making to reset before continuing. Tilt behavior compounds losses.";
  if (chasingLosses)
    return "Reduce your stake size by 25% on all bets until you record 2 consecutive wins. Do not increase bet size under any circumstances during a losing run.";
  if (riskScore > 75)
    return "Limit yourself to 1 bet today. Keep stake below 2% of your starting bankroll. Your risk exposure is critically high.";
  if (overconfidence)
    return "Keep all bets at your standard flat stake for the next 5 plays, regardless of your confidence level. Win streaks create false certainty.";
  if (riskScore > 50)
    return "Reduce stake size by 15% today and avoid parlays. Your risk indicators are elevated. Preserve capital.";
  if (disciplineScore >= 80)
    return "Continue your current approach. Maintain unit sizing discipline. Do not deviate — your edge is built on consistency.";
  return "Maintain flat stake sizing on all bets today. Focus on your documented thesis and avoid impulse plays.";
}

/* ─── Cause→Effect blocks ────────────────────────────────────────── */
interface CauseEffectItem {
  trigger: string;
  cause: string;
  effect: string;
  colorClass: string;
  borderClass: string;
  icon: React.ReactNode;
}

function buildCauseEffects(
  tiltDetected: boolean,
  tiltExplanation: string,
  chasingLosses: boolean,
  chasingLossesExplanation: string,
  overconfidence: boolean,
  overconfidenceExplanation: string,
  riskScore: number,
): CauseEffectItem[] {
  const items: CauseEffectItem[] = [];

  if (tiltDetected) {
    items.push({
      trigger: "Tilt Behavior",
      cause: tiltExplanation,
      effect:
        "Tilt causes larger, less-calculated bets — driving your risk score up and your discipline score down.",
      colorClass: "text-loss",
      borderClass: "border-loss/20 bg-loss/[0.04]",
      icon: <AlertOctagon className="w-4 h-4 text-loss shrink-0 mt-0.5" />,
    });
  }

  if (chasingLosses) {
    items.push({
      trigger: "Loss Chasing",
      cause: chasingLossesExplanation,
      effect:
        "Chasing losses with larger stakes amplifies your drawdown and destroys bankroll discipline systematically.",
      colorClass: "text-loss",
      borderClass: "border-loss/20 bg-loss/[0.04]",
      icon: <TrendingDown className="w-4 h-4 text-loss shrink-0 mt-0.5" />,
    });
  }

  if (overconfidence) {
    items.push({
      trigger: "Overconfidence Bias",
      cause: overconfidenceExplanation,
      effect:
        "Overconfidence leads to inflated stake sizing during win streaks — one bad sequence can wipe accumulated gains.",
      colorClass: "text-yellow-400",
      borderClass: "border-yellow-400/20 bg-yellow-400/[0.04]",
      icon: <Target className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />,
    });
  }

  if (items.length === 0 && riskScore < 40) {
    items.push({
      trigger: "No Active Behavioral Issues",
      cause: "Your recent betting history shows no statistically significant risk patterns.",
      effect:
        "Your discipline is holding. The goal now is consistency — not growth, not experimentation.",
      colorClass: "text-success",
      borderClass: "border-success/20 bg-success/[0.04]",
      icon: <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />,
    });
  }

  return items;
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function Insights() {
  const { isAuthenticated } = useAuth();

  const { data: insights, isLoading, isError } = useGetInsights({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetInsightsQueryKey(),
      retry: false,
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-20 w-full bg-card/50 rounded-[14px]" />
        <div>
          <Skeleton className="h-8 w-56 bg-card/50 mb-2 rounded" />
          <Skeleton className="h-4 w-64 bg-card/50 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-52 bg-card/50 rounded-[14px]" />
          <Skeleton className="h-52 bg-card/50 rounded-[14px]" />
        </div>
        <Skeleton className="h-36 w-full bg-card/50 rounded-[14px]" />
        <Skeleton className="h-52 w-full bg-card/50 rounded-[14px]" />
        <Skeleton className="h-48 w-full bg-card/50 rounded-[14px]" />
      </div>
    );
  }

  if (isError || !insights) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto text-center space-y-5">
        <div className="w-20 h-20 bg-card border border-white/5 rounded-2xl flex items-center justify-center shadow-lg">
          <Activity className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white mb-3">
            Coach Analysis Locked
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Log at least{" "}
            <span className="text-white font-bold">3 completed bets</span> to
            activate your behavioral profile.
          </p>
        </div>
        <div className="bg-card border border-card-border rounded-[14px] p-5 w-full text-left space-y-3">
          {[
            "Log at least 3 completed bets (Win or Loss)",
            "Include sport, bet type, odds, and stake",
            "Results are analyzed and your profile builds in real-time",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="font-mono text-primary font-bold text-xs bg-primary/10 w-6 h-6 flex items-center justify-center rounded-[6px] shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-white/80">{step}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getRiskColor = (s: number) =>
    s > 75 ? "text-loss" : s > 40 ? "text-yellow-400" : "text-success";
  const getDisciplineColor = (s: number) =>
    s < 40 ? "text-loss" : s < 75 ? "text-yellow-400" : "text-success";

  const verdict = getVerdict(
    insights.riskScore,
    insights.bankrollDisciplineScore,
    insights.tiltDetected,
    insights.chasingLosses,
    insights.overconfidence,
  );

  const oneAction = getOneAction(
    insights.riskScore,
    insights.bankrollDisciplineScore,
    insights.tiltDetected,
    insights.chasingLosses,
    insights.overconfidence,
  );

  const causeEffects = buildCauseEffects(
    insights.tiltDetected,
    insights.tiltExplanation ?? "",
    insights.chasingLosses,
    insights.chasingLossesExplanation ?? "",
    insights.overconfidence,
    insights.overconfidenceExplanation ?? "",
    insights.riskScore,
  );

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-5xl mx-auto">

      {/* ── Verdict ─────────────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden flex items-start gap-4 p-5 rounded-[14px] border ${verdict.style}`}
      >
        <div className={`absolute top-0 left-0 w-1 h-full ${verdict.leftBar}`} />
        <div className="pl-2 mt-0.5">{verdict.icon}</div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">
            Behavioral Assessment
          </p>
          <h2 className="font-black uppercase tracking-wider text-sm md:text-base leading-snug mb-1.5">
            {verdict.headline}
          </h2>
          <p className="text-xs opacity-75 leading-relaxed">{verdict.sub}</p>
        </div>
      </div>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-widest uppercase flex items-center gap-3 text-white">
          <div className="w-9 h-9 bg-primary/10 rounded-[10px] flex items-center justify-center">
            <Brain className="text-primary w-5 h-5" />
          </div>
          Coach Analysis
        </h1>
        <p className="text-muted-foreground mt-2 font-semibold tracking-widest uppercase text-[10px]">
          AI-Driven Behavioral Profiling
        </p>
      </div>

      {/* ── Score cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="bg-card border-card-border rounded-[14px] overflow-hidden shadow-xl relative">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-success via-yellow-400 to-loss opacity-40" />
          <CardContent className="p-7 text-center flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">
              Risk Score
            </span>
            <div
              className={`text-8xl font-black tracking-tighter font-mono ${getRiskColor(insights.riskScore)} mb-4`}
            >
              {insights.riskScore}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium max-w-xs leading-relaxed mb-4">
              Stake variance · Odds volatility · Bet frequency
            </p>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  insights.riskScore > 75
                    ? "bg-loss"
                    : insights.riskScore > 40
                      ? "bg-yellow-400"
                      : "bg-success"
                }`}
                style={{ width: `${insights.riskScore}%` }}
              />
            </div>
            <div className="flex justify-between w-full mt-1">
              <span className="text-[9px] text-success uppercase tracking-wider">Low</span>
              <span className="text-[9px] text-loss uppercase tracking-wider">High</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border rounded-[14px] overflow-hidden shadow-xl relative">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-loss via-yellow-400 to-success opacity-40" />
          <CardContent className="p-7 text-center flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">
              Discipline Score
            </span>
            <div
              className={`text-8xl font-black tracking-tighter font-mono ${getDisciplineColor(insights.bankrollDisciplineScore)} mb-4`}
            >
              {insights.bankrollDisciplineScore}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium max-w-xs leading-relaxed mb-4">
              Unit sizing · Impulse resistance · Consistency
            </p>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  insights.bankrollDisciplineScore < 40
                    ? "bg-loss"
                    : insights.bankrollDisciplineScore < 75
                      ? "bg-yellow-400"
                      : "bg-success"
                }`}
                style={{ width: `${insights.bankrollDisciplineScore}%` }}
              />
            </div>
            <div className="flex justify-between w-full mt-1">
              <span className="text-[9px] text-loss uppercase tracking-wider">
                Undisciplined
              </span>
              <span className="text-[9px] text-success uppercase tracking-wider">Elite</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Cause → Effect Analysis ─────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" /> Cause → Effect Analysis
        </h3>

        {causeEffects.map((item, idx) => (
          <div
            key={idx}
            className={`border rounded-[14px] p-5 relative overflow-hidden ${item.borderClass}`}
          >
            <div className="flex items-start gap-3 mb-4">
              {item.icon}
              <h4 className={`font-black uppercase tracking-widest text-xs ${item.colorClass}`}>
                {item.trigger}
              </h4>
            </div>

            <div className="space-y-3 pl-1">
              {/* What happened */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0 pt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <div className="w-px h-6 bg-white/10 mt-1" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    What Happened
                  </p>
                  <p className="text-sm text-white/80 leading-relaxed">{item.cause}</p>
                </div>
              </div>

              {/* Why it matters */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0 pt-1">
                  <ArrowRight className="w-3.5 h-3.5 text-white/20" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Behavioral Effect
                  </p>
                  <p className="text-sm text-white/60 leading-relaxed italic">{item.effect}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Coach Directives ────────────────────────────────────── */}
      <div className="bg-card border border-card-border rounded-[14px] p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-52 h-52 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
          <ListChecks className="w-3.5 h-3.5 text-primary" /> Coach Directives
        </h3>

        <blockquote className="text-white text-base md:text-lg font-medium italic leading-relaxed mb-7 pl-4 border-l-4 border-primary text-white/90">
          "{insights.summary}"
        </blockquote>

        <div className="space-y-3">
          {insights.improvementRules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 bg-black/20 border border-white/[0.04] rounded-[10px] hover:border-primary/15 transition-colors"
            >
              <span className="font-mono text-primary font-black text-xs bg-primary/10 w-7 h-7 flex items-center justify-center rounded-[6px] shrink-0">
                {idx + 1}
              </span>
              <p className="text-white/85 text-sm leading-relaxed pt-0.5">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── One Action Recommendation ────────────────────────────── */}
      <div className="border border-primary/20 bg-primary/[0.03] rounded-[14px] p-5 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="pl-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-primary/15 rounded-[6px] flex items-center justify-center">
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-primary">
              Your One Action Today
            </p>
          </div>
          <p className="text-white text-sm leading-relaxed font-medium">{oneAction}</p>
        </div>
      </div>
    </div>
  );
}
