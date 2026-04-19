import { useGetInsights, getGetInsightsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, AlertTriangle, AlertOctagon, TrendingDown, Target, Lightbulb, Activity } from "lucide-react";

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
      <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
        <div>
          <Skeleton className="h-10 w-64 bg-card/50 mb-2 rounded-[10px]" />
          <Skeleton className="h-4 w-96 bg-card/50 rounded-[4px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 bg-card/50 rounded-[14px]" />
          <Skeleton className="h-64 bg-card/50 rounded-[14px]" />
        </div>
        <Skeleton className="h-48 w-full bg-card/50 rounded-[14px]" />
      </div>
    );
  }

  if (isError || !insights) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-card border border-white/5 rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <Activity className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Insufficient Data</h2>
        <p className="text-muted-foreground font-medium tracking-wide">
          Add at least 3 bets to activate Coach Analysis. The behavioral engine requires more betting history to identify statistically significant patterns.
        </p>
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

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-widest uppercase flex items-center gap-4 text-white">
          <div className="w-10 h-10 bg-primary/10 rounded-[10px] flex items-center justify-center">
            <Brain className="text-primary w-5 h-5" />
          </div>
          Coach Analysis
        </h1>
        <p className="text-muted-foreground mt-3 font-medium tracking-wide uppercase text-sm">AI-DRIVEN BEHAVIORAL PROFILING</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Score */}
        <Card className="bg-card border-card-border rounded-[14px] overflow-hidden shadow-xl relative group">
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-success via-yellow-400 to-loss opacity-50" />
          <CardContent className="p-8 md:p-10 text-center flex flex-col items-center justify-center h-full">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 block">Risk Score</span>
            <div className={`text-8xl font-black tracking-tighter font-mono ${getRiskColor(insights.riskScore)} drop-shadow-lg mb-6`}>
              {insights.riskScore}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium max-w-xs mx-auto leading-relaxed">
              Based on stake sizing variance, odds volatility, and bet frequency
            </p>
          </CardContent>
        </Card>

        {/* Discipline Score */}
        <Card className="bg-card border-card-border rounded-[14px] overflow-hidden shadow-xl relative group">
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-loss via-yellow-400 to-success opacity-50" />
          <CardContent className="p-8 md:p-10 text-center flex flex-col items-center justify-center h-full">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 block">Discipline Score</span>
            <div className={`text-8xl font-black tracking-tighter font-mono ${getDisciplineColor(insights.bankrollDisciplineScore)} drop-shadow-lg mb-6`}>
              {insights.bankrollDisciplineScore}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium max-w-xs mx-auto leading-relaxed">
              Adherence to unit sizing and resistance to impulse betting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Behavioral Alerts</h3>
        
        {hasAlerts ? (
          <div className="grid grid-cols-1 gap-4">
            {insights.tiltDetected && (
              <div className="bg-loss/5 border border-loss/20 p-6 rounded-[14px] flex items-start gap-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-loss" />
                <AlertOctagon className="w-6 h-6 text-loss shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-loss uppercase tracking-widest text-sm mb-2">Tilt Behavior Detected</h4>
                  <p className="text-white/80 text-sm leading-relaxed">{insights.tiltExplanation}</p>
                </div>
              </div>
            )}
            {insights.chasingLosses && (
              <div className="bg-loss/5 border border-loss/20 p-6 rounded-[14px] flex items-start gap-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-loss" />
                <TrendingDown className="w-6 h-6 text-loss shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-loss uppercase tracking-widest text-sm mb-2">Loss Chasing Detected</h4>
                  <p className="text-white/80 text-sm leading-relaxed">{insights.chasingLossesExplanation}</p>
                </div>
              </div>
            )}
            {insights.overconfidence && (
              <div className="bg-yellow-400/5 border border-yellow-400/20 p-6 rounded-[14px] flex items-start gap-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
                <Target className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-yellow-400 uppercase tracking-widest text-sm mb-2">Overconfidence Bias</h4>
                  <p className="text-white/80 text-sm leading-relaxed">{insights.overconfidenceExplanation}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-success/5 border border-success/20 p-6 rounded-[14px] flex items-center gap-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-success" />
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-success" />
            </div>
            <h4 className="font-bold text-success uppercase tracking-widest text-sm">No behavioral alerts detected</h4>
          </div>
        )}
      </div>

      {/* Directives Section */}
      <div className="bg-card border border-card-border rounded-[14px] p-8 md:p-10 shadow-xl relative overflow-hidden mt-8">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8 flex items-center gap-3">
          <Lightbulb className="w-4 h-4 text-primary" /> Directives
        </h3>
        
        <p className="text-white text-xl md:text-2xl font-serif italic leading-relaxed mb-10 pl-6 border-l-4 border-primary">
          "{insights.summary}"
        </p>
        
        <div className="space-y-4">
          {insights.improvementRules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-5 p-5 bg-black/20 border border-white/5 rounded-[10px] hover:border-primary/20 transition-colors">
              <span className="font-mono text-primary font-bold text-lg mt-0.5 bg-primary/10 w-8 h-8 flex items-center justify-center rounded-[6px] shrink-0">
                {idx + 1}
              </span>
              <p className="text-white text-sm leading-relaxed pt-1">{rule}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
