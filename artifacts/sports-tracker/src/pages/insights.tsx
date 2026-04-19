import { useGetInsights, getGetInsightsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, AlertTriangle, AlertOctagon, TrendingDown, Target, Lightbulb } from "lucide-react";

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
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <Skeleton className="h-10 w-64 bg-card mb-2" />
          <Skeleton className="h-4 w-96 bg-card" />
        </div>
        <Skeleton className="h-64 w-full bg-card rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 bg-card rounded-lg" />
          <Skeleton className="h-48 bg-card rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !insights) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] max-w-3xl mx-auto text-center space-y-6">
        <div className="bg-card p-6 rounded-full inline-block">
          <Brain className="w-16 h-16 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold uppercase tracking-tight">Insufficient Data</h2>
        <p className="text-muted-foreground text-lg">
          The behavioral analysis engine requires more betting history to identify statistically significant patterns. 
          Log more positions to activate insights.
        </p>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score > 75) return "text-destructive";
    if (score > 40) return "text-primary";
    return "text-success";
  };

  const getDisciplineColor = (score: number) => {
    if (score < 40) return "text-destructive";
    if (score < 75) return "text-primary";
    return "text-success";
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight uppercase flex items-center gap-3">
          <Brain className="text-primary w-8 h-8" /> Behavioral Analysis
        </h1>
        <p className="text-muted-foreground mt-1">AI-driven pattern recognition on your betting psychology.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-success via-primary to-destructive"></div>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Aggregated Risk Score</span>
              <div className={`text-7xl font-bold tracking-tighter ${getRiskColor(insights.riskScore)}`}>
                {insights.riskScore}
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Calculated based on stake sizing variance, odds volatility, and recent bet frequency.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-destructive via-primary to-success"></div>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bankroll Discipline</span>
              <div className={`text-7xl font-bold tracking-tighter ${getDisciplineColor(insights.bankrollDisciplineScore)}`}>
                {insights.bankrollDisciplineScore}
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Adherence to standard unit sizing and resistance to impulse betting.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {(insights.tiltDetected || insights.chasingLosses || insights.overconfidence) && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Critical Alerts
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {insights.tiltDetected && (
              <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-lg flex items-start gap-4">
                <AlertOctagon className="w-6 h-6 text-destructive shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-destructive uppercase tracking-wide">Tilt Detected</h4>
                  <p className="text-foreground/80 mt-1">{insights.tiltExplanation}</p>
                </div>
              </div>
            )}
            {insights.chasingLosses && (
              <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-lg flex items-start gap-4">
                <TrendingDown className="w-6 h-6 text-destructive shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-destructive uppercase tracking-wide">Chasing Losses</h4>
                  <p className="text-foreground/80 mt-1">{insights.chasingLossesExplanation}</p>
                </div>
              </div>
            )}
            {insights.overconfidence && (
              <div className="bg-primary/10 border border-primary/20 p-5 rounded-lg flex items-start gap-4">
                <Target className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-primary uppercase tracking-wide">Overconfidence Bias</h4>
                  <p className="text-foreground/80 mt-1">{insights.overconfidenceExplanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6 md:p-8">
        <h3 className="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" /> Strategic Directives
        </h3>
        <p className="text-muted-foreground mb-6 text-lg border-l-2 border-primary pl-4 py-1 italic">
          "{insights.summary}"
        </p>
        
        <div className="space-y-4">
          {insights.improvementRules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 bg-muted/20 rounded-md">
              <span className="font-mono text-primary font-bold text-lg mt-0.5">{idx + 1}.</span>
              <p className="text-foreground">{rule}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
