import { useListBets, useGetBankroll, getGetBankrollQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  computeEdgeScore, getTimeOfDayPerf, getBetTypePerf, getOddsRangePerf,
  getStakeSizePerf, getStreakBehavior, getWeeklyBreakdown, getOptimalComparison,
  generateAutoInsights, type SegmentPerf, type EdgeScore, type AutoInsight,
} from "@/lib/analytics";
import {
  TrendingUp, TrendingDown, Minus, BarChart2, Clock, Layers,
  Percent, DollarSign, Repeat2, AlertTriangle, CheckCircle2,
  Info, Zap, Trophy
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
const fmtUSD = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const roiColor = (roi: number) =>
  roi > 5 ? "text-success" : roi < -5 ? "text-loss" : "text-yellow-400";

const roiBg = (roi: number) =>
  roi > 5 ? "bg-success/10 border-success/20" : roi < -5 ? "bg-loss/10 border-loss/20" : "bg-yellow-400/10 border-yellow-400/20";

/* ─── Segment grid card ───────────────────────────────────────── */
function SegmentGrid({ segs }: { segs: SegmentPerf[] }) {
  if (segs.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-xs uppercase tracking-widest">
        Not enough data yet
      </div>
    );
  }
  return (
    <div className="divide-y divide-white/[0.05]">
      {segs.map(s => (
        <div key={s.label} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white uppercase tracking-wide truncate">{s.label}</p>
            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
              {s.wins}W / {s.losses}L · {s.count} bets
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">WR</p>
              <p className="text-xs font-bold font-mono text-white">{s.winRate.toFixed(1)}%</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">ROI</p>
              <p className={`text-xs font-bold font-mono ${roiColor(s.roi)}`}>{fmtPct(s.roi)}</p>
            </div>
            <div className="text-right w-20 hidden sm:block">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">P&L</p>
              <p className={`text-xs font-bold font-mono ${s.profitLoss >= 0 ? "text-success" : "text-loss"}`}>
                {s.profitLoss >= 0 ? "+" : ""}{fmtUSD(s.profitLoss)}
              </p>
            </div>
            {/* Mini bar */}
            <div className="w-16 hidden md:block">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.roi > 0 ? "bg-success" : "bg-loss"}`}
                  style={{ width: `${Math.min(Math.abs(s.roi) * 2, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Section wrapper ─────────────────────────────────────────── */
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-card-border rounded-[14px] overflow-hidden shadow-lg">
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2.5">
        <div className="text-muted-foreground">{icon}</div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/* ─── Edge Score gauge ────────────────────────────────────────── */
const GRADE_COLORS: Record<string, string> = {
  S: "text-success",
  A: "text-success",
  B: "text-yellow-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-loss",
};
const GRADE_DESCS: Record<string, string> = {
  S: "Elite decision-making",
  A: "Strong edge, disciplined",
  B: "Developing edge",
  C: "Inconsistent patterns",
  D: "High-risk behavior",
  F: "Insufficient data or negative edge",
};

function EdgeScoreCard({ es }: { es: EdgeScore }) {
  const TrendIcon = es.trend === "up" ? TrendingUp : es.trend === "down" ? TrendingDown : Minus;
  const trendColor =
    es.trend === "up" ? "text-success" : es.trend === "down" ? "text-loss" : "text-muted-foreground";

  const components = [
    { label: "ROI", value: es.components.roi, max: 35 },
    { label: "Win Rate", value: es.components.winRate, max: 25 },
    { label: "Discipline", value: es.components.discipline, max: 25 },
    { label: "Patterns", value: es.components.patterns, max: 15 },
  ];

  return (
    <div className="bg-card border border-card-border rounded-[14px] p-6 md:p-8 shadow-xl relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
        {/* Big score */}
        <div className="text-center shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Edge Score
          </p>
          <div className="flex items-end gap-3">
            <span className={`text-7xl md:text-8xl font-black font-mono leading-none ${GRADE_COLORS[es.grade]}`}>
              {es.score}
            </span>
            <div className="mb-1">
              <span className={`text-3xl font-black ${GRADE_COLORS[es.grade]}`}>{es.grade}</span>
              <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  {es.trend === "up" ? "Improving" : es.trend === "down" ? "Declining" : "Stable"}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 max-w-[160px]">
            {GRADE_DESCS[es.grade]}
          </p>
        </div>

        {/* Component bars */}
        <div className="flex-1 space-y-3 w-full">
          {components.map(c => (
            <div key={c.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {c.label}
                </span>
                <span className="text-[9px] font-mono text-white">
                  {c.value} / {c.max}
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${(c.value / c.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-6">
        <div className="flex justify-between mb-1">
          {["F", "D", "C", "B", "A", "S"].map(g => (
            <span
              key={g}
              className={`text-[9px] font-black ${g === es.grade ? GRADE_COLORS[g] : "text-white/20"}`}
            >
              {g}
            </span>
          ))}
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${GRADE_COLORS[es.grade].replace("text-", "bg-")}`}
            style={{ width: `${es.score}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-muted-foreground/50">0</span>
          <span className="text-[8px] text-muted-foreground/50">100</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Auto insights ───────────────────────────────────────────── */
const INSIGHT_ICONS: Record<AutoInsight["type"], React.ReactNode> = {
  warning: <AlertTriangle className="w-4 h-4 text-loss shrink-0 mt-0.5" />,
  positive: <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />,
  neutral: <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />,
};
const INSIGHT_STYLE: Record<AutoInsight["type"], string> = {
  warning: "bg-loss/[0.04] border-loss/15",
  positive: "bg-success/[0.04] border-success/15",
  neutral: "bg-white/[0.02] border-white/10",
};

/* ─── Component ───────────────────────────────────────────────── */
export default function Analytics() {
  const { isAuthenticated } = useAuth();

  const { data: allBets, isLoading: betsLoading } = useListBets(undefined, {
    query: { enabled: isAuthenticated },
  });

  const { data: bankroll, isLoading: bankrollLoading } = useGetBankroll({
    query: { enabled: isAuthenticated, queryKey: getGetBankrollQueryKey() },
  });

  const isLoading = betsLoading || bankrollLoading;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-56 bg-card/50 rounded" />
        <Skeleton className="h-48 w-full bg-card/50 rounded-[14px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-52 bg-card/50 rounded-[14px]" />)}
        </div>
        <Skeleton className="h-40 w-full bg-card/50 rounded-[14px]" />
      </div>
    );
  }

  const bets = allBets ?? [];
  const completedBets = bets.filter(b => b.result === "Win" || b.result === "Loss");

  if (completedBets.length < 3) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] max-w-xl mx-auto text-center space-y-5">
        <div className="w-20 h-20 bg-card border border-white/5 rounded-2xl flex items-center justify-center">
          <BarChart2 className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
          Analytics Locked
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Log at least <span className="text-white font-bold">3 completed bets</span> to unlock
          your full performance analysis, Edge Score, and behavioral patterns.
        </p>
      </div>
    );
  }

  const edgeScore = computeEdgeScore(bets);
  const timePerf = getTimeOfDayPerf(bets);
  const typePerf = getBetTypePerf(bets);
  const oddsPerf = getOddsRangePerf(bets);
  const stakePerf = getStakeSizePerf(bets);
  const streakBehavior = getStreakBehavior(bets);
  const weekly = getWeeklyBreakdown(bets);
  const optimal = getOptimalComparison(bets);
  const autoInsights = generateAutoInsights(bets);

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-6xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-widest uppercase text-white flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-[10px] flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          Performance Engine
        </h1>
        <p className="text-muted-foreground mt-2 text-[10px] font-semibold uppercase tracking-widest">
          Behavioral Pattern Analysis · {completedBets.length} Completed Bets
        </p>
      </div>

      {/* Edge Score */}
      <EdgeScoreCard es={edgeScore} />

      {/* Auto-generated insights */}
      {autoInsights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" /> Pattern Alerts
          </h3>
          <div className="space-y-2.5">
            {autoInsights.map((ins, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-[12px] border ${INSIGHT_STYLE[ins.type]}`}
              >
                {INSIGHT_ICONS[ins.type]}
                <div>
                  <p className="text-xs font-bold text-white">{ins.headline}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ins.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimal comparison */}
      {optimal && (
        <div className="relative overflow-hidden bg-primary/[0.04] border border-primary/20 rounded-[14px] p-5 md:p-6">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="pl-3">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-primary" />
              <p className="text-[9px] font-black uppercase tracking-widest text-primary">
                Profit Opportunity
              </p>
            </div>
            <p className="text-white font-medium text-sm leading-relaxed mb-3">{optimal.insight}</p>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
                  Capital Lost in Weak Context
                </p>
                <p className="text-loss font-black font-mono text-lg">
                  −{fmtUSD(optimal.missedProfit)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
                  Best Context ROI
                </p>
                <p className="text-success font-black font-mono text-lg">
                  +{optimal.bestROI.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section icon={<Clock className="w-3.5 h-3.5" />} title="Time of Day">
          <SegmentGrid segs={timePerf} />
        </Section>

        <Section icon={<Layers className="w-3.5 h-3.5" />} title="Bet Type">
          <SegmentGrid segs={typePerf} />
        </Section>

        <Section icon={<Percent className="w-3.5 h-3.5" />} title="Odds Range">
          <SegmentGrid segs={oddsPerf} />
        </Section>

        <Section icon={<DollarSign className="w-3.5 h-3.5" />} title="Stake Size">
          <SegmentGrid segs={stakePerf} />
        </Section>
      </div>

      {/* Streak behavior */}
      <Section icon={<Repeat2 className="w-3.5 h-3.5" />} title="Behavior After Results">
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              label: "After a Win",
              data: streakBehavior.afterWin,
              accent: streakBehavior.afterWin.roi > 0 ? "border-success/20 bg-success/[0.03]" : "border-loss/20 bg-loss/[0.03]",
            },
            {
              label: "After a Loss",
              data: streakBehavior.afterLoss,
              accent: streakBehavior.afterLoss.roi > 0 ? "border-success/20 bg-success/[0.03]" : "border-loss/20 bg-loss/[0.03]",
            },
          ].map(({ label, data, accent }) => (
            <div key={label} className={`p-4 rounded-[12px] border ${accent}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-3">
                {label}
              </p>
              {data.bets === 0 ? (
                <p className="text-xs text-muted-foreground">Not enough data</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sample</span>
                    <span className="text-xs font-mono text-white">{data.bets} bets</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</span>
                    <span className="text-xs font-mono text-white">{data.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">ROI</span>
                    <span className={`text-xs font-mono font-bold ${roiColor(data.roi)}`}>
                      {fmtPct(data.roi)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Avg Stake Change
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        data.avgStakeChangePct > 15
                          ? "text-loss"
                          : data.avgStakeChangePct < -5
                            ? "text-success"
                            : "text-white"
                      }`}
                    >
                      {data.avgStakeChangePct > 0 ? "+" : ""}
                      {data.avgStakeChangePct.toFixed(0)}%
                    </span>
                  </div>
                  {/* Warning if chasing */}
                  {label === "After a Loss" && data.avgStakeChangePct > 20 && (
                    <p className="text-[9px] text-loss mt-2 border border-loss/20 rounded-[6px] p-2">
                      You increase stake size after losses. This is a loss-chasing signal.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Weekly trend */}
      {weekly.length > 0 && (
        <Section icon={<TrendingUp className="w-3.5 h-3.5" />} title="Weekly Trend">
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {weekly.map(w => (
                <div
                  key={w.weekLabel}
                  className={`p-3.5 rounded-[10px] border ${
                    w.profitLoss > 0
                      ? "bg-success/[0.04] border-success/15"
                      : w.profitLoss < 0
                        ? "bg-loss/[0.04] border-loss/15"
                        : "bg-white/[0.02] border-white/10"
                  }`}
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    {w.weekLabel}
                  </p>
                  <p
                    className={`text-lg font-black font-mono ${
                      w.profitLoss > 0 ? "text-success" : w.profitLoss < 0 ? "text-loss" : "text-white"
                    }`}
                  >
                    {w.profitLoss >= 0 ? "+" : ""}
                    {fmtUSD(w.profitLoss)}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1 font-mono">
                    {w.wins}W / {w.losses}L · {fmtPct(w.roi)} ROI
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
