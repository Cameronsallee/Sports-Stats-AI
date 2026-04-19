import { useGetInsights, getGetInsightsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, AlertTriangle, AlertOctagon, TrendingDown, Target, Lightbulb, Activity, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

type VerdictConfig = {
  icon: React.ReactNode;
  label: string;
  headline: string;
  sub: string;
  style: string;
  leftBar: string;
};

function getVerdict(
  riskScore: number,
  disciplineScore: number,
  tiltDetected: boolean,
  chasingLosses: boolean,
  overconfidence: boolean,
): VerdictConfig {
  const criticalIssues = (tiltDetected ? 1 : 0) + (chasingLosses ? 1 : 0);

  if (criticalIssues >= 2 || riskScore > 75) {
    return {
      icon: <ShieldX className="w-6 h-6 shrink-0" />,
      label: "BEHAVIORAL ASSESSMENT",
      headline: "WARNING — LOSING BEHAVIORAL PATTERNS DETECTED",
      sub: "Your recent betting history shows multiple high-risk behaviors. Immediate correction required to protect your bankroll.",
      style: "bg-[#FF4D4D]/[0.06] border-[#FF4D4D]/25 text-[#FF4D4D]",
      leftBar: "bg-[#FF4D4D]",
    };
  }

  if (tiltDetected || chasingLosses || riskScore > 55 || (overconfidence && riskScore > 40)) {
    return {
      icon: <ShieldAlert className="w-6 h-6 shrink-0" />,
      label: "BEHAVIORAL ASSESSMENT",
      headline: "CAUTION — BEHAVIORAL RISK IDENTIFIED",
      sub: "Patterns in your betting history suggest emerging risk behaviors. Address these before they compound.",
      style: "bg-yellow-400/[0.05] border-yellow-400/20 text-yellow-400",
      leftBar: "bg-yellow-400",
    };
  }

  if (overconfidence && riskScore <= 40) {
    return {
      icon: <ShieldAlert className="w-6 h-6 shrink-0" />,
      label: "BEHAVIORAL ASSESSMENT",
      headline: "OVERCONFIDENCE BIAS — MANAGE YOUR STAKES",
      sub: "You are winning, but showing signs of overconfidence. Protect your edge by maintaining strict unit sizing.",
      style: "bg-yellow-400/[0.05] border-yellow-400/20 text-yellow-400",
      leftBar: "bg-yellow-400",
    };
  }

  if (disciplineScore >= 75 && riskScore < 40) {
    return {
      icon: <ShieldCheck className="w-6 h-6 shrink-0" />,
      label: "BEHAVIORAL ASSESSMENT",
      headline: "STRONG — YOUR DISCIPLINE IS YOUR EDGE",
      sub: "Your betting behavior shows consistent bankroll discipline and controlled risk. Stay the course.",
      style: "bg-[#2DFF88]/[0.05] border-[#2DFF88]/20 text-[#2DFF88]",
      leftBar: "bg-[#2DFF88]",
    };
  }

  return {
    icon: <ShieldCheck className="w-6 h-6 shrink-0" />,
    label: "BEHAVIORAL ASSESSMENT",
    headline: "NEUTRAL — PERFORMANCE WITHIN ACCEPTABLE RANGE",
    sub: "No critical behavioral flags detected. Continue logging bets to refine your behavioral profile.",
    style: "bg-white/[0.03] border-white/10 text-white/70",
    leftBar: "bg-white/20",
  };
}

export default function Insights() {
  const { isAuthenticated } = useAuth();
  
  const { data: insights, isLoading, isError } = useGetInsights({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetInsightsQueryKey(),
      retry: false
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-20 w-full bg-card/50 rounded-[14px]" />
        <div>
          <Skeleton className="h-8 w-56 bg-card/50 mb-2 rounded-[10px]" />
          <Skeleton className="h-4 w-72 bg-card/50 rounded-[4px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-52 bg-card/50 rounded-[14px]" />
          <Skeleton className="h-52 bg-card/50 rounded-[14px]" />
        </div>
        <Skeleton className="h-36 w-full bg-card/50 rounded-[14px]" />
        <Skeleton className="h-64 w-full bg-card/50 rounded-[14px]" />
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
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white mb-3">Coach Analysis Locked</h2>
          <p className="text-muted-foreground leading-relaxed">
            Log at least <span className="text-white font-bold">3 bets</span> to activate your behavioral profile. The analysis engine requires sufficient history to detect patterns.
          </p>
        </div>
        <div className="bg-card border border-card-border rounded-[14px] p-5 w-full text-left space-y-3">
          {["Log at least 3 completed bets (Win or Loss)", "Include sport, bet type, odds, and stake", "Results are analyzed in real-time"].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="font-mono text-primary font-bold text-sm bg-primary/10 w-6 h-6 flex items-center justify-center rounded-[6px] shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-sm text-white/80">{step}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score > 75) return "text-loss";
    if (score > 40) return "text-yellow-400";
    return "text-success";
  };

  const getDisciplineColor = (score: number) => {
    if (score < 40) return "text-loss";
    if (score < 75) return "text-yellow-400";
    return "text-success";
  };

  const hasAlerts = insights.tiltDetected || insights.chasingLosses || insights.overconfidence;
  const verdict = getVerdict(
    insights.riskScore,
    insights.bankrollDisciplineScore,
    insights.tiltDetected,
    insights.chasingLosses,
    insights.overconfidence,
  );

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-5xl mx-auto">

      {/* Verdict Card — the most prominent element */}
      <div className={`relative overflow-hidden flex items-start gap-4 p-5 rounded-[14px] border border-l-4 ${verdict.style} ${verdict.leftBar.replace('bg-', 'border-l-')}`}>
        <div className={`absolute top-0 left-0 w-1 h-full ${verdict.leftBar}`} />
        <div className="pl-2">
          {verdict.icon}
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">{verdict.label}</p>
          <h2 className="font-black uppercase tracking-wider text-base md:text-lg leading-tight mb-1.5">{verdict.headline}</h2>
          <p className="text-sm opacity-75 leading-relaxed">{verdict.sub}</p>
        </div>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-widest uppercase flex items-center gap-3 text-white">
          <div className="w-9 h-9 bg-primary/10 rounded-[10px] flex items-center justify-center">
            <Brain className="text-primary w-5 h-5" />
          </div>
          Coach Analysis
        </h1>
        <p className="text-muted-foreground mt-2 font-semibold tracking-widest uppercase text-[10px]">AI-Driven Behavioral Profiling</p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="bg-card border-card-border rounded-[14px] overflow-hidden shadow-xl relative">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-success via-yellow-400 to-loss opacity-40" />
          <CardContent className="p-8 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-5 block">Risk Score</span>
            <div className={`text-8xl font-black tracking-tighter font-mono ${getRiskColor(insights.riskScore)} mb-5`}>
              {insights.riskScore}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium max-w-xs leading-relaxed">
              Stake sizing variance · Odds volatility · Bet frequency
            </p>
            <div className="mt-4 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${insights.riskScore > 75 ? 'bg-loss' : insights.riskScore > 40 ? 'bg-yellow-400' : 'bg-success'}`}
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
          <CardContent className="p-8 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-5 block">Discipline Score</span>
            <div className={`text-8xl font-black tracking-tighter font-mono ${getDisciplineColor(insights.bankrollDisciplineScore)} mb-5`}>
              {insights.bankrollDisciplineScore}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium max-w-xs leading-relaxed">
              Unit sizing adherence · Impulse resistance · Consistency
            </p>
            <div className="mt-4 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${insights.bankrollDisciplineScore < 40 ? 'bg-loss' : insights.bankrollDisciplineScore < 75 ? 'bg-yellow-400' : 'bg-success'}`}
                style={{ width: `${insights.bankrollDisciplineScore}%` }}
              />
            </div>
            <div className="flex justify-between w-full mt-1">
              <span className="text-[9px] text-loss uppercase tracking-wider">Undisciplined</span>
              <span className="text-[9px] text-success uppercase tracking-wider">Elite</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Behavioral Alerts */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Behavioral Triggers</h3>

        {hasAlerts ? (
          <div className="space-y-3">
            {insights.tiltDetected && (
              <div className="bg-loss/[0.04] border border-loss/20 p-5 rounded-[14px] flex items-start gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-loss" />
                <AlertOctagon className="w-5 h-5 text-loss shrink-0 mt-0.5 ml-1" />
                <div>
                  <h4 className="font-black text-loss uppercase tracking-widest text-xs mb-2">Tilt Behavior Detected</h4>
                  <p className="text-white/75 text-sm leading-relaxed">{insights.tiltExplanation}</p>
                </div>
              </div>
            )}
            {insights.chasingLosses && (
              <div className="bg-loss/[0.04] border border-loss/20 p-5 rounded-[14px] flex items-start gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-loss" />
                <TrendingDown className="w-5 h-5 text-loss shrink-0 mt-0.5 ml-1" />
                <div>
                  <h4 className="font-black text-loss uppercase tracking-widest text-xs mb-2">Loss Chasing Detected</h4>
                  <p className="text-white/75 text-sm leading-relaxed">{insights.chasingLossesExplanation}</p>
                </div>
              </div>
            )}
            {insights.overconfidence && (
              <div className="bg-yellow-400/[0.04] border border-yellow-400/20 p-5 rounded-[14px] flex items-start gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
                <Target className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5 ml-1" />
                <div>
                  <h4 className="font-black text-yellow-400 uppercase tracking-widest text-xs mb-2">Overconfidence Bias</h4>
                  <p className="text-white/75 text-sm leading-relaxed">{insights.overconfidenceExplanation}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-success/[0.04] border border-success/20 p-5 rounded-[14px] flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-success" />
            <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center shrink-0 ml-1">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
            </div>
            <div>
              <h4 className="font-black text-success uppercase tracking-widest text-xs">No Behavioral Alerts</h4>
              <p className="text-white/60 text-xs mt-1">Your recent betting shows no critical psychological risk flags.</p>
            </div>
          </div>
        )}
      </div>

      {/* Coach Directives */}
      <div className="bg-card border border-card-border rounded-[14px] p-7 md:p-9 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-52 h-52 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
        
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-7 flex items-center gap-2.5">
          <Lightbulb className="w-4 h-4 text-primary" /> Coach Directives
        </h3>
        
        <blockquote className="text-white text-lg md:text-xl font-medium italic leading-relaxed mb-8 pl-5 border-l-4 border-primary text-white/90">
          "{insights.summary}"
        </blockquote>
        
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Rules to Follow</p>
          {insights.improvementRules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 bg-black/20 border border-white/[0.04] rounded-[10px] hover:border-primary/15 transition-colors">
              <span className="font-mono text-primary font-black text-sm bg-primary/10 w-7 h-7 flex items-center justify-center rounded-[6px] shrink-0">
                {idx + 1}
              </span>
              <p className="text-white/85 text-sm leading-relaxed pt-0.5">{rule}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
